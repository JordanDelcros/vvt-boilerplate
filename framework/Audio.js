import { AudioNode, EventManager, Randomness, Renderer } from "#framework";
import { AudioListener, Object3D } from "three";

let READY = false;
const LISTENER = new AudioListener();
const REGISTERED_FX = new Object();
const PENDING_AUDIO_NODES = new Array();
const RUNNING_AUDIO_NODES = new Array();
let OFF_OFFSCREEN_PAUSE = null;
let OFF_STATE_CHANGE = null;

const SUPPORTS_OPUS = (( audio ) => {

	return ["probably", "maybe"].includes(audio.canPlayType(`audio/webm; codec="opus"`));

})(document.createElement("audio"));

export default class Audio {
	static get ready(){

		return READY;

	}
	static get supportsOpus(){

		return SUPPORTS_OPUS;

	}
	static get listener(){

		return LISTENER;

	}
	static get context(){

		return LISTENER.context;

	}
	static get state(){

		return Audio.context.state;

	}
	static get destination(){

		return LISTENER.getInput();

	}
	static get currentTime(){

		return Audio.context.currentTime;

	}
	static get volume(){

		return LISTENER.getMasterVolume();

	}
	static set volume( volume ){

		Audio.setVolume(volume);

	}
	static setup({ target = Renderer.camera, volume = 1, pauseOffscreen = true } = {}){

		READY = Audio.state === "running";

		Audio.listenFrom(target);
		Audio.setVolume(volume);

		if( pauseOffscreen ){

			let savedVolume = volume;

			OFF_OFFSCREEN_PAUSE = EventManager.on(document, "visibilitychange", () => {

				if( document.hidden ){

					savedVolume = Audio.volume;
					Audio.volume = 0;

				}
				else {

					Audio.volume = savedVolume;

				}

			});

		}

		OFF_STATE_CHANGE = EventManager.on(Audio.context, "statechange", () => {

			if( Audio.state === "running" ) OFF_STATE_CHANGE();

			READY = true;

			for( const { audioNode, options } of PENDING_AUDIO_NODES ){

				RUNNING_AUDIO_NODES.push(audioNode);

				audioNode.play(options);

			}

			PENDING_AUDIO_NODES.length = 0;

		});

	}
	static registerFX( fx ){

		for( const name in fx.metadata ){

			const audioNode = new AudioNode(fx.grouped);

			REGISTERED_FX[name] = {
				timings: fx.metadata[name],
				audioNode
			};

		}

	}
	static listenFrom( target ){

		if( !(target instanceof Object3D) ) throw new Error(`${ target } is not an instance of three.js Object3D`);

		target.add(LISTENER);

	}
	static setVolume( volume ){

		LISTENER.setMasterVolume(volume);

	}
	static play( target, options ){

		const audioNode = new AudioNode(target, options);

		if( !Audio.ready && options.allowPending ){

			PENDING_AUDIO_NODES.push({ audioNode, options });

		}
		else {

			RUNNING_AUDIO_NODES.push(audioNode);

			audioNode.play(options).then(() => {

				RUNNING_AUDIO_NODES.splice(RUNNING_AUDIO_NODES.indexOf(audioNode), 1);

			});

		}

		return audioNode;

	}
	static playFX( target, { index = null, volume = 1, speed = 1 } = {} ){

		const fx = REGISTERED_FX[target];

		if( !fx ) return console.error(`FX ${ target } is not registered`);

		index = index ?? Randomness.randomArrayIndex(fx.timings);
		const timing = fx.timings[index];
		
		fx.audioNode.play({
			volume,
			speed,
			seek: timing.start,
			duration: timing.end - timing.start,
		});

	}
	static unlock(){

		if( READY ) return;

		if( navigator.audioSession ) navigator.audioSession.type = "playback";

		READY = true;

		Audio.context.resume();

	}
	static dispose(){

		OFF_OFFSCREEN_PAUSE?.();
		OFF_STATE_CHANGE?.();

		PENDING_AUDIO_NODES.forEach(({ audioNode }) => {

			audioNode.dispose();

		});

		PENDING_AUDIO_NODES.length = 0;

		RUNNING_AUDIO_NODES.forEach(({ audioNode }) => {

			audioNode.dispose();

		});

		RUNNING_AUDIO_NODES.length = 0;

		READY = false;

	}
}
