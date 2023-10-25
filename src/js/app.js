const STATUS_ACTIVE = 'active';
const STATUS_IDLE = 'idle';
const STATUS_HIDDEN = 'hidden';
let DOC_HIDDEN;
let VISIBILITY_CHANGE_EVENT;

class _Events {
    #store = {};
    #setListener;

    constructor() {
        this._instance;
        if (!_Events._instance) {
            _Events._instance = this;
        }
        return _Events._instance;
    }

    attach (event, callback) {
        if (!this.#store[event]) {
            this.#store[event] = [];
        }
        this.#store[event].push(callback);
    }

    fire (event, args = []) {
        if (this.#store[event]) {
            this.#store[event].forEach(callback => {
                callback(...args);
            });
        }
    }

	remove(event, callback) {
		let _loc_store = []
        if (!callback) {
            delete this.#store[event];
        }
        if (this.#store[event]) {
            _loc_store = this.#store[event].filter(savedCallback => {
                return callback !== savedCallback;
			});
			this.#store = []
			this.#store = _loc_store;
        }
    }

    dom (element, event, callback) {
        if (!this.#setListener) {
            if (element.addEventListener) {
                this.#setListener = (el, ev, fn) => {
                    return el.addEventListener(ev, fn, false);
                };
            } else if (typeof element.attachEvent === 'function') {
                this.#setListener = (el, ev, fn) => {
                    return el.attachEvent(`on${ev}`, fn, false);
                };
            } else {
                this.#setListener = (el, ev, fn) => {
                    // eslint-disable-next-line no-return-assign, no-param-reassign
                    return el[`on${ev}`] = fn;
                };
            }
        }
        return this.#setListener(element, event, callback);
    }
}
const Events = new _Events();

