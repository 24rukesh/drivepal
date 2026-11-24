function startApp(){
const KEY='dp_data_'+DP.user;const PR=DP.profile()||{};
const now=()=>Date.now();
const D=m=>now()-m*60000;
const HO=[[17.4375,78.4483],[17.4330,78.4300],[17.4290,78.4100],[17.4330,78.3900],[17.4380,78.3700],[17.4401,78.3489]];
const SP=[[17.4375,78.4483],[17.4600,78.4700],[17.4700,78.5000],[17.5300,78.5400],[17.5880,78.5650]];
const seed=()=>({
 settings:{reg:PR.reg||'',carName:PR.car||'My car',pump:107,tank:37,svcKm:10000,svcMonths:12,overCity:60,overHwy:100,lowFuel:15,theme:'dark',offline:false},
 car:{fuelPct:42,odo:8412,locked:true,hazard:false,alarm:false,headlights:true,battV:12.6,seen:D(2),place:'Office, Gachibowli',lat:17.4401,lon:78.3489,valet:false,valetSince:0,ac:false},
 valet:{speed:40,radius:2},
 geofences:[{id:1,n:'Home',lat:17.4375,lon:78.4483,r:400,on:true},{id:2,n:'Office',lat:17.4401,lon:78.3489,r:300,on:true}],
 places:[{n:'Office, Gachibowli',since:D(180)},{n:'Home',since:D(60*14)},{n:'Shamirpet',since:D(60*76)}],
 trips:[
  {id:1,when:D(60*5),from:'Home',to:'Office, Gachibowli',km:21.4,min:52,max:74,avg:25,kmpl:14.2,score:88,harsh:1,tag:'Office',route:HO},
  {id:2,when:D(60*29),from:'Office',to:'Home',km:22.1,min:61,max:81,avg:22,kmpl:13.6,score:81,harsh:3,tag:'Office',route:HO.slice().reverse()},
  {id:3,when:D(60*53),from:'Home',to:'Office, Gachibowli',km:21.2,min:49,max:70,avg:26,kmpl:14.8,score:91,harsh:0,tag:'Office',route:HO},
  {id:4,when:D(60*77),from:'Home',to:'Shamirpet (weekend)',km:46.5,min:68,max:104,avg:41,kmpl:19.6,score:86,harsh:2,tag:'Personal',route:SP},
  {id:5,when:D(60*80),from:'Shamirpet',to:'Home',km:47.1,min:72,max:101,avg:39,kmpl:19.1,score:84,harsh:2,tag:'Personal',route:SP.slice().reverse()}],
 service:[{date:'2026-06-14',odo:2100,cost:0,note:'1st free service'},{date:'2026-10-02',odo:6050,cost:3150,note:'2nd service, oil + filters'}],
 fuel:[{date:'2026-11-02',odo:7890,litres:24.1,price:107},{date:'2026-11-14',odo:8180,litres:19.4,price:107},{date:'2026-11-22',odo:8390,litres:14.6,price:107}],
 docs:[{n:'Insurance',d:'2027-04-18'},{n:'PUC',d:'2027-06-14'},{n:'RC',d:'2041-06-13'}],
 alerts:[
  {t:'Tow-away alert',cat:'Security',crit:1,ev:D(260),rx:D(251),ic:'🚨',x:'Car moved with ignition off',p:1},
  {t:'Overspeed 104 km/h',cat:'Trips',ev:D(60*77+30),rx:D(60*77+28),ic:'⚠',x:'Highway limit 100',p:1},
  {t:'Trip ended',cat:'Trips',ev:D(180),rx:D(178),ic:'🏁',x:'Office, Gachibowli',p:1},
  {t:'Geofence: left Home',cat:'Geofence',ev:D(60*5+55),rx:D(60*5+53),ic:'📍',x:'Home zone',p:1},
  {t:'Low fuel',cat:'Vehicle',ev:D(60*20),rx:D(60*20-4),ic:'⛽',x:'Below 15%',p:1},
  {t:'AC idling',cat:'Vehicle',ev:D(60*28),rx:D(60*28-9),ic:'❄',x:'AC on, car stationary 12 min',p:1},
  {t:'Forgot to lock',cat:'Vehicle',ev:D(60*40),rx:D(60*40-3),ic:'🔓',x:'Doors unlocked, parked',p:0},
  {t:'Seatbelt unfastened',cat:'Vehicle',ev:D(60*52),rx:D(60*52-1),ic:'⛓',x:'While moving',p:0}],
 seenAt:D(60*5),cmdLog:[],bannerOff:false
});
let S;try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!S)S=seed();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=(s,r=document)=>r.querySelector(s);
const ago=t=>{const m=Math.round((now()-t)/60000);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':Math.round(m/1440)+' d ago'};
const clock=t=>new Date(t).toLocaleTimeString('en-IN',{hour:'numeric',minute:'2-digit'});
const dt=t=>new Date(t).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
const inr=n=>'Rs '+Math.round(n).toLocaleString('en-IN');
const litres=()=>S.settings.tank*S.car.fuelPct/100;
const range=()=>Math.round(litres()*17);
const chip=p=>`<span class="chip ${p?'parity':'concept'}">${p?'Stock':'Idea'}</span>`;
const esc=s=>String(s).replace(/"/g,'&quot;');
let activeView='home';const OPEN={};const UI={geo:true,trail:false};
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('show'),2200)}
let tripMap=null;
function closeSheet(){$('#mask').classList.remove('on');if(tripMap){tripMap.remove();tripMap=null}}
function sheet(html){$('#sheet').innerHTML=html;$('#mask').classList.add('on')}
$('#mask').onclick=e=>{if(e.target.id==='mask')closeSheet()};

