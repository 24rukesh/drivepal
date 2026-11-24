/* Drivepal login: real Suzuki Connect mobile+OTP flow.
   phone -> POST /api/auth/otp/request -> SMS -> POST /api/auth/otp/validate -> tokens. */
(function(){
 const APIB = window.DP_API_BASE || 'https://tsp-in.suzukiconnect.info';
 const AUTH_KEY='dp_auth', SESSION='dp_session';
 const CLIENT_ID='8cCjstzZLTG9SmPByrfF', CLIENT_SECRET='mrJXukN$3$6fQ!dncdkkdbWd62JVAM';
 const APPVER='1.1.24';
 function deviceId(){let d=localStorage.getItem('dp_device');if(!d){d='dp-'+crypto.randomUUID().replace(/-/g,'').slice(0,16);localStorage.setItem('dp_device',d)}return d}
 const fmt=p=>'+91 '+p.slice(0,5)+' '+p.slice(5);
 const mask=p=>'+91 '+p.slice(0,2)+'XXX X'+p.slice(6);
 const esc=s=>String(s||'').replace(/"/g,'&quot;');
 function api(path,body){
  return fetch(APIB+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})}).then(async r=>{
   const j=await r.json().catch(()=>({}));
   if(!r.ok){const e=(j.errors&&j.errors[0])||{};throw new Error(e.message||e.title||('HTTP '+r.status))}
   return j});
 }
 const session=()=>localStorage.getItem(SESSION);
 window.DP={
  user:session(),
  api, APIB,
  auth(){try{return JSON.parse(localStorage.getItem(AUTH_KEY))}catch(e){return null}},
  profile(){const a=this.auth();if(!a)return null;const u=a.user||{};return{phone:a.phone,phoneFmt:fmt(a.phone||''),name:u.name,car:u.car,reg:u.reg,vin:u.vin,contractId:u.contractId}},
  signOut(){localStorage.removeItem(SESSION);localStorage.removeItem(AUTH_KEY);location.reload()},
  deleteAccount(){localStorage.removeItem(AUTH_KEY);localStorage.removeItem('dp_data_'+this.user);this.signOut()},
  updateProfile(p){const a=this.auth();if(!a)return;Object.assign(a.user,p);localStorage.setItem(AUTH_KEY,JSON.stringify(a))}
 };
 const a=DP.auth();
 if(DP.user&&a&&a.access_token){/* signed in */}
 else if(DP.user){localStorage.removeItem(SESSION);DP.user=null}
 if(DP.user&&a)return;

 const wrap=document.createElement('div');wrap.id='authScreen';
 let step='phone',phone='',oai=null,remember=true,profile={};
 const head=`<div class="brand"><div class="logo">D</div><div><div class="bn">Drivepal</div><div class="bs">Your car, at a glance</div></div></div>`;
 const foot=`<p class="fine">Independent app, not made by or linked to any car maker. Login uses your Suzuki Connect account.</p>`;
 function draw(msg){
  let body='';
  if(step==='phone')body=`<h2 class="ah">Sign in with your mobile</h2><p class="ap">Use the number registered with your Suzuki Connect account. An OTP will be sent by SMS.</p>
   <form id="fPhone"><label>Mobile number<div class="ph"><span>+91</span><input id="aPhone" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="98765 43210" value="${phone}"></div></label>
   <label class="rem"><input id="aRem" type="checkbox" ${remember?'checked':''}> Keep me signed in on this phone</label>
   <div id="aErr" role="alert">${msg||''}</div><button class="btn" type="submit">Send OTP</button></form>`;
  if(step==='otp')body=`<h2 class="ah">Enter OTP</h2><p class="ap">6-digit code sent by SMS to <b>${mask(phone)}</b>. <button class="linkbtn" id="chg" type="button">Change number</button></p>
   <form id="fOtp"><input id="aOtp" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="OTP">
   <div id="aErr" role="alert">${msg||''}</div><button class="btn" type="submit">Verify</button></form>
   <div class="resend">${left>0?`Resend OTP in ${left}s`:'<button class="linkbtn" id="resend" type="button">Resend OTP</button>'}</div>`;
  if(step==='profile')body=`<h2 class="ah">Confirm your car</h2><p class="ap">${fmt(phone)} verified.</p>
   <form id="fProf"><label>Your name<input id="aName" value="${esc(profile.name||'')}" required></label>
   <label>Car<input id="aCar" value="${esc(profile.car||'Baleno Alpha AGS')}"></label>
   <label>Registration number<input id="aReg" value="${esc(profile.reg||'')}" style="text-transform:uppercase"></label>
   <div id="aErr" role="alert">${msg||''}</div><button class="btn" type="submit">Continue</button></form>`;
  wrap.innerHTML=`<div class="authcard">${head}${body}${foot}</div>`;
  const f=wrap.querySelector('input');if(f)setTimeout(()=>f.focus(),50);
 }
 let left=0,timer=null;
 function resendCountdown(){left=30;clearInterval(timer);timer=setInterval(()=>{left--;const r=wrap.querySelector('.resend');if(r&&left>0)r.textContent=`Resend OTP in ${left}s`;if(left<=0){clearInterval(timer);const r2=wrap.querySelector('.resend');if(r2)r2.innerHTML='<button class="linkbtn" id="resend" type="button">Resend OTP</button>'}},1000)}
 async function sendOtp(){
  const j=await api('/api/auth/otp/request',{mobile:phone,appVer:APPVER,device_id:deviceId(),device_type:'Android',grant_type:'otp',client_id:CLIENT_ID,client_secret:CLIENT_SECRET});
  oai=j?.result?.data?.OAI;if(!oai)throw new Error('No OTP reference returned');
  step='otp';resendCountdown();draw();
 }
 function finish(){(remember?localStorage:sessionStorage).setItem(SESSION,phone);location.reload()}
 wrap.addEventListener('input',e=>{if(e.target.id==='aPhone'||e.target.id==='aOtp')e.target.value=e.target.value.replace(/\D/g,'')});
 wrap.addEventListener('click',async e=>{
  if(e.target.id==='chg'){step='phone';clearInterval(timer);draw();return}
  if(e.target.id==='resend'){try{await sendOtp()}catch(x){draw(x.message)}return}
 });
 wrap.addEventListener('submit',async e=>{
  e.preventDefault();const $=s=>wrap.querySelector(s);
  try{
   if(e.target.id==='fPhone'){phone=$('#aPhone').value;remember=$('#aRem').checked;if(!/^[6-9]\d{9}$/.test(phone))throw new Error('Enter a valid 10-digit Indian mobile number');await sendOtp();return}
   if(e.target.id==='fOtp'){
    const code=$('#aOtp').value;if(code.length!==6)throw new Error('Enter the 6-digit OTP');
    const j=await api('/api/auth/otp/validate',{grant_type:'otp',oai:oai,otp:code,client_id:CLIENT_ID,client_secret:CLIENT_SECRET,device_token:'',device_id:deviceId(),device_type:'Android',appVer:APPVER,device_model:navigator.platform||'Android',os_version:'15'});
    const ud=j?.result?.data?.USER_DETAILS||{},db=j?.result?.data?.DASHBOARD_DATA||{};
    profile={name:ud.CUSTOMER_NAME||phone,car:'Baleno Alpha AGS',reg:(db.VRN||'').replace(/\.\./g,''),vin:db.VIN||'',contractId:String(ud.DEFAULT_CONTRACT_ID||''),deviceType:ud.DEVICE_TYPE||'',brand:ud.BrandCode||''};
    localStorage.setItem(AUTH_KEY,JSON.stringify({phone,access_token:j.access_token,refresh_token:j.refresh_token,ts:Date.now(),user:profile}));
    if(profile.name&&profile.contractId)return finish();
    step='profile';draw();return}
   if(e.target.id==='fProf'){
    const a2=DP.auth();if(!a2)throw new Error('Session lost, sign in again');
    a2.user.name=$('#aName').value.trim();a2.user.car=$('#aCar').value.trim()||'My car';a2.user.reg=$('#aReg').value.trim().toUpperCase();
    localStorage.setItem(AUTH_KEY,JSON.stringify(a2));finish()}
  }catch(x){const er=$('#aErr');if(er)er.textContent=x.message}
 });
 document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('locked');document.body.appendChild(wrap);draw()});
})();
