import { Assets, Audio, Configurator, Input, Renderer, Timer } from "#framework";
import MainScene from "#webgl/components/main-scene";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

export default class WebGL {
	constructor( canvas ){

		Renderer.setup(canvas);
		Renderer.instance.setClearColor(0x000000, 1);

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

		Renderer.camera.position.set(0, 0, 15);

		const bloomPass = new UnrealBloomPass(Renderer.screenSize, 0.2, 2.0, 0.2);
		Renderer.addPass(bloomPass, [
			[bloomPass, "strength"],
			[bloomPass, "radius"],
			[bloomPass, "threshold"]
		]);

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
