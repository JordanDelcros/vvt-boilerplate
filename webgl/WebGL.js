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
			name: "copypaste",
			program: `
				outColor = color;
				outColor.rgb = vec3(1.0) - outColor.rgb;
				outNormal = normal;
			`
		});

		const pass = Renderer.addPass({
			name: "fx",
			defines: {},
			uniforms: {
				aspect: { value: window.innerWidth / window.innerHeight },
				cameraNear: { value: this.scene.camera.near },
				cameraFar: { value: this.scene.camera.far },
				projectionMatrix: { value: this.scene.camera.projectionMatrix },
				inverseProjectionMatrix: { value: this.scene.camera.projectionMatrixInverse },
				veloute: { value: 0.05 },
				ssaoRadius: { value: 0.5 },
				ssaoStrength: { value: 1.0 },
				ssaoBias: { value: 0.01 },
				ssaoThreshold: { value: 50 }
			},
			preprogram: `

				float linearizeDepth( float depth, float near, float far ){

					return (2.0 * near * far) / (far + near - (depth * 2.0 - 1.0) * (far - near));

				}

				vec3 getViewPosition( vec2 screenPosition, float depth ){
					vec4 clipSpacePosition = vec4(screenPosition * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
					vec4 viewSpacePosition = inverseProjectionMatrix * clipSpacePosition;
					return viewSpacePosition.xyz / viewSpacePosition.w;
				}

				const int KERNEL_SIZE = 32;
				const vec3 SSAO_KERNEL[KERNEL_SIZE] = vec3[KERNEL_SIZE](
					vec3(0.04977, -0.04471, 0.04996),
					vec3(0.01457, 0.01653, 0.00224),
					vec3(-0.04065, -0.01937, 0.03193),
					vec3(0.01378, -0.09158, 0.04092),
					vec3(0.05599, 0.05979, 0.05766),
					vec3(0.09227, 0.04428, 0.01545),
					vec3(-0.10735, -0.06234, 0.06188),
					vec3(-0.08715, 0.03156, 0.06918),
					vec3(0.03774, -0.02742, 0.02002),
					vec3(-0.00086, -0.05653, 0.00019),
					vec3(0.01609, 0.00377, 0.00659),
					vec3(-0.02122, 0.02321, 0.02315),
					vec3(-0.05764, -0.13482, 0.06833),
					vec3(-0.15181, -0.08413, 0.12407),
					vec3(0.15193, 0.05302, 0.04687),
					vec3(-0.06122, -0.02021, 0.05006),
					vec3(0.00543, -0.00584, 0.00674),
					vec3(0.01027, -0.00361, 0.01683),
					vec3(-0.01753, 0.00847, 0.01045),
					vec3(-0.00934, -0.01904, 0.01651),
					vec3(0.18639, 0.11002, 0.12346),
					vec3(0.01315, 0.01936, 0.02574),
					vec3(-0.03949, -0.01089, 0.02835),
					vec3(0.01493, 0.03651, 0.02484),
					vec3(-0.04623, 0.02024, 0.01409),
					vec3(-0.03451, -0.03516, 0.03435),
					vec3(0.02524, 0.02076, 0.04482),
					vec3(-0.00556, -0.00848, 0.02042),
					vec3(0.17157, -0.16829, 0.11833),
					vec3(-0.10866, 0.06592, 0.05347),
					vec3(-0.01419, -0.13747, 0.07126),
					vec3(0.12352, 0.15173, 0.10208)
				);

			`,
			program: `
				vec3 unpackedNormal = unpackRGBToNormal(normal.rgb);

				float rawDepth = texture(tDepth, vUv).r;
				float linearDepth = linearizeDepth(rawDepth, cameraNear, cameraFar) / cameraFar;
				float depth = linearizeDepth(rawDepth, cameraNear, cameraFar);
				float blurDepth = linearizeDepth(texture(tBlurDepth, vUv).r, cameraNear, cameraFar) / cameraFar;

				vec4 blur = texture(tBlurColor, vUv);
				vec3 bluredNormal = unpackRGBToNormal(texture(tBlurNormal, vUv).rgb); 

				vec4 outputColor = vec4(1.0);

				// bloom
				outputColor.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - blur.rgb * veloute);

				// ssao
				float ssao = 1.0;
				if( rawDepth < 0.9999 && depth < ssaoThreshold ){
					
					// Generate random vector for sample rotation
					float noiseX = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
					float noiseY = fract(sin(dot(vUv, vec2(93.9898, 67.345))) * 43758.5453);
					vec3 randomVec = vec3(noiseX * 2.0 - 1.0, noiseY * 2.0 - 1.0, 0.0);

					// Reconstruct view space position from depth
					vec3 viewPos = getViewPosition(vUv, rawDepth);
					vec3 viewNormal = normalize((inverseProjectionMatrix * vec4(unpackedNormal, 0.0)).xyz);

					// Create TBN matrix
					vec3 tangent = normalize(randomVec - viewNormal * dot(randomVec, viewNormal));
					vec3 bitangent = cross(viewNormal, tangent);
					mat3 TBN = mat3(tangent, bitangent, viewNormal);

					float occlusion = 0.0;

					for( int i = 0; i < KERNEL_SIZE; i++ ){
						// Get sample position in view space
						vec3 samplePos = TBN * SSAO_KERNEL[i];
						samplePos = viewPos + samplePos * ssaoRadius;
						
						// Project sample to screen space
						vec4 offset = vec4(samplePos, 1.0);
						offset = projectionMatrix * offset;
						offset.xyz /= offset.w;
						offset.xy = offset.xy * 0.5 + 0.5;
						
						// Skip samples outside screen
						if( offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0 ) continue;
						
						// Get sample depth
						float sampleRawDepth = texture(tDepth, offset.xy).r;
						// float sampleRawDepth = blurDepth;
						
						// Skip background samples
						if( sampleRawDepth >= 0.9999 ) continue;
						
						vec3 sampleViewPos = getViewPosition(offset.xy, sampleRawDepth);
						
						// Range check: only occlude if sample is close enough
						float rangeCheck = smoothstep(0.0, 1.0, ssaoRadius / abs(viewPos.z - sampleViewPos.z));
						
						// Occlusion test: is the sample behind the surface?
						float occluded = step(samplePos.z, sampleViewPos.z - ssaoBias);
						
						occlusion += occluded * rangeCheck;
					}

					ssao = 1.0 - (occlusion / float(KERNEL_SIZE)) * ssaoStrength;
				}

				outputColor *= ssao;

				outColor = outputColor;
				outNormal = normal;
			`
		});

		// console.log(pass);

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
