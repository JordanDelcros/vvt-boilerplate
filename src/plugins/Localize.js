import { Assets } from "#framework";
import { USAGES } from "#framework/assets-packer/config.js";
import { reactive, ref, computed } from "vue";

const DEFAULT_LOCALE = "en";

const LOCALES = reactive({});

async function loadLocale( path ){

	try {

		const name = path.split("/").pop().replace(".json", "");
		const data = await fetch(path).then(response => response.json());

		if( LOCALES[name] === undefined ) LOCALES[name] = {};

		Object.assign(LOCALES[name], data);

	}
	catch( error ){

		console.error(`Fail loading locale from "${ path }"`);

	}

}

async function importLocales( schema ){

	// Import generated locales
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

		const $l = computed(() => ( path ) => {

			return LOCALES[currentLocale.value]?.[path] ?? LOCALES[base]?.[path] ?? path;

		});

		app.config.globalProperties.$l = ( path ) => $l.value(path);
		app.provide("l", app.config.globalProperties.$l);

		app.config.globalProperties.$locales = LOCALES;
		app.config.globalProperties.$currentLocale = currentLocale.value;

		app.config.globalProperties.setLocale = ( locale ) => {
			if( LOCALES[locale] === undefined ) return;
			currentLocale.value = locale;
			app.config.globalProperties.$currentLocale = locale;
		}
	}

}
