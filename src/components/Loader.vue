<template>
	<Transition>
		<section
			v-if="$store.loaded && !isExiting"
			class="loader"
			:class="{
				complete: $store.loaded,
				entering: isExiting
			}"
		>
			<button
				v-if="$store.loaded"
				@click="exit"
			>
				{{ $l('start') }}
			</button>
			<p v-else v-html="$l('loading')"/>
		</section>
	</Transition>
</template>

<script setup>

	import { Assets, Audio, Randomness, UseStore } from "#framework";
	import { ref, watch, onMounted } from "vue";
	import { $assets } from "#app/plugins/Assets.js";
	import config from "#root/config.js";

	const $store = UseStore();
	const progress = ref(0);
	let biggest = 0;
	let smallest = Infinity;

	const isExiting = ref(false);

	watch(() => Assets.pending, ( pendingFiles ) => {

		biggest = Math.max(biggest, pendingFiles);
		smallest = Math.min(smallest, pendingFiles);
		progress.value = (smallest / biggest) * 100;

		if( !config.renderer.awaitLoaderExit && pendingFiles === 0 ) exit();

	});

	function exit(){

		Assets.userResolve();
		Audio.unlock();

		isExiting.value = true;

	}

</script>

<style lang="scss" scoped>

	.loader {
		z-index: 2;
		position: absolute;
		left: 0;
		top: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100vw;
		height: 100svh;
		opacity: 1;
		transition: opacity 0.6s ease-in;

		&.complete {}
		&.entering {}
	}

	.v-enter-active,
	.v-leave-active {
		transition: opacity 0.5s ease;
	}

	.v-enter-from,
	.v-leave-to {
		opacity: 0;
	}

</style>