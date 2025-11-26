import { Assets, BaseMesh, PostProcessing } from "#framework";
import { BoxGeometry, MeshStandardMaterial } from "three";

export default class Cube extends BaseMesh {
	constructor(){

		const map = Assets.get("/maps/debug.png");

		const geometry = new BoxGeometry(5, 5, 5);
		const material = new MeshStandardMaterial({ map });
		PostProcessing.patchMaterial(material);

		super(geometry, material);

	}
	update( currentTime, deltaTime ){

		// this.rotation.x += deltaTime * 0.00005;
		// this.rotation.y -= deltaTime * 0.00005;

	}
}
