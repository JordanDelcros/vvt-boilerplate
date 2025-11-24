const ACTIONS = new Array();

let CURRENT_TIME = 0;
let PREVIOUS_TIME = 0;
let LAST_RENDER = 0;
let DELTA_TIME = 0;
let ANIMATION_FRAME = null;

let tic = true;
function loop( currentTime ){

	ANIMATION_FRAME = requestAnimationFrame(loop);

	CURRENT_TIME = currentTime;

	DELTA_TIME = currentTime - PREVIOUS_TIME;

	PREVIOUS_TIME = currentTime;

	if( DELTA_TIME > 100 && (currentTime - LAST_RENDER) < 1000 ) return;

	ACTIONS.forEach(({ callback }) => callback(currentTime, DELTA_TIME, tic));

	LAST_RENDER = currentTime;

	tic = !tic;

}

export default class Timer {
	static get currentTime(){

		return CURRENT_TIME;

	}
	static get deltaTime(){

		return DELTA_TIME;

	}
	static get lerpFactor(){

		return Math.min(1, DELTA_TIME * 0.001);

	}
	static setup(){

		Timer.stop();

		ANIMATION_FRAME = requestAnimationFrame(loop);

	}
	static stop(){

		cancelAnimationFrame(ANIMATION_FRAME);

	}
	static add( callback, priority = 0 ){

		if( !ACTIONS.find(action => action.callback === callback) ){

			ACTIONS.push({ callback, priority });

			ACTIONS.sort(( a, b ) => a.priority - b.priority);

		}

		return () => Timer.remove(callback);

	}
	static remove( callback ){

		const index = ACTIONS.findIndex(action => action.callback === callback);
		if( index > 0 ) ACTIONS.splice(index, 1);

	}
	static dispose(){

		ACTIONS.length = 0;
		Timer.stop();

	}
}