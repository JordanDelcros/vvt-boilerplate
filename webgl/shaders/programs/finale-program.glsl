vec4 outputColor = color;
vec3 unpackedNormal = unpackRGBToNormal(normal.xyz);

// rim
float rim = max(dot(unpackedNormal * 2.0 - 1.0, viewDirection), 0.0);
rim = smoothstep(0.0, 1.0, rim);
outputColor.rgb += rim * fresnel;

// ssao
#ifdef USE_SSAO
vec2 texel = 1.0 / vec2(textureSize(tSsao, 0));
float ssao = 0.0;
ssao += texture(tSsao, vUv + vec2(-0.5, -0.5) * texel).r;
ssao += texture(tSsao, vUv + vec2(+0.5, -0.5) * texel).r;
ssao += texture(tSsao, vUv + vec2(+0.5, +0.5) * texel).r;
ssao += texture(tSsao, vUv + vec2(-0.5, +0.5) * texel).r;
ssao /= 4.0;
outputColor.rgb *= ssao;
#endif

#ifdef USE_BLUR
vec4 blurColor = texture(tBlurColor, vUv);

// Depth of field
float depth = linearizeDepth(texture(tDepth, vUv).r);
float blurDepth = linearizeDepth(texture(tBlurDepth, vUv).r);
float focusFactor = 0.0;
float foregroundFactor = 0.0;
if( depth > focusFar ){

	focusFactor = (depth - focusFar) / focusFarRamp;

}
if( blurDepth < focusNear ){

	foregroundFactor = (focusNear - blurDepth) / focusNearRamp;

}
focusFactor = max(focusFactor, foregroundFactor);
focusFactor = clamp(focusFactor, 0.0, 1.0);
outputColor = mix(outputColor, blurColor, focusFactor * depthOfField);

// bloom
float luminance = dot(blurColor.rgb, vec3(0.2126, 0.7152, 0.0722));
float thresholdedLuminance = max(0.0, luminance - 0.5);
float bloomFactor = thresholdedLuminance * bloom;
outputColor.rgb += blurColor.rgb * bloomFactor;

// vignetting
float vignette = clamp(smoothstep(0.0, 0.15, distance(vUv, vec2(0.5)) / 5.0), 0.0, 1.0) * vignetting;
outputColor.rgb = mix(outputColor.rgb, blurColor.rgb, vignette / (10.0 * (1.0 - vignettingBlur)));
outputColor.rgb *= 1.0 - vignette;
#endif

outColor = outputColor;
outNormal = normal;