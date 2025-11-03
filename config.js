export default {
	title: "Sephora Serious Game",
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
	renderer: {
		antialias: false,
		// run the webgl only when exiting the loader (user input)
		awaitLoaderExit: false,
	},
	postProcessing: {
		enabled: true,
		ssao: true
	},
	configurator: {
		// toggle configurator tool
		enabled: true
	}
};
