import AssetsPacker from "./";
import Mapping from "../Mapping.js";
import { readFileSync } from "fs";
import { writeFile, unlink } from "fs/promises";
import sharp from "sharp";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

function nearestPow2( value ){

	return Math.pow(2, Math.round(Math.log2(value)));

}

async function generateKTX2( source, output, downscale = false, quality = 4, fast = false ){

	const metadata = await sharp(source).metadata();
	const width = nearestPow2(metadata.width) * (downscale ? 0.5 : 1);
	const height = nearestPow2(metadata.height) * (downscale ? 0.5 : 1);

	return execAsync(`
		toktx\
		--verbose\
		--threads 8\
		--t2\
		--encode uastc\
		--resize ${ width }x${ height }\
		--assign_oetf linear\
		--uastc_quality ${ fast ? 0 : 4 }\
		--uastc_rdo_l 1.0\
		--zcmp ${ fast ? 0 : 22 }\
		--lower_left_maps_to_s0t0\
		${ output }\
		${ source }
	`);

}

export default function packTexture( source ){

	return {
		info: `🌠 pack-texture "${ source.file }"`,
		action: async () => {

			if( !AssetsPacker.toktxAvailable ){

				throw new Error(`⚠️ toktx not available!`);

			}

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				high: `${ output }.high.ktx2`,
				medium: `${ output }.medium.ktx2`,
				low: `${ output }.low.ktx2`,
				fallback: `${ output }.fallback.webp`
			};

			const { fast } = source.options;

			await generateKTX2(source.file, source.generated.high, false, 4, fast);
			await generateKTX2(source.file, source.generated.medium, false, 2, fast);
			await generateKTX2(source.file, source.generated.low, true, 0, fast);
			await sharp(source.file).flip().webp({ lossless: true }).toFile(source.generated.fallback);

			return source;

		}
	};

};
