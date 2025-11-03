import { Assets, Audio, Configurator, Input, Renderer, Timer } from "#framework";
import MainScene from "#webgl/components/main-scene";
import { ACESFilmicToneMapping } from "three";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

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

		Renderer.addPass({
			name: "fx",
			defines: {},
			uniforms: {
				veloute: { value: 0.2 }
			},
			program: `
				vec3 unpackedNormal = unpackRGBToNormal(normal.rgb);

				vec4 blur = texture(tBlurColor, vUv);
				// vec3 bluredNormal = unpackRGBToNormal(texture(tBlurNormal, vUv).rgb);

				vec4 outputColor = color;

				// bloom
				// outputColor.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - blur.rgb * veloute);

				// ssao
				outputColor.rgb *= texture(tSsao, vUv).r;

				outColor = outputColor;
				outNormal = normal;
			`
		});

		Renderer.setToneMapping(ACESFilmicToneMapping);

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
