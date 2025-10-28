import AssetsPacker from "./";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";

const execAsync = promisify(exec);

async function generateWebM( input, output, quality = 128, fast = false ){

	return execAsync(`ffmpeg -y -i ${ input } -c:a libopus -b:a ${ quality }k ${ fast ? "-vbr off" : "" } ${ output }`);

}

async function generateMP3( input, output, quality = 128, fast = false ){

	return execAsync(`ffmpeg -y -i ${ input } -c:a libmp3lame -b:a ${ quality }k ${ fast ? "-qscale:a 7" : "" } ${ output }`);

}

export default function packAudio( source ){

	return {
		info: `🎧 pack-audio "${ source.file }"`,
		action: async () => {

			if( !AssetsPacker.FFMpegAvailable ){

				throw new Error("⚠️ FFMpeg (FFProbe) not available!")

			}

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				high: `${ output }.high.opus`,
				medium: `${ output }.medium.opus`,
				low: `${ output }.low.opus`,
				fallback: `${ output }.fallback.mp3`
			};

			const { fast } = source.options;

			await execAsync(`
				ffmpeg -y -i ${ source.file }\
				-map 0:a -c:a libopus -b:a 128k ${ fast ? "-vbr off" : "" } ${ source.generated.high }\
				-map 0:a -c:a libopus -b:a 96k ${ fast ? "-vbr off" : "" } ${ source.generated.medium }\
				-map 0:a -c:a libopus -b:a 64k ${ fast ? "-vbr off" : "" } ${ source.generated.low }\
				-map 0:a -c:a libmp3lame -b:a 128k ${ fast ? "-qscale:a 7" : "" } ${ source.generated.fallback }\
			`);

			return source;

		}
	};

};
