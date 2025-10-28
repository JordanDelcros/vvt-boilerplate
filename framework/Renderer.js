import { Scene, WebGLRenderer, Vector2, NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping } from "three";
import { BaseScene, Configurator, EventManager, Mapping, Timer } from "#framework";

let INSTANCE = null;
let SCENE = null;

const GLOBAL_UNIFORMS = {
	currentTime: { value: 0 },
	deltaTime: { value: 0 },
	screen: { value: new Vector2() }
};

const IGNORED_MATERIAL_PROPERTIES = [];

let QUALITY = 1;

export default class Renderer {
	static get instance(){

		return INSTANCE;

	}
	static get domElement(){

		return INSTANCE.domElement;

	}
	static get scene(){

		return SCENE;

	}
	static get camera(){

		return SCENE?.camera;

	}
	static get uniforms(){

		return GLOBAL_UNIFORMS;

	}
	static setup( canvas, scene = null ){

		INSTANCE = new WebGLRenderer({
			canvas,
			antialias: false,
			alpha: true,
			powerPreference: "high-performance"
		});

		EventManager.on(window, "resize", Renderer.resize);

		Renderer.resize();

		if( Configurator.active ){

			const infoFolder = Configurator.addFolder("Info");
			infoFolder.addBinding(INSTANCE.info.render, "calls", {
				label: "drawcall",
				readonly: true
			});

			infoFolder.addBinding(INSTANCE.info.render, "triangles", {
				readonly: true
			});

			infoFolder.addBinding(INSTANCE.info.memory, "geometries", {
				readonly: true
			});

			infoFolder.addBinding(INSTANCE.info.memory, "textures", {
				readonly: true
			});

			const configFolder = Configurator.addFolder("Renderer");

			const toneMappings = {
				none: NoToneMapping,
				linear: LinearToneMapping,
				reinhard: ReinhardToneMapping,
				cineon: CineonToneMapping,
				acesfilmic: ACESFilmicToneMapping,
				agx: AgXToneMapping,
				neutral: NeutralToneMapping
			};

			configFolder.addBlade({
				view: "list",
				value: "none",
				options: [
					{ text: "none", value: "none" },
					{ text: "linear", value: "linear" },
					{ text: "reinhard", value: "reinhard" },
					{ text: "cineon", value: "cineon" },
					{ text: "aces filmic", value: "acesfilmic" },
					{ text: "agx", value: "agx" },
					{ text: "neutral", value: "neutral" }
				]
			}).on("change", ({ value }) => {

				INSTANCE.toneMapping = toneMappings[value];

			});

		}

		Renderer.setScene(scene ? scene : new BaseScene());

	}
	static setScene( scene ){

		if( !(scene instanceof BaseScene) ) return console.error("given scene is not an instance of BaseScene:", scene);

		SCENE?.dispose();

		SCENE = scene;

	}
	static setQuality( value ){

		QUALITY = Mapping.clamp(value, 0.01, 1);
		Renderer.resize();

	}
	static resize(){

		const width = window.innerWidth * QUALITY;
		const height = window.innerHeight * QUALITY;
		const pixelRatio = Math.min(QUALITY < 1 ? 1 : 2, window.devicePixelRatio);

		INSTANCE.setPixelRatio(pixelRatio);
		INSTANCE.setSize(width, height, false);

	}
	static compile( element ){

		INSTANCE.compile(Renderer.scene, Renderer.camera, element);

	}
	static update( currentTime, deltaTime ){

		Configurator.frameStart();

		GLOBAL_UNIFORMS.currentTime.value = currentTime;
		GLOBAL_UNIFORMS.deltaTime.value = deltaTime;

		SCENE.traverse(( element ) => {

			if( element.update instanceof Function ) element.update(currentTime, deltaTime);

		});

		INSTANCE.render(Renderer.scene, Renderer.camera);

		Configurator.frameEnd();

	}
	static disposeElement( element, remove = true ){

		if( element.isObject3D || element.isGroup ){

			Renderer.disposeGroup(element, remove);

		}
		else if( element.isMesh ){

			Renderer.disposeMesh(element, remove);

		}

	}
	static disposeGroup( group, remove = true ){

		const meshes = new Array();

		group.traverse(( element ) => {

			if( element.isMesh ) meshes.push(element);

		});

		for( let index = meshes.length - 1; index >= 0; index-- ){

			const element = meshes[index];
			if( element.isMesh ) Renderer.disposeMesh(element, remove);

		}

	}
	static disposeMesh( mesh, remove = true ){

		if( remove ) mesh.removeFromParent();

		Renderer.disposeGeometry(mesh.geometry);
		Renderer.disposeMaterial(mesh.material);

	}
	static disposeGeometry( geometry ){

		geometry.dispose();

	}
	static disposeMaterial( material, disposeMaterial = true, disposeMaps = true ){

		if( disposeMaps ){

			material.map?.dispose();
			material.normalMap?.dispose();
			material.roughnessMap?.dispose();
			material.metalnessMap?.dispose();
			material.aoMap?.dispose();
			material.bumpMap?.dispose();

			Object.assign(material, {
				map: null,
				normalMap: null,
				roughnessMap: null,
				metalnessMap: null,
				aoMap: null,
				bumpMap: null
			});

			if( material.uniforms ){

				for( let key in material.uniforms ){

					if( material.uniforms[key].value?.isTexture ){

						material.uniforms[key].value.dispose();
						material.uniforms[key].value = null;

					}

				}

			}

		}

		if( disposeMaterial ) material.dispose();

	}
	static copyMaterial( target, source ){

		Object.assign(target, {
			isMaterial: source.isMaterial,
			// type: source.type,
			blending: source.blending,
			side: source.side,
			vertexColors: source.vertexColors,
			opacity: source.opacity,
			transparent: source.transparent,
			alphaHash: source.alphaHash,
			blendSrc: source.blendSrc,
			blendDst: source.blendDst,
			blendEquation: source.blendEquation,
			blendSrcAlpha: source.blendSrcAlpha,
			blendDstAlpha: source.blendDstAlpha,
			blendEquationAlpha: source.blendEquationAlpha,
			blendColor: source.blendColor,
			blendAlpha: source.blendAlpha,
			depthFunc: source.depthFunc,
			depthTest: source.depthTest,
			depthWrite: source.depthWrite,
			stencilWriteMask: source.stencilWriteMask,
			stencilFunc: source.stencilFunc,
			stencilRef: source.stencilRef,
			stencilFuncMask: source.stencilFuncMask,
			stencilFail: source.stencilFail,
			stencilZFail: source.stencilZFail,
			stencilZPass: source.stencilZPass,
			stencilWrite: source.stencilWrite,
			clippingPlanes: source.clippingPlanes,
			clipIntersection: source.clipIntersection,
			clipShadows: source.clipShadows,
			shadowSide: source.shadowSide,
			colorWrite: source.colorWrite,
			precision: source.precision,
			polygonOffset: source.polygonOffset,
			polygonOffsetFactor: source.polygonOffsetFactor,
			polygonOffsetUnits: source.polygonOffsetUnits,
			dithering: source.dithering,
			alphaToCoverage: source.alphaToCoverage,
			premultipliedAlpha: source.premultipliedAlpha,
			forceSinglePass: source.forceSinglePass,
			allowOverride: source.allowOverride,
			visible: source.visible,
			toneMapped: source.toneMapped,
			userData: source.userData,
			version: source.version,
			isMeshStandardMaterial: source.isMeshStandardMaterial,
			color: source.color,
			roughness: source.roughness,
			metalness: source.metalness,
			map: source.map,
			lightMap: source.lightMap,
			lightMapIntensity: source.lightMapIntensity,
			aoMap: source.aoMap,
			aoMapIntensity: source.aoMapIntensity,
			emissive: source.emissive,
			emissiveIntensity: source.emissiveIntensity,
			emissiveMap: source.emissiveMap,
			bumpMap: source.bumpMap,
			bumpScale: source.bumpScale,
			normalMap: source.normalMap,
			normalMapType: source.normalMapType,
			normalScale: source.normalScale,
			displacementMap: source.displacementMap,
			displacementScale: source.displacementScale,
			displacementBias: source.displacementBias,
			roughnessMap: source.roughnessMap,
			metalnessMap: source.metalnessMap,
			alphaMap: source.alphaMap,
			envMap: source.envMap,
			envMapRotation: source.envMapRotation,
			envMapIntensity: source.envMapIntensity,
			wireframe: source.wireframe,
			wireframeLinewidth: source.wireframeLinewidth,
			wireframeLinecap: source.wireframeLinecap,
			wireframeLinejoin: source.wireframeLinejoin,
			flatShading: source.flatShading,
			fog: source.fog,
			// isMeshPhysicalMaterial: source.isMeshPhysicalMaterial,
			anisotropyRotation: source.anisotropyRotation,
			anisotropyMap: source.anisotropyMap,
			clearcoatMap: source.clearcoatMap,
			clearcoatRoughness: source.clearcoatRoughness,
			clearcoatRoughnessMap: source.clearcoatRoughnessMap,
			clearcoatNormalScale: source.clearcoatNormalScale,
			clearcoatNormalMap: source.clearcoatNormalMap,
			ior: source.ior,
			iridescenceMap: source.iridescenceMap,
			iridescenceIOR: source.iridescenceIOR,
			iridescenceThicknessRange: source.iridescenceThicknessRange,
			iridescenceThicknessMap: source.iridescenceThicknessMap,
			sheenColor: source.sheenColor,
			sheenColorMap: source.sheenColorMap,
			sheenRoughness: source.sheenRoughness,
			sheenRoughnessMap: source.sheenRoughnessMap,
			transmissionMap: source.transmissionMap,
			thickness: source.thickness,
			thicknessMap: source.thicknessMap,
			attenuationDistance: source.attenuationDistance,
			attenuationColor: source.attenuationColor,
			specularIntensity: source.specularIntensity,
			specularIntensityMap: source.specularIntensityMap,
			specularColor: source.specularColor,
			specularColorMap: source.specularColorMap
		});

	}
	static copyMaps( target, source ){

		target.map = source.map;
		target.normalMap = source.normalMap;
		target.roughnessMap = source.roughnessMap;
		target.metalnessMap = source.metalnessMap;
		target.aoMap = source.aoMap;
		target.bumpMap = source.bumpMap;

	}
	static dispose(){

		EventManager.off(window, "resize", Renderer.resize);

		const disposables = new Array();

		SCENE.traverse(( element ) => {

			if( element.dispose instanceof Function ) disposables.push(element);

		});

		for( const element of disposables ) element.dispose();

		INSTANCE.dispose();

	}
}
