import EventManager from "./EventManager.js";

let INFO = null;

export default class Device {
	static get info(){
		return INFO;
	}
	static get type(){
		return Device.info.deviceType;
	}
	static get os(){
		return Device.info.os;
	}
	static get browser(){
		return Device.info.browser;
	}
	static get is(){
		return Device.info.is;
	}
	static update(){

		const userAgent = navigator.userAgent || navigator.vendor || window.opera;

		let deviceType = "desktop";
		if (/Mobi|Android/i.test(userAgent)) {
			deviceType = "mobile";
		}
		else if (/Tablet|iPad/i.test(userAgent)) {
			deviceType = "tablet";
		}

		const os = {
			name: "unknown",
			version: "unknown"
		};

		if (/Windows NT (\d+(?:\.\d+)?)/.test(userAgent)) {
			os.name = "windows";
			os.version = userAgent.match(/Windows NT (\d+(?:\.\d+)?)/)[1];
		}
		else if (/Mac OS X (\d+[_.]?\d*)/.test(userAgent)) {
			os.name = "macos";
			os.version = userAgent.match(/Mac OS X (\d+[_.]?\d*)/)[1].replace(/_/g, ".");
		}
		else if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) {
			os.name = "linux";
		}
		else if (/Android (\d+(?:\.\d+)?)/.test(userAgent)) {
			os.name = "android";
			os.version = userAgent.match(/Android (\d+(?:\.\d+)?)/)[1];
		}
		else if (/iPhone OS (\d+_?\d*)/.test(userAgent) || /iPad; CPU OS (\d+_?\d*)/.test(userAgent)) {
			os.name = "ios";
			os.version = (userAgent.match(/iPhone OS (\d+_?\d*)/) || userAgent.match(/iPad; CPU OS (\d+_?\d*)/))[1].replace(/_/g, ".");
		}

		const browser = {
			name: "unknown",
			version: "unknown"
		};

		if (/Chrome\/(\d+\.\d+\.\d+\.\d+)/.test(userAgent)) {
			browser.name = "chrome";
			browser.version = userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)[1];
		}
		else if (/Firefox\/(\d+(?:\.\d+)?)/.test(userAgent)) {
			browser.name = "firefox";
			browser.version = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1];
		}
		else if (/Version\/(\d+(?:\.\d+)?)/.test(userAgent) && /Safari\/(\d+)/.test(userAgent) && !/Chrome/.test(userAgent)) {
			browser.name = "safari";
			browser.version = userAgent.match(/Version\/(\d+(?:\.\d+)?)/)[1];
		}
		else if (/Edg\/(\d+(?:\.\d+)?)/.test(userAgent)) {
			browser.name = "edge";
			browser.version = userAgent.match(/Edg\/(\d+(?:\.\d+)?)/)[1];
		}
		else if (/OPR\/(\d+(?:\.\d+)?)/.test(userAgent)) {
			browser.name = "opera";
			browser.version = userAgent.match(/OPR\/(\d+(?:\.\d+)?)/)[1];
		}
		else if (/MSIE (\d+(?:\.\d+)?)/.test(userAgent) || /Trident.*rv:(\d+(?:\.\d+)?)/.test(userAgent)) {
			browser.name = "ie";
			browser.version = userAgent.match(/MSIE (\d+(?:\.\d+)?)/)?.[1] || userAgent.match(/Trident.*rv:(\d+(?:\.\d+)?)/)?.[1] || "unknown";
		}

		const supportsPointer = window.PointerEvent !== undefined;
		const supportsTouch = (supportsPointer && navigator.maxTouchePoints > 0) || "ontouchstart" in window;

		const strongRam = navigator.deviceMemory >= 8;
		const strongMemory = navigator.hardwareConcurrency >= 8;

		const is = {
			desktop: deviceType === "desktop",
			mobile: deviceType === "mobile",
			tablet: deviceType === "tablet",
			windows: os.name === "windows",
			macos: os.name === "macos",
			linux: os.name === "linux",
			android: os.name === "android",
			ios: os.name === "ios",
			chrome: browser.name === "chrome",
			firefox: browser.name === "firefox",
			safari: browser.name === "safari",
			edge: browser.name === "edge",
			opera: browser.name === "opera",
			ie: browser.name === "ie",
			pointer: supportsPointer,
			touch: supportsTouch,
			portrait: window.innerHeight > window.innerWidth,
			landscape: window.innerHeight < window.innerWidth,
			strong: strongRam && strongMemory,
			average: (strongRam || strongMemory) && !(!strongRam || !strongMemory) && !(strongRam && strongMemory),
			weak: !strongRam || !strongMemory
		};

		INFO = { deviceType, os, browser, is };

	}
};

EventManager.on(window, "resize", Device.update, { immediate: true, debounce: true });
