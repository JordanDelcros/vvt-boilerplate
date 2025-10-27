import Configurator from "./Configurator.js";

const USER_EVENTS = ["mouseup", "touchend"];

let READY = false;
let INSTANCE = null;
let GAIN_NODE = null;

const PENDING_AUDIO_SOURCES = new Array();
const RUNNING_AUDIO_SOURCES = new Array();

export default class AudioManager {
	static get instance(){

		return INSTANCE;

	}
	static get destination(){

		return GAIN_NODE;

	}
	static get currentTime(){

		return INSTANCE.currentTime;

	}
	static async setup(){

		INSTANCE = new AudioContext();

		GAIN_NODE = INSTANCE.createGain();
		GAIN_NODE.connect(INSTANCE.destination);

		READY = INSTANCE.state === "running";

		// Unlock audio from any user input
		if( !READY ){

			USER_EVENTS.forEach(event => window.addEventListener(event, AudioManager.unlock, { once: true }));

			// Run pending audios
			INSTANCE.onstatechange = () => {

				if( INSTANCE.state === "running" ){

					READY = true;

					INSTANCE.onstatechange = null;

					for( const { resolve, source } of PENDING_AUDIO_SOURCES ){

						RUNNING_AUDIO_SOURCES.push(source);
						AudioManager.startSource(source);
						resolve(source);

					}

					PENDING_AUDIO_SOURCES.length = 0;

				}

			}

		}

		if( Configurator.active ){

			const configFolder = Configurator.addFolder("audio");
			configFolder.addBinding(GAIN_NODE.gain, "value", { label: "volume", min: 0, max: 1 });
			configFolder.addButton({ title: "pause/resume" }).on("click", () => {

				if( INSTANCE.state === "running" ) INSTANCE.suspend();
				else INSTANCE.resume();

			});

		}

	}
	static play( audioBuffer, playbackRate = 1, delay = 0, fadeIn = 0, allowPending = true, volume = 1, loop = false ){

		return new Promise(( resolve, reject ) => {

			const gain = INSTANCE.createGain();
			gain.connect(AudioManager.destination);

			const source = INSTANCE.createBufferSource();
			source.buffer = audioBuffer;
			source.playbackRate.value = playbackRate;
			source.delay = delay;
			source.loop = loop;
			source.connect(gain);

			gain.gain.setValueAtTime(volume, 0);

			if( fadeIn !== 0 ){

				gain.gain.setValueAtTime(0, AudioManager.currentTime);
				gain.gain.linearRampToValueAtTime(1, AudioManager.currentTime + fadeIn);

			}

			source.fadeOutStop = ( fadeOut = 1 ) => {

				gain.gain.setValueAtTime(gain.gain.value, AudioManager.currentTime);
				gain.gain.linearRampToValueAtTime(0, AudioManager.currentTime + fadeOut);

				setTimeout(() => source.stop(), fadeOut * 1000);

			}

			source.onended = () => {

				source.onended = null;
				source.disconnect();
				RUNNING_AUDIO_SOURCES.splice(RUNNING_AUDIO_SOURCES.indexOf(source), 1);

			};

			if( READY ){

				INSTANCE.resume();
				RUNNING_AUDIO_SOURCES.push(source);
				AudioManager.startSource(source);
				resolve(source);

			}
			else if( allowPending ){

				PENDING_AUDIO_SOURCES.push({ resolve, source });

			}

		});

	}
	static suspend(){

		INSTANCE.suspend();

	}
	static resume(){

		INSTANCE.resume();

	}
	static startSource( source ){

		source.start(INSTANCE.currentTime + source.delay);

	}
	static async unlock(){

		console.log("unlock")

		if( READY ) return;

		if( navigator.audioSession ) navigator.audioSession.type = "playback";
		// else AudioManager.forceUnmutedSound();

		READY = true;

		INSTANCE.resume();

		USER_EVENTS.forEach(event => window.removeEventListener(event, AudioManager.unlock));

	}
	static dispose(){

		PENDING_AUDIO_SOURCES.forEach(( source ) => {
			source.disconnect();
		})
		PENDING_AUDIO_SOURCES.length = 0;
		
		RUNNING_AUDIO_SOURCES.forEach(( source ) => {
			source.stop();
			source.disconnect();
		});
		RUNNING_AUDIO_SOURCES.length = 0;

		USER_EVENTS.forEach(event => window.removeEventListener(event, AudioManager.unlock));

		GAIN_NODE.disconnect();
		GAIN_NODE = null;

		INSTANCE.close();
		INSTANCE = null;

		READY = false;

	}
}
