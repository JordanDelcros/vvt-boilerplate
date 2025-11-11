import { Assets } from "#framework";
import { ref } from "vue";

const assets = ( path ) => {

	return Assets.get(path)?.src;

};

export const $assets = assets;

export default {
	install( app ){

		app.config.globalProperties.$assets = assets;
		app.provide("assets", app.config.globalProperties.$assets);
		app.config.globalProperties.$a = assets;
		app.provide("a", app.config.globalProperties.$assets);

	}

}