/* ---------- maps: OpenStreetMap via Leaflet, no API key ---------- */
const osmLink=(la,lo,z=17)=>`https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=${z}/${la}/${lo}`;
const dirLink=(la,lo)=>`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=%3B${la}%2C${lo}`;
const geoLink=(la,lo)=>`geo:${la},${lo}?q=${la},${lo}(My%20Baleno)`;
const homeMapEl=document.createElement('div');homeMapEl.className='mapbox';homeMapEl.style.height='170px';
const bigMapEl=document.createElement('div');bigMapEl.className='mapbox';bigMapEl.style.height='340px';
let homeMap=null,bigMap=null,bigLayer=null;
function mkMap(el,o={}){
 if(!window.L){if(!el.dataset.fb){el.dataset.fb=1;el.innerHTML=`<div class="mapfail">Map library could not load (offline?).<br><a href="${osmLink(S.car.lat,S.car.lon)}" target="_blank" rel="noopener">Open in OpenStreetMap</a></div>`}return null}
 const m=L.map(el,{zoomControl:!o.mini,dragging:!o.mini,scrollWheelZoom:false,touchZoom:!o.mini,doubleClickZoom:!o.mini,boxZoom:false,keyboard:!o.mini}).setView([S.car.lat,S.car.lon],o.zoom||15);
 const tl=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}).addTo(m);
 tl.on('tileerror',()=>el.classList.add('tilefail'));
 return m;
}
const carIcon=()=>L.divIcon({html:'<div class="pin">🚗</div>',className:'',iconSize:[34,34],iconAnchor:[17,17]});
function drawBig(){
 if(!bigMap)return;if(bigLayer)bigLayer.remove();bigLayer=L.layerGroup().addTo(bigMap);
 L.marker([S.car.lat,S.car.lon],{icon:carIcon()}).addTo(bigLayer);
 if(UI.geo)S.geofences.filter(g=>g.on).forEach(g=>{L.circle([g.lat,g.lon],{radius:g.r,color:'#22d3ee',weight:2,fillOpacity:.12}).addTo(bigLayer).bindTooltip(g.n,{permanent:true,direction:'top'})});
 if(S.car.valet)L.circle([S.car.lat,S.car.lon],{radius:S.valet.radius*1000,color:'#fbbf24',weight:2,dashArray:'6',fillOpacity:.05}).addTo(bigLayer).bindTooltip('Valet radius '+S.valet.radius+' km',{direction:'top'});
 if(UI.trail){const t=S.trips[0];L.polyline(t.route,{color:'#34d399',weight:4}).addTo(bigLayer)}
}
function placeMaps(){
 const h=$('#ph-home');if(h&&homeMapEl.parentNode!==h)h.appendChild(homeMapEl);
 const b=$('#ph-map');if(b&&bigMapEl.parentNode!==b)b.appendChild(bigMapEl);
 if(!homeMap&&h){homeMap=mkMap(homeMapEl,{mini:1,zoom:15});if(homeMap)L.marker([S.car.lat,S.car.lon],{icon:carIcon()}).addTo(homeMap)}
 if(!bigMap&&b&&activeView==='map'){bigMap=mkMap(bigMapEl,{zoom:15});drawBig()}
 setTimeout(()=>{homeMap&&homeMap.invalidateSize();bigMap&&bigMap.invalidateSize()},80);
}

/* ---------- command state machine ---------- */
const cmd={};
const LBL={lock:'Door lock',hazard:'Hazard lights',alarm:'Alarm',lights:'Headlights',batt:'Battery check',immo:'Immobilizer',valet:'Valet mode',ac:'Remote AC',full:'Full health check',refresh:'Status refresh'};
function logCmd(k,res){S.cmdLog.unshift({k,res,t:now()});S.cmdLog=S.cmdLog.slice(0,8)}
function runCmd(k,apply,opts={}){
 if(S.settings.offline){cmd[k]={s:'offline'};logCmd(k,'Car offline');save();render();return}
 cmd[k]={s:'sending',t:now()};render();
 setTimeout(()=>{cmd[k]={s:'reached'};render()},900);
 if(opts.unknown)setTimeout(()=>{if(cmd[k].s==='reached'){cmd[k]={s:'slow'};render()}},1500);
 setTimeout(()=>{if(opts.unknown){cmd[k]={s:'unknown'};logCmd(k,'Could not confirm')}else{apply();S.car.seen=now();cmd[k]={s:'done',t:now()};logCmd(k,'Done')}save();render()},2200);
}
function cmdUI(k){
 const c=cmd[k];if(!c)return '';
 const m={sending:`<span class="spin"></span>Sending to car…`,reached:`<span class="spin"></span>Car reached, executing…`,done:`<span class="ok">✓ Done · ${clock(c.t||now())}</span>`,
 slow:`<span class="spin"></span><span class="warn">Taking longer than usual…</span>`,
 unknown:`<span class="warn">Couldn't confirm.</span><button class="btn ghost sm" data-refresh="${k}">Refresh status</button>`,
 offline:`<span class="bad">Car offline (no signal, e.g. basement parking). Try again when it reconnects.</span>`};
 return `<div class="cmdstate" role="status">${m[c.s]||''}</div>`;
}
const TIPS={
 lock:'Locks all doors remotely. Switching off sends "Cancel lock", the stock command.',
 hazard:'Flashes the hazard lights so you can spot the car in a crowded lot, or turns them off if left on.',
 alarm:'Sounds the buzzer to locate the car or warn people nearby.',
 lights:'The stock Baleno can only switch headlamps off remotely, not on. Read-only when already off.',
 valet:'Valet mode on your Baleno. While active, the app watches the car and alerts you if it goes beyond the limits you set. The limits here are my placeholders. Match them to the options in your real app.',
 batt:'Reads the 12 V battery voltage and health from the car.',
 immo:'Stops the engine restarting after it is switched off. Needs a police complaint (FIR) first. Use only if the car is stolen.',
 ac:'Concept. Pre-cool the cabin before you get in. Not on the stock Baleno.',
 full:'Concept. Engine and sensor check. The stock app only reports battery health.'
};
function swRow(k,label,on,txtOn,txtOff,p,o={}){
 const pend=cmd[k]&&['sending','reached','slow'].includes(cmd[k].s);
 return `<div class="rc"><div style="flex:1;min-width:0"><div class="n">${label} ${chip(p)} <button class="tipbtn" data-tip="${k}" title="${esc(TIPS[k])}" aria-label="About ${label}">i</button></div>
 <div class="d"><b class="${on?'ok':''}">${pend?'Waiting for car…':(on?txtOn:txtOff)}</b>${o.extra||''}</div><div class="tiptxt" id="tip-${k}" hidden>${TIPS[k]}</div>${cmdUI(k)}</div>
 <button class="switch ${on?'on':''}" data-cmd="${k}" role="switch" aria-checked="${on}" aria-label="${label}" ${(pend||o.disabled)?'disabled':''}></button></div>`;
}
function btnRow(k,label,verb,p,desc){
 return `<div class="rc"><div style="flex:1;min-width:0"><div class="n">${label} ${chip(p)} <button class="tipbtn" data-tip="${k}" title="${esc(TIPS[k])}" aria-label="About ${label}">i</button></div>
 <div class="d">${desc}</div><div class="tiptxt" id="tip-${k}" hidden>${TIPS[k]}</div>${cmdUI(k)}</div><button class="btn ghost sm" data-cmd="${k}">${verb}</button></div>`;
}
const det=(id,title,body)=>`<details class="card" data-d="${id}" ${OPEN[id]?'open':''}><summary>${title}</summary>${body}</details>`;

