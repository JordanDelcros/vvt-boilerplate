import { Assets, BaseScene } from "#framework";
import Cube from "#webgl/components/cube";

export default class MainScene extends BaseScene {
	constructor(){

		super();

		this.environment = Assets.get("/maps/environment-small.exr");

		this.add(Cube);

	}
}
