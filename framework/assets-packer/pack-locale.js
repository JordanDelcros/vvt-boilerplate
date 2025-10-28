import { readFile, writeFile } from "fs/promises";

function flatten( object, parentKey = "", result = {} ){

	if( typeof object !== "object" || object === null ){

		result[parentKey] = object;
		return result;

	}

	for( const key in object ){

		if( !object.hasOwnProperty(key) ) continue;

		const value = object[key];
		const newKey = parentKey ? `${ parentKey }.${ key }` : key;

		if( Array.isArray(value) ){

			value.forEach((item, index) => {

				flatten(item, `${ newKey }.${ index }`, result);

			});

		}
		else if (value && typeof value === "object") {

			flatten(value, newKey, result);

		}

		else if (typeof value === "string" && !value.includes("images/")) {

			result[newKey] = value;

		}

	}

	return result;

}

export default function packLocale( source ){

	return {
		info: `🌍 pack-locale "${ source.file }"`,
		action: async () => {

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				prefer: `${ output }.json`
			};

			const raw = await readFile(source.file, "utf-8");
			let data = JSON.parse(raw);

			data = flatten(data);

			const json = JSON.stringify(data, null, "\t");

			await Promise.all([
				writeFile(source.generated.prefer, json)
			]);

			return source;

		}
	};

};
