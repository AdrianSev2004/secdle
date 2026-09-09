const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = path.join(__dirname, 'data', 'store.json');
const DATABASE_URL = process.env.DATABASE_URL || '';
const usingPostgres = Boolean(DATABASE_URL);
let pool = null;

function normalizeStore(store = {}) {
  return {
    users: Array.isArray(store.users) ? store.users : [],
    sessions: Array.isArray(store.sessions) ? store.sessions : [],
    progress: Array.isArray(store.progress) ? store.progress : [],
    checkoutIntents: Array.isArray(store.checkoutIntents) ? store.checkoutIntents : [],
    subscriptions: Array.isArray(store.subscriptions) ? store.subscriptions : [],
    paymentEvents: Array.isArray(store.paymentEvents) ? store.paymentEvents : [],
    analyticsEvents: Array.isArray(store.analyticsEvents) ? store.analyticsEvents : []
  };
}

function readStore() {
  try { return normalizeStore(JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'))); }
  catch { return normalizeStore(); }
}
function writeStore(store) {
  const tmp = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(normalizeStore(store), null, 2));
  fs.renameSync(tmp, STORE_PATH);
}
function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

const userSelect = `
  id, email,
  password_salt AS "passwordSalt",
  password_hash AS "passwordHash",
  plan, current_streak AS "currentStreak",
  best_streak AS "bestStreak",
  created_at AS "createdAt",
  subscription_status AS "subscriptionStatus",
  payment_provider AS "paymentProvider",
  subscription_cycle AS "subscriptionCycle",
  mercado_pago_subscription_id AS "mercadoPagoSubscriptionId",
  plus_until AS "plusUntil",
  imported_guest_events AS "importedGuestEvents"
`;


const userSelectAlias = `
  u.id, u.email,
  u.password_salt AS "passwordSalt",
  u.password_hash AS "passwordHash",
  u.plan, u.current_streak AS "currentStreak",
  u.best_streak AS "bestStreak",
  u.created_at AS "createdAt",
  u.subscription_status AS "subscriptionStatus",
  u.payment_provider AS "paymentProvider",
  u.subscription_cycle AS "subscriptionCycle",
  u.mercado_pago_subscription_id AS "mercadoPagoSubscriptionId",
  u.plus_until AS "plusUntil",
  u.imported_guest_events AS "importedGuestEvents"
`;

const progressSelect = `
  user_id AS "userId", case_id AS "caseId", attempts, status, guesses,
  correct_attempts AS "correctAttempts", retry_count AS "retryCount",
  created_at AS "createdAt", updated_at AS "updatedAt",
  completed_at AS "completedAt", last_retry_at AS "lastRetryAt"
`;

async function init() {
  if (!usingPostgres) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_URL es obligatorio en producción. No se permite store.json como base de datos productiva.');
    }
    writeStore(readStore());
    return;
  }

  const { Pool } = require('pg');
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
  });

  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
}

async function query(text, params = []) {
  if (!pool) throw new Error('PostgreSQL no está inicializado.');
  return pool.query(text, params);
}

