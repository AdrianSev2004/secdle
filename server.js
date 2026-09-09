require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const SECDLE_DATA = require('./data/secdle_data.js');
const db = require('./db.js');

const app = express();
app.set('trust proxy', 1);

const PORT = Number(process.env.PORT || 5500);
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const GAME_TIMEZONE = process.env.GAME_TIMEZONE || 'America/Lima';
const SESSION_DAYS = Math.max(1, Number(process.env.SESSION_DAYS || 30));
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'adriansg007@gmail.com';
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || '';
const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || '';
const MP_PLAN_MONTHLY_ID = process.env.MP_PLAN_MONTHLY_ID || '';
const MP_PLAN_ANNUAL_ID = process.env.MP_PLAN_ANNUAL_ID || '';

const PRICE_CONFIG = {
  monthly: { displayUsd: 1.99, chargePen: 7.90, label: 'Mensual' },
  annual: { displayUsd: 19.99, chargePen: 79.00, label: 'Anual' }
};

function normalize(s=''){
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}
function gameDate(date=new Date()){
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: GAME_TIMEZONE, year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(date);
  const obj = Object.fromEntries(parts.map(p=>[p.type,p.value]));
  return `${obj.year}-${obj.month}-${obj.day}`;
}
function flattenCases(){
  const rows=[];
  for(const category of SECDLE_DATA.categories){
    for(const answer of category.answers){
      for(const c of answer.cases || []){
        if(!c.releaseDate) continue;
        rows.push({
          id:c.id, caseName:c.name, releaseDate:c.releaseDate, hints:c.hints,
          answer:answer.name, aliases:answer.aliases || [], category:category.name
        });
      }
    }
  }
  rows.sort((a,b)=>a.releaseDate.localeCompare(b.releaseDate)||a.id.localeCompare(b.id));
  return rows.map((c,i)=>({...c,level:i+1}));
}
function allCases(){return flattenCases();}
function getCase(level){return allCases().find(c=>c.level===Number(level));}
function isReleased(c){return Boolean(c && c.releaseDate<=gameDate());}
function releasedCases(){return allCases().filter(isReleased);}
function caseForToday(){
  const today=gameDate();
  const rows=releasedCases();
  return rows.find(c=>c.releaseDate===today)||rows.at(-1)||null;
}
function hasCaseToday(){const today=gameDate();return allCases().some(c=>c.releaseDate===today);}
function freeCaseIds(){return new Set(releasedCases().slice(-5).map(c=>c.id));}
function freeCutoff(){const rows=releasedCases().slice(-5);return rows.length?rows[0].releaseDate:null;}
function effectivePlan(user){
  if(!user || user.plan!=='plus') return 'free';
  if(user.plusUntil && new Date(user.plusUntil).getTime()<=Date.now()) return 'free';
  return 'plus';
}
function canAccess(user,c){return Boolean(c&&isReleased(c)&&(effectivePlan(user)==='plus'||freeCaseIds().has(c.id)));}
function publicUser(u){
  if(!u) return null;
  return {
    id:u.id,email:u.email,plan:effectivePlan(u),currentStreak:u.currentStreak||0,bestStreak:u.bestStreak||0,
    createdAt:u.createdAt,subscriptionStatus:u.subscriptionStatus||null,subscriptionCycle:u.subscriptionCycle||null,
    paymentProvider:u.paymentProvider||null,plusUntil:u.plusUntil||null
  };
}
function hashPassword(password,salt=crypto.randomBytes(16).toString('hex')){
  const hash=crypto.scryptSync(password,salt,64,{N:16384,r:8,p:1}).toString('hex');
  return {salt,hash};
}
function verifyPassword(password,user){
  try{
    const calc=crypto.scryptSync(password,user.passwordSalt,64,{N:16384,r:8,p:1});
    const stored=Buffer.from(user.passwordHash,'hex');
    return calc.length===stored.length&&crypto.timingSafeEqual(calc,stored);
  }catch{return false;}
}
function parseCookies(req){
  const out={};
  for(const chunk of (req.headers.cookie||'').split(';')){
    const i=chunk.indexOf('=');if(i<0)continue;
    out[decodeURIComponent(chunk.slice(0,i).trim())]=decodeURIComponent(chunk.slice(i+1).trim());
  }
  return out;
}
async function normalizeExpiredPlan(user){
  if(user?.plan==='plus'&&user.plusUntil&&new Date(user.plusUntil).getTime()<=Date.now()){
    return db.updateUser(user.id,{plan:'free',subscriptionStatus:user.subscriptionStatus||'expired'});
  }
  return user;
}
async function getSessionUser(req){
  const token=parseCookies(req).secdle_session;
  if(!token)return null;
  return normalizeExpiredPlan(await db.getSessionUser(token));
}
async function requireUser(req,res,next){
  try{
    const u=await getSessionUser(req);
    if(!u)return res.status(401).json({error:'Debes iniciar sesión.'});
    req.user=u;next();
  }catch(e){next(e);}
}
async function createSession(res,userId){
  const token=crypto.randomBytes(32).toString('hex');
  const expiresAt=new Date(Date.now()+SESSION_DAYS*86400000).toISOString();
  await db.createSession(token,userId,expiresAt);
  res.cookie('secdle_session',token,{
    httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',
    maxAge:SESSION_DAYS*86400000,path:'/'
  });
}
async function stateFor(user,c){
  const p=await db.getProgress(user.id,c.id)||{attempts:0,status:'playing',guesses:[]};
  const unlocked=p.status==='playing'?Math.min((p.attempts||0)+1,6):6;
  return {
    level:c.level,caseId:c.id,caseName:c.caseName,releaseDate:c.releaseDate,category:c.category,
    hints:c.hints.slice(0,unlocked),attempts:p.attempts||0,status:p.status,guesses:p.guesses||[],
    answer:(p.status==='solved'||p.status==='failed')?c.answer:null,
    correctAttempts:p.correctAttempts||null,retryCount:p.retryCount||0
  };
}
function guestBase(c){return {level:c.level,caseId:c.id,caseName:c.caseName,releaseDate:c.releaseDate,category:c.category,allHints:c.hints};}
function catalogRows(){return SECDLE_DATA.categories.flatMap(cat=>cat.answers.map(a=>({name:a.name,category:cat.name,aliases:a.aliases||[]})));}
function guestCanAccess(c){return Boolean(c&&isReleased(c)&&freeCaseIds().has(c.id));}
function cleanGuestProgress(raw,c){
  const catalog=catalogRows();
  const rawGuesses=Array.isArray(raw?.guesses)?raw.guesses.slice(0,6):[];
  const guesses=[];let solvedAt=0;
  for(const g of rawGuesses){
    const selected=catalog.find(a=>normalize(a.name)===normalize(g?.name)||a.aliases.some(x=>normalize(x)===normalize(g?.name)));
    if(!selected)continue;
    const correct=normalize(selected.name)===normalize(c.answer)||c.aliases.some(x=>normalize(x)===normalize(selected.name));
    guesses.push({name:selected.name,category:selected.category,relation:correct?'correct':selected.category===c.category?'same':'different'});
    if(correct){solvedAt=guesses.length;break;}
  }
  const attempts=guesses.length;
  const status=solvedAt?'solved':attempts>=6?'failed':'playing';
  return {attempts,status,guesses,correctAttempts:solvedAt||undefined,retryCount:Math.max(0,Math.min(Number(raw?.retryCount)||0,999)),updatedAt:typeof raw?.updatedAt==='string'?raw.updatedAt:new Date().toISOString()};
}

