import { Assets, Audio, Configurator, Input, Renderer, Timer } from "#framework";
import MainScene from "#webgl/components/main-scene";
import { ACESFilmicToneMapping } from "three";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
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
		Renderer.setScene(this.scene);

		Renderer.setToneMapping(ACESFilmicToneMapping);

		Renderer.postProcessing.addPass({
			name: "fx",
			defines: {
				USE_BLOOM: config.postProcessing.blur,
				USE_SSAO: config.postProcessing.ssao
			},
			uniforms: {
				bloom: { value: 0.25 }
			},
			program: `

				vec4 outputColor = color;

				// ssao
				#ifdef USE_SSAO
				outputColor.rgb *= texture(tSsao, vUv).r;
				#endif

				// bloom
				#ifdef USE_BLOOM
				vec4 blur = texture(tBlurColor, vUv);
				outputColor.rgb = 1.0 - (1.0 - outputColor.rgb) * (1.0 - blur.rgb * bloom);
				#endif

				outColor = outputColor;
				outNormal = normal;
			`
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
