import { Renderer, Database, Device, Audio } from "#framework";
import { USAGES, GROUPED } from "#framework/assets-packer/config.js";
import config from "#root/config.js";
import { Texture, DataTexture, EquirectangularReflectionMapping, LinearSRGBColorSpace } from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ref } from "vue";
import picomatch from "picomatch";

const REGISTRY = __ASSETS__;

const PENDING = ref(0);
const FILES = new Array();

const IMAGES = ["jpg", "jpeg", "png", "webp", "svg"];
const COMPRESSED_IMAGES = ["ktx2"];
const GLTF = ["gltf", "glb"];
const AUDIO = ["aac", "mp3", "ogg", "wav", "opus"];
const VIDEO = ["mov", "mp4", "webm"];
const FONT = ["woff2", "ttf"];
const FONT3D = ["font3d"];

const CORRECT_MIME_TYPES = {
	jpg: "jpeg",
	svg: "svg+xml",
	mov: "quicktime",
	avi: "x-msvideo",
	mkv: "x-matroska",
	ogv: "ogg",
	m4v: "mp4",
	mp3: "mpeg"
};

let SUPPORT_KTX2 = false;
let SUPPORT_WEBM = false;
let SUPPORT_WOFF2 = false;

const KTX2_LOADER = new KTX2Loader();
KTX2_LOADER.setTranscoderPath("/basis/");

let USER_VALIDATION_RESOLVE = null;
const USER_VALIDATION_PROMISE = new Promise(( resolve ) => USER_VALIDATION_RESOLVE = resolve);

export default class Assets {
	static get registry(){

		return REGISTRY;

	}
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

		SUPPORT_WEBM = (( video ) => {

			return ["probably", "maybe"].includes(video.canPlayType(`video/webm; codecs="vp9, opus"`))

		})(document.createElement("video"));

