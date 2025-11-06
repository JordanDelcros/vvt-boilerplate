<template>
	<canvas ref="canvas"></canvas>
</template>

<script setup>

	import { ref, shallowRef, onMounted, onUnmounted } from "vue";
	import WebGL from "#webgl/WebGL.js";

	const canvas = ref(null);
	const webgl = shallowRef(null);

	defineExpose({ instance: webgl });

	onMounted(() => {

		webgl.value = new WebGL(canvas.value);

	});

	onUnmounted(() => {

		webgl.value.dispose();

	});

</script>

<style lang="scss" scoped>

	canvas {
		position: fixed;
		left: 0;
		top: 0;
		display: block;
		width: 100svw;
		height: 100svh;
		background: #000;
	}

</style>
