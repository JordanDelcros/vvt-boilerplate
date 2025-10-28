import { inject } from "vue";

export default function useStore(){

	return inject("store");

}
