import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import { Assets } from "#framework";
import store from "./store.js";

console.log("Made with ♥️ from 🇫🇷");

const locale = store.isFrench ? "fr" : "en";

import(/* @vite-ignore */`/data/${ locale }.js`).then(( data ) => {

	Assets.set("data", data.default);

	const app = createApp(App);

	app.config.globalProperties.$store = store;

	app.mount("#app");

});

