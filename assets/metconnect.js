/* MetConnect client runtime: Supabase Realtime + WebRTC */
(function(){
'use strict';
if(window.__metconnectCodeLoaded)return;window.__metconnectCodeLoaded=true;
const MC=window.__metconnect={setup:false,currentTab:'contacts',contacts:[],selected:null,active:null,incoming:null,peer:null,local:null,screen:null,remote:null,ice:[],signals:null,incomingChannel:null,messageChannel:null,audio:null,ring:null,ringTimer:null,timeout:null,busy:false,held:false,mic:true,cam:true,speaker:null};
const labels={talk:'Talk',screen:'Share Screen Call',voice:'Voice Call',video:'Video Call'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const person=id=>MC.contacts.find(x=>x.contact_id===id)||null;
function status(s,bad){const e=document.getElementById('mc-status');if(e){e.textContent=s||'';e.style.color=bad?'#ffaaaa':'#a8c3d8';}else if(s&&typeof toast==='function')toast(s,bad?'error':'success');}
function appMarkup(){return '<style>'+
'.mc{background:#071320;color:#eef7ff;border:1px solid #29445b;border-radius:15px;min-height:540px;overflow:hidden}.mc-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 17px;background:#0b1b2b;border-bottom:1px solid #29465d;flex-wrap:wrap}.mc-brand{display:flex;align-items:center;gap:10px}.mc-logo{width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#51dfbd,#6bbdff);display:grid;place-items:center;color:#06131d;box-shadow:0 0 22px #4fdac455}.mc-logo svg{width:27px;height:27px;display:block}.mc-brand strong{display:block;font-size:18px}.mc-brand small{color:#9eb5ca}.mc-btn{border:1px solid #34536b;border-radius:10px;background:#142d42;color:#edf7ff;padding:9px 12px;font-weight:750}.mc-btn.primary{background:linear-gradient(110deg,#087d70,#176eaa);border-color:#37c9b4}.mc-btn.danger{background:#482231;border-color:#804357}.mc-btn:disabled{opacity:.42}.mc-hidden{display:none!important}.mc-setup{max-width:760px;margin:24px auto;padding:clamp(18px,4vw,32px);border:1px solid #35546b;border-radius:20px;background:linear-gradient(145deg,#112d43,#151d30)}.mc-setup h2{font-size:clamp(25px,4vw,36px);margin:8px 0}.mc-setup p,.mc-note{color:#acc1d3;line-height:1.55}.mc-perms{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:18px 0}.mc-perm{background:#0b1e2d;border:1px solid #2b4a62;border-radius:13px;padding:12px}.mc-perm b{display:block;margin:6px 0}.mc-perm small{color:#9bb3c8}.mc-actions{display:flex;gap:7px;flex-wrap:wrap}.mc-note{font-size:12px;margin-top:11px}.mc-menu{display:flex;gap:7px;overflow-x:auto;padding:10px 12px;background:#091a29;border-bottom:1px solid #294157}.mc-menu button{white-space:nowrap;border:1px solid #2c4a60;background:#10283a;color:#ddecf8;border-radius:10px;padding:10px 13px;font-weight:750}.mc-menu button.active{border-color:#45ccb8;background:#144557}.mc-grid{display:grid;grid-template-columns:minmax(210px,300px) minmax(0,1fr);gap:11px;padding:12px}.mc-panel{min-width:0;border:1px solid #294358;border-radius:14px;background:#0a1927;overflow:hidden}.mc-head{display:flex;align-items:center;justify-content:space-between;gap:7px;padding:11px;border-bottom:1px solid #263d50}.mc-body{padding:11px}.mc-form{display:flex;gap:7px;margin-bottom:10px}.mc-input{min-width:0;flex:1;background:#06121d;border:1px solid #2d4a60;color:#fff;border-radius:10px;padding:11px}.mc-contacts{display:grid;gap:7px;max-height:420px;overflow:auto}.mc-person{width:100%;display:flex;justify-content:space-between;gap:8px;text-align:left;padding:10px;border-radius:10px;border:1px solid #29445a;background:#0d2030;color:#eff7ff}.mc-person.active{border-color:#48cbb7;background:#124052}.mc-person small{display:block;color:#9ab1c5}.mc-chat{display:flex;flex-direction:column;min-height:450px}.mc-messages{flex:1;min-height:220px;max-height:470px;overflow:auto;padding:11px;display:flex;flex-direction:column;gap:8px}.mc-bubble{max-width:84%;background:#112b40;border:1px solid #2a4a63;border-radius:13px;padding:10px 12px;overflow-wrap:anywhere;white-space:pre-wrap}.mc-bubble.mine{align-self:flex-end;background:#12483f;border-color:#31796b}.mc-bubble small{display:block;color:#9eb4c8;font-size:10px;margin-top:5px}.mc-send{display:flex;gap:7px;padding:10px;border-top:1px solid #294157}.mc-empty{display:grid;place-items:center;text-align:center;color:#91aabf;padding:28px 12px}.mc-global{position:fixed;inset:0;z-index:1000000;pointer-events:none}.mc-modalwrap,.mc-stagewrap{position:absolute;inset:0;pointer-events:auto;display:flex;align-items:center;justify-content:center;padding:12px;background:#020912dd}.mc-modal{width:min(520px,100%);padding:22px;border-radius:20px;border:1px solid #42617a;background:linear-gradient(150deg,#112e44,#131b2d);text-align:center;box-shadow:0 22px 80px #000a}.mc-callicon{width:62px;height:62px;margin:0 auto 11px;border-radius:50%;display:grid;place-items:center;background:#154358;color:#6ce3d0;font-size:27px}.mc-stage{width:min(1050px,100%);height:min(820px,100%);display:flex;flex-direction:column;border:1px solid #36566e;border-radius:17px;background:#071421;overflow:hidden}.mc-stagehead{display:flex;justify-content:space-between;gap:8px;padding:13px;border-bottom:1px solid #294459}.mc-videos{flex:1;min-height:190px;position:relative;display:grid;place-items:center;background:#020910}.mc-remote{width:100%;height:100%;max-height:650px;object-fit:contain}.mc-local{position:absolute;right:12px;bottom:12px;width:min(27%,220px);aspect-ratio:4/3;object-fit:cover;background:#0d2030;border:1px solid #7892a8;border-radius:12px}.mc-audio{text-align:center;color:#bfd1e0;padding:40px}.mc-stageactions{display:flex;justify-content:center;gap:7px;flex-wrap:wrap;padding:12px;background:#0b1b29;border-top:1px solid #2b455a}.mc-stageactions button{min-width:70px}.mc-stage-status{text-align:center;color:#a9bfd1;font-size:12px;padding:0 12px 10px}@media(max-width:760px){.mc-perms{grid-template-columns:1fr}.mc-grid{grid-template-columns:1fr}.mc-contacts{max-height:210px}.mc-chat{min-height:380px}.mc-stage{height:100%;border-radius:10px}.mc-local{width:34%;right:7px;bottom:7px}}'+
'</style><div class="mc" id="mc-root"><header class="mc-top"><div class="mc-brand"><div class="mc-logo" aria-label="MetConnect"><svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><path d="M10 25.5c0-8.2 6.3-14.5 14-14.5s14 6.3 14 14.5-6.3 14-14 14S10 33.7 10 25.5Z" stroke="#06131d" stroke-width="3"/><path d="M16 25h5l3-7 4.5 14 3-7H36" stroke="#06131d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="25" r="3" fill="#06131d"/><circle cx="38" cy="25" r="3" fill="#06131d"/></svg></div><div><strong>MetConnect</strong><small>Private messages and calls · Metxon account</small></div></div><div class="mc-actions"><button class="mc-btn" id="mc-notify" type="button">Enable notifications</button><button class="mc-btn" id="mc-refresh" type="button">Refresh</button></div></header>'+
'<section id="mc-setup" class="mc-setup mc-hidden"><div class="eyebrow">METCONNECT SETUP</div><h2>Stay connected to everyone.</h2><p>Save Metxon usernames to message or call people who have installed MetConnect. Contacts are private. You can remove, block or report a user.</p><div class="mc-perms"><div class="mc-perm">🎙️<b>Microphone permission</b><small id="mc-mic-state">Not requested</small></div><div class="mc-perm">📷<b>Camera permission</b><small id="mc-cam-state">Not requested</small></div><div class="mc-perm">🔔<b>Speaker for ringing</b><small id="mc-speaker-state">Device default</small></div><div class="mc-perm">📣<b>Notifications</b><small id="mc-notify-state">Not enabled</small></div></div><div class="mc-actions"><button class="mc-btn primary" id="mc-permissions">Allow microphone and camera</button><button class="mc-btn" id="mc-speaker">Choose speaker</button><button class="mc-btn" id="mc-notify-setup">Enable notifications</button><button class="mc-btn" id="mc-continue">Continue</button></div><p class="mc-note">Browsers do not have a special speaker permission. Supported browsers can show an audio-output selector; otherwise the device speaker or headset is used. Camera and microphone are requested only after you press Allow. Notifications are optional and can be changed in browser site settings.</p><div class="mc-note" id="mc-setup-status" role="status"></div></section>'+
'<section id="mc-main" class="mc-hidden"><nav class="mc-menu"><button type="button" class="active" data-tab="contacts">Saved Usernames</button><button type="button" data-tab="talk">Talk</button><button type="button" data-tab="screen">Share Screen Call</button><button type="button" data-tab="voice">Voice Call</button><button type="button" data-tab="video">Video Call</button></nav><div id="mc-tab-help" class="mc-note" style="padding:10px 14px;margin:0;background:#091a29;border-bottom:1px solid #294157">Choose a saved username to view messages.</div><div class="mc-grid"><aside class="mc-panel"><div class="mc-head"><b>Saved Usernames</b><span class="pill" id="mc-count">0</span></div><div class="mc-body"><form id="mc-add" class="mc-form"><input class="mc-input" id="mc-username" placeholder="Metxon username" maxlength="80" required><button class="mc-btn primary">Add</button></form><div id="mc-contacts" class="mc-contacts"><div class="mc-empty">Loading usernames…</div></div></div></aside><section class="mc-panel mc-chat"><div class="mc-head"><div><b id="mc-title">Choose a username</b><small id="mc-subtitle" style="display:block;color:#9bb3c8">Save a contact to start texting</small></div><div class="mc-actions"><button class="mc-btn" id="mc-remove" disabled>Remove</button><button class="mc-btn danger" id="mc-block" disabled>Block</button><button class="mc-btn" id="mc-report" disabled>Report</button></div></div><div id="mc-messages" class="mc-messages"><div class="mc-empty">Your private messages appear here.</div></div><form id="mc-send" class="mc-send"><input id="mc-text" class="mc-input" placeholder="Write a message…" maxlength="4000" disabled><button class="mc-btn primary" id="mc-send-btn" disabled>Send</button></form><div style="padding:0 11px 9px"><small id="mc-status" role="status" style="color:#a8c3d8">MetConnect ready.</small></div><div class="mc-body"><div class="mc-actions"><button class="mc-btn" data-call="screen" disabled>Start Share Screen Call</button><button class="mc-btn" data-call="voice" disabled>Start Voice Call</button><button class="mc-btn" data-call="video" disabled>Start Video Call</button></div><p class="mc-note">A screen call starts screen sharing for the caller. After answering, the other person can hold or share their own screen.</p></div></section></div></section></div>';
}
function ensureLayer(){
if(document.getElementById('mc-global'))return;
const el=document.createElement('div');el.id='mc-global';el.className='mc-global';
el.innerHTML='<section class="mc-modalwrap mc-hidden" id="mc-incoming" aria-live="assertive"><div class="mc-modal"><div class="mc-callicon">◉</div><small>INCOMING METCONNECT CALL</small><h2 id="mc-in-name">Metxon user</h2><p id="mc-in-mode">Voice Call</p><p class="mc-note">Answer or decline. Accept only calls from people you recognise.</p><div class="mc-actions" style="justify-content:center;margin-top:17px"><button class="mc-btn primary" id="mc-answer">Answer</button><button class="mc-btn danger" id="mc-decline">Decline</button></div></div></section><section class="mc-stagewrap mc-hidden" id="mc-stage-wrap"><div class="mc-stage"><header class="mc-stagehead"><div><b id="mc-stage-name">MetConnect</b><small id="mc-stage-mode" style="display:block;color:#9eb5c8"></small></div><span class="pill green" id="mc-stage-state">Connecting</span></header><div class="mc-videos"><div id="mc-audio" class="mc-audio">◉<p>Audio call</p></div><video id="mc-remote" class="mc-remote mc-hidden" autoplay playsinline muted></video><video id="mc-local" class="mc-local mc-hidden" autoplay playsinline muted></video></div><audio id="mc-remote-audio" autoplay></audio><div id="mc-stage-status" class="mc-stage-status">Connecting…</div><div class="mc-stageactions"><button class="mc-btn" id="mc-mute">Mute mic</button><button class="mc-btn" id="mc-camera-toggle">Camera off</button><button class="mc-btn" id="mc-hold">Hold</button><button class="mc-btn" id="mc-share-screen">Share screen</button><button class="mc-btn danger" id="mc-end">End call</button></div></div></section>';
document.body.appendChild(el);
document.getElementById('mc-answer').onclick=answerIncoming;document.getElementById('mc-decline').onclick=declineIncoming;document.getElementById('mc-end').onclick=endCall;document.getElementById('mc-mute').onclick=toggleMic;document.getElementById('mc-camera-toggle').onclick=toggleCam;document.getElementById('mc-hold').onclick=toggleHold;document.getElementById('mc-share-screen').onclick=shareScreen;
}
function audioContext(){if(!MC.audio){const C=window.AudioContext||window.webkitAudioContext;if(C)MC.audio=new C();}return MC.audio;}
function notificationPermissionLabel(){
 if(!('Notification' in window))return 'Unavailable in this browser';
 if(Notification.permission==='granted')return 'Enabled';
 if(Notification.permission==='denied')return 'Blocked in browser settings';
 return 'Not enabled';
}
function updateNotificationUi(){
 const label=notificationPermissionLabel();
 const state=document.getElementById('mc-notify-state');if(state)state.textContent=label;
 const buttons=['mc-notify','mc-notify-setup'].map(id=>document.getElementById(id)).filter(Boolean);
 buttons.forEach(b=>{b.textContent=label==='Enabled'?'Notifications enabled':'Enable notifications';b.disabled=label==='Enabled'||label==='Unavailable in this browser';});
}
async function requestNotifications(){
 if(!('Notification' in window)){status('Browser notifications are not available here. Messages and calls still appear while MetConnect is open.',true);updateNotificationUi();return;}
 try{
  const permission=await Notification.requestPermission();
  updateNotificationUi();
  if(permission==='granted')status('Notifications enabled for incoming messages and calls.');
  else if(permission==='denied')status('Notifications are blocked. Allow them for this site in your browser settings.',true);
  else status('Notification permission was not granted.');
 }catch(e){status(e.message||'Could not request notification permission.',true);}
}
async function notifySystem(title,body,tag){
 if(!('Notification' in window)||Notification.permission!=='granted')return;
 try{
  if('serviceWorker' in navigator){
   const registration=await navigator.serviceWorker.getRegistration();
   if(registration?.showNotification){await registration.showNotification(title,{body,tag,renotify:true});return;}
  }
  const n=new Notification(title,{body,tag,renotify:true});
  n.onclick=()=>{try{window.focus();}catch(e){}n.close();};
 }catch(e){console.warn('MetConnect notification:',e);}
}
function handleIncomingMessage(row){
 if(!row||row.sender_id===profile.id)return;
 const current=person(row.sender_id);
 if(MC.selected!==row.sender_id||MC.currentTab!=='talk'||document.hidden){
  notifySystem('New MetConnect message','@'+(current?.username||'Metxon user')+': '+String(row.body||'').slice(0,160),'metconnect-message-'+row.id);
 }
 if(MC.selected)loadMessages(MC.selected);
}
// Incoming receiver tone: an original celestial-bell melody with short guitar-like plucks.
function ring(){
stopRing();const ctx=audioContext();if(!ctx)return;if(ctx.state==='suspended')ctx.resume().catch(()=>{});let live=true;
const notes=[392.00,493.88,587.33,783.99,587.33,493.88,349.23,440.00,523.25,698.46,523.25,440.00];
function strike(freq,at,duration){
 const bell=ctx.createOscillator(),bellGain=ctx.createGain(),bell2=ctx.createOscillator(),bell2Gain=ctx.createGain();
 bell.type='sine';bell.frequency.setValueAtTime(freq,at);
 bell2.type='sine';bell2.frequency.setValueAtTime(freq*2.01,at);
 bellGain.gain.setValueAtTime(.0001,at);bellGain.gain.exponentialRampToValueAtTime(.11,at+.018);bellGain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 bell2Gain.gain.setValueAtTime(.0001,at);bell2Gain.gain.exponentialRampToValueAtTime(.035,at+.015);bell2Gain.gain.exponentialRampToValueAtTime(.0001,at+duration*.65);
 bell.connect(bellGain);bellGain.connect(ctx.destination);bell2.connect(bell2Gain);bell2Gain.connect(ctx.destination);
 bell.start(at);bell2.start(at);bell.stop(at+duration);bell2.stop(at+duration*.7);
 const pluck=ctx.createOscillator(),pluckGain=ctx.createGain(),filter=ctx.createBiquadFilter();
 pluck.type='triangle';pluck.frequency.setValueAtTime(freq*.5,at);filter.type='lowpass';filter.frequency.setValueAtTime(1700,at);
 pluckGain.gain.setValueAtTime(.0001,at);pluckGain.gain.exponentialRampToValueAtTime(.055,at+.008);pluckGain.gain.exponentialRampToValueAtTime(.0001,at+.19);
 pluck.connect(filter);filter.connect(pluckGain);pluckGain.connect(ctx.destination);pluck.start(at);pluck.stop(at+.2);
}
function phrase(){if(!live)return;const now=ctx.currentTime+.04;notes.forEach((f,i)=>strike(f,now+i*.23,.55));MC.ringTimer=setTimeout(phrase,3900);}
MC.ring=()=>{live=false;clearTimeout(MC.ringTimer);MC.ringTimer=null;};phrase();
}
// Caller tone: familiar two-note telephone ringback, kept separate from the receiver melody.
function ringCaller(){
stopRing();const ctx=audioContext();if(!ctx)return;if(ctx.state==='suspended')ctx.resume().catch(()=>{});let live=true;
function phrase(){if(!live)return;const now=ctx.currentTime+.02;[440,480].forEach(freq=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(freq,now);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.075,now+.04);gain.gain.setValueAtTime(.075,now+.92);gain.gain.exponentialRampToValueAtTime(.0001,now+1.03);osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+1.05);});MC.ringTimer=setTimeout(phrase,4000);}
MC.ring=()=>{live=false;clearTimeout(MC.ringTimer);MC.ringTimer=null;};phrase();
}

