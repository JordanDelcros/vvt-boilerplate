import AssetsPacker from "./";
import { exec } from "child_process";
import { promisify } from "util";
import { mkdirSync } from "fs";

const execAsync = promisify(exec);

export default function packVideo( source ){

	return {
		info: `🎬 pack-video "${ source.file }"`,
		action: async () => {

			if( !AssetsPacker.FFMpegAvailable ){

				throw new Error("⚠️ FFMpeg (FFProbe) not available!")

			}

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				high: `${ output }.high.webm`,
				medium: `${ output }.medium.webm`,
				low: `${ output }.low.webm`,
				fallback: `${ output }.fallback.mp4`
			};

			const { fast } = source.options;

			await execAsync(`
				ffmpeg -y -i ${ source.file }\
				-map 0:v -map 0:a? -c:v libvpx-vp9 -b:v 5M -crf ${ fast ? 35 : 18 } -deadline ${ fast ? "realtime" : "good" } -cpu-used ${ fast ? 8 : 0 } -threads auto -c:a libopus -b:a 192k ${ source.generated.high }\
				-map 0:v -map 0:a? -c:v libvpx-vp9 -b:v 2.5M -crf ${ fast ? 35 : 28 } -deadline ${ fast ? "realtime" : "good" } -cpu-used ${ fast ? 8 : 0 } -threads auto -c:a libopus -b:a 128k ${ source.generated.medium }\
				-map 0:v -map 0:a? -c:v libvpx-vp9 -b:v 1M -crf ${ fast ? 35 : 35 } -deadline ${ fast ? "realtime" : "good" } -cpu-used ${ fast ? 8 : 0 } -threads auto -c:a libopus -b:a 96k ${ source.generated.low }\
				-map 0:v -map 0:a? -c:v libx264 -preset ${ fast ? "ultrafast" : "medium" } -tune ${ fast ? "animation" : "none" } -crf 23 -c:a aac -b:a 128k ${ source.generated.fallback }\
			`);

			return source;

		}
	};

};
