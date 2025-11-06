import "./style.css";
import { Assets } from "#framework";
import { createApp } from "vue";
import App from "./App.vue";
import AssetsPlugin from "./plugins/$assets.js";
import StorePlugin from "./plugins/$store.js";
import LocalizePlugin from "./plugins/$localize.js";
import config from "#root/config.js";

console.log("Made with ♥️ from 🇫🇷");

const app = createApp(App);

app.use(AssetsPlugin);
app.use(StorePlugin);
app.use(LocalizePlugin, config.locales);

app.mount("#app");
