import { NodeIO } from "@gltf-transform/core";
import { dedup, prune, meshopt } from "@gltf-transform/functions";
import { KHRLightsPunctual, KHRMaterialsEmissiveStrength, KHRTextureTransform } from "@gltf-transform/extensions";
import { exec } from "child_process";
import { promisify } from "util";
import { MeshoptEncoder } from "meshoptimizer";

await MeshoptEncoder.ready;

const execAsync = promisify(exec);

export default function packModel( source ){

	return {
		info: `🪩 pack-model "${ source.file }"`,
		action: async () => {

			const output = `${ source.destination }/${ source.name }`;

			source.generated = {
				high: `${ output }.high.glb`,
				low: `${ output }.low.glb`,
				fallback: `${ output }.fallback.glb`,
			};

			const io = new NodeIO();
			io.registerExtensions([ KHRLightsPunctual, KHRMaterialsEmissiveStrength, KHRTextureTransform ]);

			const gltf = await io.read(source.file);

			// Disable double sided (default false)
			if( source.options.forceSingleSide === true ){

				const materials = gltf.getRoot().listMaterials();

				const containsTransparency = materials.some(( material ) => {

					return material.getAlphaMode() !== "OPAQUE";

				});

				if( !containsTransparency ){

					materials.forEach(( material ) => {

						material.setDoubleSided(false);

					});

				}

			}

			// Optimize mesh (default true)
			if( source.options.optimize !== false ){

				await gltf.transform(
					dedup(),
					prune({ keepAttributes: true })
				);

			}

			// Fallback only get mesh optimizations
			await io.write(source.generated.fallback, gltf);

			// Optimize and compress loss-less meshes
			if( source.options.optimize !== false ){

				await execAsync(`npx @gltf-transform/cli meshopt ${ source.generated.fallback } ${ source.generated.fallback }`);

			}

			// Compress textures
			const level = source.options.fast ? 0 : 5;

			// High gets UASTC compressed textures
			await execAsync(`npx @gltf-transform/cli uastc ${ source.generated.fallback } ${ source.generated.high } --level ${ source.options.fast ? 0 : 4 }`);

			// Low gets lowest size ETC1S compressed texture (1024x1024)
			await execAsync(`npx @gltf-transform/cli resize ${ source.generated.fallback } ${ source.generated.low } --width 1024 --height 1024`);
			await execAsync(`npx @gltf-transform/cli etc1s ${ source.generated.low } ${ source.generated.low } --compression ${ source.options.fast ? 0 : 5 }`);

			return source;

		}
	};

};
