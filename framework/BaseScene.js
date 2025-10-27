import { BaseMixin } from "#framework";
import { EventManager, Renderer, BaseCamera } from "./";
import { Scene, Object3D } from "three";

export default class BaseScene extends BaseMixin(Scene) {
	constructor( fov = 50, near = 0.1, far = 100 ){

		super();

		this.camera = new BaseCamera({
			fov, near, far,
			ratio: window.innerWidth / window.innerHeight
		});

		this.offResize = EventManager.on(window, "resize", () => {

			this.camera.aspect = window.innerWidth / window.innerHeight;
			this.camera.updateProjectionMatrix();

		});

	}
	dispose(){

		this.debugFolder?.dispose();

		this.offResize();

		this.traverse(( element ) => {

			if( element.isMesh ){

				element.geometry.dispose();
				element.material.dispose();

			}

		});

		super.dispose();

	}
}