/* ---------- views ---------- */
function unreadCount(){return S.alerts.filter(a=>a.rx>S.seenAt).length}
function homeV(){
 const c=S.car,L=litres(),last=S.trips[0];
 const sv=S.service[S.service.length-1],dueKm=sv.odo+S.settings.svcKm-c.odo;
 const crit=S.alerts.filter(a=>a.crit).sort((a,b)=>b.ev-a.ev)[0];
 return `<div class="headline">${c.locked?'Parked and locked':'Parked, <span class="warn">doors unlocked</span>'} at ${c.place}.<br><span class="sub2">${Math.round(L)} L left, about ${range()} km. <span class="fresh">as of ${clock(c.seen)} (${ago(c.seen)})</span> <button class="linkbtn" data-refresh="refresh">Refresh</button></span></div>
 ${cmdUI('refresh')}
 ${c.valet?`<div class="banner valet" data-go-view="map">🔑 Valet mode is on. Alerts if the car goes over ${S.valet.speed} km/h or beyond ${S.valet.radius} km.<button class="linkbtn" data-cmd="valet">Turn off</button></div>`:''}
 ${crit&&!S.bannerOff?`<div class="banner"><span data-go-view="alerts">${crit.ic} <b>${crit.t}</b> · ${clock(crit.ev)}. Tap to review.</span><button class="linkbtn" data-dismiss="1" aria-label="Dismiss">✕</button></div>`:''}
 <div class="hero"><div class="grid3">
  <div class="cell"><div class="l">Fuel</div><div class="v">${c.fuelPct}%</div><div class="gauge"><i style="width:${c.fuelPct}%"></i></div></div>
  <div class="cell"><div class="l">Odometer</div><div class="v">${c.odo.toLocaleString('en-IN')}</div><div class="fresh">km</div></div>
  <div class="cell"><div class="l">Battery</div><div class="v ${c.battV<12?'bad':'ok'}">${c.battV} V</div><div class="fresh">OK</div></div></div></div>
 <div class="quick">
  <button class="qc ${c.locked?'on':''}" data-cmd="lock"><div class="ic">🔒</div><div class="t">${c.locked?'Locked':'Lock'}</div></button>
  <button class="qc ${c.hazard?'on':''}" data-cmd="hazard"><div class="ic">⚠</div><div class="t">Locate</div></button>
  <a class="qc" href="${dirLink(c.lat,c.lon)}" target="_blank" rel="noopener"><div class="ic">🧭</div><div class="t">Navigate</div></a>
  <button class="qc" data-go="share"><div class="ic">📤</div><div class="t">Share</div></button></div>
 <div id="homecmd">${['lock','hazard'].map(cmdUI).join('')}</div>
 <div class="card"><h3>Where it is <span class="fresh">tap map to open</span></h3><div id="ph-home" data-go-view="map"></div></div>
 <div class="card"><h3>Today</h3>
  <div class="row"><span class="k">Last trip</span><span class="v">${last.km} km, ${last.min} min</span></div>
  <div class="row"><span class="k">Next service</span><span class="v ${dueKm<500?'warn':''}">in ${dueKm.toLocaleString('en-IN')} km</span></div></div>`;
}
function mapV(){
 const c=S.car;
 return `<div class="card" style="margin-top:4px"><h3>Live location ${chip(1)}</h3><div id="ph-map"></div>
 <div class="fresh" style="margin:6px 0">Map data © OpenStreetMap contributors. No API key needed. Last seen ${clock(c.seen)} (${ago(c.seen)}).</div>
 <div class="filters"><button class="f ${UI.geo?'on':''}" data-ui="geo">Geofences</button><button class="f ${UI.trail?'on':''}" data-ui="trail">Last trip route</button></div>
 <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><a class="btn ghost sm" href="${osmLink(c.lat,c.lon)}" target="_blank" rel="noopener">Open in OpenStreetMap</a><a class="btn ghost sm" href="${dirLink(c.lat,c.lon)}" target="_blank" rel="noopener">Directions to car</a><a class="btn ghost sm" href="${geoLink(c.lat,c.lon)}">Open in maps app</a><button class="btn ghost sm" data-go="share">Share</button></div></div>
 <div class="card"><h3>Geofences ${chip(1)}</h3>${S.geofences.map(g=>`<div class="rc"><div><div class="n">${g.n}</div><div class="d">${g.r} m radius · alerts on enter and leave</div></div><button class="switch ${g.on?'on':''}" data-gf="${g.id}" role="switch" aria-checked="${g.on}" aria-label="${g.n} geofence"></button></div>`).join('')}
 <div class="fresh">Zone centres are demo positions. Real geofences are set up in the official app.</div></div>
 ${c.valet?`<div class="card"><h3>Valet radius ${chip(1)}</h3><div class="fresh">Dashed circle on the map: ${S.valet.radius} km from where the car was handed over. Speed alert above ${S.valet.speed} km/h.</div></div>`:''}
 <div class="card"><h3>Parking history</h3>${S.places.map(p=>`<div class="row"><span class="k">${p.n}</span><span class="v">${ago(p.since)}</span></div>`).join('')}</div>`;
}
function remoteV(){
 const c=S.car;
 const valetExtra=` <button class="linkbtn" data-valetset="1">Set limits (${S.valet.speed} km/h, ${S.valet.radius} km)</button>`;
 return `<div class="sec">Switches show the car's state and flip only once the car confirms. Tap the i for details.</div>
 <div class="card"><h3>Everyday</h3>${swRow('lock','Door lock',c.locked,'Locked','Unlocked',1)}${swRow('hazard','Hazard lights',c.hazard,'On','Off',1)}${swRow('lights','Headlights',c.headlights,'On (can switch off)','Off (cannot switch on remotely)',1,{disabled:!c.headlights})}</div>
 <div class="card"><h3>Security</h3>${swRow('valet','Valet mode',c.valet,'Active since '+clock(c.valetSince),'Off',1,{extra:valetExtra})}${swRow('alarm','Alarm / buzzer',c.alarm,'Sounding','Off',1)}${btnRow('immo','Immobilizer','Request',1,'Not requested. Needs an FIR.')}</div>
 <div class="card"><h3>Checks</h3>${btnRow('batt','Battery health','Check',1,'Last: '+c.battV+' V')}</div>
 ${det('ideas','Ideas lab (Concept, not on the car)',swRow('ac','Remote AC',!!c.ac,'Running','Off',0)+btnRow('full','Full health check','Run',0,'Engine and sensors'))}
 ${det('log','Recent commands',S.cmdLog.length?S.cmdLog.map(l=>`<div class="row"><span class="k">${LBL[l.k]||l.k}</span><span class="v ${l.res==='Done'?'ok':'warn'}">${l.res} · ${clock(l.t)}</span></div>`).join(''):'<div class="fresh" style="padding:6px 0">No commands yet.</div>')}
 ${det('demo','Demo controls',`<div class="row"><span class="k">Simulate car offline</span><button class="switch ${S.settings.offline?'on':''}" id="offSw" role="switch" aria-checked="${S.settings.offline}" aria-label="Simulate offline"></button></div><div class="row"><span class="k">Make next command unconfirmed</span><button class="switch ${window.__unk?'on':''}" id="unkSw" role="switch" aria-checked="${!!window.__unk}" aria-label="Simulate unconfirmed"></button></div>`)}`;
}
function tripsV(){
 const T=S.trips.slice().sort((a,b)=>b.when-a.when);
 const tot=T.reduce((a,t)=>a+t.km,0),L=T.reduce((a,t)=>a+t.km/t.kmpl,0),avg=Math.round(T.reduce((a,t)=>a+t.score,0)/T.length);
 const col=avg>=85?'var(--ok)':'var(--warn)';
 const wk=[['M',3.1],['T',4.2],['W',2.4],['T',3.8],['F',5.1],['S',7.4],['S',6.2]],mx=Math.max(...wk.map(x=>x[1]));
 const monthL=S.fuel.reduce((a,f)=>a+f.litres,0),monthRs=S.fuel.reduce((a,f)=>a+f.litres*f.price,0);
 return `<div class="card" style="margin-top:4px"><div style="display:flex;gap:14px;align-items:center"><div class="ring" style="background:conic-gradient(${col} 0 ${avg}%,var(--line) ${avg}% 100%)"><div><b>${avg}</b><span>SCORE</span></div></div>
 <div style="flex:1"><div class="row"><span class="k">Distance</span><span class="v">${tot.toFixed(1)} km</span></div><div class="row"><span class="k">Fuel ${chip(0)}</span><span class="v">${L.toFixed(1)} L, ${inr(L*S.settings.pump)}</span></div><div class="row"><span class="k">Harsh events</span><span class="v">${T.reduce((a,t)=>a+t.harsh,0)}</span></div></div></div></div>
 <div class="card"><h3>Trips <button class="btn ghost sm" id="csv">Export CSV</button></h3>${T.map(t=>`<div class="trip" data-trip="${t.id}"><div class="t1"><span>${t.from} → ${t.to}</span><span>${t.km} km</span></div>
 <div class="t2"><span>${dt(t.when)}, ${clock(t.when)}</span><span>${t.min} min</span><span>max ${t.max}</span><span>${t.kmpl} km/l</span><span>${inr(t.km/t.kmpl*S.settings.pump)}</span><button class="tag" data-tag="${t.id}">${t.tag}</button></div></div>`).join('')}<div class="fresh" style="margin-top:6px">Tap a trip for its route on the map.</div></div>
 <div class="card"><h3>Fuel use this week (L/day) ${chip(0)}</h3><div class="bars">${wk.map(([d,v])=>`<div class="bar" style="height:${v/mx*100}%"><b>${v}</b><span>${d}</span></div>`).join('')}</div>
 <div class="row"><span class="k">Fuel logged this month</span><span class="v">${monthL.toFixed(1)} L, ${inr(monthRs)}</span></div></div>`;
}
function carV(){
 const c=S.car,sv=S.service[S.service.length-1],dueKm=sv.odo+S.settings.svcKm-c.odo,dueDate=new Date(sv.date);dueDate.setMonth(dueDate.getMonth()+S.settings.svcMonths);
 const dueDays=Math.round((dueDate-now())/864e5);const days=d=>Math.round((new Date(d)-now())/864e5);
 const att=[];if(dueKm<1500||dueDays<45)att.push('Service due soon: '+dueKm.toLocaleString('en-IN')+' km or '+dueDays+' days');S.docs.forEach(d=>{const n=days(d.d);if(n<180)att.push(d.n+' expires in '+n+' days')});if(c.battV<12.2)att.push('Battery voltage low');if(c.fuelPct<S.settings.lowFuel)att.push('Fuel low');
 let eff='-';if(S.fuel.length>1){const a=S.fuel[0],b=S.fuel[S.fuel.length-1];const L=S.fuel.slice(1).reduce((x,f)=>x+f.litres,0);eff=((b.odo-a.odo)/L).toFixed(1)+' km/l'}
 return `<div class="card" style="margin-top:4px"><h3>Needs attention</h3>${att.length?att.map(a=>`<div class="row"><span class="warn">● ${a}</span></div>`).join(''):'<div class="ok">All good.</div>'}</div>
 <div class="card"><h3>Health</h3><div class="row"><span class="k">12 V battery ${chip(1)}</span><span class="v ok">${c.battV} V, OK</span></div>
 <div class="row"><span class="k">Service due ${chip(0)}</span><span class="v">${dueKm.toLocaleString('en-IN')} km or ${dueDays} days</span></div></div>
 <div class="card"><h3>Service wallet ${chip(0)}</h3>${S.service.slice().reverse().map(s=>`<div class="row"><span class="k">${s.date} · ${s.odo.toLocaleString('en-IN')} km<br><small>${s.note}</small></span><span class="v">${inr(s.cost)}</span></div>`).join('')}
 ${det('addsvc','Add a service','<div class="form"><input id="sd" type="date" aria-label="Service date"><input id="so" type="number" placeholder="Odometer km" aria-label="Odometer"><input id="sc" type="number" placeholder="Cost Rs" aria-label="Cost"><input id="sn" placeholder="Note" aria-label="Note"></div><button class="btn" id="addSvc" style="margin-top:8px">Add service</button>')}</div>
 <div class="card"><h3>Fuel log ${chip(0)}</h3><div class="row"><span class="k">Average since first fill</span><span class="v">${eff}</span></div>
 ${S.fuel.slice().reverse().map(f=>`<div class="row"><span class="k">${f.date} · ${f.odo.toLocaleString('en-IN')} km</span><span class="v">${f.litres} L, ${inr(f.litres*f.price)}</span></div>`).join('')}
 ${det('addfuel','Add a refuel','<div class="form"><input id="fo" type="number" placeholder="Odometer km" aria-label="Fuel odometer"><input id="fl" type="number" step="0.1" placeholder="Litres" aria-label="Litres"></div><button class="btn" id="addFuel" style="margin-top:8px">Add refuel</button>')}</div>
 <div class="card"><h3>Documents ${chip(0)}</h3>${S.docs.map(d=>{const n=days(d.d);return `<div class="row"><span class="k">${d.n}</span><span class="v ${n<180?'warn':''}">${n>400?Math.round(n/365)+' yrs':n+' days'} · ${dt(d.d)}</span></div>`}).join('')}</div>`;
}
let alertFilter='All';
function alertsV(){
 const F=['All','Security','Geofence','Vehicle','Trips'];
 const a=S.alerts.slice().sort((x,y)=>y.ev-x.ev).filter(x=>alertFilter==='All'||x.cat===alertFilter);
 const late=x=>{const m=Math.round((x.rx-x.ev)/60000);return m>=3?' · delivered '+m+' min late':''};
 const grp=(title,list)=>list.length?`<div class="gh">${title}</div><div class="card" style="margin-top:4px">${list.map(x=>`<div class="alert"><div class="ic">${x.ic}</div><div><b>${x.t}</b> ${chip(x.p)}<div class="fresh">${x.x}</div><div class="tm">Happened ${clock(x.ev)} · received ${clock(x.rx)}${late(x)}</div></div></div>`).join('')}</div>`:'';
 return `<div style="display:flex;align-items:center;gap:10px;margin:2px 0 6px"><button class="iconbtn" data-go-view="home" aria-label="Back">←</button><b style="font-size:16px">Alerts</b></div>
 <div class="filters">${F.map(f=>`<button class="f ${f===alertFilter?'on':''}" data-f="${f}">${f}</button>`).join('')}</div>
 ${grp('Critical',a.filter(x=>x.crit))}${grp('Last 24 hours',a.filter(x=>!x.crit&&now()-x.ev<864e5))}${grp('Older',a.filter(x=>!x.crit&&now()-x.ev>=864e5))}
 ${det('thr','Alert limits '+chip(0),`<div class="form"><div><div class="fresh">Overspeed city</div><input id="t1" type="number" value="${S.settings.overCity}"></div><div><div class="fresh">Overspeed highway</div><input id="t2" type="number" value="${S.settings.overHwy}"></div><div><div class="fresh">Low fuel %</div><input id="t3" type="number" value="${S.settings.lowFuel}"></div><div><div class="fresh">Time fence</div><input value="22:00 to 06:00" disabled></div></div><button class="btn" id="saveT" style="margin-top:10px">Save limits</button>`)}`;
}
function render(){
 $('#v-home').innerHTML=homeV();$('#v-map').innerHTML=mapV()+'<div class="gh">Trips</div>'+tripsV();$('#v-incar').innerHTML=incarV();$('#v-remote').innerHTML=remoteV();$('#v-car').innerHTML=carV();$('#v-alerts').innerHTML=alertsV();
 $('#carName').textContent=S.settings.carName||'My car';$('#reg').textContent=[S.settings.reg,PR.name].filter(Boolean).join(' · ');
 $('#netdot').className='dot'+(S.settings.offline?' off':'');$('#nettxt').textContent=S.settings.offline?'Offline':'Online';
 document.body.classList.toggle('light',S.settings.theme==='light');$('#themeBtn').textContent=S.settings.theme==='light'?'☀':'☾';
 const u=unreadCount();const bd=$('#bellBadge');bd.textContent=u;bd.style.display=u?'flex':'none';
 placeMaps();if(bigMap)drawBig();
}
function showView(v){
 activeView=v;document.querySelectorAll('.view').forEach(x=>x.classList.toggle('on',x.id==='v-'+v));
 document.querySelectorAll('#nav button').forEach(x=>x.classList.toggle('on',x.dataset.v===v));
 if(v==='alerts'){S.seenAt=now();save()}
 $('#main').scrollTop=0;render();
}