function memoryRateLimit({windowMs,max,message}){
  const buckets=new Map();
  return (req,res,next)=>{
    const key=`${req.ip}:${req.path}`;const now=Date.now();let b=buckets.get(key);
    if(!b||now>b.reset){b={count:0,reset:now+windowMs};buckets.set(key,b);}b.count++;
    if(b.count>max){res.set('Retry-After',String(Math.ceil((b.reset-now)/1000)));return res.status(429).json({error:message||'Demasiadas solicitudes. Intenta de nuevo en unos minutos.'});}
    if(buckets.size>5000){for(const [k,v] of buckets)if(now>v.reset)buckets.delete(k);}
    next();
  };
}
const authLimiter=memoryRateLimit({windowMs:15*60*1000,max:20,message:'Demasiados intentos de acceso. Intenta nuevamente en 15 minutos.'});
const paymentLimiter=memoryRateLimit({windowMs:10*60*1000,max:30,message:'Demasiados intentos de pago. Espera unos minutos.'});
const guessLimiter=memoryRateLimit({windowMs:60*1000,max:120});

app.use((req,res,next)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; object-src 'none'");
  if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload');
  next();
});
app.use(express.json({limit:'200kb'}));
app.use(express.urlencoded({extended:false,limit:'50kb'}));

function requireSameOrigin(req,res,next){
  if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
  if(req.path==='/api/mercadopago/webhook')return next();
  const origin=req.get('origin');
  if(!origin)return next();
  let baseOrigin='';try{baseOrigin=new URL(BASE_URL).origin;}catch{}
  const requestOrigin=`${req.protocol}://${req.get('host')}`;
  if(origin!==baseOrigin&&origin!==requestOrigin)return res.status(403).json({error:'Origen de solicitud no permitido.'});
  next();
}
app.use(requireSameOrigin);

