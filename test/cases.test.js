const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const vm=require('node:vm');
// Aislamiento ANTES de cargar dotenv/db: jamás usar PostgreSQL o datos reales.
process.env.DATABASE_URL='';process.env.NODE_ENV='test';
const tempRoot=process.platform==='win32'?path.join(process.env.LOCALAPPDATA,'Temp','opencode'):os.tmpdir();
const temp=fs.mkdtempSync(path.join(tempRoot,'secdle-v7-test-'));
process.env.STORE_PATH=path.join(temp,'store.json');
const db=require('../db');
const {app,flattenCases,localizePayload,gameDate}=require('../server');
const {translate}=require('../public/i18n');
const rows=flattenCases();

test('37 casos diarios bilingües, IDs únicos, seis pistas y educación',()=>{
  assert.equal(rows.length,37);assert.equal(new Set(rows.map(c=>c.id)).size,37);
  for(const [i,c] of rows.entries()){
    assert.equal(c.releaseDate,new Date(Date.UTC(2026,7,25+i)).toISOString().slice(0,10));
    assert.equal(c.hints.length,6);assert.equal(c.hintsEn.length,6);
    assert.ok(c.hints.every(Boolean)&&c.hintsEn.every(Boolean));
    assert.ok(c.explanation&&c.explanationEn&&c.nameEn);
    assert.equal(c.keySignals.length,c.keySignalsEn.length);
    assert.equal(c.whyNot.length,c.whyNotEn.length);
  }
  assert.equal(rows.find(c=>c.id==='idor-a').releaseDate,'2026-09-02');
  assert.equal(rows.find(c=>c.id==='privilege-escalation-a').releaseDate,'2026-09-10');
  assert.equal(gameDate(new Date('2026-10-01T04:59:00Z')),'2026-09-30');
});

