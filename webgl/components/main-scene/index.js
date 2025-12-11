import { Assets, BaseScene, Randomness, PostProcessing } from "#framework";
import { DirectionalLight, Vector3 } from "three";
import Background from "#webgl/components/background";
import Cube from "#webgl/components/cube";

export default class MainScene extends BaseScene {
	constructor(){

		super({ fov: 30 });

		this.camera.position.z = 20;

		this.environment = Assets.get("/envs/sky-big.exr");

		const light = this.add(DirectionalLight);
		light.castShadow = true;

		this.add(Background);

		const model = Assets.get("/models/ducati.glb").scene;
		PostProcessing.patchModel(model);
		model.scale.setScalar(10);
		model.traverse(( element ) => {

			if( element.isMesh ){
				element.castShadow = true;
				element.receiveShadow = true;
				element.material.depthWrite = true;
			}

		});

		this.add(model);

		// for( let group = 0; group < 10; group++ ){

		// 	const groupPosition = new Vector3(
		// 		group === 0 ? 0 : Randomness.random(-20, +20),
		// 		group === 0 ? 0 : Randomness.random(-20, +20),
		// 		group === 0 ? 0 : Randomness.random(-20, +20)
		// 	);

		// 	for( let index = 0; index < 10; index++ ){
				
		// 		const object = this.add(Cube);
		// 		object.castShadow = true;
		// 		object.receiveShadow = true;
		// 		object.position.set(
		// 			groupPosition.x + Randomness.random(-2.5, +2.5),
		// 			groupPosition.y + Randomness.random(-2.5, +2.5),
		// 			groupPosition.z + Randomness.random(-2.5, +2.5)
		// 		);

		// 	}

		// }

	}
	onMount(){

		this.camera.enableOrbit();

	}
}
