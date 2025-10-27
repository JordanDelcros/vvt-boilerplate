import Assets from "./Assets.js";
import AudioManager from "./AudioManager.js";

const AUDIOS = new Object();

export default class AudioFX {
	static setup( files ){

		for( const name in files ){

			Assets.loadAudio(files[name]).then(( audioNode ) => {

				AUDIOS[name] = audioNode;

			});

		}

	}
	static async play( name, volume = 1, fade = 0, loop = false ){

		if( !AUDIOS[name] ) return;

		return await AUDIOS[name].play(1, 0, fade, volume, loop);

	}
	static dispose(){

		for( const name in AUDIOS ){

			AUDIOS[name].dispose();
			delete AUDIOS[name];

		}

	}
};