test('API ES/EN, cuenta/invitado, intentos, modal, reintento, importación y permisos',async t=>{
  assert.equal(db.usingPostgres,false);await db.init();
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(temp,{recursive:true,force:true})});
  const base=`http://127.0.0.1:${server.address().port}`;let cookie='';
  async function request(url,body){
    const r=await fetch(base+url,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')};
  }
  const archive=(await request('/api/guest/archive')).data;
  const free=archive.items.filter(c=>!c.locked);assert.equal(free.length,5);
  const c=rows.find(c=>c.level===free[1].level),wrong=rows.find(x=>x.answer!==c.answer).answer;
  const english=(await request(`/api/guest/cases/${c.level}?lang=en`)).data;
  assert.deepEqual(english.allHints,c.hintsEn);assert.equal(english.caseName,c.nameEn);
  assert.equal((await request(`/api/guest/cases/${c.level}/check`,{guess:wrong})).data.correct,false);
  assert.equal((await request(`/api/guest/cases/${c.level}/check?lang=en`,{guess:c.answer})).data.correct,true);
  assert.equal((await request(`/api/guest/cases/${c.level}/answer?lang=en`)).data.explanation,c.explanationEn);
  assert.equal((await request('/api/guest/cases/999?lang=en')).data.error,'Case unavailable.');
  const locked=archive.items.find(c=>c.locked);assert.equal((await request(`/api/guest/cases/${locked.level}`)).status,402);
  const registered=await request('/api/auth/register',{email:'test@example.invalid',password:'test-password-123'});
  assert.equal(registered.status,200);cookie=registered.cookie.split(';')[0];
  assert.equal((await request('/api/payment/start',{provider:'yape',cycle:'monthly'})).status,400);
  const initial=(await request(`/api/cases/${c.level}?lang=en`)).data;
  assert.equal(initial.education,null);assert.equal(initial.answer,null);assert.deepEqual(initial.hints,c.hintsEn.slice(0,1));
  assert.equal((await request(`/api/cases/${c.level}/practice/guess`,{guesses:[wrong]})).status,400);
  for(let i=1;i<=6;i++){
    const p=(await request(`/api/cases/${c.level}/guess?lang=en`,{guess:wrong})).data.state;
    assert.equal(p.attempts,i);assert.equal(p.status,i===6?'failed':'playing');
    if(i<6)assert.equal(p.education,null);else assert.equal(p.education.explanation,c.explanationEn);
  }
  assert.equal((await request(`/api/cases/${c.level}/retry`,{})).data.state.education,null);
  const solved=(await request(`/api/cases/${c.level}/guess?lang=en`,{guess:c.answer})).data.state;
  assert.equal(solved.status,'solved');assert.equal(solved.education.answer,c.answer);
  assert.equal((await request(`/api/cases/${c.level}`)).data.education.explanation,c.explanation);
  assert.equal((await request(`/api/cases/${c.level}/retry`,{})).status,400);
  const beforePractice=JSON.parse(fs.readFileSync(process.env.STORE_PATH,'utf8'));
  const practice=(await request(`/api/cases/${c.level}?practice=1&lang=en`)).data;
  assert.equal(practice.practice,true);assert.equal(practice.status,'playing');assert.equal(practice.attempts,0);
  assert.equal(practice.education,null);assert.equal(practice.answer,null);assert.deepEqual(practice.guesses,[]);assert.deepEqual(practice.hints,c.hintsEn.slice(0,1));
  const practiceWrong=(await request(`/api/cases/${c.level}/practice/guess`,{guesses:[wrong]})).data;
  assert.equal(practiceWrong.correct,false);assert.equal(practiceWrong.state.attempts,1);assert.equal(practiceWrong.state.answer,null);
  const practiceSolved=(await request(`/api/cases/${c.level}/practice/guess?lang=en`,{guesses:[wrong,c.answer]})).data;
  assert.equal(practiceSolved.correct,true);assert.equal(practiceSolved.state.practice,true);assert.equal(practiceSolved.state.education.explanation,c.explanationEn);
  const practiceFailed=(await request(`/api/cases/${c.level}/practice/guess`,{guesses:Array(6).fill(wrong)})).data.state;
  assert.equal(practiceFailed.status,'failed');assert.equal(practiceFailed.practice,true);
  assert.equal((await request(`/api/cases/${c.level}/practice/guess`,{guesses:Array(7).fill(wrong)})).status,400);
  assert.equal((await request(`/api/cases/${c.level}/practice/guess`,{guesses:['not-an-answer']})).status,400);
  assert.equal((await request(`/api/cases/${c.level}/practice/guess`,{guesses:[c.answer,wrong]})).status,400);
  const afterPractice=JSON.parse(fs.readFileSync(process.env.STORE_PATH,'utf8'));
  assert.deepEqual(afterPractice,beforePractice);
  assert.equal((await request('/api/archive')).data.items.find(item=>item.caseId===c.id).status,'solved');
  const imported=rows.find(x=>x.level===free[2].level);
  assert.equal((await request('/api/progress/import-guest',{progress:[{caseId:imported.id,guesses:[{name:imported.answer}],updatedAt:new Date().toISOString()}],events:[]})).status,200);
  assert.equal((await request(`/api/cases/${imported.level}?lang=en`)).data.education.explanation,imported.explanationEn);
  assert.equal((await request(`/api/cases/${locked.level}`)).status,402);
  assert.equal((await request(`/api/cases/${locked.level}?practice=1`)).status,402);
  assert.equal((await request(`/api/cases/${locked.level}/practice/guess`,{guesses:[wrong]})).status,402);
  const store=JSON.parse(fs.readFileSync(process.env.STORE_PATH,'utf8'));store.users[0].plan='plus';
  fs.writeFileSync(process.env.STORE_PATH,JSON.stringify(store));
  assert.equal((await request(`/api/cases/${locked.level}`)).status,200);
  const config=(await request('/api/config')).data;
  assert.equal(config.displayCurrency,'USD');assert.equal(config.chargeCurrency,'PEN');assert.equal(config.chargePricesPen.monthly,7.9);
  assert.equal(config.paymentProviders.yape,false);
});

