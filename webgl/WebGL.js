import { Assets, Audio, Configurator, Input, Renderer, Timer } from "#framework";
import { Object3D, Quaternion, NeutralToneMapping, RepeatWrapping, LinearSRGBColorSpace } from "three";
import MainScene from "#webgl/components/main-scene";

const DUMMY = new Object3D();
const QUATERNION = new Quaternion();

export default class WebGL {
	constructor( canvas ){

		Renderer.setup(canvas);
		Renderer.instance.setClearColor(0x000000, 1);
		Renderer.instance.outputColorSpace = LinearSRGBColorSpace;

		Audio.setup();
		Input.setup();
		Timer.setup();

		if( Configurator.active ){

			// Add some top-level confs here

		}

	}
	run(){

		this.scene = new MainScene();

		Renderer.setScene(this.scene);

		Renderer.camera.position.set(0, 0, 10);

		Timer.add(this.update.bind(this));

	}
	update( currentTime, deltaTime ){

		Renderer.update(currentTime, deltaTime);

	}
	dispose(){

		Configurator.dispose();
		Renderer.dispose();
		Input.dispose();
		Timer.dispose();
		Assets.dispose();

	}
}
