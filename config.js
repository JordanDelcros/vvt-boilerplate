export default {
	title: "Vite Vue Three : Boilerplate",
	description: "VVT (Vite + Vue + Three) boilerplate to create interactive websites",
	packer: {
		// toggle asset packing CLI visual progress bar
		progressBar: false
	},
	locales: {
		// default language
		base: "en",
		// uri to schema.json and xx.json locales to import from distant server
		schema: ""
	},
	assets: {
		// toggle database caching
		useCache: true
	},
	database: {
		name: "VVT_DATABASE",
		stores: ["CUSTOM_STORE"]
	},
	renderer: {
		// run the webgl only when exiting the loader (user input)
		awaitLoaderExit: true,
		// toggle canvas native antialiasing (disabled in case of postprocessing)
		antialias: false,
		alpha: false
	},
	postprocessing: {
		enabled: true,
		ssao: true,
		blur: true
	},
	configurator: {
		// toggle configurator tool
		enabled: true
	}
};
