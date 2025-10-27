import EventManager from "#framework/EventManager.js";
import { Pane } from "tweakpane";

const pane = new Pane();

pane.hidden = true;

EventManager.on(window, "keydown", ( event ) => {

	if( event.ctrlKey && event.key === "d" ) pane.hidden = !pane.hidden;

});

EventManager.on(window, "touchstart", ( event ) => {

	if( event.touches.length === 4 ) pane.hidden = !pane.hidden;

});

export default pane;
