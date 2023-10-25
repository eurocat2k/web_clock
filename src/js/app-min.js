const STATUS_ACTIVE="active",STATUS_IDLE="idle",STATUS_HIDDEN="hidden";let DOC_HIDDEN,VISIBILITY_CHANGE_EVENT;class _Events{#store={};#setListener;constructor(){return this._instance,_Events._instance||(_Events._instance=this),_Events._instance}attach(t,e){this.#store[t]||(this.#store[t]=[]),this.#store[t].push(e)}fire(t,e=[]){this.#store[t]&&this.#store[t].forEach(t=>{t(...e)})}remove(t,e){e||delete this.#store[t],this.#store[t]&&(t=this.#store[t].filter(t=>e!==t),this.#store=[],this.#store=t)}dom(t,e,s){return this.#setListener||(t.addEventListener?this.#setListener=(t,e,s)=>t.addEventListener(e,s,!1):"function"==typeof t.attachEvent?this.#setListener=(t,e,s)=>t.attachEvent("on"+e,s,!1):this.#setListener=(t,e,s)=>t["on"+e]=s),this.#setListener(t,e,s)}}const Events=new _Events;class _Timer{#token;#stopped=!1;#timeout;constructor(t,e=1e3,s){return this._ifvisible=t,this._callback=s,this._seconds=e,this.cancel,this._instance,_Timer._instance||(_Timer._instance=this),this.start(),this._ifvisible&&this._ifvisible.on("statusChanged",t=>{!1===this.#stopped&&(t.status===STATUS_ACTIVE?this.start():this.pause())}),_Timer._instance}get ifvisible(){return this._ifvisible}set ifvisible(t){return this._ifvisible=t}get callback(){return this._callback}set callback(t){return this._callback=t}start(){let e=this;if(this.#stopped=!1,this.callback){var[s,i=1e3]=[this.callback,this.seconds];let t;t=(new Date).getTime()+i;const n=()=>{t+=i,e.#timeout=setTimeout(n,t-(new Date).getTime()),s()};e.#timeout&&(clearTimeout(e.#timeout),this.#timeout=null),e.#timeout=setTimeout(n,t-(new Date).getTime())}}stop(){this.#stopped=!0,this.#timeout&&(clearTimeout(this.#timeout),this.#timeout=null)}resume(){this.start()}pause(){this.stop()}}let IIdleInfo={isIdle:!1,idleFor:0,timeLeft:0,timeLeftPer:0};const IE=function(){let t=3;for(var e=document.createElement("div"),s=e.getElementsByTagName("i");e.innerHTML=`<!--[if gt IE ${++t}]><i></i><![endif]-->`,s[0];);return 4<t?t:void 0}();class IfVisible{#status=STATUS_ACTIVE;#VERSION="2.0.11";#timers=[];#idleTime=3e4;#idleStartedTime=0;#isLegacyModeOn=!1;constructor(t,e){return this.doc=e,this.root=t,this.Events=new _Events,this._timer,IfVisible._instance||(IfVisible._instance=this),void 0!==this.doc.hidden?(DOC_HIDDEN="hidden",VISIBILITY_CHANGE_EVENT="visibilitychange"):void 0!==this.doc.mozHidden?(DOC_HIDDEN="mozHidden",VISIBILITY_CHANGE_EVENT="mozvisibilitychange"):void 0!==this.doc.msHidden?(DOC_HIDDEN="msHidden",VISIBILITY_CHANGE_EVENT="msvisibilitychange"):void 0!==this.doc.webkitHidden&&(DOC_HIDDEN="webkitHidden",VISIBILITY_CHANGE_EVENT="webkitvisibilitychange"),void 0===DOC_HIDDEN?this.legacyMode():((e=()=>{this.doc[DOC_HIDDEN]?this.blur():this.focus()})(),this.Events.dom(this.doc,VISIBILITY_CHANGE_EVENT,e)),this.startIdleTimer(),this.trackIdleStatus(),IfVisible._instance}legacyMode(){if(!this.#isLegacyModeOn){let t="blur";IE<9&&(t="focusout"),this.Events.dom(this.root,t,()=>this.blur()),this.Events.dom(this.root,"focus",()=>this.focus()),this.#isLegacyModeOn=!0}}startIdleTimer(t){t instanceof MouseEvent&&0===t.movementX&&0===t.movementY||(this.#timers.map(clearTimeout),this.#timers.length=0,this.#status===STATUS_IDLE&&this.wakeup(),this.#idleStartedTime=+new Date,this.#timers.push(setTimeout(()=>{if(this.#status===STATUS_ACTIVE||this.#status===STATUS_HIDDEN)return this.idle()},this.#idleTime)))}trackIdleStatus(){this.Events.dom(this.doc,"mousemove",this.startIdleTimer.bind(this)),this.Events.dom(this.doc,"mousedown",this.startIdleTimer.bind(this)),this.Events.dom(this.doc,"keyup",this.startIdleTimer.bind(this)),this.Events.dom(this.doc,"touchstart",this.startIdleTimer.bind(this)),this.Events.dom(this.root,"scroll",this.startIdleTimer.bind(this)),window.DeviceOrientationEvent&&this.Events.dom(this.root,"deviceorientation",this.startIdleTimer.bind(this)),this.focus(this.startIdleTimer.bind(this))}on(t,e){return this.Events.attach(t,e),this}off(t,e){return this.Events.remove(t,e),this}setIdleDuration(t){return this.#idleTime=1e3*t,this.startIdleTimer(),this}getIdleDuration(){return this.#idleTime}getIdleInfo(){var t,e=+new Date;let s;return s=this.#status===STATUS_IDLE?{isIdle:!0,idleFor:e-this.#idleStartedTime,timeLeft:0,timeLeftPer:100}:(t=this.#idleStartedTime+this.#idleTime-e,{isIdle:!1,idleFor:e-this.#idleStartedTime,timeLeft:t,timeLeftPer:parseFloat((100-100*t/this.#idleTime).toFixed(2))})}idle(t){return t?this.on("idle",t):(this.#status=STATUS_IDLE,this.Events.fire("idle"),this.Events.fire("statusChanged",[{status:this.#status}])),this}blur(t){return t?this.on("blur",t):(this.#status=STATUS_HIDDEN,this.Events.fire("blur"),this.Events.fire("statusChanged",[{status:this.#status}])),this}focus(t){return t?this.on("focus",t):this.#status!==STATUS_ACTIVE&&(this.#status=STATUS_ACTIVE,this.Events.fire("focus"),this.Events.fire("wakeup"),this.Events.fire("statusChanged",[{status:this.#status}])),this}wakeup(t){return t?this.on("wakeup",t):this.status!==STATUS_ACTIVE&&(this.#status=STATUS_ACTIVE,this.Events.fire("wakeup"),this.Events.fire("statusChanged",[{status:this.#status}])),this}onEvery(t,e){return this._timer&&(delete this._timer,this._timer=null),this._timer=new _Timer(this,t,e),this._timer}now(t){return void 0!==t?this.#status===t:this.#status===STATUS_ACTIVE}}$(function(){$hh=$(".hh"),$mm=$(".mm"),$ss=$(".ss"),$sep=$(".sep"),$clock=$(".clock");new _Events;let t=new IfVisible(window,document),e;const s=()=>{var t=(new Date).getTime(),t=new Date(t);let e,s,i,n;e=t.getHours(),s=t.getMinutes(),n=t.getSeconds(),i=n,e=e<10?"0"+e:""+e.toString(10),s=s<10?"0"+s:""+s.toString(10),i=i<10?"0"+i:""+i.toString(10),n%2?$sep.addClass("off"):$sep.removeClass("off"),$clock.hasClass("inactive")&&$clock.removeClass("inactive"),$hh.text(e),$mm.text(s),$ss.text(i)};t.on("blur",()=>{e&&(e.stop(),delete e,e=null,$sep.hasClass("off")&&$sep.removeClass("off"),$clock.addClass("inactive"))}),t.on("focus",()=>{s(),e=t.onEvery(1,s)}),t.focus(function(){s(),e=t.onEvery(1,s)}),t.blur(function(){e&&(e.stop(),delete e,e=null,$sep.hasClass("off")&&$sep.removeClass("off"),$clock.addClass("inactive"))}),t.idle(function(){e&&(e.stop(),delete e,e=null,$sep.hasClass("off")&&$sep.removeClass("off"),$clock.addClass("inactive"))}),t.wakeup(function(){s(),e=t.onEvery(1,s)}),s(),e=t.onEvery(1,s)});