async function mpFetch(endpoint,options={}){
  if(!MP_ACCESS_TOKEN)throw new Error('Mercado Pago no está configurado.');
  const r=await fetch(`https://api.mercadopago.com${endpoint}`,{
    ...options,
    headers:{Authorization:`Bearer ${MP_ACCESS_TOKEN}`,'Content-Type':'application/json',...(options.headers||{})}
  });
  const data=await r.json().catch(()=>({}));
  if(!r.ok){const err=new Error(data.message||`Mercado Pago respondió ${r.status}`);err.status=r.status;err.data=data;throw err;}
  return data;
}
function planIdFor(cycle){return cycle==='annual'?MP_PLAN_ANNUAL_ID:MP_PLAN_MONTHLY_ID;}
function cycleForPlan(planId){if(planId===MP_PLAN_ANNUAL_ID)return'annual';if(planId===MP_PLAN_MONTHLY_ID)return'monthly';return null;}
async function getVerifiedPlan(cycle){
  const planId=planIdFor(cycle);if(!planId)throw new Error(`Falta configurar el plan ${cycle==='annual'?'anual':'mensual'} de Mercado Pago.`);
  const plan=await mpFetch(`/preapproval_plan/${encodeURIComponent(planId)}`);
  const expected=PRICE_CONFIG[cycle].chargePen;
  const actual=Number(plan?.auto_recurring?.transaction_amount);
  const currency=plan?.auto_recurring?.currency_id;
  if(currency!=='PEN'||!Number.isFinite(actual)||Math.abs(actual-expected)>0.001){
    throw new Error(`El plan ${PRICE_CONFIG[cycle].label.toLowerCase()} de Mercado Pago debe cobrar S/ ${expected.toFixed(2)} PEN. Actualmente figura ${currency||'sin moneda'} ${Number.isFinite(actual)?actual.toFixed(2):'sin monto'}. Corrígelo antes de cobrar.`);
  }
  if(plan.status&&plan.status!=='active')throw new Error('Ese plan de Mercado Pago no está activo.');
  return plan;
}
function addCycleFrom(date,cycle){
  const d=new Date(date||Date.now());
  if(cycle==='annual')d.setUTCFullYear(d.getUTCFullYear()+1);else d.setUTCMonth(d.getUTCMonth()+1);
  return d.toISOString();
}
async function findUserForSubscription(subscription){
  let user=await db.findUserBySubscriptionId(String(subscription.id));
  if(user)return user;
  if(subscription.external_reference){user=await db.getUserById(String(subscription.external_reference));if(user)return user;}
  const payerEmail=subscription.payer_email||subscription.payer?.email||null;
  if(payerEmail)user=await db.getUserByEmail(normalize(payerEmail));
  return user||null;
}
async function syncSubscription(subscription,source='webhook'){
  if(!subscription?.id)return null;
  const planId=subscription.preapproval_plan_id||subscription.plan_id||null;
  const cycle=cycleForPlan(planId);
  const payerEmail=subscription.payer_email||subscription.payer?.email||null;
  let user=await findUserForSubscription(subscription);
  const status=String(subscription.status||'').toLowerCase();
  const nextPaymentDate=subscription.next_payment_date||null;

  await db.upsertSubscription({
    providerSubscriptionId:String(subscription.id),userId:user?.id||null,provider:'mercadopago',cycle,status,planId,
    payerEmail,nextPaymentDate,raw:subscription
  });
  if(!user)return null;

  const previousEffective=effectivePlan(user);
  let patch={mercadoPagoSubscriptionId:String(subscription.id),paymentProvider:'mercadopago',subscriptionCycle:cycle||user.subscriptionCycle||null};
  if(status==='authorized'){
    const plusUntil=nextPaymentDate&&new Date(nextPaymentDate)>new Date()?new Date(nextPaymentDate).toISOString():addCycleFrom(Date.now(),cycle||'monthly');
    patch={...patch,plan:'plus',subscriptionStatus:'active',plusUntil};
  }else if(status==='canceled'||status==='cancelled'||status==='paused'){
    const stillPaid=user.plusUntil&&new Date(user.plusUntil)>new Date();
    patch={...patch,plan:stillPaid?'plus':'free',subscriptionStatus:status};
  }else{
    patch.subscriptionStatus=status||user.subscriptionStatus||'pending';
  }
  user=await db.updateUser(user.id,patch);
  if(planId)await db.markCheckoutIntentMatched(user.id,planId,String(subscription.id));
  const nowEffective=effectivePlan(user);
  if(previousEffective!=='plus'&&nowEffective==='plus')await db.recordAnalytics('subscription_activated',user.id,{source,cycle});
  if(previousEffective==='plus'&&nowEffective!=='plus')await db.recordAnalytics('subscription_ended',user.id,{source,status});
  return user;
}
async function searchLatestSubscriptionForUser(user,cycle){
  const planId=planIdFor(cycle);if(!planId)return null;
  const qs=new URLSearchParams({payer_email:user.email,preapproval_plan_id:planId,limit:'20',offset:'0'});
  const data=await mpFetch(`/preapproval/search?${qs.toString()}`);
  const rows=Array.isArray(data.results)?data.results:[];
  rows.sort((a,b)=>String(b.date_created||'').localeCompare(String(a.date_created||'')));
  return rows.find(x=>['authorized','paused','canceled','cancelled','pending'].includes(String(x.status||'').toLowerCase()))||null;
}

