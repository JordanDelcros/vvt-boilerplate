const vec2 blueNoiseTextureSize = vec2(128.0);

vec3 blueNoise(){

	vec2 blueNoiseOffset = fract(vec2(currentTime * 0.1, currentTime * 0.1));
	vec2 blueNoiseUv = fract(gl_FragCoord.xy / blueNoiseTextureSize + blueNoiseOffset);
	return texture(tNoise, blueNoiseUv).rgb * 2.0 - 1.0;

}

vec3 staticBlueNoise(){

	vec2 staticBlueNoiseUv = fract(gl_FragCoord.xy / blueNoiseTextureSize);
	return texture(tNoise, staticBlueNoiseUv).rgb * 2.0 - 1.0;

}