import { ref, reactive } from "vue";

export const $store = reactive({
	loaded: false,
	foo: "bar"
});

export default {
	install( app ){

		app.config.globalProperties.$store = ref($store);
		app.provide("store", $store);

	}
}
