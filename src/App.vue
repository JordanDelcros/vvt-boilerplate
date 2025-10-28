<template>
	<Loader/>
	<WebGL ref="$webgl"/>
</template>

<script setup>

	import { Assets, Audio, Configurator, Renderer, UseStore } from "#framework";
	import { ref, onMounted } from "vue";
	import Loader from "#app/components/Loader.vue";
	import WebGL from "#app/components/WebGL.vue";
	import config from "#root/config.js";

	if( config.configurator.enabled ) Configurator.setup();

	const $webgl = ref(null);
	const $store = UseStore();

	onMounted(async () => {

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
