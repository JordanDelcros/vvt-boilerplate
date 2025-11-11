<template>
	<div
		:class="{
			['language-selector']: true,
			open
		}"
		@click="toggle"
		@pointerleave="close"
	>
		<ul>
			<li
				v-for="(locale, name) in $locales"
				:class="{
					active: name === $currentLocale
				}"
				@click="select(name)"
			>
				<img :src="$assets(`/flags/${ name }.svg`)"/>
				<span v-html="$l(`languages.${ name }`)"/>
			</li>
		</ul>
	</div>
</template>

<script setup>

	import { getCurrentInstance, ref, computed } from "vue";

	const { proxy } = getCurrentInstance();

	const open = ref(false);

	function toggle(){

		open.value = !open.value;

	}

	function close(){

		open.value = false;

	}

	function select( locale ) {

		proxy.setLocale(locale);

		console.log("access locale from code:", proxy.$l("hello"));

	}

</script>

<style lang="scss" scoped>

	.language-selector {
		z-index: 10;
		position: absolute;
		bottom: 20px;
		left: 20px;
		display: flex;
		flex-direction: row;
		width: 150px;
		min-height: 46px;
		cursor: pointer;
		color: #000;
		opacity: 0.5;

		&:hover {
			opacity: 1;
		}

		ul {
			width: 100%;
			height: 100%;
			grow: 1;
			display: flex;
			flex-direction: column-reverse;
			justify-content: flex-end;
			border-radius: 1svh;
			background-color: #FFF;

			li {
				order: 2;
				display: flex;
				align-items: center;
				padding: 10px;
				border-radius: 1svh;
				background-color: transparent;
				transition: background-color 0.25s ease;

				&.active {
					order: 1;
				}

				&:not(.active){
					display: none;
				}

				img {
					width: 26px;
					height: 26px;
				}

				span {
					margin-left: 10px;
					text-transform: uppercase;
				}

				&:hover {
					background-color: #F0F0F0;
				}
			}
		}

		&.open {

			ul {

				li {
					display: flex;
				}
			}
		}
	}

</style>