function stopRing(){if(MC.ring){MC.ring();MC.ring=null;}if(MC.ringTimer)clearTimeout(MC.ringTimer);MC.ringTimer=null;}
function stopOutgoing(){if(MC.outgoing){MC.outgoing();MC.outgoing=null;}stopRing();}
function setStageStatus(s){const el=document.getElementById('mc-stage-status');if(el)el.textContent=s;}
function showStage(){
ensureLayer();const c=MC.active,w=document.getElementById('mc-stage-wrap');if(!c){w.classList.add('mc-hidden');return;}w.classList.remove('mc-hidden');
document.getElementById('mc-stage-name').textContent='@'+(c.peer?.username||'Metxon user');document.getElementById('mc-stage-mode').textContent=labels[c.mode]||'MetConnect';document.getElementById('mc-stage-state').textContent=c.status==='ringing'?'Calling…':'Active';
const video=document.getElementById('mc-remote'),audio=document.getElementById('mc-remote-audio'),local=document.getElementById('mc-local');
if(MC.remote){video.srcObject=MC.remote;audio.srcObject=MC.remote;const hasVideo=MC.remote.getVideoTracks().length>0;video.classList.toggle('mc-hidden',!hasVideo);document.getElementById('mc-audio').classList.toggle('mc-hidden',hasVideo);video.muted=true;}else{video.classList.add('mc-hidden');document.getElementById('mc-audio').classList.remove('mc-hidden');}
const preview=MC.screen||MC.local;if(preview?.getVideoTracks().length){local.srcObject=preview;local.classList.remove('mc-hidden');}else local.classList.add('mc-hidden');
if(audio)audio.play().catch(()=>{});if(video)video.play().catch(()=>{});if(MC.speaker&&audio.setSinkId)audio.setSinkId(MC.speaker).catch(()=>{});
}
async function loadSetup(){const r=await sb.from('metconnect_preferences').select('setup_completed,ringtone_enabled').eq('user_id',profile.id).maybeSingle();if(r.error)throw r.error;MC.setup=!!r.data?.setup_completed;return MC.setup;}
async function permissions(){
const el=document.getElementById('mc-setup-status');if(el)el.textContent='Requesting camera and microphone permissions…';let mic=false,cam=false,s;
try{s=await navigator.mediaDevices.getUserMedia({audio:true,video:true});mic=s.getAudioTracks().length>0;cam=s.getVideoTracks().length>0;}
catch(e){if(s)s.getTracks().forEach(t=>t.stop());try{s=await navigator.mediaDevices.getUserMedia({audio:true,video:false});mic=true;}catch(x){}if(s)s.getTracks().forEach(t=>t.stop());try{s=await navigator.mediaDevices.getUserMedia({audio:false,video:true});cam=true;}catch(x){}}
if(s)s.getTracks().forEach(t=>t.stop());document.getElementById('mc-mic-state').textContent=mic?'Permission granted':'Not granted yet';document.getElementById('mc-cam-state').textContent=cam?'Permission granted':'Not granted yet';if(el)el.textContent=(mic?'Microphone ready. ':'Microphone permission not granted. ')+(cam?'Camera ready.':'Camera may be enabled later for video calls.');try{const a=audioContext();if(a&&a.state==='suspended')await a.resume();}catch(x){}await finishSetup();
}
async function chooseSpeaker(){
const el=document.getElementById('mc-setup-status');if(!navigator.mediaDevices?.selectAudioOutput){document.getElementById('mc-speaker-state').textContent='Device default';if(el)el.textContent='No speaker picker is available in this browser; using the device default.';return;}
try{const d=await navigator.mediaDevices.selectAudioOutput();MC.speaker=d.deviceId;document.getElementById('mc-speaker-state').textContent=d.label||'Speaker selected';if(el)el.textContent='Speaker selected.';}catch(e){if(el)el.textContent='Speaker selection cancelled. Device default will be used.';}
}
async function finishSetup(){
try{const r=await sb.from('metconnect_preferences').upsert({user_id:profile.id,setup_completed:true,ringtone_enabled:true,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(r.error)throw r.error;MC.setup=true;document.getElementById('mc-setup').classList.add('mc-hidden');document.getElementById('mc-main').classList.remove('mc-hidden');await refreshContacts();await initMetConnectBackground();status('Setup complete. Add a Metxon username.');}
catch(e){const el=document.getElementById('mc-setup-status');if(el)el.textContent=e.message||'Setup could not be saved.';}
}
async function refreshContacts(){
const r=await sb.rpc('metconnect_list_contacts');if(r.error)throw r.error;MC.contacts=Array.isArray(r.data)?r.data:[];
const list=document.getElementById('mc-contacts');if(list){list.innerHTML=MC.contacts.map(c=>'<button class="mc-person'+(c.contact_id===MC.selected?' active':'')+'" data-id="'+esc(c.contact_id)+'"><span><b>@'+esc(c.username)+'</b><small>'+esc(c.display_name||'Metxon user')+'</small></span><span>›</span></button>').join('')||'<div class="mc-empty">No saved usernames yet. Add a user who has installed MetConnect.</div>';list.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>selectContact(b.dataset.id));}
document.getElementById('mc-count').textContent=String(MC.contacts.length);document.querySelectorAll('[data-call]').forEach(b=>b.disabled=!MC.selected);['mc-remove','mc-block','mc-report'].forEach(id=>{const b=document.getElementById(id);if(b)b.disabled=!MC.selected;});
}
async function addContact(e){
e.preventDefault();const input=document.getElementById('mc-username'),username=input.value.trim();if(!username)return;status('Checking Metxon username…');
try{const q=await sb.rpc('metconnect_lookup_user',{p_username:username});if(q.error)throw q.error;const p=Array.isArray(q.data)?q.data[0]:null;if(!p)throw Error('Username not found, or contact is blocked.');if(!p.has_metconnect)throw Error('@'+p.username+' has not installed MetConnect.');const ins=await sb.from('metconnect_contacts').insert({owner_id:profile.id,contact_id:p.id});if(ins.error){if(ins.error.code==='23505')throw Error('Username is already saved.');throw ins.error;}input.value='';MC.selected=p.id;await refreshContacts();await loadMessages(p.id);status('@'+p.username+' added to Saved Usernames.');}
catch(x){status(x.message||'Could not add that username.',true);}
}
async function selectContact(id){
MC.selected=id;const p=person(id);document.getElementById('mc-title').textContent=p?'@'+p.username:'Choose a username';document.getElementById('mc-subtitle').textContent=p?(p.display_name||'Metxon user')+' · MetConnect':'Save a username to start texting';document.getElementById('mc-text').disabled=!p;document.getElementById('mc-send-btn').disabled=!p;await refreshContacts();await loadMessages(id);
}
function renderMessages(rows){
const box=document.getElementById('mc-messages');if(!box)return;if(!rows.length){box.innerHTML='<div class="mc-empty">No messages yet. Send the first message.</div>';return;}box.innerHTML=rows.map(m=>'<div class="mc-bubble'+(m.sender_id===profile.id?' mine':'')+'>'+esc(m.body)+'<small>'+new Date(m.created_at).toLocaleString()+'</small></div>').join('');box.scrollTop=box.scrollHeight;
}
async function loadMessages(id){
const box=document.getElementById('mc-messages');if(!id){if(box)box.innerHTML='<div class="mc-empty">Choose a saved username.</div>';return;}
try{const [a,b]=await Promise.all([sb.from('metconnect_messages').select('id,sender_id,recipient_id,body,created_at').eq('sender_id',profile.id).eq('recipient_id',id).order('created_at').limit(150),sb.from('metconnect_messages').select('id,sender_id,recipient_id,body,created_at').eq('sender_id',id).eq('recipient_id',profile.id).order('created_at').limit(150)]);if(a.error)throw a.error;if(b.error)throw b.error;renderMessages([...(a.data||[]),...(b.data||[])].sort((x,y)=>new Date(x.created_at)-new Date(y.created_at)).slice(-200));}
catch(e){if(box)box.innerHTML='<div class="mc-empty">Could not load messages: '+esc(e.message)+'</div>';}
}
async function sendMessage(e){
e.preventDefault();const input=document.getElementById('mc-text'),body=input.value.trim();if(!MC.selected||!body)return;input.disabled=true;
try{const r=await sb.from('metconnect_messages').insert({sender_id:profile.id,recipient_id:MC.selected,body});if(r.error)throw r.error;input.value='';await loadMessages(MC.selected);status('Message sent.');}
catch(x){status(x.message||'Message could not be sent.',true);}finally{input.disabled=false;input.focus();}
}
async function removeContact(){if(!MC.selected)return;const p=person(MC.selected);if(!confirm('Remove @'+(p?.username||'this user')+'?'))return;const r=await sb.from('metconnect_contacts').delete().eq('owner_id',profile.id).eq('contact_id',MC.selected);if(r.error)return status(r.error.message,true);MC.selected=null;await refreshContacts();await loadMessages(null);status('Contact removed.');}
async function blockContact(){if(!MC.selected)return;const id=MC.selected,p=person(id);if(!confirm('Block @'+(p?.username||'this user')+'?'))return;const r=await sb.from('metconnect_blocks').insert({owner_id:profile.id,blocked_user_id:id});if(r.error&&r.error.code!=='23505')return status(r.error.message,true);await sb.from('metconnect_contacts').delete().eq('owner_id',profile.id).eq('contact_id',id);if(MC.active?.peerId===id)await endCall();MC.selected=null;await refreshContacts();await loadMessages(null);status('User blocked.');}
async function reportContact(){if(!MC.selected)return;const id=MC.selected,p=person(id),reason=prompt('Why are you reporting @'+(p?.username||'this user')+'?');if(!reason||reason.trim().length<3)return;const r=await sb.from('metconnect_reports').insert({reporter_id:profile.id,reported_user_id:id,reason:reason.trim().slice(0,1000)});if(r.error)return status(r.error.message,true);await sb.from('metconnect_blocks').insert({owner_id:profile.id,blocked_user_id:id});await sb.from('metconnect_contacts').delete().eq('owner_id',profile.id).eq('contact_id',id);if(MC.active?.peerId===id)await endCall();MC.selected=null;await refreshContacts();await loadMessages(null);status('Report submitted and user blocked.');}
function signal(id,type,payload){return sb.from('metconnect_call_signals').insert({call_id:id,sender_id:profile.id,signal_type:type,payload:payload||{}});}
async function flushIce(){if(!MC.peer?.remoteDescription)return;for(const x of MC.ice.splice(0)){try{await MC.peer.addIceCandidate(new RTCIceCandidate(x));}catch(e){console.warn(e);}}}
async function subscribeCall(id){
if(MC.signals)sb.removeChannel(MC.signals);MC.signals=sb.channel('metconnect-call-'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'metconnect_call_signals',filter:'call_id=eq.'+id},p=>handleSignal(p.new)).on('postgres_changes',{event:'UPDATE',schema:'public',table:'metconnect_calls',filter:'id=eq.'+id},p=>handleCallUpdate(p.new)).subscribe();
const old=await sb.from('metconnect_call_signals').select('id,sender_id,signal_type,payload,created_at').eq('call_id',id).order('created_at').limit(100);if(!old.error)for(const s of old.data||[])if(s.sender_id!==profile.id)await handleSignal(s);await flushIce();
const now=await sb.from('metconnect_calls').select('id,status,answer_sdp').eq('id',id).single();if(!now.error&&MC.active?.role==='caller'&&now.data.status==='accepted'&&now.data.answer_sdp)await handleCallUpdate({...now.data,id});
}
function newPeer(){
const pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});MC.peer=pc;MC.remote=new MediaStream();MC.ice=[];
pc.ontrack=e=>{if(e.streams?.[0])MC.remote=e.streams[0];else if(!MC.remote.getTracks().some(t=>t.id===e.track.id))MC.remote.addTrack(e.track);showStage();};
pc.onicecandidate=e=>{if(!e.candidate)return;const c=e.candidate.toJSON?e.candidate.toJSON():e.candidate;if(MC.active?.id)signal(MC.active.id,'ice',c).then(r=>{if(r.error)console.warn(r.error);});else MC.ice.push(c);};
pc.onconnectionstatechange=()=>{if(pc.connectionState==='connected'){stopOutgoing();if(MC.active)MC.active.status='accepted';showStage();setStageStatus('Connected peer-to-peer.');}if(pc.connectionState==='failed')setStageStatus('Connection failed. A TURN relay may be needed on this network.');};return pc;
}
async function startCall(mode){
if(MC.busy||MC.active||MC.incoming)return;const c=person(MC.selected);if(!c)return status('Choose a saved username.',true);MC.busy=true;let local=null,screen=null;
try{
let screenPromise=null;if(mode==='screen'){if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Screen sharing is not supported by this browser.');screenPromise=navigator.mediaDevices.getDisplayMedia({video:{frameRate:15},audio:false});}
if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone or camera access is unavailable.');
const pair=await Promise.all([navigator.mediaDevices.getUserMedia({audio:true,video:mode==='video'}),screenPromise||Promise.resolve(null)]);local=pair[0];screen=pair[1];MC.local=local;MC.screen=screen;const pc=newPeer();
local.getTracks().forEach(t=>pc.addTrack(t,local));if(screen)screen.getTracks().forEach(t=>pc.addTrack(t,screen));
const offer=await pc.createOffer();await pc.setLocalDescription(offer);
const row=await sb.from('metconnect_calls').insert({caller_id:profile.id,callee_id:c.contact_id,call_mode:mode,status:'ringing',offer_sdp:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}}).select('id,caller_id,callee_id,call_mode,status,offer_sdp,created_at').single();if(row.error)throw row.error;
MC.active={id:row.data.id,callerId:profile.id,peerId:c.contact_id,peer:c,mode,role:'caller',status:'ringing'};await subscribeCall(MC.active.id);
for(const item of MC.ice.splice(0)){const r=await signal(MC.active.id,'ice',item);if(r.error)throw r.error;}
showStage();ringCaller();MC.outgoing=MC.ring;MC.ring=null;status('Calling @'+c.username+'…');
MC.timeout=setTimeout(async()=>{if(MC.active?.id===row.data.id&&MC.active.status==='ringing'){await sb.from('metconnect_calls').update({status:'ended'}).eq('id',row.data.id).eq('caller_id',profile.id);cleanupCall('No answer.');}},45000);
if(screen)screen.getVideoTracks().forEach(t=>t.onended=()=>status('Screen sharing stopped.'));
}catch(e){if(local)local.getTracks().forEach(t=>t.stop());if(screen)screen.getTracks().forEach(t=>t.stop());if(MC.peer)MC.peer.close();MC.peer=null;MC.local=null;MC.screen=null;stopOutgoing();status(e.message||'Could not start the call.',true);}
finally{MC.busy=false;}
}
function showIncoming(call,peer){ensureLayer();MC.incoming=call;document.getElementById('mc-in-name').textContent='@'+(peer?.username||'Metxon user');document.getElementById('mc-in-mode').textContent=(labels[call.call_mode]||'Call')+' · Incoming';document.getElementById('mc-incoming').classList.remove('mc-hidden');notifySystem('Incoming '+(labels[call.call_mode]||'MetConnect call'),'@'+(peer?.username||'Metxon user')+' is calling you.','metconnect-call-'+call.id);ring();MC.timeout=setTimeout(async()=>{if(MC.incoming?.id===call.id){await sb.from('metconnect_calls').update({status:'missed'}).eq('id',call.id).eq('callee_id',profile.id);hideIncoming();MC.incoming=null;}},40000);}
function hideIncoming(){stopRing();if(MC.timeout)clearTimeout(MC.timeout);MC.timeout=null;document.getElementById('mc-incoming')?.classList.add('mc-hidden');}
async function handleIncoming(call){if(!call||call.status!=='ringing'||MC.active||MC.incoming||!MC.setup)return;const q=await sb.rpc('metconnect_get_call_peer',{p_call_id:call.id});if(q.error)return;const p=Array.isArray(q.data)?q.data[0]:null;if(p)showIncoming(call,p);}
async function initMetConnectBackground(){
if(!profile?.id)return;ensureLayer();if(!MC.setup){try{await loadSetup();}catch(e){return;}}if(!MC.setup||MC.incomingChannel)return;
MC.incomingChannel=sb.channel('metconnect-incoming-'+profile.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'metconnect_calls',filter:'callee_id=eq.'+profile.id},p=>handleIncoming(p.new)).subscribe();
const p=await sb.from('metconnect_calls').select('id,caller_id,callee_id,call_mode,status,offer_sdp,created_at').eq('callee_id',profile.id).eq('status','ringing').order('created_at',{ascending:false}).limit(1);if(!p.error&&p.data?.[0])await handleIncoming(p.data[0]);
}
async function answerIncoming(){
const call=MC.incoming;if(!call||MC.busy)return;MC.busy=true;let local=null;
try{hideIncoming();const r=await sb.from('metconnect_calls').select('id,caller_id,callee_id,call_mode,status,offer_sdp,created_at').eq('id',call.id).eq('callee_id',profile.id).single();if(r.error)throw r.error;if(r.data.status!=='ringing')throw Error('This call is no longer available.');
if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone or camera access is unavailable.');
local=await navigator.mediaDevices.getUserMedia({audio:true,video:r.data.call_mode==='video'});MC.local=local;
const q=await sb.rpc('metconnect_get_call_peer',{p_call_id:call.id});const peer=Array.isArray(q.data)?q.data[0]:null;if(q.error||!peer)throw Error(q.error?.message||'Caller unavailable.');
MC.active={id:call.id,callerId:call.caller_id,peerId:peer.user_id,peer,mode:r.data.call_mode,role:'callee',status:'ringing'};const pc=newPeer();await pc.setRemoteDescription(new RTCSessionDescription(r.data.offer_sdp));local.getTracks().forEach(t=>pc.addTrack(t,local));await subscribeCall(call.id);
const answer=await pc.createAnswer();await pc.setLocalDescription(answer);
const u=await sb.from('metconnect_calls').update({status:'accepted',answer_sdp:{type:pc.localDescription.type,sdp:pc.localDescription.sdp},answered_at:new Date().toISOString()}).eq('id',call.id).eq('callee_id',profile.id).eq('status','ringing');if(u.error)throw u.error;
MC.active.status='accepted';MC.incoming=null;showStage();setStageStatus('Connecting…');status('Connected to @'+peer.username+'.');
}catch(e){if(local)local.getTracks().forEach(t=>t.stop());if(MC.peer)MC.peer.close();MC.peer=null;MC.local=null;MC.active=null;MC.incoming=null;document.getElementById('mc-stage-wrap')?.classList.add('mc-hidden');status(e.message||'Could not answer.',true);}
finally{MC.busy=false;}
}
async function declineIncoming(){const c=MC.incoming;if(!c)return;hideIncoming();await sb.from('metconnect_calls').update({status:'declined'}).eq('id',c.id).eq('callee_id',profile.id);MC.incoming=null;status('Call declined.');}
async function handleCallUpdate(row){
if(MC.active?.id===row.id&&MC.active.role==='caller'&&row.status==='accepted'&&row.answer_sdp&&MC.peer&&!MC.peer.remoteDescription){try{await MC.peer.setRemoteDescription(new RTCSessionDescription(row.answer_sdp));MC.active.status='accepted';stopOutgoing();if(MC.timeout)clearTimeout(MC.timeout);await flushIce();showStage();setStageStatus('Connecting…');}catch(e){setStageStatus('Could not apply answer.');}}
else if(MC.active?.id===row.id&&['declined','missed','ended'].includes(row.status))cleanupCall(row.status==='declined'?'The other person declined.':row.status==='missed'?'Call missed.':'Call ended.');
if(MC.incoming?.id===row.id&&row.status!=='ringing'){hideIncoming();MC.incoming=null;}
}
async function handleSignal(row){
if(!row||row.sender_id===profile.id||!MC.active||row.call_id!==MC.active.id)return;const p=row.payload||{};
try{if(row.signal_type==='ice'){if(MC.peer?.remoteDescription)await MC.peer.addIceCandidate(new RTCIceCandidate(p));else MC.ice.push(p);}
else if(row.signal_type==='renegotiate_offer'){await MC.peer.setRemoteDescription(new RTCSessionDescription(p));const a=await MC.peer.createAnswer();await MC.peer.setLocalDescription(a);await signal(MC.active.id,'renegotiate_answer',{type:MC.peer.localDescription.type,sdp:MC.peer.localDescription.sdp});}
else if(row.signal_type==='renegotiate_answer'){if(MC.peer&&MC.peer.signalingState!=='stable'){await MC.peer.setRemoteDescription(new RTCSessionDescription(p));await flushIce();}}
else if(row.signal_type==='hold')setStageStatus('The other person has put the call on hold.');else if(row.signal_type==='resume')setStageStatus('The other person resumed the call.');else if(row.signal_type==='hangup')cleanupCall('The other person ended the call.');
}catch(e){console.warn('MetConnect signal:',e);}
}
async function endCall(){const c=MC.active;if(!c)return;await sb.from('metconnect_calls').update({status:'ended'}).eq('id',c.id);cleanupCall('Call ended.');}
function cleanupCall(message){
stopOutgoing();stopRing();if(MC.timeout)clearTimeout(MC.timeout);if(MC.signals){sb.removeChannel(MC.signals);MC.signals=null;}if(MC.peer){MC.peer.onicecandidate=null;MC.peer.close();}
if(MC.local)MC.local.getTracks().forEach(t=>t.stop());if(MC.screen)MC.screen.getTracks().forEach(t=>t.stop());
MC.peer=null;MC.local=null;MC.screen=null;MC.remote=null;MC.active=null;MC.ice=[];MC.held=false;document.getElementById('mc-stage-wrap')?.classList.add('mc-hidden');status(message||'Call ended.');
}
function toggleMic(){if(!MC.local)return;const tracks=MC.local.getAudioTracks();if(!tracks.length)return;MC.mic=!MC.mic;tracks.forEach(t=>t.enabled=MC.mic);document.getElementById('mc-mute').textContent=MC.mic?'Mute mic':'Unmute mic';}
function toggleCam(){if(!MC.local)return;const tracks=MC.local.getVideoTracks();if(!tracks.length)return;MC.cam=!MC.cam;tracks.forEach(t=>t.enabled=MC.cam);document.getElementById('mc-camera-toggle').textContent=MC.cam?'Camera off':'Camera on';}
async function toggleHold(){if(!MC.active||!MC.local)return;MC.held=!MC.held;MC.local.getTracks().forEach(t=>t.enabled=!MC.held);if(MC.screen)MC.screen.getTracks().forEach(t=>t.enabled=!MC.held);const output=document.getElementById('mc-remote-audio');if(output)output.muted=MC.held;document.getElementById('mc-hold').textContent=MC.held?'Resume':'Hold';setStageStatus(MC.held?'You put the call on hold.':'Call resumed.');const r=await signal(MC.active.id,MC.held?'hold':'resume',{});if(r.error)console.warn(r.error);}
async function shareScreen(){
if(!MC.active||!MC.peer)return;
try{if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Screen sharing is not supported.');const s=await navigator.mediaDevices.getDisplayMedia({video:{frameRate:15},audio:false});MC.screen=s;s.getTracks().forEach(t=>MC.peer.addTrack(t,s));const offer=await MC.peer.createOffer();await MC.peer.setLocalDescription(offer);const r=await signal(MC.active.id,'renegotiate_offer',{type:MC.peer.localDescription.type,sdp:MC.peer.localDescription.sdp});if(r.error)throw r.error;setStageStatus('You are sharing your screen. Stop sharing with the browser control.');s.getVideoTracks().forEach(t=>t.onended=()=>setStageStatus('Screen sharing stopped.'));showStage();}
catch(e){setStageStatus(e.message||'Screen sharing cancelled.');}
}
function bind(){
document.getElementById('mc-add').onsubmit=addContact;document.getElementById('mc-send').onsubmit=sendMessage;document.getElementById('mc-remove').onclick=removeContact;document.getElementById('mc-block').onclick=blockContact;document.getElementById('mc-report').onclick=reportContact;document.getElementById('mc-refresh').onclick=refreshContacts;document.getElementById('mc-permissions').onclick=permissions;document.getElementById('mc-speaker').onclick=chooseSpeaker;document.getElementById('mc-notify').onclick=requestNotifications;document.getElementById('mc-notify-setup').onclick=requestNotifications;document.getElementById('mc-continue').onclick=finishSetup;updateNotificationUi();
const setTab=tab=>{
 MC.currentTab=tab;
 const root=document.getElementById('mc-root');
 root.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 root.querySelectorAll('[data-call]').forEach(b=>b.classList.toggle('mc-hidden',!['screen','voice','video'].includes(tab)||b.dataset.call!==tab));
 const help=document.getElementById('mc-tab-help');
 const messages=document.getElementById('mc-messages');
 const composer=document.getElementById('mc-send');
 const titles={
  contacts:'Saved usernames: choose a contact to view your conversations.',
  talk:'Talk: select a saved username, then use the message box to chat privately.',
  screen:'Share Screen Call: select a contact, then tap Start Share Screen Call below.',
  voice:'Voice Call: select a contact, then tap Start Voice Call below.',
  video:'Video Call: select a contact, then tap Start Video Call below.'
 };
 if(help)help.textContent=titles[tab]||titles.contacts;
 const title=document.getElementById('mc-title');
 const subtitle=document.getElementById('mc-subtitle');
 const selected=person(MC.selected);
 if(title)title.textContent=selected?'@'+selected.username:(tab==='contacts'?'Saved Usernames':'Choose a username');
 if(subtitle)subtitle.textContent=selected?(selected.display_name||'Metxon user')+' · MetConnect':(tab==='talk'?'Choose a username to start a private chat.':'Select a saved username first.');
 if(composer)composer.classList.toggle('mc-hidden',tab!=='talk'&&tab!=='contacts');
 if(messages)messages.classList.toggle('mc-hidden',tab!=='talk'&&tab!=='contacts');
 status(tab==='contacts'?'Saved usernames and conversations.':tab==='talk'?'Private messaging selected.':titles[tab]||'Choose a tab.');
};
document.getElementById('mc-root').querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>setTab(b.dataset.tab));
setTab(MC.currentTab||'contacts');
document.getElementById('mc-root').querySelectorAll('[data-call]').forEach(b=>b.onclick=()=>startCall(b.dataset.call));
}
async function openApp(){
if(!profile?.id)return toast('Sign in to your Metxon account to open MetConnect.','error');
if(!installed?.has('metconnect')){
 const app=APPS.find(x=>x.id==='metconnect');
 const body='<div class="mc-setup"><div class="eyebrow">METCONNECT · PURCHASE</div><h2>Unlock MetConnect</h2><p>Install MetConnect with your MetPay transaction password. One-time installation price: <strong>π50 (50 JP)</strong>. This app installation is shared across your Metxon account.</p><div class="field"><label for="mc-install-password">MetPay transaction password</label><input id="mc-install-password" class="mc-input" type="password" autocomplete="current-password" maxlength="128"></div><div class="mc-actions"><button class="mc-btn primary" id="mc-install-pay">Pay π50 and open MetConnect</button></div><div class="mc-note" id="mc-install-status" role="status"></div></div>';
 renderLocalApp(app,body);
 const button=document.getElementById('mc-install-pay');
 button.onclick=async()=>{
  const password=document.getElementById('mc-install-password').value;
  if(!password){document.getElementById('mc-install-status').textContent='Enter your MetPay password to continue.';return;}
  button.disabled=true;document.getElementById('mc-install-status').textContent='Verifying MetPay and installing…';
  try{
   const result=await sb.rpc('mettin_install_nebula_app',{p_app_id:'metconnect',p_metpay_password:password});
   if(result.error)throw result.error;
   if(!result.data?.installed)throw new Error('MetConnect installation was not confirmed.');
   document.getElementById('mc-install-password').value='';
   await getProfile();await refreshOverview();await loadStore();await loadMetPay();
   if(!installed?.has('metconnect'))throw new Error('The installation was paid but the app entitlement has not refreshed. Reload Mettin before retrying.');
   await openApp();
  }catch(e){document.getElementById('mc-install-status').textContent=e.message||'Could not install MetConnect.';button.disabled=false;}
 };
 return;
}
renderLocalApp(APPS.find(x=>x.id==='metconnect'),'<div class="mc-empty">Opening MetConnect…</div>');const host=document.getElementById('launchContent');if(!host)return;host.innerHTML=appMarkup();bind();
try{updateNotificationUi();if(await loadSetup()){document.getElementById('mc-main').classList.remove('mc-hidden');await refreshContacts();await initMetConnectBackground();}else document.getElementById('mc-setup').classList.remove('mc-hidden');}
catch(e){document.getElementById('mc-setup').classList.remove('mc-hidden');document.getElementById('mc-setup-status').textContent=e.message||'Could not load setup.';}
MC.messageChannel=sb.channel('metconnect-messages-'+profile.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'metconnect_messages',filter:'sender_id=eq.'+profile.id},()=>{if(MC.selected)loadMessages(MC.selected);}).on('postgres_changes',{event:'INSERT',schema:'public',table:'metconnect_messages',filter:'recipient_id=eq.'+profile.id},p=>handleIncomingMessage(p.new)).subscribe();
window.__mettinAppStop=function(){if(MC.messageChannel){sb.removeChannel(MC.messageChannel);MC.messageChannel=null;}};
}
async function shutdown(){stopRing();stopOutgoing();if(MC.active)await endCall();if(MC.incomingChannel){sb.removeChannel(MC.incomingChannel);MC.incomingChannel=null;}if(MC.messageChannel){sb.removeChannel(MC.messageChannel);MC.messageChannel=null;}}
function initBackground(){if(typeof profile!=='undefined'&&profile&&typeof installed!=='undefined'&&installed.has('metconnect'))initMetConnectBackground().catch(e=>console.warn('MetConnect listener:',e));}
window.initMetConnectBackground=async function(){
if(!profile?.id)return;ensureLayer();if(!MC.setup){try{await loadSetup();}catch(e){return;}}if(!MC.setup||MC.incomingChannel)return;
MC.incomingChannel=sb.channel('metconnect-incoming-'+profile.id).on('postgres_changes',{event:'INSERT',schema:'public',table:'metconnect_calls',filter:'callee_id=eq.'+profile.id},p=>handleIncoming(p.new)).subscribe();
const p=await sb.from('metconnect_calls').select('id,caller_id,callee_id,call_mode,status,offer_sdp,created_at').eq('callee_id',profile.id).eq('status','ringing').order('created_at',{ascending:false}).limit(1);if(!p.error&&p.data?.[0])await handleIncoming(p.data[0]);
};
window.launchMetConnectApp=openApp;window.metconnectShutdown=shutdown;window.openMetConnect=function(){window.location.href='https://nidhilarthicknet.github.io/Mettin/?openApp=metconnect';};
window.addEventListener('beforeunload',()=>{if(MC.peer)MC.peer.close();});
window.dispatchEvent(new Event('metconnect-ready'));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initBackground,{once:true});else initBackground();
})();
