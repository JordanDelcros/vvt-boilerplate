import { BaseMixin } from "#framework";
import { PerspectiveCamera, Object3D, Frustum, Matrix4, Vector3, AudioListener } from "three";

const MATRIX = new Matrix4();
const VECTOR = new Vector3();

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
	update(){

		this.getWorldPosition(this.worldPosition);
		this.getWorldDirection(this.worldDirection);

	}
	debug( folder ){

		console.log("debug camera", folder);

	}
}