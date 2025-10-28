export default {
	packer: {
		// toggle asset packing CLI visual progress bar
		progressBar: true
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
		// run the webgl only when exiting the loader (user input)
		awaitLoaderExit: true
	},
	configurator: {
		// toggle configurator tool
		enabled: true
	}
};
