import { Assets, Renderer, Timer } from "#framework";
import { Object3D, Quaternion, NeutralToneMapping, RepeatWrapping } from "three";
import Store from "#app/Store.js";
import Levels from "/public/data/levels.js";

const DUMMY = new Object3D();
const QUATERNION = new Quaternion();

export default class WebGL {
	constructor( canvas ){

		Renderer.setup(canvas);
		Renderer.instance.sortObjects = false;
		Renderer.instance.setClearColor(0xFFFFFF, 1);
		Renderer.instance.toneMapping = NeutralToneMapping;
		Renderer.instance.toneMappingExposure = 1;

		Timer.setup();

		this.preload()
			.then(async () => {

				Timer.add(this.update.bind(this));

			})
			.catch(( error ) => {

				console.error(error);

			});

	}
	async preload(){

		await Assets.setup();

		const promises = [
			// Assets.load("/fonts/caveat-regular.woff2"),
			Assets.load("/maps/environment.exr"),
			Assets.load("/maps/blue-noise.png", { wrapS: RepeatWrapping, wrapT: RepeatWrapping }),
			Assets.loadSound("/audio/sounds/packed-sounds")
		];

		// const localizedData = Assets.get("data");

		for( const level of Levels.levels ){

			for( const layer of level.layers ){

				promises.push(Assets.load(layer.image));

			}

		}

		await Promise.all(promises);

		Assets.dispose();

		await Renderer.compile();

		await Assets.userValidation;

	}
	update( currentTime, deltaTime ){

		Renderer.update(currentTime, deltaTime);

	}
	dispose(){

		Renderer.dispose();

	}
}
