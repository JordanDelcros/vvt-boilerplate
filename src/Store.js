import { reactive } from "vue";

const forceLanguage = localStorage.getItem("forceLanguage");
const isFrench = (forceLanguage === null && navigator.language.startsWith("fr")) || forceLanguage === "fr";

export default reactive({
	isFrench,
	isLoading: true
});
