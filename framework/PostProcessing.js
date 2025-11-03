import { Assets, Configurator, Renderer, PostProcessingPass } from "#framework";
import { BufferGeometry, BufferAttribute, Scene, WebGLRenderTarget, RGBAFormat, HalfFloatType, UnsignedShortType, OrthographicCamera, RawShaderMaterial, Mesh, DepthTexture, GLSL3, LinearFilter } from "three";

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

		this.scene = new Scene();

		this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

		this.passes = new Array();

		this.renderTargetSource = PostProcessing.createRenderTarget(["color", "normal"]);
		this.renderTargetA = PostProcessing.createRenderTarget(["color", "normal"]);
		this.renderTargetB = PostProcessing.createRenderTarget(["color", "normal"]);
		this.fxRenderTarget = PostProcessing.createRenderTarget(["blurColor", "blurNormal", "blurDepth", "ssao"], 0.25);

		this.fxPass = new PostProcessingPass({
			name: "fx",
			autoSource: false,
			source: this.renderTargetSource,
			target: this.fxRenderTarget,
			defines: {
				SAMPLES: 5,
				USE_NOISE: true
			},
			uniforms: {
				tDepth: { value: this.renderTargetSource.depthTexture },
				tNoise: { value: Assets.get("/maps/blue-noise.png") },
				radius: { value: 0.01 },
				noiseScale: { value: 10 },
				noiseForce: { value: 0.001 }
			},
			preprogram: `
				vec4 blurMap( sampler2D map, vec2 uv ){

					#ifdef USE_NOISE
					float ratio = screenSize.x / screenSize.y;
					vec4 dithering = texture(tNoise, fract(vUv * noiseScale * vec2(ratio, 1.0) + cos(currentTime * 0.5) + sin(currentTime * 0.5))) * noiseForce;
					#endif

					vec4 sum = vec4(0.0);

					float angleStep = 6.28318530718 / float(SAMPLES);
					float totalWeight = 0.0;

					for( int sampleIndex = 0; sampleIndex < SAMPLES; sampleIndex++) {

						float angle = float(sampleIndex) * angleStep;
						vec2 dir = vec2(cos(angle), sin(angle));

						sum += texture(map, vUv);
						totalWeight += 1.0;

						for( int r = 1; r <= 4; r++ ){

							float t = float(r) / 4.0;
							vec2 offset = dir * (t * radius);
							#ifdef USE_NOISE
							offset += dithering.rb;
							#endif
							sum += texture(map, vUv + offset);
							sum += texture(map, vUv - offset);
							totalWeight += 2.0;

						}
					}

					return sum / totalWeight;

				}
			`,
			program: `
				outBlurColor = blurMap(tColor, vUv);
				outBlurNormal = blurMap(tNormal, vUv);
				outBlurDepth = blurMap(tDepth, vUv);
				outSsao = vec4(0.0, 1.0, 0.0, 1.0);
			`
		});

		this.outputPass = new PostProcessingPass({
			name: "output",
			output: true,
			source: this.renderTargetSource,
			target: this.renderTargetB,
			defines: {
				OUTPUT: "color"
			},
			uniforms: {
				tBlurColor: { value: this.fxRenderTarget.textures[0] },
				tBlurNormal: { value: this.fxRenderTarget.textures[1] },
				tDepth: { value: this.renderTargetSource.depthTexture },
				tBlurDepth: { value: this.fxRenderTarget.textures[2] }
			},
			preprogram: `
				float linearizeDepth( float depth, float near, float far ){

					return (2.0 * near * far) / (far + near - (depth * 2.0 - 1.0) * (far - near));

				}
			`,
			program: `
				vec4 blurColor = texture(tBlurColor, vUv);
				vec4 blurNormal = texture(tBlurNormal, vUv);
				vec4 depth = texture(tDepth, vUv);
				depth.r = 1.0 - depth.r;
				vec4 blurDepth = texture(tBlurDepth, vUv);
				blurDepth.r = 1.0 - blurDepth.r;

				outColor = OUTPUT;
				outNormal = normal;
			`
		});

		this.scene.add(new Mesh(TRIANGLE, this.outputPass.material));

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
					{ text: "blur depth", value: "blurDepth" }
				]
			}).on("change", ({ value }) => {

				this.outputPass.material.defines.OUTPUT = value;
				this.outputPass.material.needsUpdate = true;

			});

		}

	}
	setSize( width, height, pixelRatio ){

		this.renderTargetSource.setSize(width * pixelRatio * this.renderTargetSource.resolution, height * pixelRatio * this.renderTargetSource.resolution);
		this.renderTargetA.setSize(width * pixelRatio * this.renderTargetA.resolution, height * pixelRatio * this.renderTargetA.resolution);
		this.renderTargetB.setSize(width * pixelRatio * this.renderTargetB.resolution, height * pixelRatio * this.renderTargetB.resolution);
		this.fxRenderTarget.setSize(width * this.fxRenderTarget.resolution, height * this.fxRenderTarget.resolution);

	}
	setToneMapping( toneMapping ){

		this.outputPass.setToneMapping(toneMapping);

	}
	addPass( passData ){

		passData.source ??= this.renderTargetA;
		passData.target ??= this.renderTargetB;

		passData.uniforms ??= {};

		Object.assign(passData.uniforms, {
			tBlurColor: { value: this.fxRenderTarget.textures[0] },
			tBlurNormal: { value: this.fxRenderTarget.textures[1] },
			tDepth: { value: this.renderTargetSource.depthTexture },
			tBlurDepth: { value: this.fxRenderTarget.textures[2] }
		});

		const pass = new PostProcessingPass(passData);

		this.passes.push(pass);

		return pass;

	}
	render(){

		// main
		Renderer.instance.setRenderTarget(this.renderTargetSource);
		Renderer.instance.render(Renderer.scene, Renderer.camera);

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
	static createRenderTarget( textures, resolution = 1 ){

		const renderTarget = new WebGLRenderTarget(1024 * resolution, 512 * resolution, {
			count: textures.length,
			samples: 0,
			format: RGBAFormat,
			type: HalfFloatType,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			generateMipmaps: false,
			depthBuffer: true,
			stencilBuffer: false,
			depthTexture: new DepthTexture()
		});

		renderTarget.resolution = resolution;

		for( let index = 0; index < textures.length; index++ ){

			renderTarget.textures[index].name = textures[index];

		}

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
