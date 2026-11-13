(()=>{'use strict';
const $=id=>document.getElementById(id),storageKey='solarCloudV1',idOk=s=>/^[A-Za-z0-9_-]{1,80}$/.test(s);
const excluded=new Set();
const clientId='web_'+crypto.randomUUID().replaceAll('-','').slice(0,24),devices=new Map(),pending=new Map();
let client=null,connected=false,prefix='luxpower',selected='',counter=0,config={};
try{config=JSON.parse(localStorage.getItem(storageKey)||'{}')}catch{}
for(const id of config.excluded||[])if(idOk(id))excluded.add(id);
for(const [id,key]of [['cloudUrl','url'],['cloudUsername','username'],['cloudPrefix','prefix']])if(typeof config[key]==='string')$(id).value=config[key];
function message(text,error=false){$('cloudMessage').textContent=text;$('cloudMessage').dataset.error=String(error)}
function save(){const safe={url:$('cloudUrl').value.trim(),username:$('cloudUsername').value.trim(),prefix:$('cloudPrefix').value.trim(),selected,devices:[...devices.keys()],excluded:[...excluded]};try{localStorage.setItem(storageKey,JSON.stringify(safe))}catch{}}
function ensure(id){if(!idOk(id))return null;if(!devices.has(id))devices.set(id,{id,state:null,liveAt:0,online:false});return devices.get(id)}
if(typeof config.prefix==='string'&&/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(config.prefix))prefix=config.prefix;
for(const id of config.devices||[])ensure(id);selected=idOk(config.selected||'')?config.selected:'';
function fresh(entry){const interval=entry?.state?.mqtt?.interval_seconds||1;return connected&&entry?.online&&entry.liveAt>0&&performance.now()-entry.liveAt<Math.max(12000,interval*3000+5000)}
function renderDevices(){const frag=document.createDocumentFragment(),empty=document.createElement('option');empty.value='';empty.textContent='Chọn thiết bị ESP32…';frag.append(empty);for(const entry of devices.values()){const o=document.createElement('option');o.value=entry.id;const name=entry.state?.device_name||entry.id;o.textContent=(fresh(entry)?'● ':'○ ')+name+' · '+entry.id.slice(-6);frag.append(o)}$('cloudDevice').replaceChildren(frag);$('cloudDevice').value=devices.has(selected)?selected:'';$('cloudCount').textContent=devices.size+' thiết bị';$('cloudBadge').textContent=connected?'Đã nối EMQX':'Chưa kết nối';$('cloudBadge').dataset.online=String(connected);$('cloudDisconnect').disabled=!client;}
function iframeHtml(raw,id,registers=false){
 if(registers)raw=raw.replace('<body>','<body class="embedded">');
 const boot=`<script>window.SolarCloud=parent.SolarCloud;window.LUX_REMOTE={deviceId:${JSON.stringify(id)},registerPage:()=>window.SolarCloud.registerPage(${JSON.stringify(id)})};window.fetch=(url,opt)=>window.SolarCloud.fetch(${JSON.stringify(id)},url,opt);window.addEventListener('click',async e=>{const a=e.target.closest?.('a[href^="/api/"]');if(!a)return;e.preventDefault();const tab=window.open('about:blank','_blank');if(tab)tab.opener=null;try{const res=await fetch(a.getAttribute('href'));if(!res.ok)throw Error('Không đọc được API JSON');const url=URL.createObjectURL(new Blob([await res.text()],{type:'application/json;charset=utf-8'}));if(tab)tab.location=url;else{const link=document.createElement('a');link.href=url;link.download='solar-registers.json';link.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(error){if(tab)tab.document.body.textContent=error.message}});<\/script>`;
 return raw.replace('<head>','<head>'+boot).replace('__TOKEN__','mqtt-transport');
}
function choose(id){if(!devices.has(id))return;selected=id;$('cloudFrame').srcdoc=iframeHtml(window.SOLAR_DASHBOARD,id);$('cloudFrame').hidden=false;$('cloudEmpty').hidden=true;$('cloudFoot').hidden=true;$('cloudHelp').textContent='Thiết bị: '+id+' · Mỗi lệnh và phản hồi đều kiểm tra đúng Device ID.';renderDevices();save()}
$('cloudDevice').onchange=()=>{if($('cloudDevice').value)choose($('cloudDevice').value)};
$('cloudSettings').onclick=()=>{$('cloudConnectPanel').hidden=!$('cloudConnectPanel').hidden};
function clearPending(reason){for(const job of pending.values()){clearTimeout(job.timer);job.reject(Error(reason))}pending.clear()}
$('cloudDisconnect').onclick=()=>{if(client)client.end(true);client=null;connected=false;clearPending('Đã ngắt kết nối MQTT.');renderDevices();$('cloudConnectPanel').hidden=false;message('Đã ngắt kết nối.')};
function handleMessage(topic,payload,packet){
 if(payload.length>65536||!topic.startsWith(prefix+'/'))return;const tail=topic.slice(prefix.length+1),chunks=tail.split('/'),id=chunks[0];if(!idOk(id)||excluded.has(id))return;
 let data;try{data=JSON.parse(new TextDecoder().decode(payload))}catch{return}
 if(data.device_id!==id)return;
 if(chunks[1]==='state'&&chunks.length===2){const entry=ensure(id);entry.state=data;if(!packet.retain){entry.liveAt=performance.now();entry.online=true}renderDevices();if(!selected)choose(id);else if(selected===id&&$('cloudFrame').hidden)choose(id);return;}
 if(chunks[1]==='availability'&&chunks.length===2){const entry=ensure(id);entry.online=data.online===true;if(!entry.online)entry.liveAt=0;renderDevices();return;}
 if(chunks[1]==='rpc'&&chunks[2]==='response'&&chunks[3]===clientId&&chunks.length===4&&!packet.retain){
  const job=pending.get(id+'/'+data.id);if(!job||job.deviceId!==id||!Number.isInteger(data.part)||!Number.isInteger(data.parts)||data.parts<1||data.parts>32||data.part<0||data.part>=data.parts||typeof data.data!=='string'||data.data.length>4096||data.encoding!=='base64')return;
  if(job.parts!==null&&job.parts!==data.parts)return;job.parts=data.parts;job.code=data.status;try{job.chunks[data.part]=Uint8Array.from(atob(data.data),c=>c.charCodeAt(0))}catch{return}
  if(Object.keys(job.chunks).length!==job.parts)return;const bytes=Array.from({length:job.parts},(_,i)=>job.chunks[i]),length=bytes.reduce((n,b)=>n+b.length,0);if(length>65536)return;const merged=new Uint8Array(length);let offset=0;for(const part of bytes){merged.set(part,offset);offset+=part.length}const body=new TextDecoder().decode(merged);
  clearTimeout(job.timer);pending.delete(id+'/'+data.id);job.resolve(new Response(body,{status:Number.isInteger(job.code)?job.code:500,headers:{'Content-Type':'application/json'}}));
 }
}
$('cloudConnectForm').onsubmit=e=>{
 e.preventDefault();let url;try{url=new URL($('cloudUrl').value.trim());if(url.protocol!=='wss:'||url.username||url.password||url.hash)throw Error()}catch{message('Cần URL wss://hostname:8084/mqtt hợp lệ.',true);return}
 const nextPrefix=$('cloudPrefix').value.trim();if(!/^[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(nextPrefix)||nextPrefix.length>100){message('Prefix không có +/#, khoảng trắng hoặc dấu / ở đầu/cuối.',true);return}
 if(client)client.end(true);clearPending('Đang đổi kết nối MQTT.');connected=false;
 if(prefix!==nextPrefix){devices.clear();excluded.clear();selected='';$('cloudFrame').hidden=true;$('cloudEmpty').hidden=false}prefix=nextPrefix;
 for(const entry of devices.values()){entry.liveAt=0;entry.online=false}
 const instance=mqtt.connect(url.href,{protocolVersion:4,username:$('cloudUsername').value.trim(),password:$('cloudPassword').value,clientId,clean:true,reconnectPeriod:3000,connectTimeout:15000,keepalive:20,resubscribe:true});client=instance;message('Đang kết nối WSS…');save();renderDevices();
 instance.on('connect',()=>{if(client!==instance)return;connected=true;instance.subscribe([prefix+'/+/state',prefix+'/+/availability',prefix+'/+/rpc/response/'+clientId],{qos:1},(error,granted)=>{if(error||granted?.some(g=>g.qos===128)){message('EMQX từ chối đăng ký topic. Kiểm tra ACL/prefix và quyền Subscribe.'+(error?' '+error.message:''),true);return}message('Đã kết nối. Đang chờ dữ liệu mới từ ESP32.');$('cloudConnectPanel').hidden=true;if(selected&&devices.has(selected)&&$('cloudFrame').hidden)choose(selected)});renderDevices()});
 instance.on('message',(topic,payload,packet)=>{if(client===instance)handleMessage(topic,payload,packet)});
 instance.on('error',error=>{if(client===instance)message('Lỗi WSS/MQTT: '+error.message,true)});
 instance.on('close',()=>{if(client!==instance)return;connected=false;for(const entry of devices.values())entry.liveAt=0;clearPending('MQTT mất kết nối. Kiểm tra trạng thái trước khi gửi lại cài đặt.');renderDevices();message('Mất MQTT, đang tự kết nối lại…',true)});
};
$('cloudAdd').onclick=()=>{const id=$('cloudAddId').value.trim();if(!idOk(id)){message('Device ID chỉ có chữ/số, dấu _ hoặc -, tối đa 80 ký tự.',true);$('cloudConnectPanel').hidden=false;return}excluded.delete(id);ensure(id);$('cloudAddId').value='';choose(id)};
$('cloudRemove').onclick=()=>{if(!selected)return;excluded.add(selected);devices.delete(selected);selected='';$('cloudFrame').hidden=true;$('cloudFrame').srcdoc='';$('cloudEmpty').hidden=false;renderDevices();save()};
window.SolarCloud={
 registerPage:id=>iframeHtml(window.SOLAR_REGISTERS,id,true),
 async fetch(id,input,options={}){
  const url=new URL(String(input),'https://solar.invalid'),path=url.pathname;
  if(!path.startsWith('/api/')||path==='/api/firmware/upload')throw Error('API này chỉ có trên ESP32 trong LAN.');
  const entry=devices.get(id);if(!fresh(entry))throw Error('Chưa có dữ liệu trực tiếp của thiết bị '+id+'. Kiểm tra MQTT trên ESP32.');
  const method=String(options?.method||'GET').toUpperCase();
  if(path==='/api/status'&&method==='GET')return new Response(JSON.stringify(entry.state),{status:200,headers:{'Content-Type':'application/json'}});
  const requestId=clientId+'_'+(++counter),args=Object.fromEntries(url.searchParams),headers=new Headers(options?.headers||{});let body='';
  if(options?.body){if(typeof options.body==='string'&&headers.get('Content-Type')?.startsWith('application/json'))body=options.body;else if(typeof options.body.entries==='function')for(const [key,value]of options.body.entries())args[key]=String(value);else for(const [key,value]of new URLSearchParams(String(options.body)))args[key]=value;}
  const estimate=(entry.state.uptime_ms+(performance.now()-entry.liveAt)+30000)>>>0;
  const command={id:requestId,client_id:clientId,device_id:id,nonce:entry.state.mqtt.rpc_nonce,expires_ms:estimate,method,path,args,body,content_type:body?'application/json':'application/x-www-form-urlencoded'};
  return new Promise((resolve,reject)=>{const key=id+'/'+requestId,timer=setTimeout(()=>{pending.delete(key);reject(Error('Hết thời gian chờ ESP32. Đọc lại trạng thái trước khi gửi lại cài đặt.'))},25000);const job={resolve,reject,timer,deviceId:id,parts:null,chunks:{},code:500};pending.set(key,job);
   if(options?.signal){if(options.signal.aborted){clearTimeout(timer);pending.delete(key);reject(new DOMException('Aborted','AbortError'));return}options.signal.addEventListener('abort',()=>{if(pending.delete(key)){clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))}},{once:true})}
   client.publish(prefix+'/'+id+'/rpc/request',JSON.stringify(command),{qos:1,retain:false},error=>{if(error&&pending.delete(key)){clearTimeout(timer);reject(error)}});
  });
 }
};
renderDevices();setInterval(renderDevices,2000);
})();
