import { statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, basename, extname } from "path";
import { globSync } from "glob";
import packTexture from "./pack-texture.js";
import packModel from "./pack-model.js";
import packAudio from "./pack-audio.js";
import packSound from "./pack-sound.js";

// All defined usages
const USAGES = {
	texture: 0,
	model: 1,
	audio: 2,
	sound: 3
};
// Files grouped into one
const GROUPED = [
	USAGES.sound
];
const DESTINATION = "/.generated";
const SOURCES = new Array();
let FORCE_UPDATE = false;
let FORCE_FAST = false;
let USE_VERBOSE = false;

export default class AssetsPacker {
	static get root(){

		return process.cwd() + "/public";

	}
	static get destination(){

		return AssetsPacker.root + DESTINATION;

	}
	static get registry(){

		return AssetsPacker.destination + "/.registry.json";

	}
	static get usages(){

		return USAGES;

	}
	static registryExists(){

		return existsSync(AssetsPacker.registry);

	}
	static getRegistry(){

		let registry = null;

		if( AssetsPacker.registryExists() ){

			registry = JSON.parse(readFileSync(AssetsPacker.registry, "utf-8"));

		}

		return registry;

	}
	static setRegistry( data ){

		writeFileSync(AssetsPacker.registry, JSON.stringify(data), "utf-8");

	}
	static forceUpdate(){

		FORCE_UPDATE = true;

	}
	static forceFast(){

		FORCE_FAST = true;

	}
	static verbose( useVerbose ){

		USE_VERBOSE = useVerbose;

	}
	static add( path, usage = null, options = {} ){

		if( path[0] !== "/" ) path = "/" + path;

		if( usage === null ){

			if( /\.(png|jpe?g)$/.test(path) ){

				usage = AssetsPacker.usages.texture;

			}
			else if( /\.(gltf|glb)$/.test(path) ){

				usage = AssetsPacker.usages.model;

			}
			else if( /\.(aac|mp3|ogg|wav)$/.test(path) ){

				usage = AssetsPacker.usages.audio;

			}

		}

		if( FORCE_UPDATE ) options.force = true;
		if( FORCE_FAST ) options.fast = true;

		SOURCES.push({ path, usage, options });

	}
	static get( path, target = SOURCES ){

		return target?.find(asset => asset.path === path);

	}
	static getFileInfo( path ){

		const extension = extname(path);
		const name = basename(path, extension);
		
		return { name, extension };

	}
	static getTask( source ){

		if( source.usage === AssetsPacker.usages.texture ){
			return packTexture(source);
		}
		else if( source.usage === AssetsPacker.usages.model ){
			return packModel(source);
		}
		else if( source.usage === AssetsPacker.usages.audio ){
			return packAudio(source);
		}
		else if( source.usage === AssetsPacker.usages.sound ){
			return packSound(source);
		}

	}
	static async pack(){

		const previousGeneration = AssetsPacker.getRegistry();
		const generated = new Array();
		const tasks = new Array();

		for( const source of SOURCES ){

			// Get all files from given path
			source.files = globSync(AssetsPacker.root + source.path, { nodir: true });

			const isGrouped = GROUPED.includes(source.usage);

			// Create a single task for all files to be treated in the pack-module
			if( isGrouped ){

				const packName = source.options.name ?? "sounds";

				const localPath = dirname(source.path);
				const packPath = `${ localPath }/${ packName }`;

				const previous = AssetsPacker.get(packPath, previousGeneration);

				const destination = AssetsPacker.destination + localPath;
				mkdirSync(destination, { recursive: true });

				source.lastUpdate = 0;
				for( const file of source.files ){

					const stats = statSync(file);
					const time = stats.mtime.getTime();
					if( time > source.lastUpdate ) source.lastUpdate = time;

				}

				if( source.options.force !== true && previous && source.lastUpdate <= previous.lastUpdate ){

					generated.push(previous);
					continue;

				}

				const taskSource = {
					packName,
					path: packPath,
					usage: source.usage,
					options: source.options,
					lastUpdate: source.lastUpdate,
					destination,
					files: source.files
				};

				const task = AssetsPacker.getTask(taskSource);

				tasks.push(task);
				generated.push(taskSource);

			}
			// Create a task per file
			else {

				for( const file of source.files ){

					const localPath = file.replace(AssetsPacker.root, "");

					const previous = AssetsPacker.get(localPath, previousGeneration);

					// Ensure destination folder exists by creating it
					const destination = AssetsPacker.destination + dirname(localPath);
					mkdirSync(destination, { recursive: true });

					const stats = statSync(file);
					source.lastUpdate = stats.mtime.getTime();

					// Use previous generation if file aint changed
					if( source.options.force !== true && previous && source.lastUpdate <= previous.lastUpdate ){

						generated.push(previous);
						continue;

					}

					const { name, extension } = AssetsPacker.getFileInfo(file);

					const taskSource = {
						path: localPath,
						usage: source.usage,
						options: source.options,
						lastUpdate: source.lastUpdate,
						destination,
						file,
						name,
						extension
					};

					const task = AssetsPacker.getTask(taskSource);

					tasks.push(task);
					generated.push(taskSource);

				}

			}

		}

		await Promise.all(tasks).then(( tasks ) => {

			tasks.forEach(( source ) => {

				source.path = source.path.replace(AssetsPacker.root, "");

				for( const output in source.generated ){

					source.generated[output] = source.generated[output].replace(AssetsPacker.destination, ".generated");

				}

			});

		});

		const registry = generated.map(({ path, generated, lastUpdate }) => {

			return {
				path,
				generated,
				lastUpdate
			};

		});

		AssetsPacker.setRegistry(registry);

		return generated;

	}
}
