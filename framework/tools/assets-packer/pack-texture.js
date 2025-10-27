import AssetsPacker from "./";
import { readFileSync, writeFileSync } from "fs";
import { encodeToKTX2 } from "ktx2-encoder";
import sharp from "sharp";

// Image decoder for ktx2-encoder
async function imageDecoder( buffer ){

	const image = sharp(buffer);
	const metadata = await image.metadata();
	const { width, height } = metadata;
	const rawBuffer = await image.ensureAlpha().raw().toBuffer();
	const data = new Uint8Array(rawBuffer);

	const imageData = { width, height, data };

	return imageData;

}

function generateKTX2( buffer, quality = 255, fast = false, enhance = false ){

	return encodeToKTX2(buffer, {
		imageDecoder,
		type: "etc1s",
		isYFlip: true,
		isUASTC: enhance,
		isKTX2File: true, // mandatory
		isSetKTX2SRGBTransferFunc: false,
		generateMipmaps: false,
		qualityLevel: quality, // max 1 - 255
		compressionLevel: fast ? 0 : 12, // 0 - 12
		needSupercompression: true
	});

}

export default async function packTexture( source ){

	const output = `${ source.destination }/${ source.name }`;

	console.log(`🌆 pack-texture "${ source.file }"`);

	source.generated = {
		high: `${ output }.high.ktx2`,
		medium: `${ output }.medium.ktx2`,
		low: `${ output }.low.ktx2`,
		fallback: `${ output }.fallback.webp`
	};

	const imageBuffer = readFileSync(source.file);

	const [ high, medium, low, fallback ] = await Promise.all([
		generateKTX2(imageBuffer, 255, source.options.fast, true),
		generateKTX2(imageBuffer, 127, source.options.fast, true),
		generateKTX2(imageBuffer, 1, source.options.fast, true),
		sharp(source.file).webp({ lossless: true })
	]);

	await Promise.all([
		writeFileSync(source.generated.high, high),
		writeFileSync(source.generated.medium, medium),
		writeFileSync(source.generated.low, low),
		fallback.toFile(source.generated.fallback)
	]);

	return source;

}
