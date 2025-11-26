import Assets from "./Assets.js";
import Configurator from "./Configurator.js";
import Renderer from "./Renderer.js";
import PostProcessingPass from "./PostProcessingPass.js";
import { BufferGeometry, BufferAttribute, Scene, WebGLRenderTarget, Vector3, Matrix4, RGBAFormat, HalfFloatType, UnsignedShortType, OrthographicCamera, RawShaderMaterial, Mesh, DepthTexture, GLSL3, NearestFilter } from "three";
import blueNoiseChunk from "#webgl/shaders/chunks/blue-noise.glsl?raw";
import blurMapChunk from "#webgl/shaders/chunks/blur-map.glsl?raw";
import SSAOChunk from "#webgl/shaders/chunks/ssao.glsl?raw";
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
		this.blurRenderTarget = this.createRenderTarget([...(config.postprocessing.blur ? ["blurColor", "blurNormal", "blurDepth"] : [])], false, 0.5);
		this.fxRenderTarget = this.createRenderTarget([
			...(config.postprocessing.blur ? ["blurColor", "blurNormal", "blurDepth"] : []),
			...(config.postprocessing.ssao ? ["ssao"] : [])
		], false, 0.5);

		this.useFx = this.fxRenderTarget.textures.length > 0;

		this.outputPass = new PostProcessingPass({
			name: "output",
			output: true,
			source: this.renderTargetSource,
			target: this.renderTargetB,
			defines: {
				OUTPUT: "color",
				USE_BLUR: config.postprocessing.blur,
				USE_SSAO: config.postprocessing.ssao
			},
			uniforms: {
				tDepth: { value: this.renderTargetSource.depthTexture },
				...(config.postprocessing.blur ? {
					tBlurColor: { value: this.getFxTexture("blurColor") },
					tBlurNormal: { value: this.getFxTexture("blurNormal") },
					tBlurDepth: { value: this.getFxTexture("blurDepth") }
				} : {}),
				...(config.postprocessing.ssao ? {
					tSsao: { value: this.getFxTexture("ssao") }
				} : {})
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

		if( this.useFx ){

			const blurSamples = config.postprocessing.blur && 32;
			const ssaoSamples = config.postprocessing.ssao && 32;

			const noiseMap = Assets.get("/noises/blue-noise.png");
			noiseMap.minFilter = NearestFilter;
			noiseMap.magFilter = NearestFilter;

			if( blurSamples ){

				this.blurPass = new PostProcessingPass({
					name: "pre-blur",
					autoSource: false,
					source: this.renderTargetSource,
					target: this.blurRenderTarget,
					defines: {
						BLUR_MAP_SAMPLES: blurSamples
					},
					uniforms: {
						tDepth: { value: this.renderTargetSource.depthTexture },
						tNoise: { value: noiseMap },
						blurRadius: { value: 0.001 },
						blurCoeffs: { value: PostProcessing.createSplittedCoeffsUniform(blurSamples) },
						blurNoiseForce: { value: 0.001 }
					},
					preprogram: `
						${ blurMapChunk }
					`,
					program: `
						float ratio = screenSize.x / screenSize.y;
						${ blueNoiseChunk }

						outBlurColor = blurMap(tColor, vUv, vec2(blurRadius, 0.0), noise.rb * blurNoiseForce);
						outBlurNormal = blurMap(tNormal, vUv, vec2(blurRadius, 0.0), noise.rb * blurNoiseForce);
						outBlurDepth = blurMap(tDepth, vUv, vec2(blurRadius, 0.0), noise.rb * blurNoiseForce);
					`
				});

			}

			const sources = {
				textures: [
					...this.renderTargetSource.textures,
					...(blurSamples ? this.blurRenderTarget.textures : [])
				]
			};

			this.fxPass = new PostProcessingPass({
				name: "fx",
				autoSource: false,
				source: sources,
				target: this.fxRenderTarget,
				defines: {
					USE_BLUR: config.postprocessing.blur,
					BLUR_MAP_SAMPLES: blurSamples,
					USE_SSAO: config.postprocessing.ssao,
					SSAO_SAMPLES: ssaoSamples
				},
				uniforms: {
					...Renderer.uniforms,
					tDepth: { value: this.renderTargetSource.depthTexture },
					tNoise: { value: noiseMap },
					...(config.postprocessing.blur ? {
						blurCoeffs: { value: PostProcessing.createSplittedCoeffsUniform(blurSamples) },
						blurRadius: { value: 0.001 },
						blurNoiseForce: { value: 0.001 }
					} : {}),
					...(config.postprocessing.ssao ? {
						viewMatrix: { value: this.targetScene?.camera.viewMatrix ?? new Matrix4() },
						projectionMatrix: { value: this.targetScene?.camera.projectionMatrix ?? new Matrix4() },
						viewMatrix: { value: this.targetScene?.camera.projectionMatrixInverse ?? new Matrix4() },
						ssaoKernel: { value: PostProcessing.createKernelUniform(ssaoSamples) },
						ssaoRadius: { value: 0.5 },
						ssaoStrength: { value: 2 },
						ssaoBias: { value: 0.15 }
					} : {})
				},
				preprogram: `
					#ifdef USE_BLUR
					${ blurMapChunk }
					#endif

					#ifdef USE_SSAO
					${ SSAOChunk }
					#endif
				`,
				program: `
					float ratio = screenSize.x / screenSize.y;
					${ blueNoiseChunk }

					// blurs
					#ifdef USE_BLUR
					outBlurColor = blurMap(tBlurColor, vUv, vec2(0.0, blurRadius), noise.rb * blurNoiseForce);
					outBlurNormal = blurMap(tBlurNormal, vUv, vec2(0.0, blurRadius), noise.rb * blurNoiseForce);
					outBlurDepth = blurMap(tBlurDepth, vUv, vec2(0.0, blurRadius), noise.rb * blurNoiseForce);
					#endif

					// ssao
					#ifdef USE_SSAO
					outSsao = ssao(noise);
					#endif
				`
			});

		}

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
					...(config.postprocessing.ssao ? [{ text: "ssao", value: "ssao" }] : [])
				]
			}).on("change", ({ value }) => {

				this.outputPass.material.defines.OUTPUT = value;
				this.outputPass.material.needsUpdate = true;

			});

		}

	}
	getFxTexture( name ){

		if( !this.useFx ) return null;

		return this.fxRenderTarget.textures.find(texture => texture.name === name);

	}
	setScene( scene ){

		this.targetScene = scene;

		if( this.isSetup && this.useFx && config.postprocessing.ssao ){

			this.fxPass.material.uniforms.projectionMatrix.value = scene.camera.projectionMatrix;
			this.fxPass.material.uniforms.viewMatrix.value = scene.camera.projectionMatrixInverse;

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
			...(config.postprocessing.blur ? {
				tBlurColor: { value: this.getFxTexture("blurColor") },
				tBlurNormal: { value: this.getFxTexture("blurNormal") },
				tBlurDepth: { value: this.getFxTexture("blurDepth") }
			} : {}),
			...(config.postprocessing.ssao ? {
				tSsao: { value: this.getFxTexture("ssao") }
			} : {})
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
		if( this.useFx ){

			this.blurPass?.render(this.scene, this.camera);
			this.fxPass.render(this.scene, this.camera);

		}

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
	static createSplittedCoeffsUniform( size, sigma ){

		if( size < 1 ) size = 1;
		if( !sigma ) sigma = 0.3 * size + 0.8;

		const coeffs = new Float32Array(size + 1);
		let sum = 0.0;

		for( let index = 0; index <= size; index++ ){

			const x = index / sigma;
			coeffs[index] = Math.exp(-0.5 * x * x);
			sum += (index === 0 ? 1 : 2) * coeffs[index];

		}

		for( let index = 0; index < coeffs.length; index++ ){

			coeffs[index] /= sum;

		}

		return coeffs;

	}
	static createKernelUniform( size = 32 ){

		const kernel = new Array();

		for( let index = 0; index < size; index++ ){

			const vector = new Vector3(
				Math.random() * 2 - 1,
				Math.random() * 2 - 1,
				Math.random()
			).normalize();

			let scale = index / size;
			vector.multiplyScalar(0.1 + 0.9 * (scale * scale));

			kernel.push(vector);

		}

		return kernel;

	}
	static patchMaterial( material ){

		material.onBeforeCompile = ( shader ) => PostProcessing.patchShader(shader);

		return material;

	}
	static patchShader( shader ){

		if( !/#define STANDARD/.test(shader.vertexShader) ){

			shader.vertexShader = shader.vertexShader.replace("void main() {", `
				varying vec3 vNormal;
				void main() {
			`);
			shader.vertexShader = shader.vertexShader.replace(/}$/, `
				vNormal = normalize(normal);
			}`);

		}

		shader.fragmentShader = shader.fragmentShader
			.replace("void main() {", `
				layout(location = 1) out vec4 outNormal;
				void main() {
			`)
			.replace(/}$/, `
				outNormal = vec4(normalize(vNormal) * 0.5 + 0.5, 1.0);
			}`);

		return shader;

	}
}
