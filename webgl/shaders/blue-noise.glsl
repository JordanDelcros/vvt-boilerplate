float blueNoise( float force ){

	vec2 pixel = gl_FragCoord.xy / vec2(width, height) * (max(width, height) * 0.01);
	pixel += vec2(cos(time * 0.1));

	return (texture2D(noiseMap, pixel).r * 2.0 - 1.0) * force;

}
