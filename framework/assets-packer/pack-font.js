import { readFile, writeFile } from "fs/promises";
import ttf2woff from "ttf2woff";
import ttf2woff2 from "ttf2woff2";

export default function packFont( source ){

	return {
		info: `🔠 pack-font "${ source.file }"`,
		action: async () => {

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				prefer: `${ output }.prefer.woff2`,
				fallback: `${ output }.fallback.woff`
			};

			const buffer = await readFile(source.file);

			const prefer = ttf2woff2(buffer);
			const fallback = ttf2woff(buffer);

			await Promise.all([
				writeFile(source.generated.prefer, prefer),
				writeFile(source.generated.fallback, fallback)
			]);

			return source;

		}
	};

};
