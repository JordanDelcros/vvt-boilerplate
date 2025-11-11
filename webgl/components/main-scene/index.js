import { Assets, BaseScene } from "#framework";
import Background from "#webgl/components/background";
import Cube from "#webgl/components/cube";

export default class MainScene extends BaseScene {
	constructor(){

		super({ fov: 30 });

		this.camera.position.z = 20;

		this.environment = Assets.get("/maps/environment-big.exr");

		this.add(Background);

		for( let index = 0; index < 10; index++ ){
			
			const object = this.add(Cube);
			object.position.set(
				Math.random() * 5 - 2.5,
				Math.random() * 5 - 2.5,
				Math.random() * 5 - 2.5
			);

		}

	}
	onMount(){

		this.camera.enableOrbit();

	}
}