app.get('/api/health',async(req,res)=>{
  try{
    await db.health();
    res.json({ok:true,service:'SecDle',date:new Date().toISOString(),database:db.usingPostgres?'postgres':'json-dev'});
  }catch{
    res.status(503).json({ok:false,service:'SecDle',date:new Date().toISOString(),database:db.usingPostgres?'postgres':'json-dev'});
  }
});
app.get('/api/config',(req,res)=>{
  res.json({
    today:gameDate(),timezone:GAME_TIMEZONE,
    prices:{monthly:PRICE_CONFIG.monthly.displayUsd,annual:PRICE_CONFIG.annual.displayUsd},
    chargePricesPen:{monthly:PRICE_CONFIG.monthly.chargePen,annual:PRICE_CONFIG.annual.chargePen},
    displayCurrency:'USD',chargeCurrency:'PEN',freeArchiveDays:5,
    paymentProviders:{mercadoPago:Boolean(MP_ACCESS_TOKEN&&MP_PLAN_MONTHLY_ID&&MP_PLAN_ANNUAL_ID),yape:Boolean(MP_ACCESS_TOKEN&&MP_PLAN_MONTHLY_ID&&MP_PLAN_ANNUAL_ID)},
    dailyIsToday:hasCaseToday(),dailyReleaseDate:caseForToday()?.releaseDate||null,supportEmail:SUPPORT_EMAIL
  });
});
app.get('/api/catalog',(req,res)=>res.json(catalogRows()));

app.get('/api/guest/archive',(req,res)=>{
  const items=releasedCases().map(c=>({level:c.level,caseId:c.id,releaseDate:c.releaseDate,caseName:c.caseName,category:c.category,locked:!guestCanAccess(c),status:'unplayed'})).reverse();
  res.json({items,plan:'free',cutoff:freeCutoff(),freeCaseLimit:5});
});
app.get('/api/guest/daily',(req,res)=>{
  const c=caseForToday();if(!c)return res.status(404).json({error:'Todavía no hay casos publicados.'});
  if(!guestCanAccess(c))return res.status(402).json({error:'Este caso no está disponible en Free.',upgrade:true});
  res.json(guestBase(c));
});
app.get('/api/guest/cases/:level',(req,res)=>{
  const c=getCase(req.params.level);if(!c||!isReleased(c))return res.status(404).json({error:'Caso no disponible.'});
  if(!guestCanAccess(c))return res.status(402).json({error:'Este caso requiere SecDle Plus.',upgrade:true});
  res.json(guestBase(c));
});
app.post('/api/guest/cases/:level/check',guessLimiter,(req,res)=>{
  const c=getCase(req.params.level);if(!c||!isReleased(c))return res.status(404).json({error:'Caso no disponible.'});
  if(!guestCanAccess(c))return res.status(402).json({error:'Este caso requiere SecDle Plus.',upgrade:true});
  const guess=String(req.body.guess||'').trim();if(guess.length>120)return res.status(400).json({error:'Respuesta demasiado larga.'});
  const selected=catalogRows().find(a=>normalize(a.name)===normalize(guess)||a.aliases.some(x=>normalize(x)===normalize(guess)));
  if(!selected)return res.status(400).json({error:'Selecciona una respuesta válida.'});
  const correct=normalize(selected.name)===normalize(c.answer)||c.aliases.some(x=>normalize(x)===normalize(guess));
  res.json({correct,guess:{name:selected.name,category:selected.category,relation:correct?'correct':selected.category===c.category?'same':'different'}});
});
app.get('/api/guest/cases/:level/answer',(req,res)=>{
  const c=getCase(req.params.level);if(!c||!isReleased(c))return res.status(404).json({error:'Caso no disponible.'});
  if(!guestCanAccess(c))return res.status(402).json({error:'Este caso requiere SecDle Plus.',upgrade:true});
  res.json({answer:c.answer});
});

