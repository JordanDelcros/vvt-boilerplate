import EventManager from "./EventManager.js";
import { Pane } from "tweakpane";
import * as TweakpaneEssentialsPlugin from "@tweakpane/plugin-essentials";

let IS_SETUP = false;
let PANE = null;
let FPSGraph = null;

export default class Configurator {
	static get active(){

		return IS_SETUP;

	}
	static get pane(){

		return PANE;

	}
	static setup(){

		console.info("Press CTRL+D or 4 fingers to display configurator.");

		PANE = new Pane({ title: "CONFIG", hidden: true });
		PANE.registerPlugin(TweakpaneEssentialsPlugin);

		FPSGraph = PANE.addBlade({
			view: "fpsgraph",
			rows: 2
		});

		PANE.on("change", Configurator.save);

		EventManager.on(window, "keydown", Configurator.toggle);
		EventManager.on(window, "touchstart", Configurator.toggle);

		IS_SETUP = true;

	}
	static frameStart(){

		if( !IS_SETUP ) return;

		FPSGraph.begin();

	}
	static frameEnd(){

		if( !IS_SETUP ) return;

		FPSGraph.end();

	}
	static toggle( event = null ){

		if( !Configurator.active ) return;

		// Listen for CTRL+D
		if( event instanceof KeyboardEvent ){

			if( event.ctrlKey && event.keyCode == 68 ) PANE.hidden = !PANE.hidden;

		}
		else if( event instanceof TouchEvent ){

			if( event.touches.length === 4 ) PANE.hidden = !PANE.hidden;

		}
		else if( event instanceof Boolean ){

			PANE.hidden = event;

		}
		else {

			PANE.hidden = !PANE.hidden;

		}

		Configurator.save();

	}
	static addFolder( title, expanded = false ){

		if( !Configurator.active ) return;

		return PANE.addFolder({
			title,
			expanded
		});

	}
	static getStateHash(){

		const structure = new Array();

		function traverse( paneOrFolder ){

			paneOrFolder.children.forEach(child => {

				structure.push(child.title ?? "");
				structure.push(child.label ?? "");

				if( child.options instanceof Array ) structure.push(child.options.length);

				if( child.children ) traverse(child);

			});

		}

		// FNV-1a hash simple (32 bits)
		function fnv1aHash (str) {

			let hash = 0x811c9dc5;

			for( let index = 0; index < str.length; index++ ){
				hash ^= str.charCodeAt(index);
				hash = (hash * 0x01000193) >>> 0;
			}

			return ("0000000" + hash.toString(16)).slice(-8); // hash en hex, 8 caractères
		}

		traverse(PANE);

		return fnv1aHash(structure.join("-"));

	}
	static save(){

		if( !Configurator.active ) return;

		try {

			const state = PANE.exportState();
			state.hash = Configurator.getStateHash();
			window.localStorage.setItem("configurator", JSON.stringify(state));

		}
		catch( error ){

			console.error("save error", error);

		}

	}
	static restore(){

		if( !Configurator.active ) return;

		const currentHash = Configurator.getStateHash();

		try {

			const state = JSON.parse(window.localStorage.getItem("configurator"));
			if( state && state.hash === currentHash ) PANE.importState(state);

		}
		catch( error ){

			// Remove incompatible saved state (error on save or braking changes since save)
			window.localStorage.removeItem("configurator");
			console.error("restore error", error);

		}

	}
	static refresh(){

		Configurator.pane.refresh();

	}
	static dispose(){

		EventManager.off(window, "keydown", Configurator.toggle);
		EventManager.off(window, "touchstart", Configurator.toggle);

		PANE.dispose();

	}
};
