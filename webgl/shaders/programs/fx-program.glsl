float ratio = screenSize.x / screenSize.y;

#if defined(USE_BLUR) || defined(USE_SSAO)
vec3 noise = blueNoise();
#endif

// blurs
#ifdef USE_BLUR
vec2 scaledNoise = noise.xy * blurNoiseForce * 5.0;
outBlurColor = blurMap(tBlurColor, vUv, vec2(0.0, blurRadius), scaledNoise);
outBlurNormal = blurMap(tBlurNormal, vUv, vec2(0.0, blurRadius), scaledNoise);
outBlurDepth = blurMap(tBlurDepth, vUv, vec2(0.0, blurRadius), scaledNoise);
#endif

// ssao
#ifdef USE_SSAO
outSsao = ssao(noise);
#endif