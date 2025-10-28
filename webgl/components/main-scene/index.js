import { BaseScene } from "#framework";
import Cube from "#webgl/components/cube";

export default class MainScene extends BaseScene {
	constructor(){

		super();

		this.add(Cube);

	}
}
