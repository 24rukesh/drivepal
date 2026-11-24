/* Drivepal login: mobile number + OTP, like the official apps in India.
   DEMO: there is no SMS server yet, so the OTP is shown on screen instead of being texted.
   Accounts and data live only on this device. */
(function(){
 const USERS='dp_users2',SESSION='dp_session',OTPK='dp_otp',TTL=5*60*1000,RESEND=30,MAXTRY=3;
 const enc=new TextEncoder();
 const users=()=>{try{return JSON.parse(localStorage.getItem(USERS))||{}}catch(e){return {}}};
 const saveUsers=u=>localStorage.setItem(USERS,JSON.stringify(u));
 const sha=async s=>{if(!(window.crypto&&crypto.subtle))throw new Error('Open the app over https or localhost.');return btoa(String.fromCharCode(...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s)))))};
 const fmt=p=>'+91 '+p.slice(0,5)+' '+p.slice(5);
 const mask=p=>'+91 '+p.slice(0,2)+'XXX X'+p.slice(6);
 const current=()=>localStorage.getItem(SESSION)||sessionStorage.getItem(SESSION);
 window.DP={
  user:current(),
  profile(){const u=users()[this.user];return u?{phone:this.user,phoneFmt:fmt(this.user),name:u.name,car:u.car,reg:u.reg,vin:u.vin}:null},
  signOut(){localStorage.removeItem(SESSION);sessionStorage.removeItem(SESSION);location.reload()},
  updateProfile(p){const u=users();Object.assign(u[this.user],p);saveUsers(u)},
  deleteAccount(){const u=users();delete u[this.user];saveUsers(u);localStorage.removeItem('dp_data_'+this.user);this.signOut()}
 };
 if(DP.user&&!users()[DP.user]){localStorage.removeItem(SESSION);sessionStorage.removeItem(SESSION);DP.user=null}
 if(DP.user)return;

 const wrap=document.createElement('div');wrap.id='authScreen';
 let step='phone',phone='',timer=null,left=0,remember=true;
 const head=`<div class="brand"><div class="logo">D</div><div><div class="bn">Drivepal</div><div class="bs">Your car, at a glance</div></div></div>`;
 const foot=`<p class="fine">Independent app, not made by or linked to any car maker. Your account is stored only on this phone for now.</p>`;
 function draw(msg){
  let body='';
  if(step==='phone')body=`<h2 class="ah">Sign in with your mobile</h2><p class="ap">Use the number registered with your car. New here? You'll set up your profile after the OTP.</p>
   <form id="fPhone"><label>Mobile number<div class="ph"><span>+91</span><input id="aPhone" inputmode="numeric" autocomplete="tel-national" maxlength="10" placeholder="98765 43210" value="${phone}"></div></label>
   <label class="rem"><input id="aRem" type="checkbox" ${remember?'checked':''}> Keep me signed in on this phone</label>
   <div id="aErr" role="alert">${msg||''}</div><button class="btn" type="submit">Send OTP</button></form>`;
  if(step==='otp'){const o=JSON.parse(sessionStorage.getItem(OTPK)||'{}');
   body=`<h2 class="ah">Enter OTP</h2><p class="ap">6-digit code sent to <b>${mask(phone)}</b>. <button class="linkbtn" id="chg" type="button">Change number</button></p>
   <div class="demo">Demo mode: no SMS is sent yet. Your code is <b>${o.demo||''}</b></div>
   <form id="fOtp"><input id="aOtp" class="otp" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" aria-label="OTP">
   <div id="aErr" role="alert">${msg||''}</div><button class="btn" type="submit">Verify</button></form>
   <div class="resend">${left>0?`Resend OTP in ${left}s`:'<button class="linkbtn" id="resend" type="button">Resend OTP</button>'}</div>`}
  if(step==='profile')body=`<h2 class="ah">Set up your car</h2><p class="ap">${fmt(phone)} verified.</p>
   <form id="fProf"><label>Your name<input id="aName" autocomplete="name" placeholder="Your name" required></label>
   <label>Car<input id="aCar" value="Baleno Alpha AGS"></label>
   <label>Registration number<input id="aReg" placeholder="TG07XX0000" style="text-transform:uppercase"></label>
   <label>VIN / chassis number (optional)<input id="aVin" maxlength="17" placeholder="17 characters, on your RC" style="text-transform:uppercase"></label>
   <div id="aErr" role="alert">${msg||''}</div><button class="btn" type="submit">Continue</button></form>`;
  wrap.innerHTML=`<div class="authcard">${head}${body}${foot}</div>`;
  const f=wrap.querySelector('input');if(f)setTimeout(()=>f.focus(),50);
 }
 async function sendOtp(){
  const code=String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0');
  sessionStorage.setItem(OTPK,JSON.stringify({p:phone,h:await sha(phone+':'+code),exp:Date.now()+TTL,tries:0,demo:code}));
  step='otp';left=RESEND;clearInterval(timer);
  timer=setInterval(()=>{left--;const r=wrap.querySelector('.resend');if(r&&left>0)r.textContent=`Resend OTP in ${left}s`;if(left<=0){clearInterval(timer);if(step==='otp')r.innerHTML='<button class="linkbtn" id="resend" type="button">Resend OTP</button>'}},1000);
  draw();
 }
 function finish(){(remember?localStorage:sessionStorage).setItem(SESSION,phone);sessionStorage.removeItem(OTPK);location.reload()}
 wrap.addEventListener('input',e=>{if(e.target.id==='aPhone'||e.target.id==='aOtp')e.target.value=e.target.value.replace(/\D/g,'')});
 wrap.addEventListener('click',e=>{
  if(e.target.id==='chg'){step='phone';clearInterval(timer);draw()}
  if(e.target.id==='resend')sendOtp();
 });
 wrap.addEventListener('submit',async e=>{
  e.preventDefault();const $=s=>wrap.querySelector(s);
  try{
   if(e.target.id==='fPhone'){phone=$('#aPhone').value;remember=$('#aRem').checked;if(!/^[6-9]\d{9}$/.test(phone))throw new Error('Enter a valid 10-digit Indian mobile number');await sendOtp();return}
   if(e.target.id==='fOtp'){
    const o=JSON.parse(sessionStorage.getItem(OTPK)||'null'),code=$('#aOtp').value;
    if(!o||o.p!==phone)throw new Error('Request a new OTP');
    if(Date.now()>o.exp)throw new Error('OTP expired. Tap Resend OTP.');
    if(o.tries>=MAXTRY)throw new Error('Too many wrong tries. Tap Resend OTP.');
    if(await sha(phone+':'+code)!==o.h){o.tries++;sessionStorage.setItem(OTPK,JSON.stringify(o));throw new Error(`Wrong OTP. ${MAXTRY-o.tries} tries left.`)}
    if(users()[phone])return finish();
    step='profile';draw();return}
   if(e.target.id==='fProf'){
    const name=$('#aName').value.trim(),vin=$('#aVin').value.trim().toUpperCase();
    if(!name)throw new Error('Enter your name');
    if(vin&&!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin))throw new Error('VIN should be 17 letters and numbers (no I, O or Q)');
    const u=users();u[phone]={name,car:$('#aCar').value.trim()||'My car',reg:$('#aReg').value.trim().toUpperCase(),vin,created:Date.now()};saveUsers(u);finish()}
  }catch(x){const er=$('#aErr');if(er)er.textContent=x.message}
 });
 document.addEventListener('DOMContentLoaded',()=>{document.body.classList.add('locked');document.body.appendChild(wrap);draw()});
})();
