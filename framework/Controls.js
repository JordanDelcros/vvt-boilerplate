import { Vector2, Raycaster, Scene } from "three";
import { Renderer, EventManager } from "#framework";

let LOCKED = false;

const EVENTS = new Array();
const RAYCASTER = new Raycaster();
const VECTOR = new Vector2();

const POINTER = {
	POSITION: new Vector2(),
	DELTA: new Vector2(),
	DISTANCE: 0,
	NORMALIZED_POSITION: new Vector2(),
	NORMALIZED_DELTA: new Vector2(),
	NORMALIZED_DISTANCE: 0,
	BUTTON: 0,
	DRAG: false,
	CLICKED: false,
	TOUCH: false
};
const SCROLL = {
	POSITION: new Vector2(),
	DELTA: new Vector2(),
	DISTANCE: 0
};

export default class Controls {
	static get isTouch(){
		return POINTER.TOUCH;
	}
	static get pointer(){
		return POINTER.POSITION;
	}
	static get pointerDelta(){
		return POINTER.DELTA;
	}
	static get pointerDistance(){
		return POINTER.DISTANCE;
	}
	static get normalizedPointer(){
		return POINTER.NORMALIZED_POSITION;
	}
	static get normalizedPointerDelta(){
		return POINTER.NORMALIZED_DELTA;
	}
	static get normalizedPointerDistance(){
		return POINTER.NORMALIZED_DISTANCE;
	}
	static get pointerDrag(){
		return POINTER.DRAG;
	}
	static get pointerDown(){
		return POINTER.BUTTONS === 1;
	}
	static get pointerClick(){
		return POINTER.CLICKED;
	}
	static get scroll(){
		return SCROLL.POSITION;
	}
	static get scrollDelta(){
		return SCROLL.DELTA;
	}
	static get scrollDistance(){
		return SCROLL.DISTANCE;
	}
	static setup( target = window ){

		Controls.addInput(target, "contextmenu", ( event ) => {

			event.preventDefault();

		}, { lockable: true });

		Controls.addInput(target, "mousedown", ( event ) => {

			POINTER.BUTTONS = event.buttons;

		}, { lockable: true });

		Controls.addInput(target, "mousemove", ( event ) => {

			VECTOR.set(event.clientX, event.clientY);

			POINTER.DISTANCE = POINTER.POSITION.distanceTo(VECTOR);

			POINTER.DELTA.subVectors(VECTOR, POINTER.POSITION);
			POINTER.POSITION.copy(VECTOR);

			// NORMALIZED
			VECTOR.set(
				(event.clientX / window.innerWidth) * 2 - 1,
				-(event.clientY / window.innerHeight) * 2 + 1
			);

			POINTER.NORMALIZED_DISTANCE = POINTER.NORMALIZED_POSITION.distanceTo(VECTOR);

			POINTER.NORMALIZED_DELTA.subVectors(VECTOR, POINTER.NORMALIZED_POSITION);
			POINTER.NORMALIZED_POSITION.copy(VECTOR);

			if( Controls.pointerDown && Controls.pointerDistance ){

				POINTER.DRAG = true;

			}

		}, { lockable: true });

		Controls.addInput(target, "mouseleave", ( event ) => {

			POINTER.BUTTONS = 0;
			POINTER.DRAG = false;

		});

		Controls.addInput(target, "mouseup", ( event ) => {

			POINTER.BUTTONS = 0;
			POINTER.CLICKED = true;

		}, { lockable: true });

		Controls.addInput(target, "wheel", ( event ) => {

			event.preventDefault();

			SCROLL.DELTA.set(event.deltaX, event.deltaY);

			SCROLL.DISTANCE = VECTOR.addVectors(SCROLL.POSITION, SCROLL.DELTA).distanceTo(SCROLL.POSITION);

			SCROLL.POSITION.add(SCROLL.DELTA);

		}, { lockable: true, passive: false });

		Controls.addInput(Renderer.instance.domElement, "touchstart", ( event ) => {

			event.preventDefault();

			POINTER.TOUCH = true;
			POINTER.BUTTONS = 1;
			POINTER.DRAG = false;

			const { clientX, clientY } = event.touches.item(0);

			POINTER.POSITION.set(clientX, clientY);

			// NORMALIZED
			POINTER.NORMALIZED_POSITION.set(
				(clientX / window.innerWidth) * 2 - 1,
				-(clientY / window.innerHeight) * 2 + 1
			);

		}, { lockable: true, passive: false });

		Controls.addInput(target, "touchmove", ( event ) => {

			event.preventDefault();

			POINTER.DRAG = true;

			const { x, y } = POINTER.POSITION;

			const { clientX, clientY } = event.touches.item(0);

			VECTOR.set(clientX, clientY);

			POINTER.DISTANCE = POINTER.POSITION.distanceTo(VECTOR);

			POINTER.DELTA.subVectors(VECTOR, POINTER.POSITION);
			POINTER.POSITION.copy(VECTOR);

			// SCROLL
			SCROLL.DELTA.copy(POINTER.DELTA).negate();

			SCROLL.DISTANCE = VECTOR.addVectors(SCROLL.POSITION, SCROLL.DELTA).distanceTo(SCROLL.POSITION);

			SCROLL.POSITION.add(SCROLL.DELTA);

			// NORMALIZED
			VECTOR.set(
				(clientX / window.innerWidth) * 2 - 1,
				-(clientY / window.innerHeight) * 2 + 1
			);

			POINTER.NORMALIZED_DISTANCE = POINTER.NORMALIZED_POSITION.distanceTo(VECTOR);

			POINTER.NORMALIZED_DELTA.subVectors(VECTOR, POINTER.NORMALIZED_POSITION);
			POINTER.NORMALIZED_POSITION.copy(VECTOR);

		}, { lockable: true, passive: false });

		Controls.addInput(target, "touchend", ( event ) => {

			event.preventDefault();

			POINTER.BUTTONS = 0;

			if( !POINTER.DRAG ) POINTER.CLICKED = true;

		}, { passive: false });

	}
	static addInput( target, type, action, options ){

		if( options?.lockable ){

			const originalAction = action;

			action = ( event ) => {

				if( LOCKED ) return false;

				originalAction(event);

			};

		}

		const event = EventManager.on(target, type, action, options);

		EVENTS.push(event);

		return event;

	}
	static removeInput( target, type, action, options ){

		EventManager.off(target, type, action, options);

	}
	static raycast( target ){

		RAYCASTER.setFromCamera(POINTER.NORMALIZED_POSITION, Renderer.currentCamera);

		return RAYCASTER.intersectObjects(target.children, true);

	}
	static setupRaycast( near, far ){

		Object.assign(RAYCASTER, { near, far });

	}
	static update(){

		POINTER.DELTA.set(0, 0);
		POINTER.DISTANCE = 0;
		POINTER.NORMALIZED_DELTA.set(0, 0);
		POINTER.NORMALIZED_DISTANCE = 0;
		if( POINTER.BUTTONS === 0 ) POINTER.DRAG = false;
		POINTER.CLICKED = false;

		SCROLL.DELTA.set(0, 0);
		SCROLL.DISTANCE = 0;

	}
	static lock( locked = true ){

		LOCKED = locked;

	}
	static unlock(){

		LOCKED = false;

	}
	static dispose(){

		EVENTS.forEach(off => off());

	}
}
