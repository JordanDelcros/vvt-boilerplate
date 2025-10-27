import AssetsPacker from "./";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export default async function packAudio( source ){

	console.log(`🎧 pack-audio "${ source.file }"`);

	const output = `${ source.destination }/${ source.name }`;

	source.generated = {
		high: `${ output }.high.opus`,
		medium: `${ output }.medium.opus`,
		low: `${ output }.low.opus`,
		fallback: `${ output }.fallback.mp3`
	};

	await Promise.all([
		execAsync(`ffmpeg -y -i ${ source.file } -c:a libopus -b:a 128k -f webm ${ source.generated.high }`),
		execAsync(`ffmpeg -y -i ${ source.file } -c:a libopus -b:a 96k -f webm ${ source.generated.medium }`),
		execAsync(`ffmpeg -y -i ${ source.file } -c:a libopus -b:a 64k -f webm ${ source.generated.low }`),
		execAsync(`ffmpeg -y -i ${ source.file } -c:a libmp3lame -b:a 128k ${ source.generated.fallback }`)
	]);

	return source;

}
