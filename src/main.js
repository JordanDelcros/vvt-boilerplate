import "./style.css";
import { Assets } from "#framework";
import { createApp } from "vue";
import App from "./App.vue";
import AssetsPlugin from "./plugins/Assets.js";
import StorePlugin from "./plugins/Store.js";
import LocalizePlugin from "./plugins/Localize.js";
import config from "#root/config.js";

console.log("Made with ♥️ from 🇫🇷");

const app = createApp(App);

app.use(AssetsPlugin);
app.use(StorePlugin);
app.use(LocalizePlugin, config.locales);

app.mount("#app");
