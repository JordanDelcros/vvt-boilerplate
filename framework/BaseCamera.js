import Animation from "./Animation.js";
import BaseMixin from "./BaseMixin.js";
import Configurator from "./Configurator.js";
import Easings from "./Easings.js";
import Renderer from "./Renderer.js";
import { PerspectiveCamera, Object3D, Frustum, Matrix4, Vector3, Euler, Quaternion, AudioListener } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MATRIX = new Matrix4();
const VECTOR = new Vector3();
const VECTOR_2 = new Vector3();
const EULER = new Euler();
const QUATERNION = new Quaternion();
const QUATERNION_2 = new Quaternion();

export default class BaseCamera extends BaseMixin(PerspectiveCamera) {
	constructor({ fov = 50, ratio = window.innerWidth / window.innerHeight, near = 0.1, far = 100 } = {}){

		super(fov, ratio, near, far);

		this.frustum = new Frustum();
		this.worldPosition = new Vector3();
		this.worldDirection = new Vector3();

	}
	inFrustum( object ){

		MATRIX.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);
		this.frustum.setFromProjectionMatrix(MATRIX);

		object.getWorldPosition(VECTOR);

		return this.frustum.containsPoint(VECTOR);

	}
	copy( camera, container = null ){

		const target = container ?? this;

		target.position.copy(camera.position);
		target.rotation.copy(camera.rotation);
		this.fov = camera.fov;
		this.zoom = camera.zoom;
		this.updateProjectionMatrix();

	}
	animateTo({ container = null, camera = null, position = null, rotation = null, quaternion = null, fov = null, zoom = null, duration = 1000, easing = Easings.inOutSine }){

		this.tween = new Animation({
			onUpdate: () => this.updateProjectionMatrix(),
			onComplete: () => this.tween = null,
		});

		const target = container ?? this;

		position = camera ? camera.position : position;
		if( position ){

			this.tween.to(target.position, {
				x: position.x,
				y: position.y,
				z: position.z,
				duration,
				easing
			}, 0);

		}

		quaternion = camera ? camera.quaternion : quaternion;

		if( rotation ){

			quaternion = QUATERNION.setFromEuler(camera ? camera.rotation : rotation);

		}

		if( quaternion ){

			QUATERNION_2.copy(target.quaternion);

			this.tween.to({ progress: 0 }, {
				progress: 1,
				duration,
				easing,
				onUpdate: ({ progress }) => {

					target.quaternion.slerpQuaternions(QUATERNION_2, quaternion, progress);

				}
			}, 0);

		}

		fov = camera ? camera.fov : fov;
		if( fov !== null ){

			this.tween.to(this, {
				fov,
				duration,
				easing
			}, 0);

		}

		zoom = camera ? camera.zoom : zoom;
		if( zoom !== null ){

			this.tween.to(this, {
				zoom,
				duration,
				easing
			}, 0);

		}

	}
	animateLookAt({ container = null, target: targetLookAt, fov = null, zoom = null, duration = 1000, easing = Easings.inOutSine }){

		const target = container ? container : this;

		VECTOR.copy(targetLookAt);
		container.parent.worldToLocal(VECTOR);

		MATRIX.identity().lookAt(container.position, VECTOR, container.parent.up);
		QUATERNION.setFromRotationMatrix(MATRIX);

		this.animateTo({
			container,
			quaternion: QUATERNION,
			fov,
			zoom,
			duration,
			easing
		});

	}
	update( currentTime, deltaTime ){

		this.getWorldPosition(this.worldPosition);
		this.getWorldDirection(this.worldDirection);

		this.tween?.update(deltaTime);
		this.orbit.controls?.update(deltaTime);

	}
	debug( folder ){

		this.orbit = {
			active: false,
			controls: null,
			parent: this.parent,
			position: this.position.clone(),
			quaternion: this.quaternion.clone()
		};

		folder.addBinding(this.orbit, "active", { label: "freemove" }).on("change", ({ value }) => {
			if( value ) this.enableOrbit();
			else this.disableOrbit();
		});

	}
	enableOrbit(){

		if( this.orbit.controls ) return;

		this.orbit.active = true;
		this.orbit.position.copy(this.position);
		this.orbit.quaternion.copy(this.quaternion);

		this.orbit.parent = this.parent;

		Renderer.scene.add(this);

		this.orbit.controls = new OrbitControls(this, Renderer.domElement);
		this.orbit.controls.enableDamping = true;
		this.orbit.controls.dampingFactor = 0.08;

		this.orbit.controls.update();
		Configurator.refresh();

	}
	disableOrbit(){

		if( !this.orbit.controls ) return;

		this.orbit.active = false;
		this.orbit.controls.dispose();
		this.orbit.controls = null;

		this.orbit.parent.add(this);

		this.position.copy(this.orbit.position);
		this.quaternion.copy(this.orbit.quaternion);

	}
}