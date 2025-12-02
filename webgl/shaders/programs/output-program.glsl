vec4 depth = texture(tDepth, vUv);

#ifdef USE_BLUR
vec4 blurColor = texture(tBlurColor, vUv);
vec4 blurNormal = texture(tBlurNormal, vUv);
vec4 blurDepth = texture(tBlurDepth, vUv);
blurDepth.r = 1.0 - blurDepth.r;
#endif

#ifdef USE_SSAO
vec4 ssao = texture(tSsao, vUv);
#endif

outColor = OUTPUT;
outNormal = normal;
