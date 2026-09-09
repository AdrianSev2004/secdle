const $=id=>document.getElementById(id);
const esc=v=>String(v??'');
function date(v){try{return new Date(v).toLocaleString('es-PE')}catch{return esc(v)}}
async function load(){
  try{
    const r=await fetch('/api/admin/metrics');
    if(!r.ok)throw new Error(`No se pudieron cargar las métricas (${r.status}).`);
    const d=await r.json();
    $('mUsers').textContent=d.totalUsers??0;$('mPlus').textContent=d.plusUsers??0;$('mSubs').textContent=d.activeSubscriptions??0;$('mMrr').textContent=`S/ ${Number(d.estimatedMrrPen||0).toFixed(2)}`;$('mRevenue').textContent=`S/ ${Number(d.revenue30dPen||0).toFixed(2)}`;$('mPending').textContent=d.pendingCheckouts??0;$('mEvents').textContent=d.events7d??0;
    $('adminMessage').textContent=`Base de datos: ${d.backend}.`;
    $('subsRows').innerHTML='';
    for(const s of d.recentSubscriptions||[]){const tr=document.createElement('tr');[s.providerSubscriptionId||s.id,s.cycle,s.status,s.payerEmail,date(s.updatedAt||s.createdAt)].forEach(v=>{const td=document.createElement('td');td.textContent=esc(v);tr.appendChild(td)});$('subsRows').appendChild(tr)}
    $('payRows').innerHTML='';
    for(const p of d.recentPayments||[]){const tr=document.createElement('tr');[p.provider,p.eventType,p.externalId,date(p.createdAt)].forEach(v=>{const td=document.createElement('td');td.textContent=esc(v);tr.appendChild(td)});$('payRows').appendChild(tr)}
  }catch(e){$('adminMessage').textContent=e.message;$('adminMessage').classList.add('error')}
}
load();
