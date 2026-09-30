let me=null,catalog=[],state=null,currentLevel=null,authMode='login',config=null,currentGuestBase=null;
let selectedCycle = null;
let pendingPaymentCycle = null;
let gameMode = 'classic';
let submitting=false,educationFocus=null;
const archivePageSize=6;
let archiveItems=[],archivePage=0;
const lang=globalThis.SECDLE_I18N?.language||'es';
const PUBLIC_URL='https://secdle.onrender.com';
const SUPPORT_EMAIL='adriansg007@gmail.com';
let onboardingFocus=null,installPrompt=null;
function setLanguage(nextLang){
  if(submitting)return;
  try{
    localStorage.setItem('secdle_lang',nextLang==='en'?'en':'es');
    sessionStorage.setItem('secdle_language_restore',JSON.stringify({level:currentLevel,mode:gameMode,draft:$('answerInput').value,education:!$('educationModal').classList.contains('hidden'),archive:!$('archiveModal').classList.contains('hidden'),archivePage}));
    location.reload();
  }catch{setMsg('message',lang==='en'?'Your browser could not save the language preference.':'Tu navegador no pudo guardar la preferencia de idioma.','error')}
}

const $=id=>document.getElementById(id);
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const GUEST_KEY='secdle_guest_progress_v1';

async function api(url,opts={}){
  url+=`${url.includes('?')?'&':'?'}lang=${lang}`;
  const r=await fetch(url,{headers:{'Content-Type':'application/json',...(opts.headers||{})},...opts});
  const data=await r.json().catch(()=>({}));
  if(!r.ok){const e=new Error(data.error||'Error inesperado');e.data=data;e.status=r.status;throw e}
  return data;
}
function openModal(id){$(id).classList.remove('hidden')}
function closeModal(id){$(id).classList.add('hidden')}
function setMsg(id,text,type=''){const e=$(id);e.textContent=text;e.className=`message ${type}`}
function uid(){return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}
function nowIso(){return new Date().toISOString()}

