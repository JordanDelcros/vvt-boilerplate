<template>
	<Loader/>
	<template v-if="$store.loaded">
		<TransitionScreen/>
		<LanguageSelector/>
	</template>
	<WebGL ref="$webgl"/>
</template>

<script setup>

	import { Assets, Audio, Configurator, Database, Renderer } from "#framework";
	import $store from "#root/store.js";
	import { ref, onMounted } from "vue";
	import Loader from "#app/components/Loader.vue";
	import TransitionScreen from "#app/components/TransitionScreen.vue";
	import LanguageSelector from "#app/components/LanguageSelector.vue";
	import WebGL from "#app/components/WebGL.vue";
	import config from "#root/config.js";

	const $webgl = ref(null);

	if( config.configurator.enabled ){

		Configurator.setup();

		const storeFolder = Configurator.addFolder("Store");

		for( const key in $store ){

			if( !$store.hasOwnProperty(key) || $store[key] === null || $store[key] instanceof Object ) continue;

			storeFolder.addBinding($store, key);

		}

	}

	onMounted(async () => {

		await Database.setup();
		await Assets.setup();

		const files = await Assets.preloadRegistry();

		files.forEach(( file ) => {

			if( file.metadata && file.grouped instanceof AudioBuffer ){

				Audio.registerFX(file)

			}

		});

		Assets.unload();

		$store.loaded = true;

		if( config.renderer.awaitLoaderExit !== false ) await Assets.userValidation;

		$webgl.value.instance.run();

	});

</script>
