(()=>{'use strict';
const $=id=>document.getElementById(id),idOk=s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(s),prefixOk=s=>typeof s==='string'&&s.length<=100&&/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(s);
const clientId='web_'+crypto.randomUUID().replaceAll('-','').slice(0,24),devices=new Map(),excluded=new Set(),pending=new Map();
let client=null,connected=false,subscribed=false,selected='',counter=0,config={},endpoint=null,prefix='',storageKey='',pageGone=false,activeView='overview';
function message(text,error=false){$('cloudMessage').textContent=text;$('cloudMessage').dataset.error=String(error)}
function validConfig(){try{const c=window.SOLAR_CLOUD_CONFIG;if(!c||typeof c.wssUrl!=='string'||!prefixOk(c.topicPrefix))throw Error();const u=new URL(c.wssUrl.trim());if(u.protocol!=='wss:'||u.username||u.password||u.hash||!u.hostname||u.hostname.toLowerCase().includes('your-emqx'))throw Error();endpoint=u.href;prefix=c.topicPrefix;storageKey='solarCloudV2:'+JSON.stringify([endpoint,prefix]);$('cloudEndpoint').textContent=u.host+' · '+prefix;return true}catch{$('cloudEndpoint').textContent='Chưa cài WSS / topic';message('Mở file config.js để điền đúng wssUrl và topicPrefix, rồi tải cả config.js và index.html lên GitHub Pages.',true);$('cloudConnect').disabled=true;$('cloudSettings').disabled=true;return false}}
const configured=validConfig();
if(configured){try{config=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{};if(!config||typeof config!=='object'||Array.isArray(config))config={};}
function ensure(id){if(!idOk(id))return null;if(!devices.has(id))devices.set(id,{id,state:null,descriptor:null,online:null,nonce:'',clockAt:0,clockUptime:0,epoch:0,hello:null});return devices.get(id)}
for(const id of Array.isArray(config.excluded)?config.excluded:[])if(idOk(id))excluded.add(id);
for(const id of Array.isArray(config.devices)?config.devices:[])ensure(id);
selected=idOk(config.selected||'')&&devices.has(config.selected)?config.selected:'';
if(typeof config.username==='string')$('cloudUsername').value=config.username;
if(typeof config.password==='string')$('cloudPassword').value=config.password;
function save(withCredentials=false){if(!configured)return;config={...config,selected,devices:[...devices.keys()],excluded:[...excluded]};if(withCredentials){config.username=$('cloudUsername').value.trim();config.password=$('cloudPassword').value;}try{localStorage.setItem(storageKey,JSON.stringify(config))}catch{message('Trình duyệt không cho lưu tài khoản. Tab hiện tại vẫn sử dụng được.',true)}}
function visible(){return !pageGone&&document.visibilityState!=='hidden'}
function active(id,view){return visible()&&connected&&subscribed&&id===selected&&(!view||view===activeView)}
function fresh(entry){return !!(connected&&entry?.online===true&&entry.nonce&&entry.clockAt>0)}
function renderDevices(){const frag=document.createDocumentFragment(),empty=document.createElement('option');empty.value='';empty.textContent='Chọn thiết bị ESP32…';frag.append(empty);for(const entry of devices.values()){const o=document.createElement('option');o.value=entry.id;o.textContent=(entry.online===true?'● ':'○ ')+(entry.descriptor?.device_name||entry.state?.device_name||entry.id)+' · '+entry.id.slice(-6);frag.append(o)}$('cloudDevice').replaceChildren(frag);$('cloudDevice').value=devices.has(selected)?selected:'';$('cloudCount').textContent=devices.size+' thiết bị';$('cloudBadge').textContent=connected?'Đã nối EMQX':client?'Đang kết nối…':'Chưa kết nối';$('cloudBadge').dataset.online=String(connected);$('cloudSettings').hidden=!!client;$('cloudDisconnect').hidden=!client;$('cloudDisconnect').disabled=!client;$('cloudConnect').hidden=!!client;$('cloudRemove').disabled=!selected;}
function noticeFrame(){try{$('cloudFrame').contentWindow?.dispatchEvent(new CustomEvent('solarcloud:visibility',{detail:{active:active(selected)}}))}catch{}}
function iframeHtml(raw,id,registers=false){
 if(registers)raw=raw.replace('<body>','<body class="embedded">');
 const boot=`<script>window.SolarCloud=parent.SolarCloud;window.LUX_REMOTE={deviceId:${JSON.stringify(id)},registerPage:()=>window.SolarCloud.registerPage(${JSON.stringify(id)})};window.fetch=(url,opt)=>window.SolarCloud.fetch(${JSON.stringify(id)},url,opt);window.addEventListener('click',async e=>{const a=e.target.closest?.('a[href^="/api/"]');if(!a)return;e.preventDefault();const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;try{const res=await fetch(a.getAttribute('href'));if(!res.ok)throw Error('Không đọc được API JSON');const url=URL.createObjectURL(new Blob([await res.text()],{type:'application/json;charset=utf-8'}));if(tab)tab.location=url;else{const link=document.createElement('a');link.href=url;link.download='solar-registers.json';link.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(error){if(tab)tab.document.body.textContent=error.message}});<\/script>`;
 return raw.replace('<head>','<head>'+boot).replace('__TOKEN__','mqtt-transport');
}
function choose(id){if(!devices.has(id))return;selected=id;activeView='overview';$('cloudFrame').srcdoc=iframeHtml(window.SOLAR_DASHBOARD,id);$('cloudFrame').hidden=false;$('cloudEmpty').hidden=true;$('cloudFoot').hidden=true;$('cloudHelp').textContent='Thiết bị: '+id+' · Chỉ tải dữ liệu của menu đang mở.';renderDevices();save()}
$('cloudDevice').onchange=()=>{if($('cloudDevice').value)choose($('cloudDevice').value)};
$('cloudSettings').onclick=()=>{$('cloudConnectPanel').hidden=false;$('cloudUsername').focus()};
function clearPending(reason,predicate=()=>true){for(const [key,job]of pending)if(predicate(job)){pending.delete(key);job.finish();job.reject(Error(reason))}}
function invalidate(entry){entry.clockAt=0;entry.hello=null;entry.epoch++;}
function disconnect(reason='Đã ngắt kết nối.'){const old=client;client=null;connected=subscribed=false;for(const entry of devices.values())invalidate(entry);clearPending(reason);if(old)old.end(true);renderDevices();$('cloudConnectPanel').hidden=false;message(reason);noticeFrame()}
$('cloudDisconnect').onclick=()=>disconnect();
$('cloudForget').onclick=()=>{delete config.username;delete config.password;save();$('cloudUsername').value='';$('cloudPassword').value='';disconnect('Đã quên tài khoản trên trình duyệt này.');$('cloudUsername').focus()};
function handleMessage(topic,payload,packet){
 if(payload.length>65536||!topic.startsWith(prefix+'/'))return;const chunks=topic.slice(prefix.length+1).split('/'),id=chunks[0];if(!idOk(id)||excluded.has(id))return;
 let data;try{data=JSON.parse(new TextDecoder().decode(payload))}catch{return}if(!data||data.device_id!==id)return;
 if(chunks[1]==='state'&&chunks.length===2){const entry=ensure(id),nonce=data.mqtt?.rpc_nonce;if(typeof nonce!=='string'||!nonce.length)return;if(entry.nonce!==nonce){invalidate(entry);clearPending('Thiết bị đã đổi phiên MQTT; đang đồng bộ lại.',job=>job.deviceId===id);entry.nonce=nonce;}entry.descriptor=data;renderDevices();if(!selected)choose(id);else if(selected===id&&$('cloudFrame').hidden)choose(id);return;}
 if(chunks[1]==='availability'&&chunks.length===2){const entry=ensure(id);entry.online=data.online===true;if(!entry.online){invalidate(entry);clearPending('Thiết bị tạm offline. Đợi kết nối lại.',job=>job.deviceId===id)}renderDevices();return;}
 if(chunks[1]==='rpc'&&chunks[2]==='response'&&chunks[3]===clientId&&chunks.length===4&&!packet.retain){
  const job=pending.get(id+'/'+data.id);if(!job||job.deviceId!==id||!Number.isInteger(data.part)||!Number.isInteger(data.parts)||data.parts<1||data.parts>32||data.part<0||data.part>=data.parts||!Number.isInteger(data.status)||data.status<100||data.status>599||typeof data.data!=='string'||data.data.length>4096||data.encoding!=='base64')return;
  if(job.parts!==null&&(job.parts!==data.parts||job.code!==data.status))return;job.parts=data.parts;job.code=data.status;try{job.chunks[data.part]=Uint8Array.from(atob(data.data),c=>c.charCodeAt(0))}catch{return}
  if(Object.keys(job.chunks).length!==job.parts)return;const bytes=Array.from({length:job.parts},(_,i)=>job.chunks[i]),length=bytes.reduce((n,b)=>n+b.length,0);if(length>65536)return;const merged=new Uint8Array(length);let offset=0;for(const part of bytes){merged.set(part,offset);offset+=part.length}const body=new TextDecoder().decode(merged);
  pending.delete(id+'/'+data.id);job.finish();try{job.resolve(new Response(body,{status:job.code,headers:{'Content-Type':'application/json'}}))}catch{job.reject(Error('Phản hồi MQTT không hợp lệ.'))}
 }
}
function request(entry,command,signal){
 if(!active(entry.id))return Promise.reject(Error('Chỉ đọc dữ liệu khi đang mở thiết bị và tab GitHub Pages.'));
 return new Promise((resolve,reject)=>{const key=entry.id+'/'+command.id;let timer;const abort=()=>{if(pending.delete(key)){finish();reject(new DOMException('Aborted','AbortError'))}},finish=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort)};if(signal?.aborted){reject(new DOMException('Aborted','AbortError'));return}timer=setTimeout(()=>{pending.delete(key);finish();reject(Error('Hết thời gian chờ ESP32. Đọc lại trạng thái trước khi gửi lại cài đặt.'))},25000);pending.set(key,{resolve,reject,finish,deviceId:entry.id,parts:null,chunks:{},code:500});signal?.addEventListener('abort',abort,{once:true});client.publish(prefix+'/'+entry.id+'/rpc/request',JSON.stringify(command),{qos:1,retain:false},error=>{if(error&&pending.delete(key)){finish();reject(error)}});
 });
}
async function hello(entry){
 if(entry.clockAt&&performance.now()-entry.clockAt<20000)return;
 if(entry.hello)return entry.hello;
 const epoch=entry.epoch;entry.hello=(async()=>{if(!entry.nonce)throw Error('Đang chờ thông tin nhận diện ESP32 từ MQTT.');if(entry.online===false)throw Error('Thiết bị đang offline.');const expected=entry.nonce,command={id:clientId+'_'+(++counter),client_id:clientId,device_id:entry.id,nonce:expected,kind:'hello'},res=await request(entry,command);if(!res.ok)throw Error('Không đồng bộ được phiên ESP32.');const body=await res.json();if(entry.epoch!==epoch||body.device_id!==entry.id||body.mqtt?.rpc_nonce!==expected||!Number.isInteger(body.uptime_ms)||body.uptime_ms<0)throw Error('Phiên thiết bị đã thay đổi; hãy chờ rồi thử lại.');entry.clockUptime=body.uptime_ms;entry.clockAt=performance.now();entry.online=true;renderDevices()})();const promise=entry.hello;try{return await promise}finally{if(entry.hello===promise)entry.hello=null}
}
function connect(){
 if(!configured||client)return;if(!$('cloudUsername').value.trim()||!$('cloudPassword').value){message('Nhập tài khoản và mật khẩu EMQX.',true);return}
 clearPending('Đang đổi kết nối MQTT.');connected=subscribed=false;for(const entry of devices.values()){invalidate(entry);entry.online=null}
 let instance;try{instance=mqtt.connect(endpoint,{protocolVersion:4,username:$('cloudUsername').value.trim(),password:$('cloudPassword').value,clientId,clean:true,reconnectPeriod:3000,connectTimeout:15000,keepalive:20,resubscribe:false,queueQoSZero:false})}catch(error){message('Không mở được WSS: '+error.message,true);return}client=instance;message('Đang kết nối WSS…');renderDevices();
 instance.on('connect',()=>{if(client!==instance)return;connected=true;subscribed=false;for(const entry of devices.values())invalidate(entry);instance.subscribe([prefix+'/+/state',prefix+'/+/availability',prefix+'/+/rpc/response/'+clientId],{qos:1},(error,granted)=>{if(client!==instance)return;if(error||granted?.some(g=>g.qos===128)){message('EMQX từ chối topic. Kiểm tra ACL/prefix và quyền Subscribe.'+(error?' '+error.message:''),true);return}subscribed=true;save(true);message('Đã kết nối. Dữ liệu chỉ tải theo menu đang xem.');$('cloudConnectPanel').hidden=true;if(selected&&devices.has(selected)&&$('cloudFrame').hidden)choose(selected);renderDevices();noticeFrame()});renderDevices()});
 instance.on('message',(topic,payload,packet)=>{if(client===instance)handleMessage(topic,payload,packet)});
 instance.on('error',error=>{if(client===instance){message('Lỗi WSS/MQTT: '+error.message,true);$('cloudConnectPanel').hidden=false}});
 instance.on('close',()=>{if(client!==instance)return;connected=subscribed=false;for(const entry of devices.values())invalidate(entry);clearPending('MQTT mất kết nối. Kiểm tra trạng thái trước khi gửi lại cài đặt.');renderDevices();message('Mất MQTT, đang tự kết nối lại…',true);noticeFrame()});
}
$('cloudConnectForm').onsubmit=e=>{e.preventDefault();connect()};
$('cloudAdd').onclick=()=>{const id=$('cloudAddId').value.trim();if(!idOk(id)){message('Device ID chỉ có chữ/số, dấu _ hoặc -, tối đa 80 ký tự.',true);$('cloudConnectPanel').hidden=false;return}excluded.delete(id);ensure(id);$('cloudAddId').value='';choose(id)};
$('cloudRemove').onclick=()=>{if(!selected)return;const old=selected;excluded.add(old);devices.delete(old);selected='';clearPending('Đã bỏ thiết bị khỏi danh sách.',job=>job.deviceId===old);$('cloudFrame').hidden=true;$('cloudFrame').srcdoc='';$('cloudEmpty').hidden=false;renderDevices();save()};
window.SolarCloud={
 active,intervalMs(id){const seconds=Number(devices.get(id)?.descriptor?.mqtt?.interval_seconds);return Number.isInteger(seconds)&&seconds>=1&&seconds<=60?seconds*1000:1000},setView(id,view){if(id===selected&&typeof view==='string')activeView=view},
 registerPage:id=>iframeHtml(window.SOLAR_REGISTERS,id,true),
 async fetch(id,input,options={}){
  const url=new URL(String(input),'https://solar.invalid'),path=url.pathname;if(!path.startsWith('/api/')||path==='/api/firmware/upload')throw Error('API này chỉ có trên ESP32 trong LAN.');
  if(!active(id))throw Error('Tab hoặc thiết bị này chưa được mở để đọc dữ liệu.');const requestedView=activeView,entry=devices.get(id);if(!entry)throw Error('Thiết bị chưa có trong danh sách.');await hello(entry);if(!active(id,requestedView))throw Error('Đã chuyển menu hoặc dừng đọc thiết bị.');
  const method=String(options?.method||'GET').toUpperCase(),requestId=clientId+'_'+(++counter),args=Object.fromEntries(url.searchParams),headers=new Headers(options?.headers||{});let body='';
  if(options?.body){if(typeof options.body==='string'&&headers.get('Content-Type')?.startsWith('application/json'))body=options.body;else if(typeof options.body.entries==='function')for(const [key,value]of options.body.entries())args[key]=String(value);else for(const [key,value]of new URLSearchParams(String(options.body)))args[key]=value;}
  const estimate=(entry.clockUptime+(performance.now()-entry.clockAt)+30000)>>>0,nonce=entry.nonce,command={id:requestId,client_id:clientId,device_id:id,nonce,expires_ms:estimate,method,path,args,body,content_type:body?'application/json':'application/x-www-form-urlencoded'};
  const response=await request(entry,command,options?.signal);if(path==='/api/status'&&method==='GET'&&response.ok){try{const state=await response.clone().json();if(entry.nonce===nonce&&state.device_id===id){entry.state=state;if(Number.isInteger(state.uptime_ms)){entry.clockUptime=state.uptime_ms;entry.clockAt=performance.now()}entry.online=true;renderDevices()}}catch{}}
  return response;
 }
};
document.addEventListener('visibilitychange',()=>{if(!visible())clearPending('Tab đã ẩn; dừng tải dữ liệu MQTT.');noticeFrame()});
window.addEventListener('pagehide',()=>{pageGone=true;clearPending('Đã đóng trang.');noticeFrame();const old=client;client=null;connected=subscribed=false;if(old)old.end(true)});
window.addEventListener('pageshow',e=>{if(e.persisted){pageGone=false;if(configured&&config.username&&config.password)connect()}});
renderDevices();if(configured&&config.username&&config.password)connect();
})();
