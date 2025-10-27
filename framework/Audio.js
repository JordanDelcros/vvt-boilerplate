import { Assets, AudioEmitter, EventManager, Renderer } from "#framework";
import { AudioListener } from "three";

const LISTENER = new AudioListener();

const SUPPORTS_OPUS = (( audio ) => {

	return ["probably", "maybe"].includes(audio.canPlayType(`audio/webm; codec="opus"`));

})(document.createElement("audio"));

export default class Audio {
	static get supportsOpus(){

		return SUPPORTS_OPUS;

	}
	static get listener(){

		return LISTENER;

	}
	static get context(){

		return LISTENER.context;

	}
	static get destination(){

		return Audio.context.destination;

	}
	static get sampleRate(){

		return Audio.context.sampleRate;

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
	static setVolume( volume ){

		LISTENER.setMasterVolume(volume);

	}
	static setup( target, { volume = 1, pauseOffscreen = true } = {} ){

		Audio.listenFrom(Renderer.currentCamera);
		Audio.setVolume(volume);

		if( pauseOffscreen ){

			let originalVolume = volume;

			EventManager.on(document, "visibilitychange", () => {

				if( document.hidden ){

					originalVolume = Audio.volume;
					Audio.volume = 0;

				}
				else {

					Audio.volume = originalVolume;

				}

			});

		}

	}
	static createEmitter( target, options ){

		return new AudioEmitter(LISTENER, target, options);

	}
	static listenFrom( target ){

		target.add(LISTENER);

	}
	static rampMasterVolume( volume, duration = 1 ){

		const { currentTime } = Audio.context;

		LISTENER.gain.gain.exponentialRampToValueAtTime(volume, currentTime + duration);

	}
}
