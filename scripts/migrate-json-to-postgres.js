require('dotenv').config();

const fs = require('fs');
const path = require('path');
const db = require('../db.js');

const STORE_PATH = path.join(__dirname, '..', 'data', 'store.json');

async function main(){
  if(!process.env.DATABASE_URL){
    throw new Error('Falta DATABASE_URL. Crea tu PostgreSQL y colócalo en .env antes de migrar.');
  }
  if(!fs.existsSync(STORE_PATH)){
    throw new Error('No existe data/store.json.');
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
  const users = Array.isArray(store.users) ? store.users : [];
  const progress = Array.isArray(store.progress) ? store.progress : [];

  await db.init();

  let usersImported = 0;
  for(const u of users){
    if(!u?.id || !u?.email || !u?.passwordSalt || !u?.passwordHash) continue;
    let existing = await db.getUserById(u.id);
    if(!existing) existing = await db.getUserByEmail(u.email);

    if(!existing){
      existing = await db.createUser({
        id:u.id,
        email:u.email,
        passwordSalt:u.passwordSalt,
        passwordHash:u.passwordHash,
        plan:u.plan || 'free',
        currentStreak:Number(u.currentStreak)||0,
        bestStreak:Number(u.bestStreak)||0,
        createdAt:u.createdAt || new Date().toISOString(),
        importedGuestEvents:Array.isArray(u.importedGuestEvents)?u.importedGuestEvents:[]
      });
    }

    await db.updateUser(existing.id,{
      passwordSalt:u.passwordSalt,
      passwordHash:u.passwordHash,
      plan:u.plan || 'free',
      currentStreak:Number(u.currentStreak)||0,
      bestStreak:Number(u.bestStreak)||0,
      subscriptionStatus:u.subscriptionStatus || null,
      paymentProvider:u.paymentProvider || null,
      subscriptionCycle:u.subscriptionCycle || null,
      mercadoPagoSubscriptionId:u.mercadoPagoSubscriptionId || null,
      plusUntil:u.plusUntil || null,
      importedGuestEvents:Array.isArray(u.importedGuestEvents)?u.importedGuestEvents:[]
    });
    usersImported++;
  }

  let progressImported = 0;
  for(const p of progress){
    if(!p?.userId || !p?.caseId) continue;
    const user = await db.getUserById(p.userId);
    if(!user) continue;
    await db.upsertProgress({
      ...p,
      userId:p.userId,
      caseId:p.caseId,
      attempts:Number(p.attempts)||0,
      guesses:Array.isArray(p.guesses)?p.guesses:[],
      retryCount:Number(p.retryCount)||0,
      createdAt:p.createdAt || new Date().toISOString(),
      updatedAt:p.updatedAt || p.createdAt || new Date().toISOString()
    });
    progressImported++;
  }

  console.log(`Migración completada: ${usersImported} usuario(s), ${progressImported} progreso(s).`);
  console.log('Las sesiones antiguas no se migran; los usuarios deberán iniciar sesión otra vez.');
}

main().then(()=>process.exit(0)).catch(err=>{
  console.error('Error de migración:', err.message || err);
  process.exit(1);
});