test('traducciones UI y localización sin mutar la identidad o revelar educación',()=>{
  assert.equal(translate('Fácil','en'),'Easy');assert.equal(translate('Pista 4','en'),'Hint 4');
  assert.equal(translate('Lo resolviste en 1 intento. Tu racha aumenta en 1.','en'),'You solved it in 1 attempt. Your streak increases by 1.');
  for(const file of ['index','about','privacy','terms','payments','admin','404']){
    const html=fs.readFileSync(path.join(__dirname,`../public/${file}.html`),'utf8');
    assert.ok(html.includes('id="languageBtn"')&&html.includes('/i18n.js'));
  }
  const spanish={caseId:rows[0].id,caseName:rows[0].caseName,hints:rows[0].hints.slice(0,1),education:null};
  const english=localizePayload(spanish);
  assert.equal(english.education,null);assert.equal(english.caseId,spanish.caseId);
  assert.deepEqual(english.hints,rows[0].hintsEn.slice(0,1));assert.deepEqual(spanish.hints,rows[0].hints.slice(0,1));
});

test('frontend: fallo intermedio → acierto/fallo final → educación → siguiente; modo Fácil conservado',async()=>{
  const elements=new Map(),storage=new Map();
  const document={activeElement:null,hidden:false,addEventListener(){},querySelectorAll(){return []},createElement:()=>element(),getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}};
  function element(){
    const classes=new Set(['hidden']);
    return {textContent:'',disabled:false,value:'',children:[],previousElementSibling:{classList:{toggle(){}}},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c)}},appendChild(child){this.children.push(child)},append(...children){this.children.push(...children)},replaceChildren(){this.children=[]},setAttribute(){},addEventListener(){},focus(){document.activeElement=this},select(){},querySelector(){return element()}};
  }
  const education={answer:'Worm',explanation:'Se replica solo.',keySignals:['Autorreplicación','Red'],whyNot:['Sin anfitrión.'],language:'es'};
  const context=vm.createContext({document,localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},console,Date,URLSearchParams,setTimeout,setInterval(){}});
  context.mockApi=async(url,opts)=>{
    if(url.endsWith('/check')){const correct=JSON.parse(opts.body).guess==='Worm';return {correct,guess:{name:correct?'Worm':'Phishing',category:'Malware',relation:correct?'correct':'different'}}}
    if(url.endsWith('/answer'))return education;
    if(url.includes('archive'))return {items:[{level:2,caseId:'two',locked:false,status:'unplayed'},{level:3,caseId:'three',locked:true,status:'unplayed'}]};
    if(url==='/api/guest/cases/1')return {level:1,caseId:'one',caseName:'Primero',releaseDate:'2026-09-29',allHints:['1','2','3','4','5','6']};
    return {level:2,caseId:'two',caseName:'Segundo',releaseDate:'2026-09-30',allHints:['1','2','3','4','5','6']};
  };
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8').replace("init().catch(e=>setMsg('message',e.message,'error'));",''),context);
  vm.runInContext("api=mockApi;catalog=[{name:'Worm',category:'Malware',aliases:[]}];currentGuestBase={level:1,caseId:'one',caseName:'Primero',releaseDate:'2026-09-29',allHints:['1','2','3','4','5','6']};state=guestState(currentGuestBase);currentLevel=1;setGameMode('easy')",context);
  assert.equal(elements.get('easyAssistPanel').classList.contains('hidden'),false);
  elements.get('answerInput').value='Phishing';await vm.runInContext('submitGuess()',context);
  assert.equal(vm.runInContext('state.status',context),'playing');assert.equal(document.getElementById('educationModal').classList.contains('hidden'),true);
  assert.equal(elements.get('message').classList.contains('soft-reveal'),false);
  assert.equal(vm.runInContext('buildShareResult()',context),'');
  elements.get('answerInput').value='Worm';await vm.runInContext('submitGuess()',context);
  assert.equal(elements.get('educationModal').classList.contains('hidden'),false);assert.equal(elements.get('educationExplanation').textContent,education.explanation);
  assert.equal(elements.has('streakStat'),false);
  const share=vm.runInContext('buildShareResult()',context);
  assert.ok(share.includes('https://secdle.onrender.com'));assert.ok(!share.includes('Worm')&&!share.includes('Phishing')&&!share.includes('@'));
  let copied='';context.navigator={clipboard:{async writeText(text){copied=text}}};
  await vm.runInContext('copyResult()',context);assert.equal(copied,share);
  context.navigator={share:async()=>{throw Object.assign(new Error('Cancelled'),{name:'AbortError'})}};
  copied='';await vm.runInContext('shareResult()',context);assert.equal(copied,'');
  context.navigator={};await vm.runInContext('copyResult()',context);assert.equal(elements.get('shareFallback').value,share);
  const report=new URL(vm.runInContext("feedbackMailto('report')",context));
  assert.equal(report.pathname,'adriansg007@gmail.com');assert.match(report.searchParams.get('body'),/Caso: #1/);
  vm.runInContext('showOnboarding();dismissOnboarding()',context);assert.equal(storage.get('secdle_onboarding_seen'),'1');
  const saved=storage.get('secdle_guest_progress_v1');
  await vm.runInContext('loadCase(1)',context);
  assert.equal(vm.runInContext('state.practice',context),true);assert.equal(vm.runInContext('state.attempts',context),0);
  assert.equal(vm.runInContext('state.hints.length',context),1);assert.equal(vm.runInContext('state.answer',context),null);
  assert.equal(elements.get('answerInput').disabled,false);
  elements.get('answerInput').value='Worm';await vm.runInContext('submitGuess()',context);
  assert.equal(vm.runInContext('state.status',context),'solved');assert.equal(storage.get('secdle_guest_progress_v1'),saved);
  await vm.runInContext('loadCase(1)',context);
  for(let i=0;i<6;i++){elements.get('answerInput').value='Phishing';await vm.runInContext('submitGuess()',context)}
  assert.equal(vm.runInContext('state.status',context),'failed');assert.equal(storage.get('secdle_guest_progress_v1'),saved);
  assert.match(elements.get('resultText').textContent,/estadísticas no cambian/);
  await vm.runInContext('retryCase()',context);assert.equal(vm.runInContext('state.practice',context),true);
  assert.equal(vm.runInContext('state.attempts',context),0);assert.equal(storage.get('secdle_guest_progress_v1'),saved);
  await vm.runInContext('nextCase()',context);assert.equal(vm.runInContext('state.level',context),2);assert.equal(vm.runInContext('gameMode',context),'easy');
  for(let i=0;i<6;i++){elements.get('answerInput').value='Phishing';await vm.runInContext('submitGuess()',context)}
  assert.equal(vm.runInContext('state.status',context),'failed');assert.match(elements.get('educationResult').textContent,/incorrecta/);
  await vm.runInContext('nextCase()',context);assert.match(elements.get('message').textContent,/No hay más casos/);
  await vm.runInContext('retryCase()',context);assert.equal(vm.runInContext('state.attempts',context),0);
  const practiceRequests=[];
  context.mockApi=async(url,opts)=>{
    practiceRequests.push(url);
    if(url.endsWith('/practice/guess')){
      assert.deepEqual(JSON.parse(opts.body).guesses,['Worm']);
      return {correct:true,state:{level:1,caseId:'one',practice:true,status:'solved',attempts:1,correctAttempts:1,answer:'Worm',hints:['1'],guesses:[{name:'Worm',relation:'correct'}],education}};
    }
    return {level:1,caseId:'one',practice:true,status:'playing',attempts:0,hints:['1'],guesses:[],answer:null,education:null};
  };
  vm.runInContext("api=mockApi;me={email:'account@example.invalid',plan:'free',currentStreak:4,bestStreak:4}",context);
  await vm.runInContext('loadCase(1)',context);
  elements.get('answerInput').value='Worm';await vm.runInContext('submitGuess()',context);
  assert.deepEqual(practiceRequests,['/api/cases/1?practice=1','/api/cases/1/practice/guess']);
  assert.equal(vm.runInContext('me.currentStreak',context),4);assert.equal(vm.runInContext('state.status',context),'solved');
});

