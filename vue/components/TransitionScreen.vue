<template>
	<Transition @after-enter="$store.transitionCallback" @after-leave="$store.transitionCallback">
		<section
			v-if="$store.transitionVisible"
			class="transition-screen"
		>
			<p v-html="$l('hello')"/>
		</section>
	</Transition>
</template>

<script setup></script>

<style lang="scss" scoped>

	.transition-screen {
		z-index: 2;
		position: fixed;
		left: 0;
		top: 0;
		display: flex;
		flex-direction: column;
		width: 100svw;
		height: 100svh;
		pointer-events: none;
		background-color: #000;
	}

	.v-enter-active,
	.v-leave-active {
		transition: opacity 0.5s ease, transform 0.5s ease;
	}

	.v-enter-from,
	.v-leave-to {
		opacity: 0;
		transform: scale(0.8);
	}

</style>
