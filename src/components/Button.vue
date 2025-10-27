<template>
	<Transition>
		<div
			class="button"
			:class="{
				invert,
				locked: isLocked
			}"
			@click="onClick"
		>
			<span class="text">
				<span v-for="letter in text">{{ letter }}</span>
			</span>
			<span class="placeholder">
				<span v-for="letter in text">{{ letter }}</span>
			</span>
			<slot />
		</div>
	</Transition>
</template>

<script setup>
	import { computed } from "vue";

	const props = defineProps({
		text: String,
		action: [String, Function],
		invert: Boolean,
		locked: Boolean
	});

	const isLocked = computed(() => props.locked || !props.action);

	function onClick(){

		if( !isLocked.value ){

			if( typeof props.action === "string" ){

				window.open(props.action, "_blank");

			}
			else {

				props.action();

			}

		}

	}

</script>

<style lang="scss" scoped>
	$easeBounce: cubic-bezier(0.34, 1.56, 0.64, 1);

	.button {
		padding: 0 25px;
		display: inline-block;
		width: auto;
		height: 50px;
		border-radius: 50px;
		font-family: "Bebas", sans-serif;
		font-size: 18px;
		line-height: 50px;
		text-align: center;
		color: #000;
		background: #FFF;
		transition: padding 0.4s $easeBounce;
		overflow: hidden;

		&.invert {
			color: #FFF;
			background: #000;

			&.locked {
				color: #AAA;
				background: #444;
			}
		}

		.text,
		.placeholder {
			display: inline-block;
			white-space: nowrap;
			z-index: 2;
			text-align: center;

			span {
				padding: 0 2px;
			}
		}

		.text {
			position: absolute;
			left: 50%;
			transform: translateX(-50%);

			span {
				transition: padding 0.4s $easeBounce;
			}
		}

		.placeholder {
			pointer-events: none;
			opacity: 0;
		}

		&:not(.locked){
			cursor: pointer;

			&:hover {
				padding: 5px 30px;

				.text span {
					padding: 0 3px;
				}
			}
		}
	}
</style>