test('carga inicial: configuración, catálogo y cuenta en paralelo; un solo caso después',async()=>{
  const elements=new Map(),calls=[],pending=new Map();
  const document={hidden:false,addEventListener(){},querySelectorAll:()=>[],createElement:()=>element(),getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}};
  function element(){return {value:'',textContent:'',innerHTML:'',disabled:false,previousElementSibling:{classList:{toggle(){}}},classList:{add(){},remove(){},toggle(){},contains:()=>true},replaceChildren(){},appendChild(){},addEventListener(){},setAttribute(){},querySelector:()=>element()}}
  const context=vm.createContext({document,location:{search:''},navigator:{},localStorage:{getItem:()=> '1'},sessionStorage:{getItem:()=>null,removeItem(){}},console,Date,URLSearchParams,setTimeout,setInterval(){}});
  context.mockApi=url=>{
    calls.push(url);
    if(url==='/api/guest/daily')return Promise.resolve({level:1,caseId:'one',caseName:'Caso',allHints:['1']});
    return new Promise(resolve=>pending.set(url,resolve));
  };
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8').replace("init().catch(e=>setMsg('message',e.message,'error'));",''),context);
  vm.runInContext('api=mockApi',context);const started=vm.runInContext('init()',context);
  assert.deepEqual(calls,['/api/config','/api/catalog','/api/me']);
  pending.get('/api/config')({dailyIsToday:true});pending.get('/api/catalog')([]);pending.get('/api/me')({user:null});
  await started;
  assert.deepEqual(calls,['/api/config','/api/catalog','/api/me','/api/guest/daily']);
  assert.equal(vm.runInContext('state.level',context),1);
});

