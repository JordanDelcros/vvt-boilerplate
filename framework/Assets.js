import { Renderer, Database, Device, Audio } from "#framework";
import { AudioLoader, Texture, DataTexture, EquirectangularReflectionMapping } from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ref } from "vue";

const REGISTRY = __ASSETS__;

const PENDING = ref(0);
const FILES = new Array();

const IMAGES = ["jpg", "png", "webp"];
const COMPRESSED_IMAGES = ["ktx2"];
const GLTF = ["gltf", "glb"];
const AUDIO = ["aac", "mp3", "ogg", "wav", "opus"];
const FONT = ["woff2", "woff", "ttf", "otf"];
const FONT3D = ["font3d"];

let SUPPORT_KTX2 = false;
const KTX2_LOADER = new KTX2Loader();
KTX2_LOADER.setTranscoderPath("/basis/");

let USER_VALIDATION_RESOLVE = null;
const USER_VALIDATION_PROMISE = new Promise(( resolve ) => USER_VALIDATION_RESOLVE = resolve);

export default class Assets {
	static get userValidation(){

		return USER_VALIDATION_PROMISE;

	}
	static get userResolve(){

		return USER_VALIDATION_RESOLVE;

	}
	static get pending(){

		return PENDING.value;

	}
	static get files(){

		return FILES;

	}
	static async setup(){

		await Database.setup();
		await KTX2_LOADER.detectSupport(Renderer.instance);
		SUPPORT_KTX2 = KTX2_LOADER.workerConfig.etc1Supported && KTX2_LOADER.workerConfig.astcSupported;

	}
	static dispose(){

		KTX2_LOADER.dispose();

	}
	static get( name ){

		const fileByName = FILES.find(file => file.name === name);
		if( fileByName ) return fileByName.value;

		const fileByPath = FILES.find(file => file.path.includes(name));
		return fileByPath?.value;

	}
	static set( path, value ){

		const { name, extension } = Assets.getPathInfo(path);

		const output = { path, name, extension, value };
		FILES.push(output);

		return output;

	}
	static async load( path, options ){

		const { usedPath, name, extension } = Assets.getBestFile(path);

		const alreadyLoaded = FILES.find(file => file.usedPath === usedPath);
		if( alreadyLoaded ) return alreadyLoaded.value;

		const output = { path, usedPath, name, extension, value: null };
		FILES.push(output);

		const onFail = ( error ) => {

			console.error(`Fail loading ${ usedPath }: ${ error.message }`);

		}

		PENDING.value++;

		const cachedBuffer = await Database.get(usedPath);

		let buffer = cachedBuffer ?? await fetch(usedPath).then(response => response.arrayBuffer());

		if( !cachedBuffer ) await Database.set(usedPath, buffer);

		if( extension === "json" ){

			const json = JSON.parse(new TextDecoder().decode(buffer));

			output.value = json;

		}
		else if( extension === "exr" ){

			const { data, width, height, type, format, colorSpace } = new EXRLoader().parse(buffer);
			const texture = new DataTexture(data, width, height, format, type, EquirectangularReflectionMapping);
			texture.needsUpdate = true;

			output.value = texture;

		}
		else if( IMAGES.includes(extension) ){

			const blob = new Blob([buffer]);
			const bitmap = await createImageBitmap(blob, { imageOrientation: "flipY", colorSpaceConversion: "none" });
			const texture = new Texture(bitmap);
			texture.needsUpdate = true;

			output.value = texture;

		}
		else if( COMPRESSED_IMAGES.includes(extension) ){

			output.value = await new Promise(( resolve, reject ) => {

				KTX2_LOADER.parse(buffer, data => resolve(data), error => reject(error));

			});

		}
		else if( GLTF.includes(extension) ){

			const loader = new GLTFLoader();
			loader.setKTX2Loader(KTX2_LOADER);
			loader.setMeshoptDecoder(MeshoptDecoder);

			output.value = await new Promise(( resolve, reject ) => {

				loader.parse(buffer, "", gltf => resolve(gltf.scene), error => reject(error));

			});

		}
		else if( AUDIO.includes(extension) ){

			output.value = await new Promise(( resolve, reject ) => {

				Audio.context.decodeAudioData(buffer, ( audioBuffer ) => resolve(audioBuffer), onFail);

			});

		}
		else if( FONT.includes(extension) ){

			await document.fonts.ready;
			output.value = new FontFace(name, buffer);
			document.fonts.add(output.value);

		}
		else if( FONT3D.includes(extension) ){

			const json = JSON.parse(new TextDecoder().decode(buffer));
			const data = new FontLoader().parse(json);

			output.value = data;

		}

		if( output.value ) Object.assign(output.value, options);

		PENDING.value--;

		return output.value;

	}
	static async loadSound( path ){

		const { usedPath, name, extension } = Assets.getBestFile(path);

		const registered = REGISTRY.find(entry => entry.path === path);
		if( !registered ) return null;

		const [ metadata, audioBuffer ] = await Promise.all([
			registered.generated.metadata ? Assets.load(registered.generated.metadata) : null,
			Assets.load(registered.path)
		]);

		return { metadata, audioBuffer };

	}
	static getPathInfo( path ){

		const chunk = path.split("/").pop().split(".");
		const extension = chunk.length > 1 ? chunk.pop() : null;
		const name = chunk.join(".");

		return { name, extension };

	}
	static getBestFile( path ){

		let { name, extension } = Assets.getPathInfo(path);

		const registered = REGISTRY.find(entry => entry.path === path);
		if( !registered ) return { path, usedPath: path, name, extension };

		let { extension: usedExtension } = Assets.getPathInfo(registered.generated.high);
		
		let usedPath = path;

		// Unsupported formats check
		let needsExtensionUpdate = false;
		const isUnsupportedTexture = !SUPPORT_KTX2 && (COMPRESSED_IMAGES.includes(usedExtension) || GLTF.includes(usedExtension));
		const isUnsupportedAudio = !Audio.supportsOpus && AUDIO.includes(usedExtension);
		if( isUnsupportedTexture || isUnsupportedAudio ){
			usedPath = registered.generated.fallback ?? path;
			usedExtension = Assets.getPathInfo(usedPath).extension;
		}
		// Supported desktops
		else if( Device.is.desktop ){
			// Only safari
			if( Device.is.safari ) usedPath = registered.generated.medium || registered.generated.high || registered.generated.low;
			// Others
			else usedPath = registered.generated.high || registered.generated.medium || registered.generated.low;
		}
		// supported mobiles/tablets
		else usedPath = registered.generated.low || registered.generated.medium || registered.generated.high || registered.generated.fallback || path;

		return {
			path,
			usedPath,
			name,
			extension: usedExtension
		};

	}
}
