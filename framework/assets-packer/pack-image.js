import { readFileSync } from "fs";
import { writeFile } from "fs/promises";
import sharp from "sharp";

export default function packImage( source ){

	return {
		info: `🌆 pack-image "${ source.file }"`,
		action: async () => {

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				high: `${ output }.high.webp`,
				medium: `${ output }.medium.webp`,
				low: `${ output }.low.webp`,
				fallback: `${ output }.fallback.png`
			};

			const imageBuffer = readFileSync(source.file);

			const animated = source.extension === ".gif";

			const [ high, medium, low, fallback ] = await Promise.all([
				sharp(imageBuffer, { animated }).webp({ quality: 100 }).toBuffer(),
				sharp(imageBuffer, { animated }).webp({ quality: 80 }).toBuffer(),
				sharp(imageBuffer, { animated }).webp({ quality: 30 }).toBuffer(),
				animated ? imageBuffer : sharp(imageBuffer).png({ compressionLevel: 9, quality: 80 }).toBuffer()
			]);

			await Promise.all([
				writeFile(source.generated.high, high),
				writeFile(source.generated.medium, medium),
				writeFile(source.generated.low, low),
				writeFile(source.generated.fallback, fallback)
			]);

			return source;

		}
	};

};