test('PWA y contenido público: iconos, URLs, selector y caché sin API ni checkout',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../public/manifest.webmanifest'),'utf8'));
  assert.equal(manifest.scope,'/');assert.equal(manifest.id,'/');
  for(const icon of manifest.icons){
    const image=fs.readFileSync(path.join(__dirname,'../public',icon.src));
    assert.equal(`${image.readUInt32BE(16)}x${image.readUInt32BE(20)}`,icon.sizes);
  }
  const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
  assert.ok(html.includes('https://secdle.onrender.com/'));assert.ok(!html.includes('data-payment="yape"'));
  assert.ok(html.includes('¿Reconoces el ataque?'));
  assert.ok(!html.includes('class="intro-card"')&&!html.includes('id="playTodayBtn"'));
  assert.match(html,/<details class="account-menu" id="accountMenu">[\s\S]*?id="plusBtn"[\s\S]*?<\/details>/);
  assert.ok(html.includes('/game.css?v=1'));
  for(const id of ['attemptStat','streakStat','bestStreakStat','planStat','educationStreak'])assert.ok(!html.includes(`id="${id}"`));
  const css=fs.readFileSync(path.join(__dirname,'../public/styles.css'),'utf8');
  const js=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
  assert.ok(!/softReveal|streakPop|soft-reveal|streak-pop/.test(css+js));
  assert.equal(translate('Cómo jugar','en'),'How to play');
  const listeners={};
  const context=vm.createContext({self:{location:{origin:'https://secdle.onrender.com'},addEventListener:(name,fn)=>{listeners[name]=fn}},URL});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8'),context);
  for(const [pathname,method] of [['/api/me','GET'],['/api/payment/status','GET'],['/admin','GET'],['/admin.html','GET'],['/?payment=return','GET'],['/api/cases/1/guess','POST']]){
    let intercepted=false;listeners.fetch({request:{method,url:'https://secdle.onrender.com'+pathname,mode:'navigate'},respondWith(){intercepted=true}});assert.equal(intercepted,false);
  }
});

