import { defineConfig } from "vite";
import assetsManager from "./plugins/assets-manager.js";
import vue from "@vitejs/plugin-vue";
import glsl from "vite-plugin-glsl";
import { resolve } from "path";
import { readFileSync } from "fs";

export default defineConfig({
	plugins: [
		assetsManager(),
		vue(),
		glsl({
			watch: true,
			root: resolve(__dirname, "./webgl/shaders")
		}),
	],
	resolve: {
		alias: {
			"#framework": resolve(__dirname, "./framework"),
			"#app": resolve(__dirname, "./src"),
			"#webgl": resolve(__dirname, "./webgl")
		}
	},
	server: {
		https: {
			key: readFileSync(`${ process.env.HOME }/Sites/.certificates/localhost-key.pem`),
			cert: readFileSync(`${ process.env.HOME }/Sites/.certificates/localhost.pem`)
		}
	}
})
