import config from "../config.js";

export default function htmlIndexPlugin( mode ){

	return {
		name: "vite-plugin-html-index",
		enforce: "pre",
		async transformIndexHtml( html ){

			return html.replace(/%config\.(\w+)%/g, ( match, key ) => {

				return config[key] ?? "";

			});

		}
	};

}
