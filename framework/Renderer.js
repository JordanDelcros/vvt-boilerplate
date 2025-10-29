import { BaseScene, Configurator, EventManager, Mapping, Timer } from "#framework";
import { Scene, WebGLRenderer, Vector2, NoColorSpace, SRGBColorSpace, LinearSRGBColorSpace, NoToneMapping, LinearToneMapping, ReinhardToneMapping, CineonToneMapping, ACESFilmicToneMapping, AgXToneMapping, NeutralToneMapping } from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import config from "#root/config.js";

let INSTANCE = null;
let SCENE = null;

const SCREEN_SIZE = new Vector2();
const GLOBAL_UNIFORMS = {
	currentTime: { value: 0 },
	deltaTime: { value: 0 },
	screenSize: { value: SCREEN_SIZE }
};

const IGNORED_MATERIAL_PROPERTIES = [];

let QUALITY = 1;
let USE_POSTPROCESSING = false;
let POSTPROCESSING = null;
let DEBUG_FOLDERS = {
	info: null,
	renderer: null,
	postprocessing: null
};

export default class Renderer {
	static get instance(){

		return INSTANCE;

	}
	static get domElement(){

		return Renderer.instance.domElement;

	}
	static get scene(){

		return SCENE;

	}
	static get camera(){

		return SCENE?.camera;

	}
	static get screenSize(){

		return SCREEN_SIZE;

	}
	static get uniforms(){

		return GLOBAL_UNIFORMS;

	}
	static get usePostprocessing(){

		return USE_POSTPROCESSING;

	}
	static set usePostprocessing( value ){

		USE_POSTPROCESSING = value;
		if( Configurator.active && !DEBUG_FOLDERS.postprocessing ) DEBUG_FOLDERS.postprocessing = Configurator.addFolder("Postprocessings");
		Configurator.refresh();

	}
	static setup( canvas, scene = null ){

		INSTANCE = new WebGLRenderer({
			canvas,
			antialias: config.renderer.antialias,
			alpha: true,
			powerPreference: "high-performance"
		});

		EventManager.on(window, "resize", Renderer.resize);

		Renderer.resize();

		if( Configurator.active ){

			DEBUG_FOLDERS.info = Configurator.addFolder("Info");
			DEBUG_FOLDERS.info.addBinding(Renderer.instance.info.render, "calls", {
				label: "drawcall",
				readonly: true
			});

			DEBUG_FOLDERS.info.addBinding(Renderer.instance.info.render, "triangles", {
				readonly: true
			});

			DEBUG_FOLDERS.info.addBinding(Renderer.instance.info.memory, "geometries", {
				readonly: true
			});

			DEBUG_FOLDERS.info.addBinding(Renderer.instance.info.memory, "textures", {
				readonly: true
			});

			DEBUG_FOLDERS.renderer = Configurator.addFolder("Renderer");

			DEBUG_FOLDERS.renderer.addBlade({
				view: "list",
				value: 1,
				label: "quality",
				options: [
					{ text: "high", value: 1 },
					{ text: "medium", value: 0.5 },
					{ text: "low", value: 0.25 }
				]
			}).on("change", ({ value }) => {

				Renderer.setQuality(value);

			});

			const outputColorSpace = {
				srgb: SRGBColorSpace,
				linear: LinearSRGBColorSpace
			};

			DEBUG_FOLDERS.renderer.addBlade({
				view: "list",
				value: "srgb",
				label: "color space",
				options: [
					{ text: "srgb", value: "srgb" },
					{ text: "linear", value: "linear" }
				]
			}).on("change", ({ value }) => {

				Renderer.instance.outputColorSpace = outputColorSpace[value];

			});

			const toneMappings = {
				none: NoToneMapping,
				linear: LinearToneMapping,
				reinhard: ReinhardToneMapping,
				cineon: CineonToneMapping,
				acesfilmic: ACESFilmicToneMapping,
				agx: AgXToneMapping,
				neutral: NeutralToneMapping
			};

			DEBUG_FOLDERS.renderer.addBlade({
				view: "list",
				value: "none",
				label: "tone mapping",
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

				Renderer.instance.toneMapping = toneMappings[value];

			});

			DEBUG_FOLDERS.renderer.addBinding(Renderer, "usePostprocessing");

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

		Renderer.screenSize.set(width, height);

		Renderer.instance.setPixelRatio(pixelRatio);
		Renderer.instance.setSize(width, height, false);

		if( POSTPROCESSING ) POSTPROCESSING.setSize(width, height);

	}
	static compile( element ){

		Renderer.instance.compile(Renderer.scene, Renderer.camera, element);

	}
	static addPass( pass, configurables = null ){

		if( !POSTPROCESSING ){

			Renderer.usePostprocessing = true;
			POSTPROCESSING = new EffectComposer(Renderer.instance);

			POSTPROCESSING.setSize(Renderer.screenSize.x, Renderer.screenSize.y);

			POSTPROCESSING.addPass(new RenderPass(Renderer.scene, Renderer.camera));

		}

		POSTPROCESSING.addPass(pass);

		if( Configurator.active && DEBUG_FOLDERS.postprocessing && configurables instanceof Array ){

			const folder = DEBUG_FOLDERS.postprocessing.addFolder({ title: pass.constructor.name });

			for( const [ target, key ] of configurables ){

				folder.addBinding(target, key)

			}

		}

	}
	static update( currentTime, deltaTime ){

		Configurator.frameStart();

		GLOBAL_UNIFORMS.currentTime.value = currentTime;
		GLOBAL_UNIFORMS.deltaTime.value = deltaTime;

		SCENE.traverse(( element ) => {

			if( element.update instanceof Function ) element.update(currentTime, deltaTime);

		});

		if( Renderer.usePostprocessing ) POSTPROCESSING.render();
		else Renderer.instance.render(Renderer.scene, Renderer.camera);

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

		Renderer.instance.dispose();

	}
}