function showOnboarding(){onboardingFocus=document.activeElement;openModal('onboardingModal');$('onboardingDone').focus()}
function dismissOnboarding(){
  try{localStorage.setItem('secdle_onboarding_seen','1')}catch{}
  closeModal('onboardingModal');
  if(onboardingFocus&&!onboardingFocus.disabled)onboardingFocus.focus();else $('howToPlayBtn').focus();
}
function buildShareResult(){
  if(!state||state.status==='playing')return '';
  const english=lang==='en',solved=state.status==='solved';
  const squares=Array.from({length:6},(_,i)=>{const guess=state.guesses?.[i];return !guess?'⬛':guess.relation==='correct'?'🟩':guess.relation==='same'?'🟨':'🟥'}).join('');
  return [`SecDle #${String(state.level).padStart(3,'0')} · ${state.releaseDate}`,`${solved?'✅':'❌'} ${solved?state.correctAttempts:state.attempts}/6`,`${english?'Current streak':'Racha actual'}: ${me?.currentStreak??getGuest().currentStreak}`,squares,PUBLIC_URL].join('\n');
}
async function copyResult(){
  const text=buildShareResult();if(!text)return;
  try{
    if(!globalThis.navigator?.clipboard?.writeText)throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text);setMsg('shareMessage','Resultado copiado.','good');
  }catch{
    $('shareFallback').value=text;$('shareFallback').classList.remove('hidden');$('shareFallback').focus();$('shareFallback').select();
    setMsg('shareMessage','Selecciona y copia este texto para compartirlo.');
  }
}
async function shareResult(){
  const text=buildShareResult();if(!text)return;
  if(globalThis.navigator?.share){
    try{await navigator.share({title:'SecDle',text});return}catch(error){if(error.name==='AbortError')return}
  }
  await copyResult();
}
function feedbackMailto(kind){
  const english=lang==='en',report=kind==='report';
  const subject=report?`${english?'Case report':'Reporte de caso'} SecDle #${state?.level||'—'}`:`${english?'Case suggestion':'Sugerencia de caso'} SecDle`;
  const body=report?`${english?'Case':'Caso'}: #${state?.level||'—'}\n${english?'Date':'Fecha'}: ${state?.releaseDate||'—'}\n${PUBLIC_URL}\n\n${english?'Problem or confusing hint':'Problema o pista confusa'}:\n`:`${PUBLIC_URL}\n\n${english?'Suggested topic and scenario':'Tema y situación sugeridos'}:\n\n${english?'Source (if based on a real incident)':'Fuente (si se basa en un incidente real)'}:\n`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
async function installApp(){
  if(installPrompt){
    const prompt=installPrompt;installPrompt=null;
    try{await prompt.prompt();await prompt.userChoice;return}catch{}
  }
  openModal('installModal');$('installModal').querySelector('button').focus();
}
function setupInstall(){
  if(!globalThis.navigator?.serviceWorker)return;
  navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'}).catch(()=>{ /* La partida funciona aunque la instalación no esté disponible. */ });
}

function blankGuest(){return {version:1,progress:{},events:[],currentStreak:0,bestStreak:0,updatedAt:nowIso()}}
function getGuest(){
  try{
    const raw=JSON.parse(localStorage.getItem(GUEST_KEY)||'null');
    if(!raw || typeof raw!=='object') return blankGuest();
    return {
      version:1,
      progress:raw.progress&&typeof raw.progress==='object'?raw.progress:{},
      events:Array.isArray(raw.events)?raw.events:[],
      currentStreak:Number(raw.currentStreak)||0,
      bestStreak:Number(raw.bestStreak)||0,
      updatedAt:raw.updatedAt||nowIso()
    };
  }catch{return blankGuest()}
}
function saveGuest(g){g.updatedAt=nowIso();localStorage.setItem(GUEST_KEY,JSON.stringify(g))}
function clearGuest(){localStorage.removeItem(GUEST_KEY)}
function hasGuestActivity(){const g=getGuest();return Object.keys(g.progress).length>0 || g.events.length>0}
function guestSnapshot(){
  const g=getGuest();
  return {progress:Object.values(g.progress),events:g.events,currentStreak:g.currentStreak,bestStreak:g.bestStreak,updatedAt:g.updatedAt};
}
function guestProgress(caseId){return getGuest().progress[caseId]||null}
function guestState(base,practice=false){
  const p=(!practice&&guestProgress(base.caseId))||{attempts:0,status:'playing',guesses:[],retryCount:0};
  const unlocked=p.status==='playing'?Math.min((p.attempts||0)+1,6):6;
  return {
    level:base.level,caseId:base.caseId,caseName:base.caseName,releaseDate:base.releaseDate,category:base.category,practice,
    hints:(base.allHints||[]).slice(0,unlocked),attempts:p.attempts||0,status:p.status||'playing',guesses:p.guesses||[],
    answer:(p.status==='solved'||p.status==='failed')?(p.answer||null):null,education:(p.education?.language||'es')===lang?p.education||null:null,correctAttempts:p.correctAttempts||null,retryCount:p.retryCount||0
  };
}
function recordGuestEvent(g,caseId,result){
  g.events.push({id:uid(),caseId,result,at:nowIso()});
  if(g.events.length>1000)g.events=g.events.slice(-1000);
}

function setGameMode(mode){
  if(mode !== 'classic' && mode !== 'easy') return;

  gameMode = mode;

  document.querySelectorAll('[data-game-mode]').forEach(btn => {
    const active = btn.dataset.gameMode === mode;

    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  });

  renderAssistPanel();
}


function findCatalogAnswer(value){
  const q = normalize(value);

  return catalog.find(answer =>
    normalize(answer.name) === q ||
    answer.aliases.some(alias => normalize(alias) === q)
  );
}


function renderAssistPanel(){
  const panel = $('easyAssistPanel');

  if(!panel) return;

  // En Clásico no dejamos contenido renderizado.
  panel.innerHTML = '';

  if(gameMode !== 'easy' || !state){
    panel.classList.add('hidden');
    return;
  }


  /*
    Creamos un mapa de respuestas ya utilizadas.

    state.guesses utiliza la respuesta canónica que devuelve
    el servidor, pero igualmente volvemos a resolverla contra
    el catálogo para respetar aliases.
  */
  const guessed = new Map();

  (state.guesses || []).forEach(guess => {
    const selected = findCatalogAnswer(guess.name);

    if(selected){
      guessed.set(
        normalize(selected.name),
        guess.relation
      );
    }
  });


  /*
    El catálogo proviene dinámicamente de secdle_data.js.
    No hay categorías ni respuestas escritas manualmente aquí.
  */
  const groups = new Map();

  catalog.forEach(answer => {
    if(!groups.has(answer.category)){
      groups.set(answer.category, []);
    }

    groups.get(answer.category).push(answer);
  });


  const head = document.createElement('div');

  head.className = 'easy-assist-head';

  head.innerHTML = `
    <div>
      <div class="easy-assist-title">
        Modo Fácil · Respuestas posibles
      </div>

      <div class="easy-assist-copy">
        Las respuestas fallidas se irán descartando conforme juegues.
      </div>
    </div>
  `;


  const grid = document.createElement('div');

  grid.className = 'easy-category-grid';


  groups.forEach((answers, category) => {

    const card = document.createElement('div');
    card.className = 'easy-category';


    const title = document.createElement('div');
    title.className = 'easy-category-title';
    title.textContent = category;


    const options = document.createElement('div');
    options.className = 'easy-options';


    answers.forEach(answer => {

      const option = document.createElement('div');

      const relation = guessed.get(
        normalize(answer.name)
      );

      option.className = 'easy-option';
      option.textContent = answer.name;


      // Respuesta correcta
      if(relation === 'correct'){

        option.classList.add('correct');

        option.setAttribute(
          'aria-label',
          `${answer.name}, respuesta correcta`
        );

      }

      // Cualquier respuesta incorrecta
      else if(relation){

        option.classList.add('discarded');

        option.setAttribute(
          'aria-label',
          `${answer.name}, opción descartada`
        );

      }


      options.appendChild(option);

    });


    card.append(
      title,
      options
    );

    grid.appendChild(card);

  });


  panel.append(
    head,
    grid
  );

  panel.classList.remove('hidden');
}

function updateAccount(){
  const logged=!!me;
  $('accountBtn').classList.toggle('hidden',logged);
  $('accountChip').classList.toggle('hidden',!logged);
  if(logged){
    $('accountEmail').textContent=me.email;
    $('planBadge').textContent=me.plan.toUpperCase();
    $('planBadge').classList.toggle('plus',me.plan==='plus');
    $('manageBillingBtn').classList.toggle('hidden',me.plan!=='plus' || !me.paymentProvider);
    if(me.plan==='plus'){
      const until=me.plusUntil?new Date(me.plusUntil).toLocaleDateString(lang==='en'?'en-US':'es-PE',{year:'numeric',month:'long',day:'numeric'}):null;
      $('subscriptionInfo').textContent=until?`Plus activo hasta ${until}.`:'Plus activo.';
      $('subscriptionInfo').classList.remove('hidden');
    }else{
      $('subscriptionInfo').classList.add('hidden');
      $('subscriptionInfo').textContent='';
    }
  }else{
    $('manageBillingBtn').classList.add('hidden');
    $('subscriptionInfo').classList.add('hidden');
  }
}
function renderGame(){
  const input=$('answerInput'),btn=$('submitBtn');
  $('history').innerHTML='';$('resultCard').classList.add('hidden');$('retryBtn').classList.add('hidden');
  if(!state){
    input.disabled=true;btn.disabled=true;
    $('caseLabel').textContent='Selecciona un caso';$('caseNumber').textContent='—';
    $('hintsList').innerHTML='<div class="empty">Todavía no hay un caso disponible. Revisa +Casos para ver los publicados.</div>';
    $('progress').innerHTML='';
renderAssistPanel();
return;
  }
  currentLevel=state.level;
  $('caseLabel').textContent=state.caseName;
  $('caseNumber').textContent=`#${String(state.level).padStart(3,'0')} · ${state.releaseDate}`;
  $('hintTitle').textContent=state.hints.length===1?'Pista 1 de 6':`${state.hints.length} pistas desbloqueadas`;
  $('hintsList').innerHTML='';
  state.hints.forEach((h,i)=>{
    const d=document.createElement('div');d.className='hint-item'+(i===state.hints.length-1?' current':'');
    d.innerHTML=`<div class="hint-item-label">Pista ${i+1}</div><p class="hint-text"></p>`;
    d.querySelector('p').textContent=h;$('hintsList').appendChild(d);
  });
  $('progress').innerHTML='';
  for(let i=0;i<6;i++){
    const d=document.createElement('div');d.className='dot';
    if(state.status==='solved'&&i<state.attempts)d.classList.add('win');
    else if(i<state.attempts)d.classList.add('used');
    else if(i===state.attempts&&state.status==='playing')d.classList.add('current');
    $('progress').appendChild(d);
  }
  (state.guesses||[]).slice().reverse().forEach(g=>{
    const row=document.createElement('div');row.className='guess-row';
    row.innerHTML=`<div><div class="guess-name"></div><div class="guess-meta"></div></div><div class="pill ${g.relation}">${g.relation==='correct'?'Correcto':g.relation==='same'?'Misma categoría':'Categoría distinta'}</div>`;
    row.querySelector('.guess-name').textContent=g.name;row.querySelector('.guess-meta').textContent=g.category;$('history').appendChild(row);
  });
  const done=state.status!=='playing';input.disabled=done;btn.disabled=done;
  $('shareFallback').classList.add('hidden');setMsg('shareMessage','');
  if(done){
    $('resultCard').classList.remove('hidden');
    if(state.status==='solved'){
      $('resultTitle').textContent=`Correcto: ${state.answer}`;
      $('resultText').textContent=state.practice?'Práctica completada. Tu logro anterior y tus estadísticas no cambian.':`Lo resolviste en ${state.correctAttempts} intento${state.correctAttempts===1?'':'s'}. Tu racha aumenta en 1.`;
      setMsg('message',state.practice?'Modo práctica: el caso sigue marcado como Correcto en +Casos.':me?'Caso completado y guardado en tu cuenta.':'Caso completado. Tu progreso se conserva en este navegador hasta que inicies sesión.','good');
    }else{
      $('resultTitle').textContent=state.answer?`Respuesta correcta: ${state.answer}`:'Caso perdido';
      $('resultText').textContent=state.practice?'Agotaste los 6 intentos de práctica. Tu logro anterior y tus estadísticas no cambian.':'Agotaste los 6 intentos y tu racha volvió a 0. Puedes volver a intentarlo desde cero mientras este caso esté incluido en tu plan.';
      $('retryBtn').classList.remove('hidden');
      setMsg('message','Puedes volver a intentar este caso.','error');
    }
}else{
  setMsg(
    'message',
    state.practice
      ? 'Modo práctica: el caso sigue marcado como Correcto en +Casos.'
      : me
      ? ''
      : 'Jugando como invitado Free. Crea una cuenta cuando quieras para guardar este progreso.'
  );
}

renderAssistPanel();
}

async function loadMe(){
  const d=await api('/api/me');me=d.user;updateAccount();
}
async function loadDaily(){
  if(submitting)return;
  try{
    if(me){currentGuestBase=null;state=await api('/api/daily')}
    else{currentGuestBase=await api('/api/guest/daily');state=guestState(currentGuestBase)}
    currentLevel=state.level;renderGame();
  }catch(e){state=null;currentGuestBase=null;renderGame();setMsg('message',e.message,'error')}
}
async function loadCase(level){
  if(submitting)return;
  try{
    if(me){currentGuestBase=null;state=await api(`/api/cases/${level}?practice=1`)}
    else{currentGuestBase=await api(`/api/guest/cases/${level}`);state=guestState(currentGuestBase,guestProgress(currentGuestBase.caseId)?.status==='solved')}
    $('answerInput').value='';$('suggestions').classList.remove('show');
    currentLevel=state.level;closeModal('archiveModal');renderGame();
  }catch(e){if(e.data?.upgrade)openModal('plusModal');else setMsg('message',e.message,'error')}
}

async function submitGuestGuess(v){
  if(!state||!currentGuestBase)return;
  const d=await api(`/api/guest/cases/${state.level}/check`,{method:'POST',body:JSON.stringify({guess:v})});
  const g=getGuest();
  const practice=Boolean(state.practice);
  let p=practice?{...state,guesses:[...state.guesses]}:g.progress[state.caseId]||{caseId:state.caseId,level:state.level,attempts:0,status:'playing',guesses:[],retryCount:0,createdAt:nowIso()};
  if(p.status!=='playing')return {correct:p.status==='solved'};
  p.attempts=(p.attempts||0)+1;p.guesses=[...(p.guesses||[]),d.guess];p.updatedAt=nowIso();
  if(d.correct){
    p.status='solved';p.correctAttempts=p.attempts;p.answer=d.guess.name;p.completedAt=nowIso();
    if(!practice){g.currentStreak=(g.currentStreak||0)+1;g.bestStreak=Math.max(g.bestStreak||0,g.currentStreak);recordGuestEvent(g,state.caseId,'solved')}
  }else if(p.attempts>=6){
    p.status='failed';p.completedAt=nowIso();if(!practice){g.currentStreak=0;recordGuestEvent(g,state.caseId,'failed')}
  }
  if(p.status!=='playing'){
    try{const reveal=await api(`/api/guest/cases/${state.level}/answer`);p.answer=reveal.answer;p.education=reveal}catch{}
  }
  if(practice){state={...p,hints:currentGuestBase.allHints.slice(0,p.status==='playing'?Math.min(p.attempts+1,6):6)}}
  else{g.progress[state.caseId]=p;saveGuest(g);state=guestState(currentGuestBase);updateAccount()}
  return d;
}
async function showEducationModal(){
  if(!state||state.status==='playing')return;
  const level=state.level;
  let education=state.education;
  if(!education&&!me)education=await api(`/api/guest/cases/${level}/answer`);
  if(state.level!==level)return;
  education=education||{answer:state.answer,explanation:'Revisa las señales de las últimas pistas.',keySignals:state.hints.slice(-2)};
  $('educationResult').textContent=state.status==='solved'?'Respuesta correcta':'Respuesta incorrecta: agotaste los seis intentos';
  $('educationAnswer').textContent=education.answer;$('educationExplanation').textContent=education.explanation;
  for(const [id,items] of [['educationSignals',education.keySignals],['educationWhyNot',education.whyNot]]){
    $(id).replaceChildren();
    for(const text of items||[]){const li=document.createElement('li');li.textContent=text;$(id).appendChild(li)}
    $(id).previousElementSibling.classList.toggle('hidden',!(items||[]).length);
  }
  educationFocus=document.activeElement;$('educationMessage').textContent='';
  $('reportCaseLink').href=feedbackMailto('report');
  openModal('educationModal');$('educationContinue').focus();
}
function dismissEducation(){
  closeModal('educationModal');
  if(educationFocus&&!educationFocus.disabled)educationFocus.focus();else $('todayBtn').focus();
}
async function nextCase(){
  try{
    const archive=await api(me?'/api/archive':'/api/guest/archive');
    const pending=archive.items.filter(item=>!item.locked&&item.level!==currentLevel&&['unplayed','playing'].includes(item.status))
      .filter(item=>me||!['solved','failed'].includes(guestProgress(item.caseId)?.status)).sort((a,b)=>a.level-b.level);
    const item=pending.find(item=>item.level>currentLevel)||pending[0];
    if(!item){dismissEducation();setMsg('message','No hay más casos pendientes disponibles en tu plan. Puedes revisar +Casos.');return}
    dismissEducation();await loadCase(item.level);
  }catch(e){$('educationMessage').textContent=e.message}
}
async function submitGuess(){
  const v=$('answerInput').value.trim();if(!v||!state||state.status!=='playing'||submitting)return;
  submitting=true;$('submitBtn').disabled=true;
  try{
    const previousStatus=state.status;
    let correct=false;
    if(me){
      const practice=Boolean(state.practice);
      const d=await api(`/api/cases/${state.level}/${practice?'practice/guess':'guess'}`,{method:'POST',body:JSON.stringify(practice?{guesses:[...state.guesses.map(g=>g.name),v]}:{guess:v})});
      state=d.state;correct=d.correct;
      if(!practice){me=d.user;updateAccount()}
    }else{
      const d=await submitGuestGuess(v);correct=Boolean(d?.correct);
    }
    $('answerInput').value='';$('suggestions').classList.remove('show');renderGame();
    if(correct)setMsg('message','¡Correcto!','good');
    else if(state.status==='playing')setMsg('message','No es esa. Se desbloqueó una nueva pista.');
    if(previousStatus==='playing'&&state.status!=='playing')await showEducationModal();
  }catch(e){setMsg('message',e.message,'error')}
  finally{submitting=false;$('submitBtn').disabled=!state||state.status!=='playing'}
}
async function retryCase(){
  if(!state||state.status!=='failed')return;
  try{
    if(state.practice){await loadCase(state.level)}
    else if(me){
      const d=await api(`/api/cases/${state.level}/retry`,{method:'POST'});state=d.state;me=d.user;updateAccount();
    }else{
      if(!currentGuestBase)currentGuestBase=await api(`/api/guest/cases/${state.level}`);
      const g=getGuest();const old=g.progress[state.caseId]||{};
      g.progress[state.caseId]={caseId:state.caseId,level:state.level,attempts:0,status:'playing',guesses:[],retryCount:(old.retryCount||0)+1,createdAt:old.createdAt||nowIso(),updatedAt:nowIso()};
      saveGuest(g);state=guestState(currentGuestBase);updateAccount();
    }
    closeModal('failureModal');renderGame();setMsg('message','Nuevo intento iniciado. Vuelves a tener 6 intentos.');
  }catch(e){if(e.data?.upgrade)openModal('plusModal');else setMsg('message',e.message,'error')}
}

function suggestions(){
  const q=normalize($('answerInput').value),box=$('suggestions');box.innerHTML='';
  if(!q){box.classList.remove('show');return}
  const ms=catalog.filter(a=>normalize(a.name).includes(q)||a.aliases.some(x=>normalize(x).includes(q))).slice(0,10);
  ms.forEach(a=>{const d=document.createElement('div');d.className='suggestion';d.textContent=a.name;d.onmousedown=e=>{e.preventDefault();$('answerInput').value=a.name;box.classList.remove('show')};box.appendChild(d)});
  box.classList.toggle('show',ms.length>0);
}

async function openArchive(){
  try{
    const d=await api(me?'/api/archive':'/api/guest/archive');
    $('archiveSubtitle').textContent=me?.plan==='plus'?'Plus: acceso a todos los casos publicados.':me?'Free: acceso a los 5 casos publicados más recientes.':'Invitado Free: puedes jugar los 5 casos publicados más recientes. Inicia sesión para guardar el progreso en tu cuenta.';
    archiveItems=d.items;
    archivePage=0;
    renderArchivePage();
    openModal('archiveModal');
  }catch(e){setMsg('message',e.message,'error')}
}
function renderArchivePage(){
    const totalPages=Math.max(1,Math.ceil(archiveItems.length/archivePageSize));
    archivePage=Math.max(0,Math.min(archivePage,totalPages-1));
    $('archiveGrid').replaceChildren();
    $('archiveGrid').scrollTop=0;
    $('archivePrevBtn').disabled=archivePage===0;
    $('archiveNextBtn').disabled=archivePage===totalPages-1;
    $('archivePageInfo').textContent=`Página ${archivePage+1} de ${totalPages}`;
    if(!archiveItems.length){
      const empty=document.createElement('div');empty.className='empty';empty.textContent='Todavía no hay casos publicados.';$('archiveGrid').appendChild(empty);
    }
    const g=me?null:getGuest();
    archiveItems.slice(archivePage*archivePageSize,(archivePage+1)*archivePageSize).forEach(item=>{
      const localStatus=!me?(g.progress[item.caseId]?.status||item.status):item.status;
      // Los endpoints antiguos no incluían caseId en el archivo de invitado. El nivel se resuelve al abrir; para estado local usamos el caseId cuando exista.
      let statusValue=localStatus;
      if(!me && !item.caseId){const match=Object.values(g.progress).find(p=>p.level===item.level);if(match)statusValue=match.status}
      const row=document.createElement('div');row.className='archive-item'+(item.locked?' locked':'');
      const status=item.locked?(statusValue==='solved'?'✅ Correcto · 🔒 Plus para abrir':statusValue==='failed'?'❌ Perdido · 🔒 Plus para reintentar':'🔒 Plus'):statusValue==='solved'?'✅ Correcto':statusValue==='failed'?'❌ Perdido · puedes reintentarlo':'Sin jugar';
      const buttonLabel=item.locked?'Desbloquear':statusValue==='failed'?'Reintentar':'Abrir';
      row.innerHTML=`<div><strong>SecDle #${String(item.level).padStart(3,'0')}</strong><div class="archive-meta">${item.releaseDate}</div></div><div><div class="archive-status">${status}</div><button class="btn ${item.locked?'plus':''}" style="margin-top:6px">${buttonLabel}</button></div>`;
      row.querySelector('button').onclick=async()=>{
        if(item.locked){openModal('plusModal');return}
        if(statusValue==='failed'){await loadCase(item.level);if(state?.status==='failed')await retryCase();closeModal('archiveModal');return}
        await loadCase(item.level);
      };
      $('archiveGrid').appendChild(row);
    });
}
function changeArchivePage(delta){
  archivePage+=delta;
  renderArchivePage();
  if(document.activeElement?.disabled)$('archivePageInfo').focus();
}

function setAuthMode(mode){authMode=mode;document.querySelectorAll('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===mode));$('authSubmit').textContent=mode==='login'?'Iniciar sesión':'Crear cuenta';setMsg('authMessage','')}
async function importGuestIntoAccount(){
  if(!me||!hasGuestActivity())return false;
  const d=await api('/api/progress/import-guest',{method:'POST',body:JSON.stringify(guestSnapshot())});
  me=d.user;clearGuest();return true;
}
async function authSubmit(e){
  e.preventDefault();const email=$('emailInput').value,password=$('passwordInput').value;
  try{
    const levelBefore=currentLevel;
    const hadGuest=hasGuestActivity();
    const d=await api(`/api/auth/${authMode}`,{method:'POST',body:JSON.stringify({email,password})});me=d.user;
    let imported=false;
    if(hadGuest){
      try{imported=await importGuestIntoAccount()}catch(importError){setMsg('authMessage',`Sesión iniciada, pero no se pudo importar el progreso local: ${importError.message}`,'error');return}
    }
    closeModal('authModal');
    if(pendingPaymentCycle){

    const cycle = pendingPaymentCycle;

    pendingPaymentCycle = null;

    choosePayment(cycle);
    }
    updateAccount();
    if(levelBefore){try{await loadCase(levelBefore)}catch{await loadDaily()}}else await loadDaily();
    if(imported)setMsg('message','Sesión iniciada. Tu progreso de invitado fue cargado en tu cuenta.','good');
  }catch(e){setMsg('authMessage',e.message,'error')}
}
async function logout(){
  await api('/api/auth/logout',{method:'POST'});me=null;state=null;currentGuestBase=null;updateAccount();await loadDaily();setMsg('message','Sesión cerrada. Ahora juegas como invitado Free.');
}

function choosePayment(cycle){
  selectedCycle=cycle;
  pendingPaymentCycle=cycle;

  if(!me){
    setAuthMode('login');
    openModal('authModal');
    setMsg('authMessage','Inicia sesión o crea una cuenta para contratar Plus.');
    return;
  }

  pendingPaymentCycle=null;
  const annual=cycle==='annual';
  $('paymentPlanText').textContent=annual?'SecDle Plus Anual · referencia $19.99 USD':'SecDle Plus Mensual · referencia $1.99 USD';
  $('paymentDisclosure').textContent=annual?'Cobro real recurrente: S/ 79.90 PEN por año.':'Cobro real recurrente: S/ 7.90 PEN por mes.';
  setMsg('paymentMessage','');
  closeModal('plusModal');
  openModal('paymentModal');
}

async function startPayment(provider){
  if(!me){openModal('authModal');return;}
  try{
    setMsg('paymentMessage','Preparando checkout seguro...');
    const data=await api('/api/payment/start',{
      method:'POST',
      body:JSON.stringify({provider,cycle:selectedCycle||'monthly'})
    });
    location.href=data.url;
  }catch(e){setMsg('paymentMessage',e.message,'error');}
}

// La confirmación se realiza desde el servidor, sin botón ni datos de pago del navegador.
async function activatePlusOnReturn(){
  history.replaceState(null,'',location.pathname);
  if(!me){
    setMsg('message','Inicia sesión para consultar tu suscripción. La confirmación del pago sigue procesándose automáticamente.');
    return;
  }
  setMsg('message','Comprobando tu pago con Mercado Pago...');
  // Mercado Pago puede avisar al servidor unos segundos después de redirigir al usuario.
  for(let attempt=0;attempt<24;attempt++){
    try{
      const result=await api('/api/payment/status');
      const oldPlan=me.plan;
      me=result.user;
      updateAccount();
      if(me.plan==='plus'){
        if(oldPlan!=='plus')await loadDaily();
        setMsg('message','¡Pago confirmado! SecDle Plus ya está activo.','good');
        return;
      }
    }catch(e){
      console.warn('Confirmación automática pendiente:',e.message);
    }
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  setMsg('message','Tu pago sigue en proceso de confirmación. SecDle activará Plus automáticamente cuando Mercado Pago confirme el cobro.');
}
async function refreshPlanOnReturnToPage(){
  if(!me)return;
  try{
    const previous=me.plan;
    const isPending=['pending','pending_payment'].includes(me.subscriptionStatus);
    const result=await api(isPending?'/api/payment/status':'/api/me');
    me=result.user;
    updateAccount();
    if(previous!==me.plan){
      await loadDaily();
      if(me.plan==='plus')setMsg('message','¡SecDle Plus ya está activo!','good');
    }
  }catch(e){console.warn('No se pudo actualizar el plan:',e.message);}
}

async function cancelSubscription(){
  if(!me||me.plan!=='plus')return;
  const ok=confirm(globalThis.SECDLE_I18N.translate('¿Cancelar la renovación automática? Mantendrás Plus hasta el final del período ya pagado.',lang));
  if(!ok)return;
  try{
    setMsg('plusMessage','Cancelando la renovación...');
    const d=await api('/api/subscription/cancel',{method:'POST'});
    me=d.user;updateAccount();setMsg('plusMessage',d.message||'Renovación cancelada.','good');
  }catch(e){setMsg('plusMessage',e.message,'error');}
}

async function init(){
  const [settings,answers]=await Promise.all([api('/api/config'),api('/api/catalog'),loadMe()]);
  config=settings;catalog=answers;
  $('todayBtn').textContent=config.dailyIsToday?'Hoy':'Último';
  $('dailyLabel').textContent=config.dailyIsToday?'CASO DIARIO':'ÚLTIMO CASO';
  $('paymentNotice').textContent='Precios mostrados en USD como referencia. Cobro real: S/ 7.90 PEN mensual o S/ 79.90 PEN anual, procesado por Mercado Pago.';
  await loadDaily();
  $('suggestCaseLink').href=feedbackMailto('suggest');
  setupInstall();
  if(new URLSearchParams(location.search).get('payment')==='return'){
    await activatePlusOnReturn();
  }
  try{
    const restore=JSON.parse(sessionStorage.getItem('secdle_language_restore')||'null');
    sessionStorage.removeItem('secdle_language_restore');
    if(restore){
      if(restore.level&&restore.level!==currentLevel)await loadCase(restore.level);
      setGameMode(restore.mode||'classic');$('answerInput').value=restore.draft||'';
      if(restore.archive){await openArchive();archivePage=Number.isInteger(restore.archivePage)?restore.archivePage:0;renderArchivePage()}
      if(restore.education)await showEducationModal();
    }
  }catch{}
  try{
    if(!localStorage.getItem('secdle_onboarding_seen')&&!new URLSearchParams(location.search).has('payment')&&$('educationModal').classList.contains('hidden')&&$('archiveModal').classList.contains('hidden'))showOnboarding();
  }catch{}
}
$('answerInput').addEventListener('input',suggestions);
$('answerInput').addEventListener('blur',()=>setTimeout(()=>$('suggestions').classList.remove('show'),120));
$('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter')submitGuess()});
$('submitBtn').onclick=submitGuess;$('retryBtn').onclick=retryCase;$('failureRetryBtn').onclick=retryCase;$('accountBtn').onclick=()=>openModal('authModal');
$('archiveBtn').onclick=openArchive;

$('todayBtn').onclick=loadDaily;$('plusBtn').onclick=()=>openModal('plusModal');

$('logoutBtn').onclick=logout;
$('authForm').onsubmit=authSubmit;
$('manageBillingBtn').onclick=cancelSubscription;
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden)refreshPlanOnReturnToPage();
});
// También se actualiza si Mercado Pago confirma el pago mientras esta pestaña sigue abierta.
setInterval(()=>{
  if(!document.hidden && me?.plan==='free' &&
    ['pending','pending_payment'].includes(me.subscriptionStatus))refreshPlanOnReturnToPage();
},20000);
document.querySelectorAll('[data-game-mode]')
.forEach(button => {
  button.onclick = () => setGameMode(button.dataset.gameMode);
});
document.querySelectorAll('[data-auth-tab]').forEach(b=>b.onclick=()=>setAuthMode(b.dataset.authTab));
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>closeModal(b.dataset.close));

