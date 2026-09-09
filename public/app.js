let me=null,catalog=[],state=null,currentLevel=null,authMode='login',config=null,currentGuestBase=null;
let selectedCycle = null;
let pendingPaymentCycle = null;

const $=id=>document.getElementById(id);
const normalize=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const GUEST_KEY='secdle_guest_progress_v1';

async function api(url,opts={}){
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
function guestState(base){
  const p=guestProgress(base.caseId)||{attempts:0,status:'playing',guesses:[],retryCount:0};
  const unlocked=p.status==='playing'?Math.min((p.attempts||0)+1,6):6;
  return {
    level:base.level,caseId:base.caseId,caseName:base.caseName,releaseDate:base.releaseDate,category:base.category,
    hints:(base.allHints||[]).slice(0,unlocked),attempts:p.attempts||0,status:p.status||'playing',guesses:p.guesses||[],
    answer:(p.status==='solved'||p.status==='failed')?(p.answer||null):null,correctAttempts:p.correctAttempts||null,retryCount:p.retryCount||0
  };
}
function recordGuestEvent(g,caseId,result){
  g.events.push({id:uid(),caseId,result,at:nowIso()});
  if(g.events.length>1000)g.events=g.events.slice(-1000);
}

function updateAccount(){
  const logged=!!me;
  $('accountBtn').classList.toggle('hidden',logged);
  $('accountChip').classList.toggle('hidden',!logged);
  if(logged){
    $('accountEmail').textContent=me.email;
    $('planBadge').textContent=me.plan.toUpperCase();
    $('planBadge').classList.toggle('plus',me.plan==='plus');
    $('streakStat').textContent=me.currentStreak||0;
    $('bestStreakStat').textContent=me.bestStreak||0;
    $('planStat').textContent=me.plan.toUpperCase();
    $('manageBillingBtn').classList.toggle('hidden',me.plan!=='plus' || !me.paymentProvider);
    $('verifyPaymentBtn').classList.remove('hidden');
    if(me.plan==='plus'){
      const until=me.plusUntil?new Date(me.plusUntil).toLocaleDateString('es-PE',{year:'numeric',month:'long',day:'numeric'}):null;
      $('subscriptionInfo').textContent=until?`Plus activo hasta ${until}.`:'Plus activo.';
      $('subscriptionInfo').classList.remove('hidden');
    }else{
      $('subscriptionInfo').classList.add('hidden');
      $('subscriptionInfo').textContent='';
    }
  }else{
    const g=getGuest();
    $('streakStat').textContent=g.currentStreak||0;
    $('bestStreakStat').textContent=g.bestStreak||0;
    $('planStat').textContent='FREE';
    $('manageBillingBtn').classList.add('hidden');
    $('verifyPaymentBtn').classList.remove('hidden');
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
    $('progress').innerHTML='';$('attemptStat').textContent='0/6';return;
  }
  currentLevel=state.level;
  $('caseLabel').textContent=state.caseName;
  $('caseNumber').textContent=`#${String(state.level).padStart(3,'0')} · ${state.releaseDate}`;
  $('attemptStat').textContent=`${state.attempts}/6`;
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
  if(done){
    $('resultCard').classList.remove('hidden');
    if(state.status==='solved'){
      $('resultTitle').textContent=`Correcto: ${state.answer}`;
      $('resultText').textContent=`Lo resolviste en ${state.correctAttempts} intento${state.correctAttempts===1?'':'s'}. Tu racha aumenta en 1.`;
      setMsg('message',me?'Caso completado y guardado en tu cuenta.':'Caso completado. Tu progreso se conserva en este navegador hasta que inicies sesión.','good');
    }else{
      $('resultTitle').textContent=state.answer?`Respuesta correcta: ${state.answer}`:'Caso perdido';
      $('resultText').textContent='Agotaste los 6 intentos y tu racha volvió a 0. Puedes volver a intentarlo desde cero mientras este caso esté incluido en tu plan.';
      $('retryBtn').classList.remove('hidden');
      setMsg('message','Puedes volver a intentar este caso.','error');
    }
  }else setMsg('message',me?'':'Jugando como invitado Free. Crea una cuenta cuando quieras para guardar este progreso.');
}

async function loadMe(){
  const d=await api('/api/me');me=d.user;updateAccount();renderGame();await loadDaily();
}
async function loadDaily(){
  try{
    if(me){currentGuestBase=null;state=await api('/api/daily')}
    else{currentGuestBase=await api('/api/guest/daily');state=guestState(currentGuestBase)}
    currentLevel=state.level;renderGame();
  }catch(e){state=null;currentGuestBase=null;renderGame();setMsg('message',e.message,'error')}
}
async function loadCase(level){
  try{
    if(me){currentGuestBase=null;state=await api(`/api/cases/${level}`)}
    else{currentGuestBase=await api(`/api/guest/cases/${level}`);state=guestState(currentGuestBase)}
    currentLevel=state.level;closeModal('archiveModal');renderGame();
  }catch(e){if(e.data?.upgrade)openModal('plusModal');else setMsg('message',e.message,'error')}
}

async function submitGuestGuess(v){
  if(!state||!currentGuestBase)return;
  const d=await api(`/api/guest/cases/${state.level}/check`,{method:'POST',body:JSON.stringify({guess:v})});
  const g=getGuest();
  let p=g.progress[state.caseId]||{caseId:state.caseId,level:state.level,attempts:0,status:'playing',guesses:[],retryCount:0,createdAt:nowIso()};
  if(p.status!=='playing')return {correct:p.status==='solved'};
  p.attempts=(p.attempts||0)+1;p.guesses=[...(p.guesses||[]),d.guess];p.updatedAt=nowIso();
  if(d.correct){
    p.status='solved';p.correctAttempts=p.attempts;p.answer=d.guess.name;p.completedAt=nowIso();
    g.currentStreak=(g.currentStreak||0)+1;g.bestStreak=Math.max(g.bestStreak||0,g.currentStreak);recordGuestEvent(g,state.caseId,'solved');
  }else if(p.attempts>=6){
    p.status='failed';p.completedAt=nowIso();g.currentStreak=0;recordGuestEvent(g,state.caseId,'failed');
    try{const reveal=await api(`/api/guest/cases/${state.level}/answer`);p.answer=reveal.answer||null}catch{}
  }
  g.progress[state.caseId]=p;saveGuest(g);state=guestState(currentGuestBase);updateAccount();return d;
}
function showFailureModal(){
  if(!state||state.status!=='failed')return;
  $('failureAnswer').textContent=state.answer||'Respuesta no disponible';
  openModal('failureModal');
}
async function submitGuess(){
  const v=$('answerInput').value.trim();if(!v||!state)return;
  try{
    const previousStatus=state.status;
    let correct=false;
    if(me){
      const d=await api(`/api/cases/${state.level}/guess`,{method:'POST',body:JSON.stringify({guess:v})});
      state=d.state;me=d.user;correct=d.correct;updateAccount();
    }else{
      const d=await submitGuestGuess(v);correct=Boolean(d?.correct);
    }
    $('answerInput').value='';$('suggestions').classList.remove('show');renderGame();
    if(correct)setMsg('message','¡Correcto!','good');
    else if(state.status==='playing')setMsg('message','No es esa. Se desbloqueó una nueva pista.');
    else if(previousStatus==='playing'&&state.status==='failed')showFailureModal();
  }catch(e){setMsg('message',e.message,'error')}
}
async function retryCase(){
  if(!state||state.status!=='failed')return;
  try{
    if(me){
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
    $('archiveGrid').innerHTML='';
    const g=me?null:getGuest();
    d.items.forEach(item=>{
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
    openModal('archiveModal');
  }catch(e){setMsg('message',e.message,'error')}
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
  $('paymentDisclosure').textContent=annual?'Cobro real recurrente: S/ 79.00 PEN por año.':'Cobro real recurrente: S/ 7.90 PEN por mes.';
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

async function verifyPayment(){
  if(!me){
    setAuthMode('login');
    openModal('authModal');
    setMsg('authMessage','Inicia sesión con el mismo correo usado en Mercado Pago para verificar Plus.');
    return;
  }
  try{
    setMsg('plusMessage','Buscando tu suscripción en Mercado Pago...');
    const body=selectedCycle?{cycle:selectedCycle}:{};
    const d=await api('/api/payment/sync',{method:'POST',body:JSON.stringify(body)});
    me=d.user;updateAccount();
    setMsg('plusMessage','¡Listo! SecDle Plus está activo.','good');
  }catch(e){setMsg('plusMessage',e.message,'error');}
}

async function cancelSubscription(){
  if(!me||me.plan!=='plus')return;
  const ok=confirm('¿Cancelar la renovación automática? Mantendrás Plus hasta el final del período ya pagado.');
  if(!ok)return;
  try{
    setMsg('plusMessage','Cancelando la renovación...');
    const d=await api('/api/subscription/cancel',{method:'POST'});
    me=d.user;updateAccount();setMsg('plusMessage',d.message||'Renovación cancelada.','good');
  }catch(e){setMsg('plusMessage',e.message,'error');}
}

async function init(){
  config=await api('/api/config');catalog=await api('/api/catalog');
  $('todayBtn').textContent=config.dailyIsToday?'Hoy':'Último';
  $('dailyLabel').textContent=config.dailyIsToday?'CASO DIARIO':'ÚLTIMO CASO';
  $('paymentNotice').textContent='Precios mostrados en USD como referencia. Cobro real: S/ 7.90 PEN mensual o S/ 79.00 PEN anual, procesado por Mercado Pago.';
  await loadMe();
}
$('answerInput').addEventListener('input',suggestions);
$('answerInput').addEventListener('blur',()=>setTimeout(()=>$('suggestions').classList.remove('show'),120));
$('answerInput').addEventListener('keydown',e=>{if(e.key==='Enter')submitGuess()});
$('submitBtn').onclick=submitGuess;$('retryBtn').onclick=retryCase;$('failureRetryBtn').onclick=retryCase;$('accountBtn').onclick=()=>openModal('authModal');
$('archiveBtn').onclick=openArchive;$('openArchiveBtn').onclick=openArchive;$('todayBtn').onclick=loadDaily;$('plusBtn').onclick=()=>openModal('plusModal');
$('logoutBtn').onclick=logout;$('authForm').onsubmit=authSubmit;$('manageBillingBtn').onclick=cancelSubscription;$('verifyPaymentBtn').onclick=verifyPayment;
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

document.querySelectorAll('.modal-backdrop').forEach(m=>m.addEventListener('mousedown',e=>{if(e.target===m)closeModal(m.id)}));
init().catch(e=>setMsg('message',e.message,'error'));
