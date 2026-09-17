(()=>{
  'use strict';
  if(window.__vaultAuthV27)return;
  window.__vaultAuthV27=true;

  const AUTH_KEY='vault-auth-v1';
  const SESSION_KEY='vault-auth-session-v1';

  const style=document.createElement('style');
  style.textContent=`
    .vault-switch{position:relative;display:inline-flex;width:52px;height:32px;flex:0 0 auto}
    .vault-switch input{position:absolute;opacity:0;pointer-events:none}
    .vault-switch span{position:absolute;inset:0;background:#d4d5da;border-radius:999px;transition:.2s}
    .vault-switch span::after{content:"";position:absolute;width:26px;height:26px;left:3px;top:3px;background:#fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.18);transition:.2s}
    .vault-switch input:checked + span{background:#111}
    .vault-switch input:checked + span::after{transform:translateX(20px)}
    .vault-switch input:disabled + span{opacity:.45}
    #vaultAuthOverlay{position:fixed;inset:0;z-index:9999;background:linear-gradient(155deg,#f4f6fb 0%,#e9edff 48%,#f8f2ff 100%);display:none;align-items:center;justify-content:center;padding:calc(22px + env(safe-area-inset-top)) 20px calc(22px + env(safe-area-inset-bottom));font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Hiragino Sans","Noto Sans JP",system-ui,sans-serif}
    #vaultAuthOverlay.show{display:flex}
    .vault-auth-box{width:min(100%,420px);background:rgba(255,255,255,.94);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,.8);border-radius:30px;padding:26px;box-shadow:0 22px 70px rgba(48,48,80,.16);color:#111}
    .vault-auth-brand{font-size:34px;font-weight:950;letter-spacing:.09em;margin-bottom:4px}
    .vault-auth-sub{color:#8b8b93;font-size:13px;margin-bottom:22px}
    .vault-auth-field{display:grid;gap:7px;margin:12px 0}
    .vault-auth-field label{font-size:12px;color:#8b8b93;font-weight:800}
    .vault-auth-field input{width:100%;box-sizing:border-box;border:1px solid #e5e6ea;background:#fff;padding:14px 15px;border-radius:15px;outline:none;font-size:16px}
    .vault-auth-field input:focus{border-color:#9aa7ff;box-shadow:0 0 0 3px rgba(120,135,255,.13)}
    .vault-auth-submit{width:100%;border:0;border-radius:16px;padding:14px;background:#111;color:#fff;font-weight:900;margin-top:10px;min-height:50px;font-size:16px}
    .vault-auth-error{min-height:18px;color:#c83a31;font-size:12px;font-weight:750;margin-top:8px}
    .vault-auth-note{font-size:11px;color:#8b8b93;line-height:1.5;margin-top:13px}
    #vaultAuthSetup{border:0;border-radius:28px;padding:0;width:min(92vw,520px);box-shadow:0 25px 80px rgba(0,0,0,.25)}
    #vaultAuthSetup::backdrop{background:rgba(0,0,0,.38);backdrop-filter:blur(3px)}
    .vault-auth-modal{padding:22px;position:relative;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Hiragino Sans","Noto Sans JP",system-ui,sans-serif}
    .vault-auth-modal h2{margin:0 0 18px;font-size:24px;padding-right:50px}
    .vault-auth-close{position:absolute;right:16px;top:14px;width:42px;height:42px;border:0;border-radius:50%;background:#eff0f3;font-size:24px;display:grid;place-items:center}
    .vault-auth-modal .field{display:grid;gap:7px;margin:12px 0}
    .vault-auth-modal .field label{font-size:13px;color:#8b8b93;font-weight:750}
    .vault-auth-modal .field input{width:100%;box-sizing:border-box;border:1px solid #e5e6ea;background:#fff;padding:13px 14px;border-radius:14px;outline:none;font-size:16px}
    .vault-auth-save{width:100%;border:0;border-radius:15px;padding:14px;min-height:48px;font-weight:850;background:#111;color:#fff;margin-top:12px}
    .vault-auth-user{font-weight:850}
  `;
  document.head.appendChild(style);

  if(!document.querySelector('link[rel="apple-touch-icon"]')){
    const icon=document.createElement('link');
    icon.rel='apple-touch-icon';icon.sizes='180x180';icon.href='./apple-touch-icon.png?v=27';
    document.head.appendChild(icon);
  }
  const version=document.querySelector('.version');
  if(version)version.textContent='VAULT v2.7';

  const settings=document.getElementById('settingsPage');
  if(settings && !document.getElementById('vaultLoginEnabled')){
    const cards=[...settings.querySelectorAll('.settings-card')];
    const dataCard=cards.find(c=>c.querySelector('h3')?.textContent.trim()==='データ');
    const card=document.createElement('div');
    card.className='settings-card';
    card.innerHTML=`
      <h3>アクセス</h3>
      <div class="settings-row"><div><div>ユーザー名 + 4桁PIN</div><div class="hint">この端末のVAULTに簡易ロックをかけます</div></div><label class="vault-switch"><input id="vaultLoginEnabled" type="checkbox"><span></span></label></div>
      <div class="settings-row"><div><div>自動ログイン</div><div class="hint">ONなら次回からPIN入力を省略</div></div><label class="vault-switch"><input id="vaultAutoLogin" type="checkbox"><span></span></label></div>
      <div class="settings-row"><span>ユーザー</span><span class="vault-auth-user" id="vaultAuthUser">未設定</span></div>
      <div class="settings-row"><span>ユーザー名 / PINを変更</span><button class="smallbtn" id="vaultChangeLogin">変更</button></div>
      <div class="settings-row"><span>今すぐロック</span><button class="smallbtn" id="vaultLockNow">ロック</button></div>
      <p class="hint">メール登録なし。このログイン情報はこの端末だけに保存され、別端末とは同期しません。</p>`;
    if(dataCard)settings.insertBefore(card,dataCard); else settings.appendChild(card);
  }

  const setup=document.createElement('dialog');
  setup.id='vaultAuthSetup';
  setup.innerHTML=`<form class="vault-auth-modal" id="vaultAuthSetupForm">
    <button type="button" class="vault-auth-close" id="vaultAuthClose" aria-label="閉じる">×</button>
    <h2>ACCESS SETUP</h2>
    <div class="field"><label>ユーザー名</label><input id="vaultSetupUsername" maxlength="24" autocomplete="username" placeholder="an"></div>
    <div class="field"><label>4桁PIN</label><input id="vaultSetupPin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="new-password" placeholder="••••"></div>
    <div class="vault-auth-error" id="vaultSetupError"></div>
    <button class="vault-auth-save" type="submit">保存</button>
  </form>`;
  document.body.appendChild(setup);

  const overlay=document.createElement('div');
  overlay.id='vaultAuthOverlay';
  overlay.setAttribute('aria-hidden','true');
  overlay.innerHTML=`<form class="vault-auth-box" id="vaultLoginForm">
    <div class="vault-auth-brand">VAULT</div>
    <div class="vault-auth-sub">Enter your local access code</div>
    <div class="vault-auth-field"><label>USERNAME</label><input id="vaultLoginUsername" maxlength="24" autocomplete="username" placeholder="Username"></div>
    <div class="vault-auth-field"><label>4-DIGIT PIN</label><input id="vaultLoginPin" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="current-password" placeholder="••••"></div>
    <button class="vault-auth-submit" type="submit">ENTER</button>
    <div class="vault-auth-error" id="vaultLoginError" aria-live="polite"></div>
    <div class="vault-auth-note">メールアドレスは不要です。このロックはこの端末内だけで動作します。</div>
  </form>`;
  document.body.appendChild(overlay);

  function loadAuth(){
    try{
      const a=JSON.parse(localStorage.getItem(AUTH_KEY)||'{}');
      return {enabled:!!a.enabled,username:String(a.username||''),pinHash:String(a.pinHash||''),autoLogin:!!a.autoLogin};
    }catch{return {enabled:false,username:'',pinHash:'',autoLogin:false}}
  }
  let auth=loadAuth();
  function saveAuth(){localStorage.setItem(AUTH_KEY,JSON.stringify(auth));renderSettings()}
  async function hashPin(username,pin){
    const value=`VAULT|${String(username).trim().toLowerCase()}|${String(pin)}`;
    if(window.crypto?.subtle && window.TextEncoder){
      const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value));
      return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
    }
    let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16);
  }
  function setSession(persist){
    sessionStorage.setItem(SESSION_KEY,'1');
    if(persist)localStorage.setItem(SESSION_KEY,'1');else localStorage.removeItem(SESSION_KEY);
  }
  function clearSession(){sessionStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_KEY)}
  function hasSession(){
    if(!auth.enabled)return true;
    if(sessionStorage.getItem(SESSION_KEY)==='1')return true;
    if(auth.autoLogin&&localStorage.getItem(SESSION_KEY)==='1'){sessionStorage.setItem(SESSION_KEY,'1');return true}
    return false;
  }
  function renderSettings(){
    const enabled=document.getElementById('vaultLoginEnabled');
    const auto=document.getElementById('vaultAutoLogin');
    if(!enabled||!auto)return;
    enabled.checked=auth.enabled;auto.checked=auth.autoLogin;auto.disabled=!auth.enabled;
    document.getElementById('vaultAuthUser').textContent=auth.username||'未設定';
    document.getElementById('vaultChangeLogin').disabled=!auth.enabled&&!auth.username;
    document.getElementById('vaultLockNow').disabled=!auth.enabled;
  }
  function showOverlay(){
    document.getElementById('vaultLoginUsername').value=auth.username||'';
    document.getElementById('vaultLoginPin').value='';
    document.getElementById('vaultLoginError').textContent='';
    overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
    setTimeout(()=>document.getElementById(auth.username?'vaultLoginPin':'vaultLoginUsername')?.focus(),80);
  }
  function hideOverlay(){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true')}
  function openSetup(){
    document.getElementById('vaultSetupUsername').value=auth.username||'';
    document.getElementById('vaultSetupPin').value='';
    document.getElementById('vaultSetupError').textContent='';
    setup.showModal();
  }

  document.getElementById('vaultAuthClose').addEventListener('click',()=>setup.close());
  setup.addEventListener('cancel',e=>{e.preventDefault();setup.close()});

  document.getElementById('vaultLoginEnabled')?.addEventListener('change',e=>{
    if(e.target.checked){
      if(!auth.username||!auth.pinHash){e.target.checked=false;openSetup();return}
      auth.enabled=true;setSession(auth.autoLogin);saveAuth();
    }else{
      auth.enabled=false;auth.autoLogin=false;clearSession();saveAuth();hideOverlay();
    }
  });
  document.getElementById('vaultAutoLogin')?.addEventListener('change',e=>{
    auth.autoLogin=!!e.target.checked;
    if(auth.autoLogin&&auth.enabled)setSession(true);else localStorage.removeItem(SESSION_KEY);
    saveAuth();
  });
  document.getElementById('vaultChangeLogin')?.addEventListener('click',openSetup);
  document.getElementById('vaultLockNow')?.addEventListener('click',()=>{if(auth.enabled){clearSession();showOverlay()}});

  document.getElementById('vaultAuthSetupForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const username=document.getElementById('vaultSetupUsername').value.trim();
    const pin=document.getElementById('vaultSetupPin').value.trim();
    const err=document.getElementById('vaultSetupError');
    if(!username){err.textContent='ユーザー名を入力してください';return}
    if(!/^\d{4}$/.test(pin)){err.textContent='PINは数字4桁で入力してください';return}
    auth.username=username;auth.pinHash=await hashPin(username,pin);auth.enabled=true;
    setSession(auth.autoLogin);saveAuth();setup.close();hideOverlay();
  });

  document.getElementById('vaultLoginForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const username=document.getElementById('vaultLoginUsername').value.trim();
    const pin=document.getElementById('vaultLoginPin').value.trim();
    const err=document.getElementById('vaultLoginError');
    if(!/^\d{4}$/.test(pin)){err.textContent='PINは数字4桁です';return}
    const okName=username.toLowerCase()===auth.username.trim().toLowerCase();
    const okPin=(await hashPin(auth.username,pin))===auth.pinHash;
    if(!okName||!okPin){err.textContent='ユーザー名またはPINが違います';return}
    setSession(auth.autoLogin);hideOverlay();
  });

  renderSettings();
  if(auth.enabled&&!hasSession())showOverlay();else hideOverlay();
})();