class _Timer {
	#token;
	#stopped = false;
	#timeout;
	constructor(ifvisible, seconds = 1000, callback) {
		this._ifvisible = ifvisible;
		this._callback = callback;
		this._seconds = seconds;
		this.cancel;
		this._instance
		if (!_Timer._instance) {
			_Timer._instance = this
		}
		this.start();
		if (this._ifvisible) {
			this._ifvisible.on('statusChanged', data => {
				if (this.#stopped === false) {
					if (data.status === STATUS_ACTIVE) {
						this.start()
					} else {
						this.pause()
					}
				}
			})
		}
		return _Timer._instance;
	}
	get ifvisible() { return this._ifvisible; }
	set ifvisible(i) { return this._ifvisible = i; }
	get callback() { return this._callback; }
	set callback(c) { return this._callback = c; }
	start() {
		let self = this;
		this.#stopped = false;
		const accurateTimer = (fn, time = 1000) => {
			// nextAt is the value for the next time the timer should fire.
			// timeout holds the timeoutID so the timer can be stopped.
			let nextAt, timeout;
			// Initilzes nextAt as now + the time in milliseconds you pass
			// to accurateTimer.
			nextAt = new Date().getTime() + time;

			// This function schedules the next function call.
			const wrapper = () => {
				// The next function call is always calculated from when the
				// timer started.
				nextAt += time;
				// this is where the next setTimeout is adjusted to keep the
				//time accurate.
				self.#timeout = setTimeout(wrapper, nextAt - new Date().getTime());
				// the function passed to accurateTimer is called.
				fn();
			};

			// this function stops the timer.
			// const cancel = () => clearTimeout(self.#timeout);

			// the first function call is scheduled.
			if (self.#timeout) {
				clearTimeout(self.#timeout);
				this.#timeout = null;
			}
			self.#timeout = setTimeout(wrapper, nextAt - new Date().getTime());
			// the cancel function is returned so it can be called outside
			// accurateTimer.
			// return { cancel };
		};
		if (this.callback) {
			accurateTimer(this.callback, this.seconds);
		}

		// clearInterval(this.#token);
		// this.#token = setInterval(this.callback, this.seconds * 1000);
	}
	stop () {
		this.#stopped = true;
		// clearInterval(this.#token);
		if (this.#timeout) {
			clearTimeout(this.#timeout);
			this.#timeout = null;
		}
	}
	resume () {
		this.start();
	}
	pause () {
		this.stop();
	}
}
//

let IIdleInfo = {
 	 isIdle: false,
  	idleFor: 0,
	timeLeft: 0,
	timeLeftPer: 0
}
// eslint-disable-next-line func-names
const IE = (function () {
  	let undef;
  	let v = 3;
  	const div = document.createElement('div');
  	const all = div.getElementsByTagName('i');
  	// eslint-disable-next-line no-cond-assign
  	while (
		// eslint-disable-next-line no-plusplus, no-sequences
		div.innerHTML = `<!--[if gt IE ${++v}]><i></i><![endif]-->`,
		all[0]
	);
	return v > 4 ? v : undef;
}());

class IfVisible {
	#status = STATUS_ACTIVE;
	#VERSION = '2.0.11';
	#timers = [];
	#idleTime = 30000;
	#idleStartedTime = 0;
	#isLegacyModeOn = false;
	/**
	 * @name constructor
	 * @param {DOM root} root
	 * @param {Document} doc
	 */
	constructor(root, doc) {
		this.doc = doc;
		this.root = root;
		this.Events = new _Events;
		this._timer;
		if (!IfVisible._instance) {
			IfVisible._instance = this;
		}
		// Find correct browser events
		if (this.doc.hidden !== undefined) {
			DOC_HIDDEN = 'hidden';
			VISIBILITY_CHANGE_EVENT = 'visibilitychange';
		} else if (this.doc.mozHidden !== undefined) {
			DOC_HIDDEN = 'mozHidden';
			VISIBILITY_CHANGE_EVENT = 'mozvisibilitychange';
		} else if (this.doc.msHidden !== undefined) {
			DOC_HIDDEN = 'msHidden';
			VISIBILITY_CHANGE_EVENT = 'msvisibilitychange';
		} else if (this.doc.webkitHidden !== undefined) {
			DOC_HIDDEN = 'webkitHidden';
			VISIBILITY_CHANGE_EVENT = 'webkitvisibilitychange';
		}
		if (DOC_HIDDEN === undefined) {
			this.legacyMode();
		} else {
			const trackChange = () => {
				if (this.doc[DOC_HIDDEN]) {
					this.blur();
				} else {
					this.focus();
				}
			};
			trackChange(); // get initial status
			this.Events.dom(this.doc, VISIBILITY_CHANGE_EVENT, trackChange);
		}
		this.startIdleTimer();
		this.trackIdleStatus();
		return IfVisible._instance;
	}
	/**
	 * @name legacyMode
	 * @returns
	 */
	legacyMode () {
		// it's already on
		if (this.#isLegacyModeOn) { return; }

		let BLUR_EVENT = 'blur';
		const FOCUS_EVENT = 'focus';

		if (IE < 9) {
			BLUR_EVENT = 'focusout';
		}

		this.Events.dom(this.root, BLUR_EVENT, () => {
			return this.blur();
		});

		this.Events.dom(this.root, FOCUS_EVENT, () => {
			return this.focus();
		});

		this.#isLegacyModeOn = true;
	}
	/**
	 * @name startIdleTimer
	 * @param {Event} event
	 * @returns
	 */
	startIdleTimer (event) {
		//console.log(`start idle timer`);
		// Prevents Phantom events.
		// @see https://github.com/serkanyersen/ifvisible.js/pull/37
		if (event instanceof MouseEvent && event.movementX === 0 && event.movementY === 0) {
			return;
		}
		//console.log(`reset idle timer...`);
		this.#timers.map(clearTimeout);
		this.#timers.length = 0; // clear the array

		if (this.#status === STATUS_IDLE) {
			//console.log(`wakeup if idle...`)
			this.wakeup();
		}
		this.#idleStartedTime = +(new Date());
		this.#timers.push(setTimeout(() => {
			if (this.#status === STATUS_ACTIVE || this.#status === STATUS_HIDDEN) {
				//console.log(`set idle...`)
				return this.idle();
			}
		}, this.#idleTime));
	}
	/**
	 * @name trackIdleStatus
	 */
	trackIdleStatus () {
		this.Events.dom(this.doc, 'mousemove', this.startIdleTimer.bind(this));
		this.Events.dom(this.doc, 'mousedown', this.startIdleTimer.bind(this));
		this.Events.dom(this.doc, 'keyup', this.startIdleTimer.bind(this));
		this.Events.dom(this.doc, 'touchstart', this.startIdleTimer.bind(this));
		this.Events.dom(this.root, 'scroll', this.startIdleTimer.bind(this));
		// device orientation
		if (window.DeviceOrientationEvent) {
			// Chrome, Safari, Mozilla
			this.Events.dom(this.root, 'deviceorientation', this.startIdleTimer.bind(this));
		}

		// When page is focus without any event, it should not be idle.
		this.focus(this.startIdleTimer.bind(this));
	}
	/**
	 * @name on
	 * @param {event_string} event
	 * @param {function} callback
	 * @returns
	 */
	on (event, callback) {
		this.Events.attach(event, callback);
		return this;
	}
	/**
	 * @name off
	 * @param {event_string} event
	 * @param {function} callback
	 * @returns
	 */
	off(event, callback) {
		this.Events.remove(event, callback);
		return this;
	}
	/**
	 * @name setIdleDuration
	 * @param {number} seconds
	 * @returns
	 */
	setIdleDuration (seconds) {
		this.#idleTime = seconds * 1000;
		this.startIdleTimer();
		return this;
	}
	/**
	 * @name getIdleDuration
	 * @returns
	 */
	getIdleDuration () {
		return this.#idleTime;
	}
	/**
	 * @name getIdleInfo
	 */
	getIdleInfo () {
		const now = +(new Date());
		let res;
		// console.log({now})
		if (this.#status === STATUS_IDLE) {
			res = {
				isIdle: true,
				idleFor: now - this.#idleStartedTime,
				timeLeft: 0,
				timeLeftPer: 100,
			};
		} else {
			const timeLeft = (this.#idleStartedTime + this.#idleTime) - now;
			res = {
				isIdle: false,
				idleFor: now - this.#idleStartedTime,
				timeLeft,
				timeLeftPer: parseFloat((100 - (timeLeft * 100 / this.#idleTime)).toFixed(2)),
			};
		}
		return res;
	}
	/**
	 * @name idle
	 * @param {function} callback
	 * @returns
	 */
	idle (callback) {
		if (callback) {
			this.on('idle', callback);
		} else {
			this.#status = STATUS_IDLE;
			this.Events.fire('idle');
			this.Events.fire('statusChanged', [{ status: this.#status }]);
		}
		return this;
	}
	/**
	 * @name blur
	 * @param {function} callback
	 * @returns
	 */
	blur (callback) {
		if (callback) {
			this.on('blur', callback);
		} else {
			this.#status = STATUS_HIDDEN;
			this.Events.fire('blur');
			this.Events.fire('statusChanged', [{ status: this.#status }]);
		}
		return this;
	}
	/**
	 * @name focus
	 * @param {function} callback
	 * @returns
	 */
	focus (callback) {
		if (callback) {
			this.on('focus', callback);
		} else if (this.#status !== STATUS_ACTIVE) {
			this.#status = STATUS_ACTIVE;
			this.Events.fire('focus');
			this.Events.fire('wakeup');
			this.Events.fire('statusChanged', [{ status: this.#status }]);
		}
		return this;
	}
	/**
	 * @name wakeup
	 * @param {function} callback
	 * @returns
	 */
	wakeup (callback) {
		if (callback) {
			this.on('wakeup', callback);
		} else if (this.status !== STATUS_ACTIVE) {
			this.#status = STATUS_ACTIVE;
			this.Events.fire('wakeup');
			this.Events.fire('statusChanged', [{ status: this.#status }]);
		}
		return this;
	}
	/**
	 * @name onEvery
	 * @param {number} seconds
	 * @param {function} callback
	 * @returns new _Timer
	 */
	onEvery(seconds, callback) {
		if (!this._timer) {
			// delete this._timer;
			// this._timer = null;
			this._timer = new _Timer(this, seconds, callback)
		} else {
			delete this._timer;
			this._timer = null;
			this._timer = new _Timer(this, seconds, callback)
		}
		return this._timer;
	}
	/**
	 * @name now
	 * @param {boolean} check
	 * @returns status
	 */
	now (check) {
		if (typeof check !== 'undefined') {
			return this.#status === check;
		}
		return this.#status === STATUS_ACTIVE;
	}
}
//
$(function _Main() {
	$hh = $('.hh');
	$mm = $('.mm');
	$ss = $('.ss');
	$sep = $('.sep');
	$clock = $('.clock');
	let Events = new _Events();
	let ifvisible = new IfVisible(window, document);
	let DOC_HIDDEN, VISIBILITY_CHANGE_EVENT;
	let timeout, hidden = false, toggle = 1, timer;
	const updateClock = () => {
		let time = new Date().getTime();
		let dt = new Date(time);
		let hh, mm, ss, _ss;
		let cancelTimer;
		hh = dt.getHours();
		mm = dt.getMinutes();
		_ss = dt.getSeconds();
		ss = _ss;
		// format clock face elements
		hh = hh < 10 ? `0${hh}` : `${hh.toString(10)}`;
		mm = mm < 10 ? `0${mm}` : `${mm.toString(10)}`;
		ss = ss < 10 ? `0${ss}` : `${ss.toString(10)}`;
		if (_ss % 2) {
			$sep.addClass('off');
		} else {
			$sep.removeClass('off');
		}
		if ($clock.hasClass('inactive')) {
			$clock.removeClass('inactive');
		}
		$hh.text(hh);
		$mm.text(mm);
		$ss.text(ss);
	};
	ifvisible.on('blur', () => {
		if (timer) {
			timer.stop();
			delete timer;
			timer = null;
			if ($sep.hasClass('off')) {
				$sep.removeClass('off');
			}
			$clock.addClass('inactive');
			//
		}
	})
	ifvisible.on('focus', () => {
		updateClock();
		timer = ifvisible.onEvery(1, updateClock);
	})
	ifvisible.focus(function(){
		updateClock();
		timer = ifvisible.onEvery(1, updateClock);
	})
	ifvisible.blur(function(){
		if (timer) {
			timer.stop();
			delete timer;
			timer = null;
			if ($sep.hasClass('off')) {
				$sep.removeClass('off')
			}
			$clock.addClass('inactive');
		}
	})
	ifvisible.idle(function() {
		if (timer) {
			timer.stop();
			delete timer;
			timer = null;
			if ($sep.hasClass('off')) {
  				$sep.removeClass('off')
			}
			$clock.addClass('inactive');
		}
	})
	ifvisible.wakeup(function(){
		updateClock();
		timer = ifvisible.onEvery(1, updateClock);
	})
	// on load start the clock
	updateClock();
	timer = ifvisible.onEvery(1, updateClock);
	// window.ifvisible = ifvisible;
});