document.querySelectorAll('[data-cycle]')
.forEach(b => {
    b.onclick = () => choosePayment(b.dataset.cycle);
});

document.querySelectorAll('[data-payment]')
.forEach(b => {
    b.onclick = () => startPayment(b.dataset.payment);
});

document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('mousedown',e=>{if(e.target===m){if(m.id==='educationModal')dismissEducation();else if(m.id==='onboardingModal')dismissOnboarding();else closeModal(m.id)}}));
$('educationContinue').onclick=dismissEducation;$('educationNext').onclick=nextCase;
$('archivePrevBtn').onclick=()=>changeArchivePage(-1);
$('archiveNextBtn').onclick=()=>changeArchivePage(1);
$('languageBtn').onclick=()=>setLanguage(lang==='en'?'es':'en');
$('howToPlayBtn').onclick=showOnboarding;
$('onboardingDone').onclick=dismissOnboarding;$('onboardingClose').onclick=dismissOnboarding;
$('playTodayBtn').onclick=async()=>{await loadDaily();$('gameCard').scrollIntoView?.({behavior:'auto',block:'start'});if(!$('answerInput').disabled)$('answerInput').focus()};
$('shareResultBtn').onclick=shareResult;$('copyResultBtn').onclick=copyResult;
if(globalThis.addEventListener){
  globalThis.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event});
  globalThis.addEventListener('appinstalled',()=>{installPrompt=null;setMsg('installMessage','SecDle instalado.','good')});
}
document.addEventListener('keydown',e=>{
  if(!$('onboardingModal').classList.contains('hidden')){
    if(e.key==='Escape'){e.preventDefault();dismissOnboarding()}
    if(e.key==='Tab'){
      const first=$('onboardingClose'),last=$('onboardingDone');
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
    }
    return;
  }
  if($('educationModal').classList.contains('hidden'))return;
  if(e.key==='Escape'){e.preventDefault();dismissEducation()}
  if(e.key==='Tab'){
    const first=$('educationContinue'),last=$('reportCaseLink');
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}
  }
});
init().catch(e=>setMsg('message',e.message,'error'));
