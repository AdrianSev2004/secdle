// Caché exclusivamente pública. Nunca interceptar API, cuentas, admin o checkout.
const CACHE='secdle-public-v2';
const OFFLINE='/offline.html';
const ASSETS=[OFFLINE,'/styles.css?v=6','/assets/icon-192.png','/assets/icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('secdle-public-')&&key!==CACHE).map(key=>caches.delete(key))))));
function isPublicAsset(url){return ['/styles.css','/i18n.js','/app.js','/manifest.webmanifest',OFFLINE].includes(url.pathname)||url.pathname.startsWith('/assets/')}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||url.pathname.startsWith('/admin')||url.searchParams.has('payment'))return;
  const navigation=request.mode==='navigate';
  if(!navigation&&!isPublicAsset(url))return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(request);
      if(!navigation&&response.ok&&!response.redirected&&isPublicAsset(url)){
        const cache=await caches.open(CACHE);await cache.put(request,response.clone());
      }
      return response;
    }catch{
      const cached=await caches.match(navigation?OFFLINE:request);
      return cached||Response.error();
    }
  })());
});
