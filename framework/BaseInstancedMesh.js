import { BaseMixin } from "#framework";
import { InstancedMesh } from "three";

export default class BaseInstancedMesh extends BaseMixin(InstancedMesh) {
	constructor( geometry, material, count ){

		super(geometry, material, count);

	}
}
