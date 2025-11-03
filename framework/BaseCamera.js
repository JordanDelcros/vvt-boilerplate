import { BaseMixin, Renderer } from "#framework";
import { PerspectiveCamera, Object3D, Frustum, Matrix4, Vector3, AudioListener } from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const MATRIX = new Matrix4();
const VECTOR = new Vector3();

export default class BaseCamera extends BaseMixin(PerspectiveCamera) {
	constructor({ fov = 50, ratio = window.innerWidth / window.innerHeight, near = 0.1, far = 100 } = {}){

		super(fov, ratio, near, far);

		this.frustum = new Frustum();
		this.worldPosition = new Vector3();
		this.worldDirection = new Vector3();

		this.originalState = {
			position: this.position.clone(),
			quaternion: this.quaternion.clone(),
			target: new Vector3()
		};

	}
	inFrustum( object ){

		MATRIX.multiplyMatrices(this.projectionMatrix, this.matrixWorldInverse);
		this.frustum.setFromProjectionMatrix(MATRIX);

		object.getWorldPosition(VECTOR);

		return this.frustum.containsPoint(VECTOR);

	}
	update(){

		this.getWorldPosition(this.worldPosition);
		this.getWorldDirection(this.worldDirection);

		this.controls?.update();

	}
	debug( folder ){

		const params = {
			freemove: false
		};

		folder.addBinding(params, "freemove").on("change", ({ value }) => {
			if( value ) this.enableOrbit();
			else this.disableOrbit();
		});

	}
	enableOrbit() {

		if( this.controls ) return;

		this.getWorldDirection(this.worldDirection);

		this.originalState.position.copy(this.position);
		this.originalState.quaternion.copy(this.quaternion);

		this.controls = new OrbitControls(this, Renderer.domElement);
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.08;

		this.originalState.target
			.copy(this.worldDirection)
			.multiplyScalar(10)
			.add(this.position);

		this.controls.target.copy(this.originalState.target);

		this.controls.update();

	}
	disableOrbit() {

		if( !this.controls ) return;

		this.controls.dispose();
		this.controls = null;

		this.position.copy(this.originalState.position);
		this.quaternion.copy(this.originalState.quaternion);

	}
}