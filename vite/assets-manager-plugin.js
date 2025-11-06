import Manager from "../manager.js";
import OS from "os";
import { version } from "../package.json";

export default function assetsManagerPlugin( mode ){

	let registry = {};

	const concurrency = OS.cpus().length;

	let allowReload = true;

	return {
		name: "vite-plugin-assets-manager",
		enforce: "pre",
		async config(){

			await Manager.pack(mode, concurrency);
			registry = Manager.getRegistry();

			return {
				define: {
					__ASSETS__: JSON.stringify(registry),
					__VERSIONNING__: JSON.stringify(version)
				}
			};

		},
		buildStart(){

			if( mode === "development" ) registry.forEach(asset => this.addWatchFile(asset.path));

		},
		async handleHotUpdate({ file, server }){

			if( !allowReload ) return [];

			allowReload = false;

			await Manager.pack(mode, concurrency);
			registry = Manager.getRegistry();

			server.ws.send({ type: "full-reload" });

			await new Promise(resolve => setTimeout(resolve, 100));

			allowReload = true;

			return [];

		}
	}

}
