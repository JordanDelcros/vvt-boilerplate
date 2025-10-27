import AudioManager from "./AudioManager.js";

export default class AudioNode {
	constructor( audioBuffer ){

		this.audioBuffer = audioBuffer;

		this.runnings = new Array();

	}
	async play( playbackRate = 1, delay = 0, fadeIn = 0, volume = 1, loop = false ){

		const source = await AudioManager.play(this.audioBuffer, playbackRate, delay, fadeIn, true, volume, loop);

		this.runnings.push(source);

		return source;

	}
	stop( fadeOut = 0 ){

		this.runnings.forEach(source => source.fadeOutStop(fadeOut));

	}
	dispose(){

		this.stop();

	}
}