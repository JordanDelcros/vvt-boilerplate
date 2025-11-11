import { Assets } from "#framework";
import { USAGES } from "#framework/assets-packer/config.js";
import { reactive, ref, computed } from "vue";

const DEFAULT_LOCALE = "en";

const LOCALES = reactive({});

async function loadLocale( path ){

	try {

		const name = path.split("/").pop().replace(".json", "");
		const data = await fetch(path).then(response => response.json());

		if( LOCALES[name] === undefined ) LOCALES[name] = new Object();

		for( const key in data ){

			let target = LOCALES[name];
			const chunks = key.split(".");

			for( let index = 0; index < chunks.length; index++ ){

				const chunk = chunks[index];
				const nextChunk = chunks[index + 1];

				if( target[chunk] === undefined ){

					target[chunk] = /^[0-9]+$/.test(nextChunk) ? new Array() : new Object();

				}

				if( index < (chunks.length - 1) ){

					target = target[chunk];

				}
				else {

					target[chunk] = data[key];

				}

			}

		}

	}
	catch( error ){

		console.error(`Fail loading locale from "${ path }"`);

	}

}

// import locales from assets folder and optionally combine them with a i18n schema
async function importLocales( schema ){

	// import generated locales from assets
	const registeredLocales = Assets.registry.filter(asset => asset.usage === USAGES.locale);
	for( const locale of registeredLocales ){

		await loadLocale(locale.generated.prefer);

	}

	if( schema ){

		if( !schema.endsWith("/") ) schema = schema + "/";

		try {

			const { activeLanguages } = await fetch(`${ schema }schema.json`).then(response => response.json())

			for( const name of activeLanguages ){

				await loadLocale(`${ schema }${ name }.json`);

			}

		}
		catch( error ){

			console.error(`Fail loading schema locale from "${ schema }"`);

		}

	}

}

export default {
	install( app, { base = "en", schema } ){

		importLocales(schema);

		const currentLocale = ref(base);

		const $localize = computed(() => ( path ) => {


			path = path.replace(/\[([0-9]+)\]/g, ".$1");
			const chunks = path.split(".");

			let target = LOCALES[currentLocale.value];

			for( const chunk of chunks ){

				target = target[chunk];

			}

			return target;

		});

		app.config.globalProperties.$localize = ( path ) => $localize.value(path);
		app.provide("localize", app.config.globalProperties.$localize);
		app.config.globalProperties.$l = ( path ) => $localize.value(path);
		app.provide("l", app.config.globalProperties.$localize);

		app.config.globalProperties.$locales = LOCALES;
		app.config.globalProperties.$currentLocale = currentLocale.value;

		// allow changing locale
		app.config.globalProperties.setLocale = ( locale ) => {

			if( LOCALES[locale] === undefined ) return;
			currentLocale.value = locale;
			app.config.globalProperties.$currentLocale = locale;

		}

	}

}
