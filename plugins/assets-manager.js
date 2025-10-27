import Manager from "../manager.js";

export default function assetsManager(){

	let registry = {};

	return {
		name: "vite-plugin-assets-manager",
		enforce: "pre",
		async config(){

			await Manager.pack();
			registry = Manager.getRegistry();

			return {
				define: {
					__ASSETS__: JSON.stringify(registry)
				}
			};

		}
	}

}
