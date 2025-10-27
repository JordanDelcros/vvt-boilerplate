<template>
	<canvas ref="canvas"></canvas>
</template>

<script setup>
	
	import { ref, onMounted, onUnmounted } from "vue";
	import Store from "#app/Store.js";
	import WebGL from "#webgl/WebGL.js";

	const canvas = ref(null);

	let webgl = null;

	onMounted(() => webgl = new WebGL(canvas.value));
	onUnmounted(() => webgl.dispose());

</script>

<style lang="scss" scoped>
	canvas {
		position: fixed;
		left: 0;
		top: 0;
		display: block;
		width: 100svw;
		height: 100svh;
	}
</style>