import { Assets, BaseScene } from "#framework";
import Cube from "#webgl/components/cube";

export default class MainScene extends BaseScene {
	constructor(){

		super({ fov: 30 });

		this.camera.position.z = 15;

		this.environment = Assets.get("/maps/environment-big.exr");

		this.add(Cube);

	}
}
