import { Assets, Audio, Configurator, Input, PostProcessing, Renderer, Timer } from "#framework";
import MainScene from "#webgl/components/main-scene";
import { ACESFilmicToneMapping } from "three";
import finalePassProgram from "#webgl/shaders/programs/finale-program.glsl";
import finalePassPreprogram from "#webgl/shaders/programs/finale-preprogram.glsl";
import config from "#root/config.js";

export default class WebGL {
	constructor( canvas ){

		Renderer.setup(canvas);
		Renderer.instance.setClearColor(0x000000, 1);

		Audio.setup();
		Input.setup();
		Timer.setup();

		if( Configurator.active ){

			// Add some top-level confs here

		}

	}
	run(){

		this.scene = new MainScene();
		Renderer.setScene(this.scene, true);

		Renderer.setToneMapping(ACESFilmicToneMapping);

		// Finale pass
		Renderer.postProcessing.addPass({
			name: "finale",
			defines: {
				USE_BLUR: config.postprocessing.blur,
				USE_SSAO: config.postprocessing.ssao
			},
			uniforms: {
				...Renderer.uniforms,
				bloom: { value: 0.5 },
				fresnel: { value: 0.0 },
				vignetting: { value: 0.88 },
				vignettingBlur: { value: 0.7 },
				cameraNear: { value: 0.1 },
				cameraFar: { value: 100 },
				depthOfField: { value: 1 },
				focusNear: { value: 5 },
				focusNearRamp: { value: 5 },
				focusFar: { value: 30 },
				focusFarRamp: { value: 5 },
			},
			preprogram: finalePassPreprogram,
			program: finalePassProgram
		});

		Timer.add(this.update.bind(this));

	}
	update( currentTime, deltaTime ){

		Renderer.update(currentTime, deltaTime);

	}
	dispose(){

		Configurator.dispose();
		Renderer.dispose();
		Input.dispose();
		Timer.dispose();
		Assets.dispose();

	}
}
