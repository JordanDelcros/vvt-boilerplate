import { BaseMixin, BaseCamera, EventManager, Renderer } from "#framework";
import { Scene, PerspectiveCamera, OrthographicCamera } from "three";

export default class BaseScene extends BaseMixin(Scene) {
	constructor({ orthographic = false, fov = 50, near = 0.1, far = 100 } = {}){

		super();

		if( orthographic ){

			this.camera = new OrthographicCamera(
				window.innerWidth / -2,
				window.innerWidth / 2,
				window.innerHeight / 2,
				window.innerHeight / -2,
				near,
				far
			);

			this.offResize = EventManager.on(window, "resize", () => {

				Object.assign(this.camera, {
					left: window.innerWidth / -2,
					right: window.innerWidth / 2,
					top: window.innerHeight / 2,
					bottom: window.innerHeight / -2
				});

				this.camera.updateProjectionMatrix();

			});

		}
		else {

			this.camera = new BaseCamera({
				fov,
				near,
				far,
				ratio: window.innerWidth / window.innerHeight
			});

			this.offResize = EventManager.on(window, "resize", () => {

				this.camera.aspect = window.innerWidth / window.innerHeight;
				this.camera.updateProjectionMatrix();

			});

		}

		this.add(this.camera);

	}
	dispose(){

		this.debugFolder?.dispose();

		this.offResize();

		this.traverse(( element ) => {

			if( element.isMesh ){

				element.geometry.dispose();
				element.material.dispose();

			}

			if( element !== this && element.dispose instanceof Function ) element.dispose();

		});

		super.dispose();

	}
}
