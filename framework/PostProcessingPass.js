import { Configurator, PostProcessing, Renderer } from "#framework";
import { RawShaderMaterial, ColorManagement, Vector2, Vector3, Vector4, Matrix2, Matrix3, Matrix4, Texture, GLSL3, NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping, SRGBTransfer } from "three";

export default class PostProcessingPass {
	static get vertexShader(){

		return ;

	}
	constructor({
		name = "pass",
		output = false,
		autoSource = true,
		source = {},
		target = {},
		defines = {},
		uniforms = {},
		preprogram = "",
		program = "outColor = texture(tColor, vUv);"
	}){

		Object.assign(this, {
			name,
			target,
			output
		});

		const layouts = new Object();

		for( const texture of target.textures ){

			layouts[texture.name] = texture;

		}

		for( const texture of source.textures ){

			layouts[texture.name] = texture;

		}

		this.layoutUniforms = Object.fromEntries(Object.keys(layouts).map(( name ) => {

			const uniformKey = "t" + String(name).charAt(0).toUpperCase() + String(name).slice(1);

			return [uniformKey, { value: layouts[name] }];

		}));

		uniforms = Object.assign({}, {
			...Renderer.uniforms,
			...this.layoutUniforms,
			...uniforms,
			resolution: { value: target.resolution }
		});

		this.material = new RawShaderMaterial({
			glslVersion: GLSL3,
			defines: {
				LINEAR_TONE_MAPPING: false,
				REINHARD_TONE_MAPPING: false,
				CINEON_TONE_MAPPING: false,
				ACES_FILMIC_TONE_MAPPING: false,
				AGX_TONE_MAPPING: false,
				NEUTRAL_TONE_MAPPING: false,
				CUSTOM_TONE_MAPPING: false,
				SRGB_TRANSFER: output && ColorManagement.getTransfer(Renderer.instance.outputColorSpace) === SRGBTransfer,
				...defines
			},
			uniforms: {
				...uniforms,
				...( this.output && { toneMappingExposure: { value: Renderer.instance.toneMappingExposure } } )
			},
			transparent: false,
			depthTest: false,
			depthWrite: false,
			vertexShader: `
				in vec3 position;

				out vec2 vUv;

				void main(){

					vUv = position.xy;
					gl_Position = vec4(2.0 * position.xy - 1.0, 0.0, 1.0);

				}
			`,
			fragmentShader: `
				precision highp float;
				precision highp int;

				in vec2 vUv;

				// auto layout
				${ Object.keys(layouts).map(( name, index ) => `layout(location = ${ index }) out vec4 out${ String(name).charAt(0).toUpperCase() + String(name).slice(1) };`).join("\n") }

				// auto uniforms
				${ Object.keys(uniforms).map(( key ) => {

					const type = typeof uniforms[key].value === "number" ? "float" :
						uniforms[key].value instanceof Vector2 ? "vec2" :
						uniforms[key].value instanceof Vector3 ? "vec3" :
						uniforms[key].value instanceof Vector4 ? "vec4" :
						uniforms[key].value instanceof Matrix4 ? "mat4" :
						uniforms[key].value instanceof Matrix3 ? "mat3" :
						uniforms[key].value instanceof Matrix2 ? "mat2" :
						uniforms[key].value instanceof Texture ? "sampler2D" : "float";

					return `uniform ${type} ${key};`;

				}).join("\n") }

				#include <packing>

				// output's required includes
				${ this.output ? `
					#include <colorspace_pars_fragment>
					#include <tonemapping_pars_fragment>
				` : "" }

				// preprogram
				${ preprogram }

				void main(){

					// autosource
					${ autoSource ? source.textures.map(texture => `vec4 ${ texture.name } = texture(t${ String(texture.name).charAt(0).toUpperCase() + String(texture.name).slice(1) }, vUv);`).join("\n") : "" }

					// program
					${ program }

					// tone mapping & color space
					${ this.output ? `
						#ifdef LINEAR_TONE_MAPPING
							outColor.rgb = LinearToneMapping(outColor.rgb);
						#elif defined( REINHARD_TONE_MAPPING )
							outColor.rgb = ReinhardToneMapping(outColor.rgb);
						#elif defined( CINEON_TONE_MAPPING )
							outColor.rgb = CineonToneMapping(outColor.rgb);
						#elif defined( ACES_FILMIC_TONE_MAPPING )
							outColor.rgb = ACESFilmicToneMapping(outColor.rgb);
						#elif defined( AGX_TONE_MAPPING )
							outColor.rgb = AgXToneMapping(outColor.rgb);
						#elif defined( NEUTRAL_TONE_MAPPING )
							outColor.rgb = NeutralToneMapping(outColor.rgb);
						#elif defined( CUSTOM_TONE_MAPPING )
							outColor.rgb = CustomToneMapping(outColor.rgb);
						#endif

						#ifdef SRGB_TRANSFER
							outColor = sRGBTransferOETF(outColor);
						#endif
					` : ""}

				}
			`
		});

		if( this.output ) this.setToneMapping(Renderer.instance.toneMapping);

		if( Configurator.active ){

			const folder = PostProcessing.configurationFolder.addFolder({ title: name });

			for( const name in this.material.uniforms ){

				if( !this.material.uniforms.hasOwnProperty(name) || Renderer.uniforms[name] === this.material.uniforms[name] || this.material.uniforms[name].value.isTexture || this.material.uniforms[name].value.isMatrix4 || this.material.uniforms[name].value.isMatrix3 || this.material.uniforms[name].value.isMatrix2 ) continue;

				folder.addBinding(this.material.uniforms[name], "value", { label: name });

			}

		}

	}
	setSources( renderTarget ){

		this.material.uniforms.tColor.value = renderTarget.textures[0];
		this.material.uniforms.tNormal.value = renderTarget.textures[1];

	}
	setTarget( renderTarget ){

		this.target = renderTarget;

	}
	setToneMapping( toneMapping ){

		Object.assign(this.material.defines, {
			LINEAR_TONE_MAPPING: this.output && toneMapping === LinearToneMapping,
			REINHARD_TONE_MAPPING: this.output && toneMapping === ReinhardToneMapping,
			CINEON_TONE_MAPPING: this.output && toneMapping === CineonToneMapping,
			ACES_FILMIC_TONE_MAPPING: this.output && toneMapping === ACESFilmicToneMapping,
			AGX_TONE_MAPPING: this.output && toneMapping === AgXToneMapping,
			NEUTRAL_TONE_MAPPING: this.output && toneMapping === NeutralToneMapping
		});

		this.material.needsUpdate = true;

	}
	render( scene, camera ){

		Renderer.instance.setRenderTarget(this.output ? null : this.target);
		scene.overrideMaterial = this.material;
		Renderer.instance.render(scene, camera);
		scene.overrideMaterial = null;

	}
}