		SUPPORT_WOFF2 = (() => {

			return "FontFace" in window;

		})();

	}
	static unload(){

		KTX2_LOADER.dispose();

	}
	static dispose(){

		Assets.unload();

		FILES.forEach(( file ) => {

			if( /blob:/.test(file.value?.src) ) URL.revokeObjectURL(file.value.src);

		});

	}
	static get( nameOrPath ){

		const fileByName = FILES.find(file => file.name === nameOrPath);
		if( fileByName ) return fileByName.value;

		const fileByPath = FILES.find(file => file.path.includes(nameOrPath));
		return fileByPath?.value;

	}
	static getName( nameOrPath ){

		const fileByName = FILES.find(file => file.name === nameOrPath);
		if( fileByName ) return fileByName.name;

		const fileByPath = FILES.find(file => file.path.includes(nameOrPath));
		return fileByPath?.name;

	}
	static set( path, value ){

		const { name, extension } = Assets.getPathInfo(path);

		const output = { path, name, extension, value };
		FILES.push(output);

		return output;

	}
	static async preloadRegistry(){

		return await Promise.all(Assets.registry.map(async ( asset ) => {

			if( GROUPED.includes(asset.usage) ){

				return Assets.loadGrouped(asset.path);

			}
			else {

				return Assets.load(asset.path);

			}

		}));

	}
	static load( path, options ){

		return new Promise(( resolve, reject ) => {

			const isMatching = picomatch(path);
			const loadings = REGISTRY.filter(file => isMatching(file.path)).map(async ({ path, usage }) => {

				const { usedPath, name, extension } = Assets.getBestFile(path);

				const alreadyLoadedOrLoading = FILES.find(file => file.usedPath === usedPath);
				if( alreadyLoadedOrLoading ){

					if( alreadyLoadedOrLoading.promise ) await alreadyLoadedOrLoading.promise;
					return resolve(alreadyLoadedOrLoading.value);

				}

				const output = { path, usedPath, name, extension, usage, promise: null, value: null };
				FILES.push(output);

				PENDING.value++;

				const onFail = ( error ) => {

					console.error(`Fail loading ${ usedPath }: ${ error.message }`);
					reject(error);

				}

				output.promise = new Promise(async ( resolve ) => {

					const cachedBuffer = await (config.assets.useCache !== false ? Database.get(usedPath) : null);

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

						const blob = new Blob([buffer], { type: Assets.getMimeType("image", extension) });

						if( usage === USAGES.texture ){

							const bitmap = await createImageBitmap(blob, { colorSpaceConversion: "none" });
							const texture = new Texture(bitmap);
							texture.encoding = LinearSRGBColorSpace;
							texture.needsUpdate = true;

							output.value = texture;

						}
						else {

							const url = URL.createObjectURL(blob);

							const image = await new Promise(( resolve ) => {

								const img = document.createElement("img");
								img.onload = () => resolve(img);
								img.onerror = onFail;
								img.src = url;

							});

							output.value = image;

						}

					}
					else if( COMPRESSED_IMAGES.includes(extension) ){

						output.value = await new Promise(( resolve ) => {

							KTX2_LOADER.parse(buffer, texture => resolve(texture), onFail);

						});

					}
					else if( GLTF.includes(extension) ){

						const loader = new GLTFLoader();
						loader.setKTX2Loader(KTX2_LOADER);
						loader.setMeshoptDecoder(MeshoptDecoder);

						output.value = await new Promise(( resolve ) => {

							loader.parse(buffer, "", gltf => resolve(gltf), onFail);

						});

					}
					else if( AUDIO.includes(extension) ){

						output.value = await new Promise(( resolve ) => {

							Audio.context.decodeAudioData(buffer, ( audioBuffer ) => resolve(audioBuffer), onFail);

						});

					}
					else if( VIDEO.includes(extension) ){

						output.value = await new Promise(( resolve ) => {

							const blob = new Blob([buffer], { type: Assets.getMimeType("video", extension) });
							const url = URL.createObjectURL(blob);

							const video = document.createElement("video");
							video.oncanplaythrough = () => resolve(video);
							video.onerror = onFail;
							video.src = url;
							video.load();

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
					else {

						console.warn(`Unregistered format "${ extension }"`)

					}

					if( output.value && options ) Object.assign(output.value, options);

					PENDING.value--;

					resolve(output.value);

				});

				return await output.promise;

			});

			if( loadings.length === 0 ) console.warn("No matching file registered for ", path);

			Promise.all(loadings).then(resolve).catch(reject);

		});

	}
	static async loadGrouped( path ){

		const { usedPath, name, extension } = Assets.getBestFile(path);

		const registered = REGISTRY.find(entry => entry.path === path);
		if( !registered ) return null;

		const [ metadata, grouped ] = await Promise.all([
			registered.generated.metadata ? Assets.load(registered.generated.metadata) : null,
			Assets.load(registered.path)
		]);

		return {
			metadata: metadata[0],
			grouped: grouped[0]
		};

	}
	static getMimeType( category, extension ){

		return `${ category }/${ CORRECT_MIME_TYPES[extension] ?? extension }`;

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

		let { extension: usedExtension } = Assets.getPathInfo(registered.generated.high ?? registered.generated.prefer);

		let usedPath = path;

		// Unsupported formats check
		let needsExtensionUpdate = false;
		const isUnsupportedTexture = !SUPPORT_KTX2 && (COMPRESSED_IMAGES.includes(usedExtension) || GLTF.includes(usedExtension));
		const isUnsupportedAudio = !Audio.supportsOpus && AUDIO.includes(usedExtension);
		const isUnsupportedVideo = !SUPPORT_WEBM && VIDEO.includes(usedExtension);
		const isUnsupportedFont = !SUPPORT_WOFF2 && FONT.includes(usedExtension);

		// Unsupported
		if( isUnsupportedTexture || isUnsupportedAudio || isUnsupportedVideo || isUnsupportedFont ){

			usedPath = registered.generated.fallback ?? path;
			usedExtension = Assets.getPathInfo(usedPath).extension;

		}
		// Supported desktops
		else if( Device.is.desktop ){

			// Only safari
			if( Device.is.safari ) usedPath = registered.generated.prefer || registered.generated.medium || registered.generated.high || registered.generated.low;
			// All others
			else usedPath = registered.generated.prefer || registered.generated.high || registered.generated.medium || registered.generated.low;
		}
		// supported mobiles/tablets
		else {

			usedPath = registered.generated.prefer || registered.generated.low || registered.generated.medium || registered.generated.high || registered.generated.fallback || path;

		}

		return {
			path,
			usedPath,
			name,
			extension: usedExtension
		};

	}
}
