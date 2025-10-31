import { Assets, BaseMesh, PostProcessing } from "#framework";
import { SphereGeometry, MeshBasicMaterial, BackSide } from "three";

export default class Background extends BaseMesh {
	constructor(){

		const geometry = new SphereGeometry(50, 32, 16);
		const material = new MeshBasicMaterial({ color: 0x000000, side: BackSide });
		PostProcessing.patchMaterial(material);

		super(geometry, material);

	}
}
