const STATUS_ACTIVE="active";const STATUS_IDLE="idle";const STATUS_HIDDEN="hidden";let DOC_HIDDEN;let VISIBILITY_CHANGE_EVENT;function _Events(){this.store={};this.setListener}_Events.prototype.attach=function(ev,cb=function(){}){if(!this.store[ev]){this.store[ev]=[]}this.store[ev].push(cb)};_Events.prototype.fire=function(ev,args=[]){if(this.store[ev]){this.store[ev].forEach(cb=>{cb(...args)})}};_Events.prototype.remove=function(ev,cb=function(){}){if(!cb){delete this.store[ev];this.store[ev]=null}if(this.store[ev]){this.store[ev]=this.store[ev].filter(savedCallback=>{return cb!==savedCallback})}};_Events.prototype.dom=function(elem,ev,cb=function(){}){if(!this.setListener){console.log(`dom setListener`);if(elem.addEventListener){console.log(`add`);this.setListener=function _domAddEvent(el,ev,fn){return el.addEventListener(ev,fn,false)}}else if(typeof elem.attachEvent==="function"){console.log(`attach`);this.setListener=function _attachEvent(el,ev,fn){return el.attachEvent(`on${ev}`,fn,false)}}else{console.log(`on`);this.setListener=function _onEvent(el,ev,fn){return el[`on${ev}`]=fn}}}else{console.log(`no dom listener`)}return this.setListener};const Events=new _Events;class _Timer{#token;#stopped=false;constructor(ifvisible,seconds,callback){this.ifvisible=ifvisible;this.callback=callback;this.seconds=seconds;this.start();this.ifvisible.on("statusChanged",data=>{if(this.#stopped===false){if(data.status===STATUS_ACTIVE){this.start()}else{this.pause()}}})}start(){this.#stopped=false;clearInterval(this.#token);this.#token=setInterval(this.callback,this.seconds*1e3)}stop(){this.#stopped=true;clearInterval(this.#token)}resume(){this.start()}pause(){this.stop()}}let IIdleInfo={isIdle:false,idleFor:0,timeLeft:0,timeLeftPer:0};const IE=function(){let undef;let v=3;const div=document.createElement("div");const all=div.getElementsByTagName("i");while(div.innerHTML=`<!--[if gt IE ${++v}]><i></i><![endif]-->`,all[0]);return v>4?v:undef}();class IfVisible{#status=STATUS_ACTIVE;#VERSION="2.0.11";#timers=[];#idleTime=3e4;#idleStartedTime=0;#isLegacyModeOn=false;constructor(root,doc){this.doc=doc;this.root=root;if(this.doc.hidden!==undefined){DOC_HIDDEN="hidden";VISIBILITY_CHANGE_EVENT="visibilitychange"}else if(this.doc.mozHidden!==undefined){DOC_HIDDEN="mozHidden";VISIBILITY_CHANGE_EVENT="mozvisibilitychange"}else if(this.doc.msHidden!==undefined){DOC_HIDDEN="msHidden";VISIBILITY_CHANGE_EVENT="msvisibilitychange"}else if(this.doc.webkitHidden!==undefined){DOC_HIDDEN="webkitHidden";VISIBILITY_CHANGE_EVENT="webkitvisibilitychange"}if(DOC_HIDDEN===undefined){this.legacyMode()}else{const trackChange=()=>{if(this.doc[DOC_HIDDEN]){this.blur()}else{this.focus()}};trackChange();Events.dom(this.doc,VISIBILITY_CHANGE_EVENT,trackChange)}this.startIdleTimer();this.trackIdleStatus()}legacyMode(){if(this.#isLegacyModeOn){return}let BLUR_EVENT="blur";const FOCUS_EVENT="focus";if(IE<9){BLUR_EVENT="focusout"}Events.dom(this.root,BLUR_EVENT,()=>{return this.blur()});Events.dom(this.root,FOCUS_EVENT,()=>{return this.focus()});this.#isLegacyModeOn=true}startIdleTimer(event){if(event instanceof MouseEvent&&event.movementX===0&&event.movementY===0){return}this.#timers.map(clearTimeout);this.#timers.length=0;if(this.#status===STATUS_IDLE){this.wakeup()}this.#idleStartedTime=+new Date;this.#timers.push(setTimeout(()=>{if(this.#status===STATUS_ACTIVE||this.#status===STATUS_HIDDEN){return this.idle()}},this.#idleTime))}trackIdleStatus(){Events.dom(this.doc,"mousemove",this.startIdleTimer.bind(this));Events.dom(this.doc,"mousedown",this.startIdleTimer.bind(this));Events.dom(this.doc,"keyup",this.startIdleTimer.bind(this));Events.dom(this.doc,"touchstart",this.startIdleTimer.bind(this));Events.dom(this.root,"scroll",this.startIdleTimer.bind(this));this.focus(this.startIdleTimer.bind(this))}on(event,callback){Events.attach(event,callback);return this}off(event,callback){Events.remove(event,callback);return this}setIdleDuration(seconds){this.#idleTime=seconds*1e3;this.startIdleTimer();return this}getIdleDuration(){return this.#idleTime}getIdleInfo(){const now=+new Date;let res;if(this.#status===STATUS_IDLE){res={isIdle:true,idleFor:now-this.idleStartedTime,timeLeft:0,timeLeftPer:100}}else{const timeLeft=this.idleStartedTime+this.idleTime-now;res={isIdle:false,idleFor:now-this.idleStartedTime,timeLeft:timeLeft,timeLeftPer:parseFloat((100-timeLeft*100/this.idleTime).toFixed(2))}}return res}idle(callback){if(callback){this.on("idle",callback)}else{this.#status=STATUS_IDLE;Events.fire("idle");Events.fire("statusChanged",[{status:this.#status}])}return this}blur(callback){if(callback){this.on("blur",callback)}else{this.#status=STATUS_HIDDEN;Events.fire("blur");Events.fire("statusChanged",[{status:this.#status}])}return this}focus(callback){if(callback){this.on("focus",callback)}else if(this.#status!==STATUS_ACTIVE){this.#status=STATUS_ACTIVE;Events.fire("focus");Events.fire("wakeup");Events.fire("statusChanged",[{status:this.#status}])}return this}wakeup(callback){if(callback){this.on("wakeup",callback)}else if(this.status!==STATUS_ACTIVE){this.#status=STATUS_ACTIVE;Events.fire("wakeup");Events.fire("statusChanged",[{status:this.#status}])}return this}onEvery(seconds,callback){return new _Timer(this,seconds,callback)}now(check){if(typeof check!=="undefined"){return this.#status===check}return this.#status===STATUS_ACTIVE}}$(function _Main(){$hh=$(".hh");$mm=$(".mm");$ss=$(".ss");$sep=$(".sep");let Events=new _Events;let ifvisible=new IfVisible(window,document);let DOC_HIDDEN,VISIBILITY_CHANGE_EVENT;let timeout,hidden=false,toggle=1;const updateClock=()=>{let time=(new Date).getTime();let dt=new Date(time);let hh,mm,ss;let cancelTimer;hh=dt.getHours();mm=dt.getMinutes();ss=dt.getSeconds();hh=hh<10?`0${hh}`:`${hh.toString(10)}`;mm=mm<10?`0${mm}`:`${mm.toString(10)}`;ss=ss<10?`0${ss}`:`${ss.toString(10)}`;if(toggle==0){$sep.addClass("off")}else{$sep.removeClass("off")}$hh.text(hh);$mm.text(mm);$ss.text(ss);toggle^=1};let timer=ifvisible.onEvery(1,updateClock);ifvisible.on("blur",()=>{if(timer){timer.pause()}});ifvisible.on("focus",()=>{if(timer){timer.resume()}})});