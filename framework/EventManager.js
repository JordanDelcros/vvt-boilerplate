const EVENTS = new Array();

export default class EventManager {
	static get events(){

		return EVENTS;

	}
	static on( target, type, action, options = null ){

		const isNative = typeof target[`on${ type }`] !== "undefined";

		if( options?.debounce ){

			const originalAction = action;
			const debounce = typeof options.debounce === "boolean" ? 1000 : options.debounce;
			let timeout = null;
			let immediate = true;

			action = ( event ) => {

				// Authorize event immediatly once
				if( immediate ){
					
					immediate = false;
					originalAction(event);

					timeout = setTimeout(() => {
						immediate = true;
					}, debounce);

				}
				else {

					clearTimeout(timeout);
					timeout = setTimeout(() => {
						immediate = true;
						originalAction(event)
					}, debounce);

				}

			}

		}

		if( isNative ) target.addEventListener(type, action, options);

		EVENTS.push({ target, type, action, isNative });

		if( options?.immediate ) EventManager.trigger(target, type, action);

		return () => EventManager.off(target, type, action);

	}
	static off( target, type, action ){

		for( let index = EVENTS.length - 1; index >= 0; index-- ){

			const event = EVENTS[index];

			if(
				(target === event.target && type === event.type && action === event.action ) ||// match action
				(target === event.target && type === event.type && action === undefined ) ||// match type
				(target === event.target && type === undefined && action === undefined ) // Match target
			){

				if( event.isNative ) window.removeEventListener(event.type, event.action);

				EVENTS.splice(index, 1);

			}

		}

	}
	static trigger( target, type, action ){

		const isNative = typeof target[`on${ type }`] !== "undefined";

		if( isNative ){

			target.dispatchEvent(new Event(type));

		}
		else {

			for( event of EVENTS ){

				const event = EVENTS[index];

				if(
					(target === event.target && type === event.type && action === event.action ) ||// match action
					(target === event.target && type === event.type && action === undefined ) ||// match type
					(target === event.target && type === undefined && action === undefined ) // Match target
				){

					EVENTS[index]();

				}

			}

		}

	}
	static dispose(){

		EventManager.off();

	}
}