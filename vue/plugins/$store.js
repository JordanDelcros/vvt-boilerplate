import { Configurator } from "#framework";
import Store from "#root/store.js";

export default {
	install( app ){

		app.config.globalProperties.$store = Store;
		app.provide("store", Store);

	}
}
