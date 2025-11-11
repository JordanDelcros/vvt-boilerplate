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
		Renderer.setScene(this.scene, true);

		Renderer.setToneMapping(ACESFilmicToneMapping);

		Renderer.postProcessing.addPass({
			name: "post-fx",
			defines: {
				USE_BLUR: config.postprocessing.blur,
				USE_SSAO: config.postprocessing.ssao
			},
			uniforms: {
				...Renderer.uniforms,
				bloom: { value: 0.05 },
				fresnel: { value: 0.0 },
				vignetting: { value: 0.88 },
				vignettingBlur: { value: 0.7 }
			},
			preprogram: `
				const vec3 viewDirection = vec3(0.0, 0.0, -1.0);
			`,
			program: `
				vec3 unpackedNormal = unpackRGBToNormal(normal.xyz);
				vec4 outputColor = color;

				// rim
				float rim = max(dot(unpackedNormal * 2.0 - 1.0, viewDirection), 0.0);
				rim = smoothstep(0.0, 1.0, rim);
				outputColor.rgb += rim * fresnel;

				#ifdef USE_SSAO
				// ssao
				outputColor.rgb *= texture(tSsao, vUv).r;
				#endif

				#ifdef USE_BLUR
				vec4 blurColor = texture(tBlurColor, vUv);

				// bloom
				outputColor.rgb = mix(outputColor.rgb, blurColor.rgb, bloom);

				// vignetting
				float vignette = clamp(smoothstep(0.0, 0.15, distance(vUv, vec2(0.5)) / 5.0), 0.0, 1.0) * vignetting;
				outputColor.rgb = mix(outputColor.rgb, blurColor.rgb, vignette / (10.0 * (1.0 - vignettingBlur)));
				outputColor.rgb *= 1.0 - vignette;
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
