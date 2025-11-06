import { reactive } from "vue";

export default reactive({
	loaded: false,
	foo: "bar",
	transitionVisible: false,
	transitionCallback: null,
	showTransitionScreen(){

		return new Promise(( resolve ) => {

			this.transitionCallback = resolve
			this.transitionVisible = true;

		});

	},
	hideTransitionScreen(){

		return new Promise(( resolve ) => {

			this.transitionCallback = resolve;
			this.transitionVisible = false;

		});

	}
});