async function getUserById(id) {
  if (!usingPostgres) return clone(readStore().users.find(u => u.id === id) || null);
  const r = await query(`SELECT ${userSelect} FROM users WHERE id=$1`, [id]);
  return r.rows[0] || null;
}
async function getUserByEmail(email) {
  if (!usingPostgres) return clone(readStore().users.find(u => String(u.email).toLowerCase() === String(email).toLowerCase()) || null);
  const r = await query(`SELECT ${userSelect} FROM users WHERE lower(email)=lower($1)`, [email]);
  return r.rows[0] || null;
}
async function createUser(user) {
  if (!usingPostgres) {
    const s = readStore(); s.users.push(clone(user)); writeStore(s); return clone(user);
  }
  const r = await query(`INSERT INTO users
    (id,email,password_salt,password_hash,plan,current_streak,best_streak,created_at,imported_guest_events)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) RETURNING ${userSelect}`,
    [user.id,user.email,user.passwordSalt,user.passwordHash,user.plan||'free',user.currentStreak||0,user.bestStreak||0,user.createdAt,JSON.stringify(user.importedGuestEvents||[])]);
  return r.rows[0];
}
async function updateUser(id, patch) {
  const allowed = {
    email:'email', passwordSalt:'password_salt', passwordHash:'password_hash', plan:'plan',
    currentStreak:'current_streak', bestStreak:'best_streak', subscriptionStatus:'subscription_status',
    paymentProvider:'payment_provider', subscriptionCycle:'subscription_cycle',
    mercadoPagoSubscriptionId:'mercado_pago_subscription_id', plusUntil:'plus_until',
    importedGuestEvents:'imported_guest_events'
  };
  if (!usingPostgres) {
    const s=readStore(); const i=s.users.findIndex(u=>u.id===id); if(i<0) return null;
    Object.assign(s.users[i], clone(patch)); writeStore(s); return clone(s.users[i]);
  }
  const keys=Object.keys(patch).filter(k=>allowed[k]);
  if(!keys.length) return getUserById(id);
  const vals=[]; const sets=[];
  keys.forEach((k,i)=>{
    vals.push(k==='importedGuestEvents'?JSON.stringify(patch[k]||[]):patch[k]);
    sets.push(`${allowed[k]}=$${i+1}${k==='importedGuestEvents'?'::jsonb':''}`);
  });
  vals.push(id);
  const r=await query(`UPDATE users SET ${sets.join(', ')} WHERE id=$${vals.length} RETURNING ${userSelect}`, vals);
  return r.rows[0]||null;
}

async function createSession(token,userId,expiresAt){
  if(!usingPostgres){const s=readStore();s.sessions.push({token,userId,expiresAt});writeStore(s);return;}
  await query('INSERT INTO sessions(token,user_id,expires_at) VALUES($1,$2,$3)',[token,userId,expiresAt]);
}
async function getSessionUser(token){
  if(!token) return null;
  if(!usingPostgres){
    const s=readStore(); const now=Date.now(); s.sessions=s.sessions.filter(x=>new Date(x.expiresAt).getTime()>now);
    const sess=s.sessions.find(x=>x.token===token); writeStore(s);
    return clone(sess?s.users.find(u=>u.id===sess.userId)||null:null);
  }
  await query('DELETE FROM sessions WHERE expires_at<=now()');
  const r=await query(`SELECT ${userSelectAlias}
    FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires_at>now()`,[token]);
  return r.rows[0]||null;
}
async function deleteSession(token){
  if(!usingPostgres){const s=readStore();s.sessions=s.sessions.filter(x=>x.token!==token);writeStore(s);return;}
  await query('DELETE FROM sessions WHERE token=$1',[token]);
}

async function getProgress(userId,caseId){
  if(!usingPostgres) return clone(readStore().progress.find(p=>p.userId===userId&&p.caseId===caseId)||null);
  const r=await query(`SELECT ${progressSelect} FROM progress WHERE user_id=$1 AND case_id=$2`,[userId,caseId]);
  return r.rows[0]||null;
}
async function listProgress(userId){
  if(!usingPostgres) return clone(readStore().progress.filter(p=>p.userId===userId));
  const r=await query(`SELECT ${progressSelect} FROM progress WHERE user_id=$1`,[userId]);
  return r.rows;
}
async function upsertProgress(p){
  if(!usingPostgres){
    const s=readStore(); const i=s.progress.findIndex(x=>x.userId===p.userId&&x.caseId===p.caseId);
    if(i<0)s.progress.push(clone(p));else s.progress[i]=clone(p);writeStore(s);return clone(p);
  }
  const r=await query(`INSERT INTO progress
    (user_id,case_id,attempts,status,guesses,correct_attempts,retry_count,created_at,updated_at,completed_at,last_retry_at)
    VALUES($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10,$11)
    ON CONFLICT(user_id,case_id) DO UPDATE SET attempts=EXCLUDED.attempts,status=EXCLUDED.status,
      guesses=EXCLUDED.guesses,correct_attempts=EXCLUDED.correct_attempts,retry_count=EXCLUDED.retry_count,
      updated_at=EXCLUDED.updated_at,completed_at=EXCLUDED.completed_at,last_retry_at=EXCLUDED.last_retry_at
    RETURNING ${progressSelect}`,
    [p.userId,p.caseId,p.attempts||0,p.status||'playing',JSON.stringify(p.guesses||[]),p.correctAttempts??null,p.retryCount||0,
      p.createdAt||new Date().toISOString(),p.updatedAt||new Date().toISOString(),p.completedAt||null,p.lastRetryAt||null]);
  return r.rows[0];
}

