import { defineConfig } from "vite";
import assetsManager from "./plugins/assets-manager.js";
import SSLServer from "./plugins/ssl-server.js";
import vue from "@vitejs/plugin-vue";
import glsl from "vite-plugin-glsl";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
	plugins: [
		assetsManager(mode),
		vue(),
		glsl({
			watch: true,
			root: resolve(__dirname, "./webgl/shaders")
		}),
	],
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `
					@use "#app/variables.scss" as *;
				`
			}
		}
	},
	resolve: {
		alias: {
			"#root": __dirname,
			"#framework": resolve(__dirname, "./framework"),
			"#app": resolve(__dirname, "./src"),
			"#webgl": resolve(__dirname, "./webgl")
		}
	},
	server: SSLServer()
}));
