;((name,definition)=>{'undefined'!=typeof module?module.exports=definition():'function'==typeof define&&'object'==typeof define.amd?define(definition):this[name]=definition()})('streamSaver',()=>{'use strict'
let
iframe,loaded,secure=location.protocol=='https:'||location.hostname=='localhost',streamSaver={createWriteStream,supported:false,version:{full:'1.0.0',major:1,minor:0,dot:0}}
streamSaver.mitm='mitm.html?version='+streamSaver.version.full
try{streamSaver.supported=!!new ReadableStream()&&navigator.serviceWorker}catch(err){}
function createWriteStream(filename,queuingStrategy,size){if(Number.isFinite(queuingStrategy))
[size,queuingStrategy]=[queuingStrategy,size]
let channel=new MessageChannel,popup,setupChannel=()=>new Promise((resolve,reject)=>{channel.port1.onmessage=evt=>{if(evt.data.download){resolve()
if(!secure)popup.close()
let link=document.createElement('a')
let click=new MouseEvent('click')
link.href=evt.data.download
link.dispatchEvent(click)}}
if(secure&&!iframe){iframe=document.createElement('iframe')
iframe.src=streamSaver.mitm
iframe.hidden=true
document.body.appendChild(iframe)}
if(secure&&!loaded){let fn;iframe.addEventListener('load',fn=evt=>{loaded=true
iframe.removeEventListener('load',fn)
iframe.contentWindow.postMessage({filename,size},'*',[channel.port2])})}
if(secure&&loaded){iframe.contentWindow.postMessage({filename,size},'*',[channel.port2])}
if(!secure){popup=window.open(streamSaver.mitm,Math.random())
let onready=evt=>{if(evt.source===popup){popup.postMessage({filename,size},'*',[channel.port2])
removeEventListener('message',onready)}}
addEventListener('message',onready)}})
return new WritableStream({start(error){return setupChannel()},write(chunk){channel.port1.postMessage(chunk)},close(){channel.port1.postMessage('end')
console.log('All data successfully read!')},abort(e){channel.port1.postMessage('abort')}},queuingStrategy)}
return streamSaver})