/* ---------- In-car tab: replaces Smartplay Pro (Bluetooth remote) and Smartplay Pro Sync (updates) ---------- */
const PRESETS=['91.1','92.7','93.5','94.3','98.3','104.8'];
function huInit(){if(!S.hu)S.hu={conn:false,src:'FM',playing:true,vol:12,freq:'93.5',bright:70,beep:true,ver:'1.0.4',upd:null,uStage:'idle',uPct:0,lastCheck:0}}
const HUT={};let huTimer=null;
function huNeed(){toast('Connect to the head unit first (be near the car)');return false}
function incarV(){
 huInit();const h=S.hu,c=h.conn;
 const conn=`<div class="card" style="margin-top:4px"><h3>Head unit ${chip(1)}</h3>
  <div class="rc"><div><div class="n">${c?'Connected':'Not connected'}</div><div class="d">${c?'Bluetooth link to the car screen (demo)':HUT.connecting?'<span class="spin"></span> Searching nearby…':'Works only when you are near the car, Bluetooth on'}</div></div>
  <button class="btn ${c?'ghost':''} sm" data-hu="${c?'disc':'conn'}">${c?'Disconnect':'Connect'}</button></div></div>`;
 const srcs=['FM','Bluetooth','USB'].map(s=>`<button class="${h.src===s?'on':''}" data-src="${s}" ${c?'':'disabled'}>${s}</button>`).join('');
 const now=h.src==='FM'?`FM ${h.freq} MHz`:h.src==='Bluetooth'?'Phone audio over Bluetooth':'USB, track 4 of 28';
 const media=`<div class="card ${c?'':'dim'}"><h3>Audio ${chip(1)}</h3><div class="seg" role="radiogroup" aria-label="Audio source">${srcs}</div>
  <div class="np"><div class="npt">${now}</div><div class="fresh">${h.playing?'Playing':'Paused'}</div></div>
  <div class="ctrls"><button class="iconbtn big" data-hu="prev" aria-label="Previous" ${c?'':'disabled'}>⏮</button><button class="iconbtn big play" data-hu="play" aria-label="${h.playing?'Pause':'Play'}" ${c?'':'disabled'}>${h.playing?'⏸':'▶'}</button><button class="iconbtn big" data-hu="next" aria-label="Next" ${c?'':'disabled'}>⏭</button></div>
  <div class="row"><span class="k">Volume</span><input type="range" min="0" max="40" value="${h.vol}" data-huvol="1" aria-label="Volume" style="width:60%;padding:0" ${c?'':'disabled'}><b style="width:24px;text-align:right">${h.vol}</b></div>
  ${h.src==='FM'?`<div class="gh">FM presets</div><div class="filters" style="flex-wrap:wrap;overflow:visible">${PRESETS.map(p=>`<button class="f ${h.freq===p?'on':''}" data-freq="${p}" ${c?'':'disabled'}>${p}</button>`).join('')}</div>`:''}</div>`;
 const info=`<div class="card ${c?'':'dim'}"><h3>Vehicle info from the car screen ${chip(1)}</h3>
  <div class="row"><span class="k">Average economy</span><span class="v">${c?'15.8 km/l':'-'}</span></div>
  <div class="row"><span class="k">Range</span><span class="v">${c?range()+' km':'-'}</span></div>
  <div class="row"><span class="k">Trip A</span><span class="v">${c?'312.4 km':'-'}</span></div><div class="fresh">Read only. Cloud data on Home works from anywhere; this reads straight from the car when nearby.</div></div>`;
 const hs=`<div class="card ${c?'':'dim'}"><h3>Screen settings ${chip(1)}</h3>
  <div class="row"><span class="k">Display brightness</span><input type="range" min="10" max="100" value="${h.bright}" data-hubr="1" aria-label="Brightness" style="width:50%;padding:0" ${c?'':'disabled'}><b style="width:34px;text-align:right">${h.bright}%</b></div>
  <div class="row"><span class="k">Touch beep</span><button class="switch ${h.beep?'on':''}" data-hu="beep" role="switch" aria-checked="${h.beep}" aria-label="Touch beep" ${c?'':'disabled'}></button></div>
  <div class="fresh">Which settings the car exposes over Bluetooth is not confirmed yet; these two are placeholders.</div></div>`;
 const st=h.uStage;
 const bar=p=>`<div class="gauge" style="height:8px;margin:8px 0"><i style="width:${p}%;background:var(--acc)"></i></div>`;
 const u={idle:`<div class="row"><span class="k">Last checked</span><span class="v">${h.lastCheck?ago(h.lastCheck):'never'}</span></div><button class="btn" data-up="check">Check for update</button>`,
  checking:`<div class="cmdstate"><span class="spin"></span>Asking the car and the update server…</div>`,
  none:`<div class="ok" style="margin:6px 0">You're on the latest version.</div><button class="btn ghost" data-up="check">Check again</button>`,
  avail:`<div style="margin:6px 0"><b>Version ${h.upd} available</b> · 420 MB</div><div class="fresh">Download on home Wi-Fi first. Sending to the car needs you near it.</div><button class="btn" data-up="dl" style="margin-top:8px">Download to phone</button>`,
  dl:`<div class="fresh">Downloading to phone… ${h.uPct}%</div>${bar(h.uPct)}`,
  ready:`<div class="ok">Downloaded. Ready to send.</div><div class="fresh">Start the engine, park, and connect to the car's Wi-Fi and Bluetooth.</div><button class="btn" data-up="send" style="margin-top:8px">Send to car</button>`,
  send:`<div class="fresh">Sending to car… ${h.uPct}%</div>${bar(h.uPct)}<div class="warn" style="font-size:12px">Keep the engine running and stay near the car.</div>`,
  install:`<div class="warn" style="margin:6px 0">Finish on the car screen: accept the install prompt and don't switch off until it restarts.</div><button class="btn" data-up="done">It finished installing</button>`};
 const upd=`<div class="card"><h3>Software update ${chip(1)}</h3><div class="row"><span class="k">Car screen version</span><span class="v">${h.ver}</span></div>${u[st]||u.idle}
  <details class="card" style="margin-top:10px;background:var(--panel2)"><summary>Update by USB instead</summary><div class="fresh" style="line-height:1.55;margin-top:6px">1. Download the update file from the official source to your computer.<br>2. Copy it to an empty USB stick as instructed by the official notes.<br>3. Start the engine, plug the stick into the car, follow the prompt on screen.<br>4. Don't switch off until the screen restarts.</div></details></div>`;
 const real=`<div class="card"><h3>Status of this tab</h3><p class="fresh" style="line-height:1.5">Demo. The head unit's Bluetooth and Wi-Fi protocols are not captured yet, so nothing here talks to a real car. The update flow is the riskiest part: a broken transfer can brick the screen, so the real version will only hand files to the car's own installer.</p></div>`;
 return conn+media+info+hs+upd+real;
}
function upTick(stage,next,ms){const h=S.hu;h.uStage=stage;h.uPct=0;clearInterval(huTimer);huTimer=setInterval(()=>{h.uPct=Math.min(100,h.uPct+10);if(h.uPct>=100){clearInterval(huTimer);h.uStage=next}save();if(activeView==='incar')render()},ms)}
document.addEventListener('click',e=>{
 const t=e.target;let b;huInit();const h=S.hu;
 if(b=t.closest('[data-hu]')){const a=b.dataset.hu;
  if(a==='conn'){HUT.connecting=true;render();setTimeout(()=>{HUT.connecting=false;h.conn=true;save();render();toast('Connected to head unit (demo)')},1400);return}
  if(a==='disc'){h.conn=false;save();render();return}
  if(!h.conn)return huNeed();
  if(a==='play')h.playing=!h.playing;
  if(a==='beep')h.beep=!h.beep;
  if(a==='next'||a==='prev'){if(h.src==='FM'){const i=PRESETS.indexOf(h.freq);h.freq=PRESETS[(i+(a==='next'?1:PRESETS.length-1))%PRESETS.length]}else toast(a==='next'?'Next track':'Previous track')}
  save();render();return}
 if(b=t.closest('[data-src]')){h.src=b.dataset.src;save();render();return}
 if(b=t.closest('[data-freq]')){h.freq=b.dataset.freq;h.playing=true;save();render();return}
 if(b=t.closest('[data-up]')){const a=b.dataset.up;
  if(a==='check'){if(!h.conn)return huNeed();h.uStage='checking';render();setTimeout(()=>{h.lastCheck=now();if(h.ver==='1.0.4'){h.upd='1.1.0';h.uStage='avail'}else h.uStage='none';save();render()},1500);return}
  if(a==='dl'){upTick('dl','ready',250);render();return}
  if(a==='send'){if(!h.conn)return huNeed();upTick('send','install',300);render();return}
  if(a==='done'){h.ver=h.upd;h.upd=null;h.uStage='none';save();render();toast('Car screen updated to '+h.ver);return}
 }
});
document.addEventListener('input',e=>{const t=e.target;huInit();
 if(t.matches&&t.matches('[data-huvol]')){S.hu.vol=+t.value;t.nextElementSibling.textContent=t.value;save()}
 if(t.matches&&t.matches('[data-hubr]')){S.hu.bright=+t.value;t.nextElementSibling.textContent=t.value+'%';save()}});

