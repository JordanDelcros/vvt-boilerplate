import { defineConfig } from "vite";
import { createHtmlPlugin } from "vite-plugin-html";
import createAssetsManagerPlugin from "./vite/assets-manager-plugin.js";
import SSLServer from "./vite/ssl-server-plugin.js";
import vue from "@vitejs/plugin-vue";
import glsl from "vite-plugin-glsl";
import { resolve } from "path";
import config from "./config.js";

export default defineConfig(({ mode }) => ({
	plugins: [
		createHtmlPlugin({
			inject: {
				data: config
			}
		}),
		createAssetsManagerPlugin(mode),
		glsl({
			watch: true,
			root: resolve(__dirname, "./webgl/shaders/chunks")
		}),
		vue()
	],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `
					@use "#vue/variables.scss" as *;
				`
			}
		}
	},
	resolve: {
		alias: {
			"@": resolve(__dirname, "vue"),
			"#root": __dirname,
			"#framework": resolve(__dirname, "./framework"),
			"#vue": resolve(__dirname, "./vue"),
			"#webgl": resolve(__dirname, "./webgl")
		}
	},
	server: SSLServer()
}));
