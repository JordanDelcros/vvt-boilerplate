import { statSync, existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { exec } from "child_process";
import { dirname, basename, extname } from "path";
import { globSync } from "glob";
import CLIProgress from "cli-progress";
import packImage from "./pack-image.js";
import packTexture from "./pack-texture.js";
import packModel from "./pack-model.js";
import packAudio from "./pack-audio.js";
import packSound from "./pack-sound.js";
import packVideo from "./pack-video.js";
import packFont from "./pack-font.js";
import packLocale from "./pack-locale.js";
import { USAGES, GROUPED } from "./config.js";
import config from "../../config.js";

let ROOT = "/assets";
let DESTINATION = "/public/.generated";
const SOURCES = new Array();
let FORCE_UPDATE = false;
let FORCE_FAST = false;
let USE_VERBOSE = false;

const FFMPEG_AVAILABLE = (function checkFFMpegAvailable(){

	try {

		exec("ffmpeg -version");
		return true;

	}
	catch( error ){

		return false;

	}

})();

const TOKTX_AVAILABLE = (function checkToktxAvailable(){

	try {

		exec("toktx --version");
		return true;

	}
	catch( error ){

		return false;

	}

})();

export default class AssetsPacker {
	static get root(){

		return process.cwd() + ROOT;

	}
	static set root( value ){

		ROOT = value;

	}
	static get destination(){

		return AssetsPacker.formatDestination(DESTINATION);

	}
	static set destination( value ){

		DESTINATION = value;

	}
	static get registry(){

		return AssetsPacker.destination + "/.registry.json";

	}
	static get usages(){

		return USAGES;

	}
	static formatDestination( destination ){

		return process.cwd() + destination;

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
	static useFast( useFast = false ){

		FORCE_FAST = useFast;

	}
	static get fast(){

		return FORCE_FAST;

	}
	static useVerbose( useVerbose = false ){

		USE_VERBOSE = useVerbose;

	}
	static get verbose(){

		return USE_VERBOSE;

	}
	static add( path, usage = null, options = {} ){

		if( path[0] !== "/" ) path = "/" + path;

		if( usage === null ){

			if( /\.(png|jpe?g)$/.test(path) ){

				usage = AssetsPacker.usages.image;

			}
			else if( /\.(gltf|glb)$/.test(path) ){

				usage = AssetsPacker.usages.model;

			}
			else if( /\.(aac|mp3|ogg|wav)$/.test(path) ){

				usage = AssetsPacker.usages.audio;

			}
			else if( /\.(mp4|webm|mov)/.test(path) ){

				usage = AssetsPacker.usages.video;

			}
			else if( /\.(ttf)/.test(path) ){

				usage = AssetsPacker.usages.font;

			}
			else if( /\.(json)/.test(path) ){

				usage = AssetsPacker.usages.locale;

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

		if( source.usage === AssetsPacker.usages.image ){
			return packImage(source);
		}
		else if( source.usage === AssetsPacker.usages.texture ){
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
		else if( source.usage === AssetsPacker.usages.video ){
			return packVideo(source);
		}
		else if( source.usage === AssetsPacker.usages.font ){
			return packFont(source);
		}
		else if( source.usage === AssetsPacker.usages.locale ){
			return packLocale(source);
		}

	}
	static async pack( mode, maxConcurrency = 1 ){

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

				const destination = source.options.destination ? AssetsPacker.formatDestination(source.options.destination) : AssetsPacker.destination + dirname(localPath);
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

					const destination = source.options.destination ? AssetsPacker.formatDestination(source.options.destination) : AssetsPacker.destination + dirname(localPath);
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

		if( tasks.length > 0 ){

			let progressBar;
			if( config.packer?.progressBar ){

				progressBar = new CLIProgress.SingleBar({
					format: `Packing [{bar}] {percentage}% | {value}/{total} task${ tasks.length > 1 ? "s" : "" } | {info}`,
					barCompleteChar: '\u2588',
					barIncompleteChar: '\u2591',
					hideCursor: true
				});

				progressBar.start(tasks.length, 0);
				progressBar.update(0, { info: "🔥 Heating the engine!" });

			}

			let index = 0;
			let done = 0;
			const pool = new Set();

			while( index < tasks.length || pool.size > 0 ){

				while( index < tasks.length && pool.size < maxConcurrency ){

					const task = tasks[index];

					const taskPromise = task.action().then(( source ) => {

						source.path = source.path.replace(AssetsPacker.root, "");

						for( const output in source.generated ){

							source.generated[output] = source.generated[output].replace(process.cwd() + "/public", "");

						}

						if( config.packer?.progressBar ) progressBar.update(++done, { info: task.info });
						pool.delete(taskPromise);

					});

					pool.add(taskPromise);
					index++;

				}

				if( pool.size > 0 ) await Promise.race(pool);

			}

			if( config.packer?.progressBar ) progressBar.stop();

		}

		const registry = generated.map(({ path, generated, lastUpdate, usage }) => {

			return {
				path,
				generated,
				lastUpdate,
				usage
			};

		});

		for( const registered of registry.filter(({ generated }) => generated.metadata) ){

			registry.push({
				path: registered.generated.metadata,
				usage: USAGES.internal,
				generated: {
					prefer: registered.generated.metadata
				}
			});

		}

		AssetsPacker.setRegistry(registry);

		return generated;

	}
	static get FFMpegAvailable(){

		return FFMPEG_AVAILABLE;

	}
	static get toktxAvailable(){

		return TOKTX_AVAILABLE;

	}
}
