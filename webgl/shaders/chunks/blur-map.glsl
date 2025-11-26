vec4 blurMap( in sampler2D map, in vec2 uv, in vec2 direction, in vec2 noise ){

	vec4 blurred = blurCoeffs[0] * texture(map, uv + noise);

	for( int sampleIndex = 1; sampleIndex < BLUR_MAP_SAMPLES; sampleIndex += 2 ){

		float w0 = blurCoeffs[sampleIndex];
		float w1 = blurCoeffs[sampleIndex + 1];
		float w = w0 + w1;
		
		float offset = float(sampleIndex) + w1 / w;
		blurred += w * texture(map, uv + direction * offset + noise);
		blurred += w * texture(map, uv - direction * offset + noise);

	}

	return blurred;

}
