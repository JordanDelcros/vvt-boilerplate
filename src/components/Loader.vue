<template>
	<section
		v-if="$store.isLoading"
		class="loader"
		:class="{ complete, entering }"
	>
		<Button text="entrer" :action="enter" :locked="!complete || entering">
			<div
				class="bar"
				:style="{
					width: `${ progress }%`
				}"
			/>
		</Button>
	</section>
</template>

<script setup>
	import $store from "#app/store";
	import Button from "#app/components/Button.vue";
	import { Assets, Randomness } from "#framework";
	import { ref, watch } from "vue";

	const progress = ref(0);
	let biggest = 0;
	let smallest = Infinity;
	const complete = ref(false);
	const entering = ref(false);

	watch(() => Assets.pending, ( pendingFiles ) => {
		biggest = Math.max(biggest, pendingFiles);
		smallest = Math.min(smallest, pendingFiles);
		progress.value = (1 - smallest / biggest) * 100;

		if( pendingFiles === 0 && !complete.value ){
			requestAnimationFrame(() => setTimeout(() => complete.value = true, 10));
		}

	});

	function enter(){

		entering.value = true;
		setTimeout(() => {
			$store.isLoading = false;
			Assets.userResolve();
		}, 2000);

	}
</script>

<style lang="scss" scoped>

	$easeBounce: cubic-bezier(0.34, 1.56, 0.64, 1);
	$easeExpo: cubic-bezier(0.7, 0, 0.84, 0);

	.loader {
		z-index: 3;
		overflow: hidden;
		position: absolute;
		left: 0;
		top: 0;
		width: 100vw;
		height: 100svh;
		background: #000;
		opacity: 1;

		:deep(.button) {
			position: absolute;
			left: 50%;
			top: 50%;
			width: 250px;
			height: 5px;
			line-height: 5px;
			transform: translate(-50%, -50%);
			background: #555;

			.text {
				transform: translateX(-50%) scale(0.01);
			}

			.bar {
				position: absolute;
				left: 0;
				top: 0;
				height: 100%;
				background: #FFF;
			}
		}

		&.complete {
			:deep(.button) {
				height: 50px;
				line-height: 50px;
				transition: width 1s $easeBounce 1s, height 1s $easeBounce 1s, line-height 1s $easeBounce 1s, padding 0.4s $easeBounce;

				.text {
					transform: translateX(-50%);
					transition: transform 1s $easeBounce 1s;

					span {
						transition: padding 0.4s $easeBounce;
					}
				}
			}
		}

		&.entering {
			pointer-events: none;
			cursor: default;
			
			:deep(.button) {
				padding: 5px 30px;
				width: 300vw;
				height: 100svh;
				transition: width 2s $easeExpo, height 2s $easeExpo;

				.text {
					font-size: 40svh;
					line-height: 100svh;
					opacity: 0;
					transition: font-size 2s $easeExpo, line-height 2s $easeExpo, opacity 1.5s $easeExpo;

					span {
						padding: 0 5svh;
						transition: padding 2s $easeExpo;
					}
				}
			}
		}
	}
</style>