require('dotenv').config();

const token = process.env.MP_ACCESS_TOKEN || '';
const plans = [
  {cycle:'monthly', label:'Mensual', id:process.env.MP_PLAN_MONTHLY_ID || '', expected:7.90},
  {cycle:'annual', label:'Anual', id:process.env.MP_PLAN_ANNUAL_ID || '', expected:79.00}
];

async function getPlan(id){
  const r = await fetch(`https://api.mercadopago.com/preapproval_plan/${encodeURIComponent(id)}`,{
    headers:{Authorization:`Bearer ${token}`}
  });
  const data = await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

async function main(){
  if(!token) throw new Error('Falta MP_ACCESS_TOKEN en .env.');
  for(const p of plans){
    if(!p.id){
      console.log(`${p.label}: falta configurar el ID del plan.`);
      continue;
    }
    const plan = await getPlan(p.id);
    const amount = Number(plan?.auto_recurring?.transaction_amount);
    const currency = plan?.auto_recurring?.currency_id || '?';
    const ok = currency==='PEN' && Number.isFinite(amount) && Math.abs(amount-p.expected)<0.001 && (!plan.status || plan.status==='active');
    console.log(`${p.label}: ${currency} ${Number.isFinite(amount)?amount.toFixed(2):'?'} · estado ${plan.status||'?'} · ${ok?'OK':'REVISAR'}`);
    if(!ok) console.log(`  Esperado: PEN ${p.expected.toFixed(2)} y plan activo.`);
  }
}

main().catch(err=>{
  console.error('No se pudo comprobar Mercado Pago:', err.message || err);
  process.exitCode=1;
});