test('frontend minimalista: referencias DOM, traducciones y menú de cuenta/modal',()=>{
  const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8');
  const source=fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8');
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const match of source.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.includes(match[1]),`Falta #${match[1]} en index.html`);
  for(const text of ['Cuenta','Navegación principal','Ir al caso','¿Reconoces el ataque?','Lee las pistas. Identifica el ataque. Aprende algo nuevo.','Un juego para aprender ciberseguridad.','Ataque o vulnerabilidad...','Tu progreso se guarda en este navegador.'])assert.notEqual(translate(text,'en'),text);
  const css=fs.readFileSync(path.join(__dirname,'../public/game.css'),'utf8');
  assert.ok(css.includes('@media (max-width: 420px)'));
  assert.ok(!/@keyframes|animation:\s*(?!none)[a-z]/.test(css));
  const nodes=new Map(),listeners=new Map();
  function element(){
    const classes=new Set(['hidden']);
    return {open:false,disabled:false,value:'',textContent:'',classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c),toggle(c,on){on?classes.add(c):classes.delete(c)}},addEventListener(){},setAttribute(){},focus(){document.activeElement=this},contains(target){return target===this}};
  }
  const document={body:element(),activeElement:null,hidden:false,addEventListener:(name,fn)=>listeners.set(name,fn),querySelectorAll:selector=>selector==='.modal-backdrop'?['authModal','plusModal','educationModal','onboardingModal'].map(id=>document.getElementById(id)):[],getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)}};
  const context=vm.createContext({document,localStorage:{getItem:()=>null},console,Date,URLSearchParams,setTimeout,setInterval(){}});
  vm.runInContext(source.replace("init().catch(e=>setMsg('message',e.message,'error'));",''),context);
  const menu=document.getElementById('accountMenu');
  menu.open=true;nodes.get('plusBtn').onclick();
  assert.equal(menu.open,false);assert.equal(nodes.get('plusModal').classList.contains('hidden'),false);assert.equal(document.body.classList.contains('modal-open'),true);
  vm.runInContext("openModal('authModal');closeModal('authModal')",context);
  assert.equal(document.body.classList.contains('modal-open'),true);
  vm.runInContext("closeModal('plusModal')",context);assert.equal(document.body.classList.contains('modal-open'),false);
  menu.open=true;listeners.get('keydown')({key:'Escape'});assert.equal(menu.open,false);assert.equal(document.activeElement,nodes.get('accountMenuToggle'));
  menu.open=true;listeners.get('click')({target:document.body});assert.equal(menu.open,false);
  vm.runInContext("me={email:'test@example.invalid',plan:'free'};updateAccount()",context);
  assert.equal(nodes.get('accountChip').classList.contains('hidden'),false);assert.equal(nodes.get('accountBtn').classList.contains('hidden'),true);
  vm.runInContext('me=null;updateAccount()',context);
  assert.equal(nodes.get('accountBtn').classList.contains('hidden'),false);
});

test('idioma: traducción DOM, preferencia/restauración y caché invitada antigua',()=>{
  const nodes=new Map(),saved=new Map();let reloaded=false,onChange;
  const text={nodeType:3,nodeValue:'Fácil'};
  function element(){return {nodeType:1,tagName:'DIV',childNodes:[],value:'',textContent:'',attrs:{},classList:{contains:()=>true},addEventListener(){},hasAttribute(key){return key in this.attrs},getAttribute(key){return this.attrs[key]},setAttribute(key,value){this.attrs[key]=value}}}
  const document={body:{...element(),childNodes:[text]},head:element(),documentElement:{},title:'SecDle — El ataque del día',addEventListener(){},querySelectorAll:()=>[],getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id)}};
  const guest={version:1,progress:{one:{status:'solved',attempts:2,guesses:[],education:{language:'es',explanation:'Español'},answer:'Worm'}},events:[]};
  const context=vm.createContext({document,location:{reload(){reloaded=true}},localStorage:{getItem:key=>key==='secdle_lang'?'en':JSON.stringify(guest),setItem:(key,value)=>saved.set(key,value)},sessionStorage:{setItem:(key,value)=>saved.set(key,value)},MutationObserver:class{constructor(callback){onChange=callback}observe(){}},console,Date,URLSearchParams,setTimeout,setInterval(){}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/i18n.js'),'utf8'),context);
  assert.equal(text.nodeValue,'Easy');assert.equal(document.documentElement.lang,'en');
  const dynamic={nodeType:3,nodeValue:'3 pistas desbloqueadas'};onChange([{type:'childList',addedNodes:[dynamic]}]);
  assert.equal(dynamic.nodeValue,'3 hints unlocked');
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8').replace("init().catch(e=>setMsg('message',e.message,'error'));",''),context);
  const state=vm.runInContext("guestState({level:1,caseId:'one',allHints:['Hint']})",context);
  assert.equal(state.attempts,2);assert.equal(state.education,null);
  vm.runInContext("currentLevel=3;gameMode='easy';setLanguage('es')",context);
  assert.equal(saved.get('secdle_lang'),'es');assert.equal(reloaded,true);
  const restore=JSON.parse(saved.get('secdle_language_restore'));
  assert.equal(restore.level,3);assert.equal(restore.mode,'easy');
});