app.post('/api/auth/register',authLimiter,async(req,res,next)=>{
  try{
    const email=normalize(req.body.email);const password=String(req.body.password||'');
    if(!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return res.status(400).json({error:'Ingresa un correo válido.'});
    if(password.length<10)return res.status(400).json({error:'La contraseña debe tener al menos 10 caracteres.'});
    if(password.length>200)return res.status(400).json({error:'La contraseña es demasiado larga.'});
    if(await db.getUserByEmail(email))return res.status(409).json({error:'Ese correo ya tiene una cuenta.'});
    const hp=hashPassword(password);
    const user=await db.createUser({id:crypto.randomUUID(),email,passwordSalt:hp.salt,passwordHash:hp.hash,plan:'free',currentStreak:0,bestStreak:0,createdAt:new Date().toISOString(),importedGuestEvents:[]});
    await createSession(res,user.id);await db.recordAnalytics('signup',user.id,{});
    res.json({user:publicUser(user)});
  }catch(e){next(e);}
});
app.post('/api/auth/login',authLimiter,async(req,res,next)=>{
  try{
    const email=normalize(req.body.email);const password=String(req.body.password||'');
    const user=await db.getUserByEmail(email);
    if(!user||!verifyPassword(password,user))return res.status(401).json({error:'Correo o contraseña incorrectos.'});
    await createSession(res,user.id);res.json({user:publicUser(await normalizeExpiredPlan(user))});
  }catch(e){next(e);}
});
app.post('/api/auth/logout',async(req,res,next)=>{
  try{const token=parseCookies(req).secdle_session;if(token)await db.deleteSession(token);res.clearCookie('secdle_session',{path:'/'});res.json({ok:true});}catch(e){next(e);}
});
app.get('/api/me',async(req,res,next)=>{try{res.json({user:publicUser(await getSessionUser(req))});}catch(e){next(e);}});

app.get('/api/archive',requireUser,async(req,res,next)=>{
  try{
    const progress=await db.listProgress(req.user.id);const byCase=new Map(progress.map(p=>[p.caseId,p]));
    const items=releasedCases().map(c=>({level:c.level,caseId:c.id,releaseDate:c.releaseDate,caseName:c.caseName,category:c.category,locked:!canAccess(req.user,c),status:byCase.get(c.id)?.status||'unplayed'})).reverse();
    res.json({items,plan:effectivePlan(req.user),cutoff:freeCutoff(),freeCaseLimit:5});
  }catch(e){next(e);}
});
app.get('/api/daily',requireUser,async(req,res,next)=>{try{const c=caseForToday();if(!c)return res.status(404).json({error:'Todavía no hay casos publicados.'});res.json(await stateFor(req.user,c));}catch(e){next(e);}});
app.get('/api/cases/:level',requireUser,async(req,res,next)=>{
  try{const c=getCase(req.params.level);if(!c||!isReleased(c))return res.status(404).json({error:'Caso no disponible.'});if(!canAccess(req.user,c))return res.status(402).json({error:'Este caso requiere SecDle Plus.',upgrade:true});res.json(await stateFor(req.user,c));}catch(e){next(e);}
});
app.post('/api/cases/:level/guess',guessLimiter,requireUser,async(req,res,next)=>{
  try{
    const c=getCase(req.params.level);if(!c||!isReleased(c))return res.status(404).json({error:'Caso no disponible.'});if(!canAccess(req.user,c))return res.status(402).json({error:'Este caso requiere SecDle Plus.',upgrade:true});
    const guess=String(req.body.guess||'').trim();if(guess.length>120)return res.status(400).json({error:'Respuesta demasiado larga.'});
    const selected=catalogRows().find(a=>normalize(a.name)===normalize(guess)||a.aliases.some(x=>normalize(x)===normalize(guess)));
    if(!selected)return res.status(400).json({error:'Selecciona una respuesta válida.'});
    let user=await db.getUserById(req.user.id);let p=await db.getProgress(user.id,c.id);
    if(!p)p={userId:user.id,caseId:c.id,attempts:0,status:'playing',guesses:[],retryCount:0,createdAt:new Date().toISOString()};
    if(p.status!=='playing')return res.json({state:await stateFor(user,c),user:publicUser(user)});
    const correct=normalize(selected.name)===normalize(c.answer)||c.aliases.some(x=>normalize(x)===normalize(guess));
    p.attempts=(p.attempts||0)+1;p.guesses=[...(p.guesses||[]),{name:selected.name,category:selected.category,relation:correct?'correct':selected.category===c.category?'same':'different'}];p.updatedAt=new Date().toISOString();
    if(correct){p.status='solved';p.completedAt=new Date().toISOString();p.correctAttempts=p.attempts;user=await db.updateUser(user.id,{currentStreak:(user.currentStreak||0)+1,bestStreak:Math.max(user.bestStreak||0,(user.currentStreak||0)+1)});await db.recordAnalytics('case_solved',user.id,{caseId:c.id,attempts:p.attempts});}
    else if(p.attempts>=6){p.status='failed';p.completedAt=new Date().toISOString();user=await db.updateUser(user.id,{currentStreak:0});}
    await db.upsertProgress(p);
    res.json({state:await stateFor(user,c),user:publicUser(user),correct});
  }catch(e){next(e);}
});
app.post('/api/cases/:level/retry',requireUser,async(req,res,next)=>{
  try{
    const c=getCase(req.params.level);if(!c||!isReleased(c))return res.status(404).json({error:'Caso no disponible.'});if(!canAccess(req.user,c))return res.status(402).json({error:'Este caso requiere SecDle Plus.',upgrade:true});
    const p=await db.getProgress(req.user.id,c.id);if(!p)return res.status(400).json({error:'Todavía no has jugado este caso.'});if(p.status==='solved')return res.status(400).json({error:'Este caso ya está resuelto.'});if(p.status!=='failed')return res.status(400).json({error:'Solo puedes reiniciar un caso después de perderlo.'});
    p.status='playing';p.attempts=0;p.guesses=[];p.retryCount=(p.retryCount||0)+1;p.lastRetryAt=new Date().toISOString();p.completedAt=null;p.correctAttempts=null;p.updatedAt=new Date().toISOString();await db.upsertProgress(p);
    const user=await db.getUserById(req.user.id);res.json({state:await stateFor(user,c),user:publicUser(user)});
  }catch(e){next(e);}
});
app.get('/api/progress',requireUser,async(req,res,next)=>{try{res.json({progress:await db.listProgress(req.user.id),user:publicUser(req.user)});}catch(e){next(e);}});
app.post('/api/progress/import-guest',requireUser,async(req,res,next)=>{
  try{
    const guestProgress=Array.isArray(req.body?.progress)?req.body.progress.slice(0,500):[];
    const events=Array.isArray(req.body?.events)?req.body.events.slice(-1000):[];
    let user=await db.getUserById(req.user.id);if(!user)return res.status(404).json({error:'Usuario no encontrado.'});
    const current=await db.listProgress(user.id);const currentMap=new Map(current.map(p=>[p.caseId,p]));
    const imported=new Set(Array.isArray(user.importedGuestEvents)?user.importedGuestEvents:[]);
    const solvedDuring=new Set(current.filter(p=>p.status==='solved').map(p=>p.caseId));
    const validEvents=events.filter(e=>e&&typeof e.id==='string'&&typeof e.caseId==='string'&&(e.result==='solved'||e.result==='failed')).sort((a,b)=>String(a.at||'').localeCompare(String(b.at||'')));
    let currentStreak=user.currentStreak||0,bestStreak=user.bestStreak||0;
    for(const e of validEvents){
      if(imported.has(e.id))continue;const c=allCases().find(x=>x.id===e.caseId);if(!c||!isReleased(c)){imported.add(e.id);continue;}
      if(!solvedDuring.has(c.id)){if(e.result==='failed')currentStreak=0;if(e.result==='solved'){currentStreak++;bestStreak=Math.max(bestStreak,currentStreak);solvedDuring.add(c.id);}}
      imported.add(e.id);
    }
    for(const raw of guestProgress){
      const c=allCases().find(x=>x.id===raw?.caseId);if(!c||!isReleased(c))continue;const clean=cleanGuestProgress(raw,c);let p=currentMap.get(c.id);
      if(p?.status==='solved')continue;const guestTime=Date.parse(clean.updatedAt)||0;const serverTime=Date.parse(p?.updatedAt||p?.createdAt||0)||0;if(p&&serverTime>guestTime&&clean.status!=='solved')continue;
      p={...(p||{userId:user.id,caseId:c.id,createdAt:new Date().toISOString()}),attempts:clean.attempts,status:clean.status,guesses:clean.guesses,retryCount:clean.retryCount,updatedAt:clean.updatedAt,completedAt:clean.status==='playing'?null:clean.updatedAt,correctAttempts:clean.status==='solved'?clean.correctAttempts:null};
      await db.upsertProgress(p);currentMap.set(c.id,p);
    }
    user=await db.updateUser(user.id,{currentStreak,bestStreak,importedGuestEvents:Array.from(imported).slice(-5000)});
    res.json({ok:true,user:publicUser(user),importedEvents:validEvents.length,importedProgress:guestProgress.length});
  }catch(e){next(e);}
});

app.post('/api/payment/start',paymentLimiter,requireUser,async(req,res,next)=>{
  try{
    const provider=String(req.body.provider||'');const cycle=req.body.cycle==='annual'?'annual':'monthly';
    if(!['mercadopago','yape'].includes(provider))return res.status(400).json({error:'Método de pago inválido.'});
    const plan=await getVerifiedPlan(cycle);
    await db.createCheckoutIntent({userId:req.user.id,provider,cycle,planId:plan.id});
    await db.recordAnalytics('payment_started',req.user.id,{provider,cycle});
    const url=plan.init_point||`https://www.mercadopago.com.pe/subscriptions/checkout?preapproval_plan_id=${encodeURIComponent(plan.id)}`;
    res.json({url,providerNote:provider==='yape'?'Yape se procesa dentro del checkout seguro de Mercado Pago.':'Mercado Pago'});
  }catch(e){next(e);}
});
app.post('/api/payment/sync',paymentLimiter,requireUser,async(req,res,next)=>{
  try{
    const requested=req.body.cycle==='annual'?'annual':req.body.cycle==='monthly'?'monthly':null;
    const cycles=requested?[requested]:['monthly','annual'];let found=null;
    for(const cycle of cycles){const sub=await searchLatestSubscriptionForUser(req.user,cycle);if(sub){found=sub;break;}}
    if(!found)return res.status(404).json({error:'Todavía no encontramos una suscripción vinculada a este correo. Si acabas de pagar, espera unos segundos y vuelve a verificar. Usa en Mercado Pago el mismo correo de tu cuenta SecDle.'});
    const user=await syncSubscription(found,'manual_sync');
    if(!user||effectivePlan(user)!=='plus')return res.status(409).json({error:`La suscripción figura como ${found.status||'pendiente'}. Plus se activa cuando Mercado Pago la autoriza.`});
    res.json({ok:true,user:publicUser(user)});
  }catch(e){next(e);}
});
app.post('/api/subscription/cancel',paymentLimiter,requireUser,async(req,res,next)=>{
  try{
    const user=await db.getUserById(req.user.id);if(!user?.mercadoPagoSubscriptionId)return res.status(400).json({error:'No encontramos una suscripción de Mercado Pago vinculada.'});
    const subscription=await mpFetch(`/preapproval/${encodeURIComponent(user.mercadoPagoSubscriptionId)}`,{method:'PUT',body:JSON.stringify({status:'canceled'})});
    const updated=await syncSubscription(subscription,'user_cancel');
    res.json({ok:true,user:publicUser(updated),message:'Renovación cancelada. Mantendrás Plus hasta el final del período ya pagado, según la fecha registrada.'});
  }catch(e){next(e);}
});

async function validateMpWebhook(req){
  if(!MP_WEBHOOK_SECRET)throw new Error('MP_WEBHOOK_SECRET no está configurado.');
  const {WebhookSignatureValidator}=await import('mercadopago');
  WebhookSignatureValidator.validate({
    xSignature:req.headers['x-signature'],xRequestId:req.headers['x-request-id'],
    dataId:req.query['data.id']||req.body?.data?.id,secret:MP_WEBHOOK_SECRET
  });
}
app.post('/api/mercadopago/webhook',async(req,res)=>{
  try{
    await validateMpWebhook(req);
  }catch(e){
    console.warn('Webhook Mercado Pago rechazado:',e?.message||e);
    return res.sendStatus(401);
  }
  res.sendStatus(200);
  setImmediate(async()=>{
    try{
      const type=String(req.query.type||req.body?.type||'');const dataId=String(req.query['data.id']||req.body?.data?.id||'');if(!dataId)return;
      await db.recordPaymentEvent({eventType:type||'unknown',externalId:dataId,payload:req.body||{}});
      if(type==='subscription_preapproval'){
        const sub=await mpFetch(`/preapproval/${encodeURIComponent(dataId)}`);await syncSubscription(sub,'webhook_preapproval');
      }else if(type==='subscription_authorized_payment'){
        const invoice=await mpFetch(`/authorized_payments/${encodeURIComponent(dataId)}`);if(invoice.preapproval_id){const sub=await mpFetch(`/preapproval/${encodeURIComponent(invoice.preapproval_id)}`);await syncSubscription(sub,'webhook_invoice');}
      }else if(type==='payment'){
        const payment=await mpFetch(`/v1/payments/${encodeURIComponent(dataId)}`);await db.recordPaymentEvent({eventType:`payment:${payment.status||'unknown'}`,externalId:dataId,payload:payment});
        const search=await mpFetch(`/authorized_payments/search?payment_id=${encodeURIComponent(dataId)}`);const invoice=Array.isArray(search.results)?search.results[0]:null;if(invoice?.preapproval_id){const sub=await mpFetch(`/preapproval/${encodeURIComponent(invoice.preapproval_id)}`);await syncSubscription(sub,'webhook_payment');}
      }
    }catch(e){console.error('Error procesando webhook Mercado Pago:',e?.data||e);}
  });
});

function basicAuth(req,res,next){
  if(!ADMIN_USER||!ADMIN_PASSWORD)return res.status(404).end();
  const auth=req.headers.authorization||'';const [scheme,value]=auth.split(' ');
  if(scheme!=='Basic'||!value){res.setHeader('WWW-Authenticate','Basic realm="SecDle Admin"');return res.status(401).end();}
  let raw='';try{raw=Buffer.from(value,'base64').toString('utf8');}catch{}
  const i=raw.indexOf(':');const user=i>=0?raw.slice(0,i):'';const pass=i>=0?raw.slice(i+1):'';
  const safeEqual=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);};
  if(!safeEqual(user,ADMIN_USER)||!safeEqual(pass,ADMIN_PASSWORD)){res.setHeader('WWW-Authenticate','Basic realm="SecDle Admin"');return res.status(401).end();}
  next();
}
app.get('/api/admin/metrics',basicAuth,async(req,res,next)=>{try{res.json(await db.metrics());}catch(e){next(e);}});
app.get('/admin',basicAuth,(req,res)=>res.sendFile(path.join(__dirname,'public','admin.html')));

