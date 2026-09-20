const CACHE="moneybox-cache-v11";
const CORE=["./","./index.html","./manifest.webmanifest","./apple-touch-icon.png","./auth-v27.js?v=27"];

self.addEventListener("install",event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

async function withVaultAuth(response){
  if(!response)return response;
  const type=response.headers.get("content-type")||"";
  if(!type.includes("text/html"))return response;
  let text=await response.text();
  if(!text.includes("auth-v27.js")){
    text=text.replace("</body>",'<script src="./auth-v27.js?v=27"></script></body>');
  }
  const headers=new Headers(response.headers);
  headers.delete("content-length");
  return new Response(text,{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  event.respondWith((async()=>{
    let response;
    try{
      response=await fetch(event.request);
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(event.request,copy));
    }catch{
      response=await caches.match(event.request) || (event.request.mode==="navigate" ? await caches.match("./index.html") : null);
    }
    if(event.request.mode==="navigate")return withVaultAuth(response);
    return response;
  })());
});