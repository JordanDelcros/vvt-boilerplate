vec2 noiseTextureSize = vec2(128.0);
vec2 noiseOffset = fract(vec2(currentTime * 0.1, currentTime * 0.2));
vec2 noiseUv = fract(gl_FragCoord.xy / noiseTextureSize + noiseOffset);
vec3 noise = texture(tNoise, noiseUv).rgb * 2.0 - 1.0;
