vec2 uvScale( vec2 uv, float scale ){
	float scaling = 1.0 - scale;
	vec2 centeredUV = uv - 0.5;
	centeredUV /= scale;
	return centeredUV + 0.5;
}

vec2 uvScaleClamp( vec2 uv, float scale ){

	return clamp(uvScale(uv, scale), vec2(0.0), vec2(1.0));

}