/* ---------- account settings ---------- */
function settingsSheet(){
 const p=DP.profile()||{};
 sheet(`<h2>Account</h2><p>${esc(p.name||'')} · ${esc(p.phoneFmt||'')}${p.vin?'<br>VIN '+esc(p.vin):''}<br><span class="fresh">Signed in with mobile OTP on this phone only. No cloud sync yet.</span></p>
 <div class="form"><div><div class="fresh">Car name</div><input id="scar" value="${esc(S.settings.carName||'')}"></div><div><div class="fresh">Registration</div><input id="sreg" value="${esc(S.settings.reg)}"></div><div><div class="fresh">Petrol Rs/L</div><input id="spump" type="number" value="${S.settings.pump}"></div><div><div class="fresh">Service every km</div><input id="ssk" type="number" value="${S.settings.svcKm}"></div></div>
 <button class="btn" id="saveS2" style="margin-top:10px">Save</button>
 <p class="fresh" style="margin-top:10px">Maps by OpenStreetMap, no API key. Independent app, not made by or linked to any car maker.</p>
 <button class="btn ghost" id="signOut">Sign out</button>
 <button class="btn ghost" style="margin-top:8px" id="reset">Reset demo data</button>
 <button class="btn ghost" style="margin-top:8px;color:var(--bad)" id="delAcc">Delete account from this device</button>`);
}
document.addEventListener('click',async e=>{const t=e.target;
 if(t.closest('#saveS2')){S.settings.carName=$('#scar').value||'My car';S.settings.reg=$('#sreg').value;DP.updateProfile({car:S.settings.carName,reg:S.settings.reg});S.settings.pump=+$('#spump').value||107;S.settings.svcKm=+$('#ssk').value||10000;save();closeSheet();render();toast('Saved');return}
 if(t.closest('#signOut')){DP.signOut();return}
 if(t.closest('#delAcc')){if(confirm('Delete this account and all its data from this device?'))DP.deleteAccount();return}
});

