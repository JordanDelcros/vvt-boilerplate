import { copyFile } from "fs/promises";
import sharp from "sharp";

export default function packCopy( source ){

	return {
		info: `🗂️ pack-copy "${ source.file }"`,
		action: async () => {

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				prefer: `${ output }${ source.extension }`
			};

			await copyFile(source.file, source.generated.prefer);

			return source;

		}
	};

};
