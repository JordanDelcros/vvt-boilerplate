import { Vector2 } from "three";
import { Renderer, EventManager } from "#framework";

let POINTER_ACTIVE = false;
const POINTER_START = new Vector2();

const POINTER_POSITION = new Vector2();
const RELATIVE_POINTER_POSITION = new Vector2();

const POINTER_DRAG = new Vector2();
const RELATIVE_POINTER_DRAG = new Vector2();

const VECTOR = new Vector2();

const setPointer = ( x, y, active ) => {

	const isStart = !POINTER_ACTIVE && active;

	POINTER_ACTIVE = active;

	if( isStart ) POINTER_START.set(x, y);

	POINTER_POSITION.set(x, y);

	RELATIVE_POINTER_POSITION.set(
		(x / window.innerWidth) * 2 - 1,
		-(y / window.innerHeight) * 2 + 1
	);

	POINTER_DRAG.subVectors(POINTER_POSITION, POINTER_START);

	RELATIVE_POINTER_DRAG.set(
		POINTER_DRAG.x / window.innerWidth,
		-POINTER_DRAG.y / window.innerHeight
	);

}

const onMouseEvent = ({ clientX, clientY, buttons }) => {

	setPointer(clientX, clientY, buttons === 1);

}

const onTouchEvent = ( event ) => {

	// event.preventDefault();

	const { clientX, clientY } = event.touches.item(0) ?? { clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 };
	setPointer(clientX, clientY, event.touches.length > 0);

};

export default class Input {
	static get pointerActive(){

		return POINTER_ACTIVE;

	}
	static get pointer(){

		return POINTER_POSITION;

	}
	static get relativePointer(){

		return RELATIVE_POINTER_POSITION;

	}
	static get pointerDrag(){

		return POINTER_DRAG;

	}
	static get relativePointerDrag(){

		return RELATIVE_POINTER_DRAG;

	}
	static setup(){

		EventManager.on(window, "mousedown", onMouseEvent);
		EventManager.on(window, "mousemove", onMouseEvent);
		EventManager.on(window, "mouseup", onMouseEvent);
		EventManager.on(window, "touchstart", onTouchEvent, { passive: false });
		EventManager.on(window, "touchmove", onTouchEvent, { passive: false });
		EventManager.on(window, "touchend", onTouchEvent, { passive: false });

	}
	static dispose(){

		POINTER_POSITION.setScalar(0);
		RELATIVE_POINTER_POSITION.setScalar(0);
		VECTOR.setScalar(0);

		EventManager.off(window, "mousemove", onMouseEvent);
		EventManager.off(window, "touchstart", onTouchEvent);
		EventManager.off(window, "touchmove", onTouchEvent);
		EventManager.off(window, "touchstart", onTouchEvent, { passive: false });
		EventManager.off(window, "touchmove", onTouchEvent, { passive: false });
		EventManager.off(window, "touchend", onTouchEvent, { passive: false });

	}
}