/* ---------- actions and handlers ---------- */
const actions={
 lock:()=>{S.car.locked=!S.car.locked},hazard:()=>{S.car.hazard=!S.car.hazard},alarm:()=>{S.car.alarm=!S.car.alarm},lights:()=>{S.car.headlights=false},
 batt:()=>{S.car.battV=+(12.4+Math.random()*.4).toFixed(1)},immo:()=>{},ac:()=>{S.car.ac=!S.car.ac},full:()=>{},refresh:()=>{},
 valet:()=>{const on=!S.car.valet;S.car.valet=on;S.car.valetSince=on?now():0;S.alerts.unshift({t:'Valet mode '+(on?'on':'off'),cat:'Security',ev:now(),rx:now(),ic:'🔑',x:on?'Watching speed above '+S.valet.speed+' km/h and radius '+S.valet.radius+' km':'Valet monitoring ended',p:1})}
};
function go(k){
 if(k==='immo'){sheet(`<h2>Immobilizer request</h2><p>This prevents the engine restarting after it is switched off. A police complaint (FIR) must be registered before the request is accepted. Use it only if the car is stolen.</p><button class="btn" id="immoGo">I have an FIR, continue</button><button class="btn ghost" style="margin-top:8px" id="immoNo">Cancel</button>`);return}
 const u=window.__unk;runCmd(k,actions[k]||(()=>{}),{unknown:u});if(u)window.__unk=false;
}
function openTrip(id){
 const tr=S.trips.find(x=>x.id==id);
 sheet(`<h2>${tr.from} → ${tr.to}</h2><p>${dt(tr.when)} · ${tr.km} km · ${tr.min} min · avg ${tr.avg}, max ${tr.max} km/h · score ${tr.score} · ${tr.harsh} harsh events ${chip(0)}<br>Route is illustrative, not the real road path.</p><div id="tripMapEl" class="mapbox" style="height:210px"></div><button class="btn ghost" style="margin-top:12px" id="immoNo">Close</button>`);
 setTimeout(()=>{const el=$('#tripMapEl');if(!el)return;if(tripMap){tripMap.remove();tripMap=null}
  tripMap=mkMap(el,{zoom:12});if(tripMap){const pl=L.polyline(tr.route,{color:'#22d3ee',weight:5}).addTo(tripMap);L.circleMarker(tr.route[0],{radius:7,color:'#34d399',fillOpacity:1}).addTo(tripMap);L.circleMarker(tr.route[tr.route.length-1],{radius:7,color:'#f87171',fillOpacity:1}).addTo(tripMap);tripMap.fitBounds(pl.getBounds(),{padding:[20,20]})}},60);
}
document.addEventListener('toggle',e=>{const d=e.target.closest&&e.target.closest('details[data-d]');if(d)OPEN[d.dataset.d]=d.open},true);
document.addEventListener('click',e=>{
 const t=e.target;let b;
 if(b=t.closest('[data-tip]')){const x=document.getElementById('tip-'+b.dataset.tip);if(x)x.hidden=!x.hidden;return}
 if(b=t.closest('[data-refresh]')){const k=b.dataset.refresh;if(k==='refresh'){runCmd('refresh',()=>{});return}cmd[k]={s:'sending'};render();setTimeout(()=>{S.car.seen=now();cmd[k]={s:'done',t:now()};save();render();toast('Status refreshed')},1200);return}
 if(t.closest('[data-dismiss]')){S.bannerOff=true;save();render();return}
 if(b=t.closest('[data-valetset]')){sheet(`<h2>Valet limits</h2><p>Alerts you if the car goes faster than the speed or farther than the radius while valet mode is on. These two limits are my placeholders. Check which options your car's valet mode really offers.</p><div class="form"><div><div class="fresh">Speed alert km/h</div><input id="vs" type="number" value="${S.valet.speed}"></div><div><div class="fresh">Radius km</div><input id="vr" type="number" step="0.5" value="${S.valet.radius}"></div></div><button class="btn" id="saveValet" style="margin-top:10px">Save</button>`);return}
 if(t.closest('#saveValet')){S.valet.speed=+$('#vs').value||40;S.valet.radius=+$('#vr').value||2;save();closeSheet();render();toast('Valet limits saved');return}
 if(b=t.closest('[data-cmd]')){go(b.dataset.cmd);return}
 if(b=t.closest('[data-go]')){if(b.dataset.go==='share'){const txt='My Baleno is at '+S.car.place+': '+osmLink(S.car.lat,S.car.lon);if(navigator.share)navigator.share({title:'Car location',text:txt}).catch(()=>{});else{navigator.clipboard&&navigator.clipboard.writeText(txt);toast('Location link copied')}}return}
 if(b=t.closest('[data-go-view]')){showView(b.dataset.goView);return}
 if(t.closest('#immoGo')){closeSheet();runCmd('immo',()=>{});return}
 if(t.closest('#immoNo')){closeSheet();return}
 if(b=t.closest('#nav button')){showView(b.dataset.v);return}
 if(t.closest('#bellBtn')){showView('alerts');return}
 if(t.closest('#themeBtn')){S.settings.theme=S.settings.theme==='light'?'dark':'light';save();render();return}
 if(t.closest('#offSw')){S.settings.offline=!S.settings.offline;save();render();return}
 if(t.closest('#unkSw')){window.__unk=!window.__unk;render();return}
 if(b=t.closest('[data-ui]')){UI[b.dataset.ui]=!UI[b.dataset.ui];render();return}
 if(b=t.closest('[data-gf]')){const g=S.geofences.find(x=>x.id==b.dataset.gf);g.on=!g.on;save();render();return}
 if(b=t.closest('[data-f]')){alertFilter=b.dataset.f;render();return}
 if(b=t.closest('[data-tag]')){const tr=S.trips.find(x=>x.id==b.dataset.tag);tr.tag=tr.tag==='Office'?'Personal':'Office';save();render();return}
 if(b=t.closest('[data-trip]')){openTrip(b.dataset.trip);return}
 if(t.closest('#csv')){const h='date,from,to,km,min,max_kmh,kmpl,cost_rs,purpose\n'+S.trips.map(x=>[new Date(x.when).toISOString().slice(0,10),x.from,x.to,x.km,x.min,x.max,x.kmpl,Math.round(x.km/x.kmpl*S.settings.pump),x.tag].map(v=>`"${v}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h],{type:'text/csv'}));a.download='trips.csv';a.click();toast('CSV downloaded');return}
 if(t.closest('#addSvc')){const d=$('#sd').value,o=+$('#so').value,c=+$('#sc').value;if(!d||!o){toast('Add date and odometer');return}S.service.push({date:d,odo:o,cost:c||0,note:$('#sn').value||'Service'});save();render();toast('Service added');return}
 if(t.closest('#addFuel')){const o=+$('#fo').value,l=+$('#fl').value;if(!o||!l){toast('Add odometer and litres');return}S.fuel.push({date:new Date().toISOString().slice(0,10),odo:o,litres:l,price:S.settings.pump});S.car.odo=Math.max(S.car.odo,o);save();render();toast('Refuel added');return}
 if(t.closest('#saveT')){S.settings.overCity=+$('#t1').value;S.settings.overHwy=+$('#t2').value;S.settings.lowFuel=+$('#t3').value;save();toast('Limits saved');return}
 if(t.closest('#setBtn')){settingsSheet();return;sheet(`<h2>Settings</h2><div class="form"><div><div class="fresh">Registration</div><input id="sreg" value="${esc(S.settings.reg)}"></div><div><div class="fresh">Petrol Rs/L</div><input id="spump" type="number" value="${S.settings.pump}"></div><div><div class="fresh">Service km</div><input id="ssk" type="number" value="${S.settings.svcKm}"></div><div><div class="fresh">Service months</div><input id="ssm" type="number" value="${S.settings.svcMonths}"></div></div><p style="margin-top:10px">Maps: OpenStreetMap through Leaflet, no API key. Tiles load from tile.openstreetmap.org, so keep usage light. Check the pump price before relying on cost figures.</p><button class="btn" id="saveS">Save</button><button class="btn ghost" style="margin-top:8px" id="reset">Reset demo data</button>`);return}
 if(t.closest('#saveS')){S.settings.reg=$('#sreg').value;S.settings.pump=+$('#spump').value||107;S.settings.svcKm=+$('#ssk').value||10000;S.settings.svcMonths=+$('#ssm').value||12;save();closeSheet();render();toast('Saved');return}
 if(t.closest('#reset')){localStorage.removeItem(KEY);S=seed();closeSheet();render();toast('Demo data reset');return}
});
huInit();render();
setInterval(()=>{if(!document.hidden&&!/INPUT|SELECT/.test(document.activeElement.tagName)&&!$('#mask.on'))render()},60000);

}
if(window.DP&&DP.user)startApp();
if('serviceWorker' in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('sw.js').catch(()=>{});