async function createCheckoutIntent({userId,provider,cycle,planId}){
  const row={id:crypto.randomUUID(),userId,provider,cycle,planId,status:'pending',createdAt:new Date().toISOString()};
  if(!usingPostgres){const s=readStore();s.checkoutIntents.push(row);writeStore(s);return clone(row);}
  const r=await query(`INSERT INTO checkout_intents(id,user_id,provider,cycle,plan_id,status,created_at)
    VALUES($1,$2,$3,$4,$5,'pending',$6) RETURNING id,user_id AS "userId",provider,cycle,plan_id AS "planId",status,created_at AS "createdAt"`,
    [row.id,userId,provider,cycle,planId,row.createdAt]);
  return r.rows[0];
}
async function markCheckoutIntentMatched(userId,planId,subscriptionId){
  if(!usingPostgres){
    const s=readStore(); const rows=s.checkoutIntents.filter(x=>x.userId===userId&&x.planId===planId&&x.status==='pending');
    const x=rows.sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(x){x.status='matched';x.matchedSubscriptionId=subscriptionId;x.matchedAt=new Date().toISOString();writeStore(s);} return;
  }
  await query(`UPDATE checkout_intents SET status='matched',matched_subscription_id=$3,matched_at=now()
    WHERE id=(SELECT id FROM checkout_intents WHERE user_id=$1 AND plan_id=$2 AND status='pending' ORDER BY created_at DESC LIMIT 1)`,
    [userId,planId,subscriptionId]);
}

async function findUserBySubscriptionId(subscriptionId){
  if(!usingPostgres){return clone(readStore().users.find(u=>u.mercadoPagoSubscriptionId===subscriptionId)||null);}
  const r=await query(`SELECT ${userSelect} FROM users WHERE mercado_pago_subscription_id=$1`,[subscriptionId]);
  return r.rows[0]||null;
}
async function upsertSubscription(sub){
  if(!usingPostgres){
    const s=readStore(); const i=s.subscriptions.findIndex(x=>x.providerSubscriptionId===sub.providerSubscriptionId);
    if(i<0)s.subscriptions.push(clone(sub));else s.subscriptions[i]={...s.subscriptions[i],...clone(sub)};writeStore(s);return;
  }
  await query(`INSERT INTO subscriptions(provider_subscription_id,user_id,provider,cycle,status,plan_id,payer_email,next_payment_date,raw,created_at,updated_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,now(),now())
    ON CONFLICT(provider_subscription_id) DO UPDATE SET user_id=EXCLUDED.user_id,cycle=EXCLUDED.cycle,status=EXCLUDED.status,
      plan_id=EXCLUDED.plan_id,payer_email=EXCLUDED.payer_email,next_payment_date=EXCLUDED.next_payment_date,raw=EXCLUDED.raw,updated_at=now()`,
    [sub.providerSubscriptionId,sub.userId||null,sub.provider||'mercadopago',sub.cycle||null,sub.status||null,sub.planId||null,sub.payerEmail||null,sub.nextPaymentDate||null,JSON.stringify(sub.raw||{})]);
}
async function recordPaymentEvent({provider='mercadopago',eventType,externalId,payload}){
  if(!externalId) return;
  if(!usingPostgres){
    const s=readStore(); if(s.paymentEvents.some(x=>x.provider===provider&&x.eventType===eventType&&String(x.externalId)===String(externalId)))return;
    s.paymentEvents.push({id:crypto.randomUUID(),provider,eventType,externalId:String(externalId),payload:clone(payload),createdAt:new Date().toISOString()});
    s.paymentEvents=s.paymentEvents.slice(-5000);writeStore(s);return;
  }
  await query(`INSERT INTO payment_events(provider,event_type,external_id,payload,created_at) VALUES($1,$2,$3,$4::jsonb,now()) ON CONFLICT DO NOTHING`,
    [provider,eventType,String(externalId),JSON.stringify(payload||{})]);
}
async function recordAnalytics(eventName,userId=null,meta={}){
  if(!usingPostgres){
    const s=readStore();s.analyticsEvents.push({id:crypto.randomUUID(),eventName,userId,meta:clone(meta),createdAt:new Date().toISOString()});
    s.analyticsEvents=s.analyticsEvents.slice(-10000);writeStore(s);return;
  }
  await query('INSERT INTO analytics_events(event_name,user_id,meta,created_at) VALUES($1,$2,$3::jsonb,now())',[eventName,userId,JSON.stringify(meta||{})]);
}


