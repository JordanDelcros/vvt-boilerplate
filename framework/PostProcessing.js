import { Assets, Configurator, Renderer, PostProcessingPass } from "#framework";
import { BufferGeometry, BufferAttribute, Scene, WebGLRenderTarget, Matrix4, RGBAFormat, HalfFloatType, UnsignedShortType, OrthographicCamera, RawShaderMaterial, Mesh, DepthTexture, GLSL3, NearestFilter } from "three";
import config from "#root/config.js";

const TRIANGLE = new BufferGeometry()
	.setAttribute("position", new BufferAttribute(new Float32Array([-2, 0, 0, 0, -2, 0, 2, 2, 0]), 3));

let CONFIGURATION_FOLDER = null

export default class PostProcessing {
	static get configurationFolder(){

		return CONFIGURATION_FOLDER;

	}
	constructor(){

		if( Configurator.active ){

			CONFIGURATION_FOLDER = Configurator.addFolder("Postprocessing");

		}

		this.isSetup = false;
		this.active = true;

		this.targetScene = Renderer.scene;

		this.scene = new Scene();
		this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

		this.renderTargets = new Array();
		this.passes = new Array();

		this.renderTargetSource = this.createRenderTarget(["color", "normal"]);
		this.renderTargetA = this.createRenderTarget(["color", "normal"], false);
		this.renderTargetB = this.createRenderTarget(["color", "normal"], false);
		this.fxRenderTarget = this.createRenderTarget([
			...(config.postProcessing.blur ? ["blurColor", "blurNormal", "blurDepth"] : []),
			...(config.postProcessing.ssao ? ["ssao"] : [])
		], false, 0.5);

		console.log({
				tDepth: { value: this.renderTargetSource.depthTexture },
				...(config.postProcessing.blur ? {
					tBlurColor: { value: this.fxRenderTarget.textures[0] },
					tBlurNormal: { value: this.fxRenderTarget.textures[1] },
					tBlurDepth: { value: this.fxRenderTarget.textures[2] }
				} : {}),
				...(config.postProcessing.ssao ? { tSsao: { value: this.fxRenderTarget.textures[3] } } : {})
			})

		this.outputPass = new PostProcessingPass({
			name: "output",
			output: true,
			source: this.renderTargetSource,
			target: this.renderTargetB,
			defines: {
				OUTPUT: "color",
				USE_BLUR: config.postProcessing.blur,
				USE_SSAO: config.postProcessing.ssao
			},
			uniforms: {
				tDepth: { value: this.renderTargetSource.depthTexture },
				...(config.postProcessing.blur ? {
					tBlurColor: { value: this.fxRenderTarget.textures[0] },
					tBlurNormal: { value: this.fxRenderTarget.textures[1] },
					tBlurDepth: { value: this.fxRenderTarget.textures[2] }
				} : {}),
				...(config.postProcessing.ssao ? { tSsao: { value: this.fxRenderTarget.textures[3] } } : {})
			},
			program: `
				vec4 depth = texture(tDepth, vUv);
				
				#ifdef USE_BLUR
				vec4 blurColor = texture(tBlurColor, vUv);
				vec4 blurNormal = texture(tBlurNormal, vUv);
				vec4 blurDepth = texture(tBlurDepth, vUv);
				blurDepth.r = 1.0 - blurDepth.r;
				#endif
				
				#ifdef USE_SSAO
				vec4 ssao = texture(tSsao, vUv);
				#endif

				outColor = OUTPUT;
				outNormal = normal;
			`
		});

		this.scene.add(new Mesh(TRIANGLE, this.outputPass.material));

	}
	setup({ toneMapping } = {}){

		if( this.isSetup ) return;

		this.isSetup = true;

		this.fxPass = new PostProcessingPass({
			name: "fx",
			autoSource: false,
			source: this.renderTargetSource,
			target: this.fxRenderTarget,
			defines: {
				USE_BLUR: config.postProcessing.blur,
				USE_SSAO: config.postProcessing.ssao,
				BLUR_SAMPLES: 5
			},
			uniforms: {
				...Renderer.uniforms,
				tDepth: { value: this.renderTargetSource.depthTexture },
				tNoise: { value: Assets.get("/maps/blue-noise.png") },
				cameraNear: { value: 0 },
				cameraFar: { value: 100 },
				projectionMatrix: { value: this.targetScene?.camera.projectionMatrix ?? new Matrix4() },
				inverseProjectionMatrix: { value: this.targetScene?.camera.projectionMatrixInverse ?? new Matrix4() },
				noiseScale: { value: 1 },
				blurRadius: { value: 10 },
				blurNoiseForce: { value: 0.005 },
				ssaoRadius: { value: 1.2 },
				ssaoStrength: { value: 1.5 },
				ssaoBias: { value: 0.1 },
				ssaoThreshold: { value: 50 }
			},
			preprogram: `
				#ifdef USE_SSAO
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

				float linearizeDepth( float depth, float near, float far ){

					return (2.0 * near * far) / (far + near - (depth * 2.0 - 1.0) * (far - near));

				}

				vec3 getViewPosition( vec2 screenPosition, float depth ){

					vec4 clipSpacePosition = vec4(screenPosition * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
					vec4 viewSpacePosition = inverseProjectionMatrix * clipSpacePosition;
					return viewSpacePosition.xyz / viewSpacePosition.w;

				}
				#endif

				#ifdef USE_BLUR
				const int M = 4;
				const float coeffs[M + 1] = float[M + 1](
					0.19947114020071635,
					0.17467622497531212,
					0.12098536225957168,
					0.06559408169628264,
					0.02780101304479639
				);

				vec4 blurMap( in sampler2D map, in vec2 uv, in vec2 noise) {
					vec2 texelSize = 1.0 / vec2(textureSize(map, 0));

					vec2 horizontal = vec2(texelSize.x, 0.0);
					vec2 vertical = vec2(0.0, texelSize.y);

					vec4 blurred = coeffs[0] * texture(map, uv + noise);

					for( int i = 1; i < 4; i += 2 ){
						float w0 = coeffs[i];
						float w1 = coeffs[i + 1];
						float w = w0 + w1;
						float offset = float(i) + w1 / w;
						
						blurred += w * texture(map, uv + horizontal * offset * blurRadius + noise);
						blurred += w * texture(map, uv - horizontal * offset * blurRadius + noise);

						blurred += w * texture(map, uv + vertical * offset * blurRadius + noise);
						blurred += w * texture(map, uv - vertical * offset * blurRadius + noise);
					}

					return blurred * 0.5;

				}
				#endif
			`,
			program: `
				float ratio = screenSize.x / screenSize.y;
				vec3 noise = texture(tNoise, fract(vUv * 5.0 * vec2(ratio, 1.0) + mod(currentTime * 0.01, 1.0))).xyz * 2.0 - 1.0;

				// blurs
				#ifdef USE_BLUR
				outBlurColor = blurMap(tColor, vUv, noise.rb * blurNoiseForce);
				outBlurNormal = blurMap(tNormal, vUv, noise.rb * blurNoiseForce);
				outBlurDepth = blurMap(tDepth, vUv, noise.rb * blurNoiseForce);
				#endif

				// ssao
				#ifdef USE_SSAO
				vec3 unpackedNormal = unpackRGBToNormal(texture(tNormal, vUv).rgb);
				float rawDepth = texture(tDepth, vUv).r;
				float linearDepth = linearizeDepth(rawDepth, cameraNear, cameraFar);

				float ssao = 1.0;
				if( rawDepth < 0.9999 && linearDepth < ssaoThreshold ){

					vec3 viewPos = getViewPosition(vUv, rawDepth);
					float depth = -viewPos.z;
					vec3 viewNormal = normalize((inverseProjectionMatrix * vec4(unpackedNormal, 0.0)).xyz);

					mat3 tbn;
					vec3 fallback = vec3(0.0, 0.0, -1.0);
					if( abs(dot(viewNormal, fallback)) > 0.95 ){
						vec3 up = abs(viewNormal.x) > 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
						vec3 tangent = normalize(cross(up, viewNormal));
						vec3 bitangent = cross(viewNormal, tangent);
						tbn = mat3(tangent, bitangent, viewNormal);
					}
					else {
						vec3 randomVec = normalize(noise * 2.0 - 1.0);
						randomVec.z = sqrt(max(0.0, 1.0 - randomVec.x*randomVec.x - randomVec.y*randomVec.y));
						vec3 tangent = normalize(randomVec - viewNormal * dot(randomVec, viewNormal));
						vec3 bitangent = cross(viewNormal, tangent);
						tbn = mat3(tangent, bitangent, viewNormal);
					}

					float dynamicRadius = ssaoRadius * clamp(depth / 10.0, 0.1, 3.0);

					float occlusion = 0.0;
					for( int i = 0; i < KERNEL_SIZE; i++ ){

						vec3 samplePos = tbn * SSAO_KERNEL[i];
						samplePos = viewPos + samplePos * dynamicRadius;

						vec4 offset = projectionMatrix * vec4(samplePos, 1.0);
						offset.xyz /= offset.w;
						offset.xy = offset.xy * 0.5 + 0.5;

						if( offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0 ) continue;

						float sampleRawDepth = texture(tDepth, offset.xy).r;
						if( sampleRawDepth >= 0.9999 ) continue;

						vec3 sampleViewPos = getViewPosition(offset.xy, sampleRawDepth);

						float rangeCheck = smoothstep(0.0, 1.0, dynamicRadius / abs(viewPos.z - sampleViewPos.z));
						float bias = ssaoBias * depth * 0.05;
						float occluded = smoothstep(0.0, 1.0, (sampleViewPos.z - samplePos.z - bias) / (bias * 4.0));

						occlusion += occluded * rangeCheck;

					}

					ssao = 1.0 - clamp(occlusion / float(KERNEL_SIZE) * ssaoStrength, 0.0, 1.0);

				}

				outSsao = vec4(vec3(ssao), 1.0);
				#endif
			`
		});

		if( toneMapping ) this.toneMapping(toneMapping);

		if( Configurator.active ){

			CONFIGURATION_FOLDER.addBlade({
				view: "list",
				value: "color",
				label: "output",
				options: [
					{ text: "color", value: "color" },
					{ text: "blur color", value: "blurColor" },
					{ text: "normal", value: "normal" },
					{ text: "blur normal", value: "blurNormal" },
					{ text: "depth", value: "depth" },
					{ text: "blur depth", value: "blurDepth" },
					...(config.postProcessing.ssao ? [{ text: "ssao", value: "ssao" }] : [])
				]
			}).on("change", ({ value }) => {

				this.outputPass.material.defines.OUTPUT = value;
				this.outputPass.material.needsUpdate = true;

			});

		}

	}
	setScene( scene ){

		this.targetScene = scene;

		if( this.isSetup ){

			this.fxPass.material.uniforms.cameraNear.value = scene.camera.near;
			this.fxPass.material.uniforms.cameraFar.value = scene.camera.far;
			this.fxPass.material.uniforms.projectionMatrix.value = scene.camera.projectionMatrix;
			this.fxPass.material.uniforms.inverseProjectionMatrix.value = scene.camera.projectionMatrixInverse;

		}

	}
	setSize( width, height, pixelRatio ){

		for( const renderTarget of this.renderTargets ){

			renderTarget.setSize(
				width * pixelRatio * renderTarget.resolution,
				height * pixelRatio * renderTarget.resolution
			);

		}

	}
	setToneMapping( toneMapping ){

		this.outputPass.setToneMapping(toneMapping);

	}
	addPass( passData ){

		passData.source ??= this.renderTargetA;
		passData.target ??= this.renderTargetB;

		passData.uniforms ??= {};

		Object.assign(passData.uniforms, {
			tDepth: { value: this.renderTargetSource.depthTexture },
			...(config.postProcessing.blur ? {
					tBlurColor: { value: this.fxRenderTarget.textures[0] },
					tBlurNormal: { value: this.fxRenderTarget.textures[1] },
					tBlurDepth: { value: this.fxRenderTarget.textures[2] }
				} : {}),
			...(config.postProcessing.ssao ? { tSsao: { value: this.fxRenderTarget.textures[3] } } : {})
		});

		const pass = new PostProcessingPass(passData);

		this.passes.push(pass);

		return pass;

	}
	render(){

		// main
		Renderer.instance.setRenderTarget(this.renderTargetSource);
		Renderer.instance.render(this.targetScene, this.targetScene.camera);

		// blur
		this.fxPass.render(this.scene, this.camera);

		let lastRenderTarget = this.renderTargetSource;
		// passes
		for( let index = 0; index < this.passes.length; index++ ){

			const renderTarget = index % 2 === 0 ? this.renderTargetB : this.renderTargetA;

			const pass = this.passes[index];
			pass.setSources(lastRenderTarget);
			pass.setTarget(renderTarget);
			pass.render(this.scene, this.camera);

			lastRenderTarget = renderTarget;

		}

		// output
		this.outputPass.setSources(lastRenderTarget);
		this.outputPass.render(this.scene, this.camera);

	}
	createRenderTarget( textures, useDepth = true, resolution = 1 ){

		const renderTarget = new WebGLRenderTarget(
			Math.round(Renderer.screenSize.x * resolution),
			Math.round(Renderer.screenSize.y * resolution),
			{
				count: textures.length,
				samples: 0,
				format: RGBAFormat,
				type: HalfFloatType,
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				generateMipmaps: false,
				depthBuffer: useDepth,
				stencilBuffer: false,
				depthTexture: useDepth ? new DepthTexture() : null
			}
		);

		renderTarget.resolution = resolution;

		for( let index = 0; index < textures.length; index++ ){

			renderTarget.textures[index].name = textures[index];

		}

		this.renderTargets.push(renderTarget);

		return renderTarget;

	}
	static patchMaterial( material ){

		material.onBeforeCompile = ( shader ) => PostProcessing.patchShader(shader);

	}
	static patchShader( shader ){

		if( !/<packing>/.test(shader.fragmentShader) ){

			shader.fragmentShader = shader.fragmentShader.replace("void main()", `
				vec3 packNormalToRGB( const in vec3 normal ){
					return normalize(normal) * 0.5 + 0.5;
				}

				void main()
			`);

		}

		if( !/#define STANDARD/.test(shader.vertexShader) ){

			shader.vertexShader = shader.vertexShader.replace("void main()", `
				varying vec3 vNormal;
				void main()
			`);
			shader.vertexShader = shader.vertexShader.replace(/}$/, `
				vNormal = normalize(normal);
				}
			`);

		}

		shader.fragmentShader = shader.fragmentShader
			.replace("void main()", `
				layout(location = 1) out vec4 outNormal;
				void main()
			`)
			.replace(/}$/, `
				outNormal = vec4(packNormalToRGB(vNormal), 1.0);
			}
			`);

	}
}
