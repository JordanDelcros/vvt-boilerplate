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

		const pass = Renderer.postProcessing.addPass({
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
				vignettingBlur: { value: 0.7 },
				cameraNear: { value: 0.1 },
				cameraFar: { value: 100 },
				focusDistance: { value: 20 },
				focusSize: { value: 5 },
				focusFade: { value: 5 }
			},
			preprogram: `
				const vec3 viewDirection = vec3(0.0, 0.0, -1.0);

				float linearizeDepth( float depth ){

					float z = depth * 2.0 - 1.0;
					return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));

				}
			`,
			program: `
				vec3 unpackedNormal = unpackRGBToNormal(normal.xyz);
				vec4 outputColor = color;

				// rim
				float rim = max(dot(unpackedNormal * 2.0 - 1.0, viewDirection), 0.0);
				rim = smoothstep(0.0, 1.0, rim);
				outputColor.rgb += rim * fresnel;

				// ssao
				#ifdef USE_SSAO
				vec2 texel = 1.0 / vec2(textureSize(tSsao, 0));
				float ssao = 0.0;
				ssao += texture(tSsao, vUv + vec2(-0.5, -0.5) * texel).r;
				ssao += texture(tSsao, vUv + vec2(+0.5, -0.5) * texel).r;
				ssao += texture(tSsao, vUv + vec2(+0.5, +0.5) * texel).r;
				ssao += texture(tSsao, vUv + vec2(-0.5, +0.5) * texel).r;
				ssao /= 4.0;
				outputColor.rgb *= ssao;
				#endif

				#ifdef USE_BLUR
				vec4 blurColor = texture(tBlurColor, vUv);

				// Depth of field
				float depth = linearizeDepth(texture(tDepth, vUv).r);
				float dist = abs(depth - focusDistance);
				float focus = smoothstep(focusSize, focusSize + focusFade, dist);
				outputColor = mix(outputColor, blurColor, focus);

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

		console.log(pass)

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
