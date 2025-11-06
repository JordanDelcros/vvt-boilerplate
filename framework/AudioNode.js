import Assets from "./Assets.js";
import Audio from "./Audio.js";

export default class AudioNode {
	constructor( target ){

		Object.assign(this, {
			audioBuffer: target instanceof AudioBuffer ? target : Assets.get(target),
			runnings: new Array()
		});

	}
	async play({ volume = 1, loop = false, seek = 0, delay = 0, fadeIn = 0, fadeOut = 0, duration = null, speed = 1 } = {} ){

		return new Promise(( resolve, reject ) => {

			if( !this.audioBuffer ) reject("Missing audio buffer");

			try {

				const gain = Audio.context.createGain();
				gain.connect(Audio.destination);

				const source = Audio.context.createBufferSource();
				source.buffer = this.audioBuffer;
				source.playbackRate.value = speed;
				source.loop = loop;
				source.connect(gain);

				if( fadeIn > 0 ){

					gain.gain.setValueAtTime(0, Audio.currentTime + delay);
					gain.gain.linearRampToValueAtTime(volume, Audio.currentTime + delay + fadeIn);

				}

				source.fadeOutStop = ( fadeOut = 0 ) => {

					gain.gain.setValueAtTime(gain.gain.value, Audio.currentTime);
					gain.gain.linearRampToValueAtTime(0, Audio.currentTime + fadeOut);

					setTimeout(() => source.stop(), fadeOut * 1000);

				};

				source.onended = () => {

					this.runnings.splice(this.runnings.indexOf(source), 1);

					source.onended = null;
					source.disconnect();

					resolve(source);

				};

				Audio.context.resume();

				this.runnings.push(source);

				source.start(Audio.currentTime + delay, seek, duration || source.duration);

			}
			catch( error ){

				reject(error.message);

			}

		});

	}
	stop( fadeOut = 0 ){

		this.runnings.forEach(source => source.fadeOutStop(fadeOut))

	}
}