async function health(){
  if(!usingPostgres){ readStore(); return true; }
  await query('SELECT 1');
  return true;
}

async function metrics(){
  if(!usingPostgres){
    const s=readStore(); const since=Date.now()-7*86400000;
    return {
      backend:'json-dev',
      totalUsers:s.users.length,
      plusUsers:s.users.filter(u=>u.plan==='plus'&&(!u.plusUntil||new Date(u.plusUntil)>new Date())).length,
      activeSubscriptions:s.subscriptions.filter(x=>x.status==='authorized').length,
      estimatedMrrPen:Number(s.subscriptions.filter(x=>x.status==='authorized').reduce((sum,x)=>sum+(x.cycle==='annual'?79/12:x.cycle==='monthly'?7.90:0),0).toFixed(2)),
      revenue30dPen:Number(s.paymentEvents.filter(x=>x.eventType==='payment:approved'&&new Date(x.createdAt).getTime()>=Date.now()-30*86400000).reduce((sum,x)=>sum+(Number(x.payload?.transaction_amount)||0),0).toFixed(2)),
      pendingCheckouts:s.checkoutIntents.filter(x=>x.status==='pending').length,
      events7d:s.analyticsEvents.filter(x=>new Date(x.createdAt).getTime()>=since).length,
      recentPayments:s.paymentEvents.slice(-20).reverse(),
      recentSubscriptions:s.subscriptions.slice(-20).reverse()
    };
  }
  const [users,plus,subs,mrr,revenue,pending,events,payments,recentSubs]=await Promise.all([
    query('SELECT count(*)::int n FROM users'),
    query("SELECT count(*)::int n FROM users WHERE plan='plus' AND (plus_until IS NULL OR plus_until>now())"),
    query("SELECT count(*)::int n FROM subscriptions WHERE status='authorized'"),
    query("SELECT round(COALESCE(sum(CASE WHEN cycle='monthly' THEN 7.90 WHEN cycle='annual' THEN 79.00/12 ELSE 0 END),0)::numeric,2) n FROM subscriptions WHERE status='authorized'"),
    query("SELECT round(COALESCE(sum(CASE WHEN payload ? 'transaction_amount' THEN (payload->>'transaction_amount')::numeric ELSE 0 END),0)::numeric,2) n FROM payment_events WHERE event_type='payment:approved' AND created_at>now()-interval '30 days'"),
    query("SELECT count(*)::int n FROM checkout_intents WHERE status='pending' AND created_at>now()-interval '24 hours'"),
    query("SELECT count(*)::int n FROM analytics_events WHERE created_at>now()-interval '7 days'"),
    query('SELECT provider,event_type AS "eventType",external_id AS "externalId",created_at AS "createdAt" FROM payment_events ORDER BY created_at DESC LIMIT 20'),
    query('SELECT provider_subscription_id AS "providerSubscriptionId",cycle,status,plan_id AS "planId",payer_email AS "payerEmail",next_payment_date AS "nextPaymentDate",updated_at AS "updatedAt" FROM subscriptions ORDER BY updated_at DESC LIMIT 20')
  ]);
  return {backend:'postgres',totalUsers:users.rows[0].n,plusUsers:plus.rows[0].n,activeSubscriptions:subs.rows[0].n,estimatedMrrPen:Number(mrr.rows[0].n),revenue30dPen:Number(revenue.rows[0].n),pendingCheckouts:pending.rows[0].n,events7d:events.rows[0].n,recentPayments:payments.rows,recentSubscriptions:recentSubs.rows};
}

module.exports={
  init, usingPostgres, getUserById, getUserByEmail, createUser, updateUser,
  createSession, getSessionUser, deleteSession, getProgress, listProgress, upsertProgress,
  createCheckoutIntent, markCheckoutIntentMatched, findUserBySubscriptionId, upsertSubscription,
  recordPaymentEvent, recordAnalytics, health, metrics
};
