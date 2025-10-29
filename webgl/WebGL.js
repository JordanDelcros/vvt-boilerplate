import { Assets, Audio, Configurator, Input, Renderer, Timer } from "#framework";
import MainScene from "#webgl/components/main-scene";
import { ACESFilmicToneMapping } from "three";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export default class WebGL {
	constructor( canvas ){

		Renderer.setup(canvas);
		Renderer.instance.setClearColor(0x000000, 1);
		Renderer.instance.toneMapping = ACESFilmicToneMapping;

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

		const gtaoPass = new GTAOPass(Renderer.scene, Renderer.camera);
		gtaoPass.gtaoMaterial.uniforms.radius.value = 0.09;
		gtaoPass.gtaoMaterial.uniforms.thickness.value = 0.4;
		gtaoPass.gtaoMaterial.uniforms.scale.value = 1.1;
		gtaoPass.gtaoMaterial.uniforms.distanceFallOff.value = 0.86;
		gtaoPass.gtaoMaterial.uniforms.distanceExponent.value = 2.0;

		Renderer.addPass(gtaoPass, [
			[gtaoPass.gtaoMaterial.uniforms.radius, "value", "radius"],
			[gtaoPass.gtaoMaterial.uniforms.thickness, "value", "thickness"],
			[gtaoPass.gtaoMaterial.uniforms.scale, "value", "scale"],
			[gtaoPass.gtaoMaterial.uniforms.distanceFallOff, "value", "distanceFallOff"],
			[gtaoPass.gtaoMaterial.uniforms.distanceExponent, "value", "distanceExponent"]
		]);

		const bloomPass = new UnrealBloomPass(Renderer.screenSize, 0.2, 0.05, 0.2);
		Renderer.addPass(bloomPass, [
			[bloomPass, "strength"],
			[bloomPass, "radius"],
			[bloomPass, "threshold"]
		]);

		// const blueNoisePass = new ShaderPass({});

		const outputPass = new OutputPass();
		Renderer.addPass(outputPass);


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
