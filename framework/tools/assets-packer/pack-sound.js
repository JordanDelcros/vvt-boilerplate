import { writeFileSync } from "fs";
import { basename, extname } from "path";
import { exec, execSync } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const SILENCE_DURATION = 0.25;

export default async function( source ){

	const packName = source.options.name ?? "sounds";

	console.log(`🔊 pack-sound ${ packName }`);

	const output = `${ source.destination }/${ packName }`;

	source.generated = {
		metadata: `${ output }.json`,
		high: `${ output }.high.opus`,
		fallback: `${ output }.fallback.mp3`
	};

	const inputs = [];
	const filterChains = [];
	let currentTime = 0;
	const metadata = {};

	const groupedFiles = source.files.reduce(( accumulator, file ) => {

		const name = basename(file, extname(file));
		const match = name.match(/(.*)-([0-9]*)$/);

		if( match ){

			if( !accumulator[match[1]] ) accumulator[match[1]] = new Array();
			if( !metadata[match[1]] ) metadata[match[1]] = new Array();
			accumulator[match[1]].push(file);

		}
		else {

			accumulator[name] = [file];
			metadata[name] = new Array();

		}

		return accumulator;

	}, {});

	let index = 0;
	let fileIndex = 0;

	for( const group in groupedFiles ){

		for( const file of groupedFiles[group] ){

			const name = basename(file, extname(file));

			const durationRaw = execSync(`ffprobe -v error -show_entries format=duration -of default=nokey=1:noprint_wrappers=1 "${ file }"`).toString().trim();
			const duration = parseFloat(durationRaw);

			metadata[group].push({
				start: currentTime,
				end: currentTime + duration
			});

			inputs.push(`-i "${ file }"`);
			filterChains.push(`[${ index }:a]`);

			currentTime += duration;

			if( fileIndex < source.files.length - 1 ){

				index++;

				inputs.push(`-f lavfi -t ${ SILENCE_DURATION } -i anullsrc=r=48000:cl=mono`);
				filterChains.push(`[${ index }:a]`);
				currentTime += SILENCE_DURATION;

			}

			index++;
			fileIndex;

		}

	}

	const filter = `"${ filterChains.join("") }concat=n=${ filterChains.length }:v=0:a=1[outa]"`;

	await execAsync(`ffmpeg -y ${ inputs.join(" ") } -filter_complex ${ filter } -map "[outa]" -c:a libopus -b:a 96K -f webm ${ source.generated.high }`);
	await execAsync(`ffmpeg -y ${ inputs.join(" ") } -filter_complex ${ filter } -map "[outa]" -c:a libmp3lame -b:a 96K ${ source.generated.fallback }`);

	writeFileSync(source.generated.metadata, JSON.stringify(metadata));

	return source;

}