app.get('/robots.txt',(req,res)=>res.type('text/plain').send(`User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${BASE_URL.replace(/\/$/,'')}/sitemap.xml\n`));
app.get('/sitemap.xml',(req,res)=>{
  const base=BASE_URL.replace(/\/$/,'');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${base}/</loc></url><url><loc>${base}/privacy.html</loc></url><url><loc>${base}/terms.html</loc></url><url><loc>${base}/payments.html</loc></url></urlset>`);
});
app.get('/.well-known/security.txt',(req,res)=>res.type('text/plain').send(`Contact: mailto:${SUPPORT_EMAIL}\nPreferred-Languages: es, en\nPolicy: ${BASE_URL.replace(/\/$/,'')}/terms.html\nExpires: 2027-12-31T23:59:59Z\n`));

app.use(express.static(path.join(__dirname,'public'),{maxAge:process.env.NODE_ENV==='production'?'1h':0,etag:true}));
app.use('/api',(req,res)=>res.status(404).json({error:'Endpoint no encontrado.'}));
app.use((req,res)=>res.status(404).sendFile(path.join(__dirname,'public','404.html')));

app.use((err,req,res,next)=>{
  console.error('SecDle error:',err?.data||err);
  if(res.headersSent)return next(err);
  const status=Number(err.status)||500;
  const safe=status>=500?'Ocurrió un error interno. Intenta nuevamente.':err.message;
  res.status(status).json({error:safe});
});

(async()=>{
  try{
    await db.init();
    app.listen(PORT,()=>{
      console.log(`SecDle listo en ${BASE_URL}`);
      console.log(`Base de datos: ${db.usingPostgres?'PostgreSQL':'store.json (solo desarrollo)'}`);
      console.log(`Mercado Pago: ${MP_ACCESS_TOKEN&&MP_PLAN_MONTHLY_ID&&MP_PLAN_ANNUAL_ID?'configurado':'pendiente'}`);
    });
  }catch(e){console.error('No se pudo iniciar SecDle:',e);process.exit(1);}
})();