test('archivo paginado: seis filas, límites, estados invitados, reapertura y ES/EN',async()=>{
  const elements=new Map();
  function element(){
    const classes=new Set(['hidden']),button={};
    return {value:'',textContent:'',innerHTML:'',children:[],disabled:false,scrollTop:50,classList:{contains:c=>classes.has(c),add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(){}},addEventListener(){},setAttribute(){},focus(){},replaceChildren(){this.children=[]},appendChild(child){this.children.push(child)},querySelector:()=>button};
  }
  const document={activeElement:null,hidden:false,addEventListener(){},querySelectorAll:()=>[],createElement:()=>element(),getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}};
  const guest={progress:{c37:{status:'solved'}},events:[]};
  const context=vm.createContext({document,localStorage:{getItem:()=>JSON.stringify(guest)},console,Date,URLSearchParams,setTimeout,setInterval(){}});
  context.items=Array.from({length:37},(_,i)=>({level:37-i,caseId:`c${37-i}`,releaseDate:'2026-09-30',status:'unplayed',locked:i>=5}));
  context.mockApi=async()=>({items:context.items});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/app.js'),'utf8').replace("init().catch(e=>setMsg('message',e.message,'error'));",''),context);
  vm.runInContext('api=mockApi',context);await vm.runInContext('openArchive()',context);
  assert.equal(elements.get('archiveGrid').children.length,6);
  assert.match(elements.get('archiveGrid').children[0].innerHTML,/Correcto/);
  assert.match(elements.get('archiveGrid').children[5].innerHTML,/Desbloquear/);
  assert.equal(elements.get('archivePageInfo').textContent,'Página 1 de 7');
  assert.equal(elements.get('archivePrevBtn').disabled,true);assert.equal(elements.get('archiveNextBtn').disabled,false);
  vm.runInContext('changeArchivePage(1)',context);
  assert.equal(elements.get('archiveGrid').children.length,6);assert.equal(elements.get('archiveGrid').scrollTop,0);
  assert.match(elements.get('archiveGrid').children[0].innerHTML,/#031/);
  vm.runInContext('changeArchivePage(100)',context);
  assert.equal(elements.get('archiveGrid').children.length,1);
  assert.equal(elements.get('archiveNextBtn').disabled,true);assert.equal(elements.get('archivePageInfo').textContent,'Página 7 de 7');
  await vm.runInContext('openArchive()',context);assert.equal(elements.get('archivePageInfo').textContent,'Página 1 de 7');
  context.items=[];await vm.runInContext('openArchive()',context);
  assert.equal(elements.get('archiveGrid').children.length,1);assert.equal(elements.get('archivePrevBtn').disabled,true);assert.equal(elements.get('archiveNextBtn').disabled,true);
  assert.equal(translate('Página 2 de 7','en'),'Page 2 of 7');assert.equal(translate('Anterior','en'),'Previous');
});
