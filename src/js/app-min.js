const STATUS_ACTIVE="active",STATUS_IDLE="idle",STATUS_HIDDEN="hidden";let DOC_HIDDEN,VISIBILITY_CHANGE_EVENT;class _Events{#store={};#setListener;constructor(){return this._instance,_Events._instance||(_Events._instance=this),_Events._instance}attach(event,callback){this.#store[event]||(this.#store[event]=[]),this.#store[event].push(callback)}fire(event,args=[]){this.#store[event]&&this.#store[event].forEach(callback=>{callback(...args)})}remove(event,callback){callback||delete this.#store[event],this.#store[event]&&(this.#store[event]=this.#store[event].filter(savedCallback=>callback!==savedCallback))}dom(element,event,callback){return this.#setListener||(element.addEventListener?this.#setListener=(el,ev,fn)=>el.addEventListener(ev,fn,!1):"function"==typeof element.attachEvent?this.#setListener=(el,ev,fn)=>el.attachEvent("on"+ev,fn,!1):this.#setListener=(el,ev,fn)=>el["on"+ev]=fn),this.#setListener(element,event,callback)}}const Events=new _Events;class _Timer{#token;#stopped=!1;constructor(ifvisible,seconds,callback){this.ifvisible=ifvisible,this.callback=callback,this.seconds=seconds,this.start(),this.ifvisible.on("statusChanged",data=>{!1===this.#stopped&&(data.status===STATUS_ACTIVE?this.start():this.pause())})}start(){this.#stopped=!1,clearInterval(this.#token),this.#token=setInterval(this.callback,1e3*this.seconds)}stop(){this.#stopped=!0,clearInterval(this.#token)}resume(){this.start()}pause(){this.stop()}}let IIdleInfo={isIdle:!1,idleFor:0,timeLeft:0,timeLeftPer:0};const IE=function(){let v=3;for(var div=document.createElement("div"),all=div.getElementsByTagName("i");div.innerHTML=`<!--[if gt IE ${++v}]><i></i><![endif]-->`,all[0];);return 4<v?v:void 0}();class IfVisible{#status=STATUS_ACTIVE;#VERSION="2.0.11";#timers=[];#idleTime=3e4;#idleStartedTime=0;#isLegacyModeOn=!1;constructor(root,doc){this.doc=doc,this.root=root,this.Events=new _Events,void 0!==this.doc.hidden?(DOC_HIDDEN="hidden",VISIBILITY_CHANGE_EVENT="visibilitychange"):void 0!==this.doc.mozHidden?(DOC_HIDDEN="mozHidden",VISIBILITY_CHANGE_EVENT="mozvisibilitychange"):void 0!==this.doc.msHidden?(DOC_HIDDEN="msHidden",VISIBILITY_CHANGE_EVENT="msvisibilitychange"):void 0!==this.doc.webkitHidden&&(DOC_HIDDEN="webkitHidden",VISIBILITY_CHANGE_EVENT="webkitvisibilitychange"),void 0===DOC_HIDDEN?this.legacyMode():((doc=()=>{this.doc[DOC_HIDDEN]?this.blur():this.focus()})(),this.Events.dom(this.doc,VISIBILITY_CHANGE_EVENT,doc)),this.startIdleTimer(),this.trackIdleStatus()}legacyMode(){if(!this.#isLegacyModeOn){let BLUR_EVENT="blur";IE<9&&(BLUR_EVENT="focusout"),this.Events.dom(this.root,BLUR_EVENT,()=>this.blur()),this.Events.dom(this.root,"focus",()=>this.focus()),this.#isLegacyModeOn=!0}}startIdleTimer(event){event instanceof MouseEvent&&0===event.movementX&&0===event.movementY||(this.#timers.map(clearTimeout),this.#timers.length=0,this.#status===STATUS_IDLE&&this.wakeup(),this.#idleStartedTime=+new Date,this.#timers.push(setTimeout(()=>{if(this.#status===STATUS_ACTIVE||this.#status===STATUS_HIDDEN)return this.idle()},this.#idleTime)))}trackIdleStatus(){this.Events.dom(this.doc,"mousemove",this.startIdleTimer.bind(this)),this.Events.dom(this.doc,"mousedown",this.startIdleTimer.bind(this)),this.Events.dom(this.doc,"keyup",this.startIdleTimer.bind(this)),this.Events.dom(this.doc,"touchstart",this.startIdleTimer.bind(this)),this.Events.dom(this.root,"scroll",this.startIdleTimer.bind(this)),this.focus(this.startIdleTimer.bind(this))}on(event,callback){return this.Events.attach(event,callback),this}off(event,callback){return this.Events.remove(event,callback),this}setIdleDuration(seconds){return this.#idleTime=1e3*seconds,this.startIdleTimer(),this}getIdleDuration(){return this.#idleTime}getIdleInfo(){var timeLeft,now=+new Date;let res;return res=this.#status===STATUS_IDLE?{isIdle:!0,idleFor:now-this.#idleStartedTime,timeLeft:0,timeLeftPer:100}:(timeLeft=this.#idleStartedTime+this.#idleTime-now,{isIdle:!1,idleFor:now-this.#idleStartedTime,timeLeft:timeLeft,timeLeftPer:parseFloat((100-100*timeLeft/this.#idleTime).toFixed(2))})}idle(callback){return callback?this.on("idle",callback):(this.#status=STATUS_IDLE,this.Events.fire("idle"),this.Events.fire("statusChanged",[{status:this.#status}])),this}blur(callback){return callback?this.on("blur",callback):(this.#status=STATUS_HIDDEN,this.Events.fire("blur"),this.Events.fire("statusChanged",[{status:this.#status}])),this}focus(callback){return callback?this.on("focus",callback):this.#status!==STATUS_ACTIVE&&(this.#status=STATUS_ACTIVE,this.Events.fire("focus"),this.Events.fire("wakeup"),this.Events.fire("statusChanged",[{status:this.#status}])),this}wakeup(callback){return callback?this.on("wakeup",callback):this.status!==STATUS_ACTIVE&&(this.#status=STATUS_ACTIVE,this.Events.fire("wakeup"),this.Events.fire("statusChanged",[{status:this.#status}])),this}onEvery(seconds,callback){return new _Timer(this,seconds,callback)}now(check){return void 0!==check?this.#status===check:this.#status===STATUS_ACTIVE}}$(function(){$hh=$(".hh"),$mm=$(".mm"),$ss=$(".ss"),$sep=$(".sep");new _Events;let ifvisible=new IfVisible(window,document),toggle=1,timer;const updateClock=()=>{var time=(new Date).getTime(),time=new Date(time);let hh,mm,ss;hh=time.getHours(),mm=time.getMinutes(),ss=time.getSeconds(),hh=hh<10?"0"+hh:""+hh.toString(10),mm=mm<10?"0"+mm:""+mm.toString(10),ss=ss<10?"0"+ss:""+ss.toString(10),0==toggle?$sep.addClass("off"):$sep.removeClass("off"),$hh.text(hh),$mm.text(mm),$ss.text(ss),toggle^=1};ifvisible.on("blur",()=>{timer&&(timer.stop(),delete timer,timer=null,0===toggle&&(toggle=1),updateClock())}),ifvisible.on("focus",()=>{timer=ifvisible.onEvery(1,updateClock)}),ifvisible.focus(function(){timer=ifvisible.onEvery(1,updateClock)}),ifvisible.blur(function(){timer&&(timer.stop(),delete timer,timer=null,0===toggle&&(toggle=1),updateClock())}),ifvisible.idle(function(){timer&&(timer.stop(),delete timer,timer=null,0===toggle&&(toggle=1),updateClock())}),ifvisible.wakeup(function(){timer=ifvisible.onEvery(1,updateClock)}),timer=ifvisible.onEvery(1,updateClock),window.ifvisible=ifvisible});