import Configurator from "./Configurator.js";
import Audio from "./Audio.js";
import { Object3D } from "three";

export default ( Base ) => class extends Base {
	constructor( ...parameters ){

		super(...parameters);

		if( this.debug ){

			this.debugFolder = Configurator.addFolder(this.constructor.name);
			this.debug(this.debugFolder);

		}

	}
	add( object, options ){

		if( object instanceof Object3D === false ) object = new object(options);

		super.add(object);

		return object;

	}
	useAudio( target = this, options = {} ){

		return Audio.createEmitter(this, options);

	}
	onMount(){

		this.traverse(element => element !== this && element.onMount?.());

	}
	onUnmount(){

		this.traverse(element => element !== this && element.onUnmount?.());

	}
	dispose(){

		this.debugFolder?.dispose();

		super.dispose?.();

	}
}
