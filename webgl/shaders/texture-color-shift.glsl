vec4 textureColorShift( in sampler2D map, in vec2 uv, in float force ){

	vec4 red = texture2D(map, uv + force);
	vec4 green = texture2D(map, uv);
	vec4 blue = texture2D(map, uv - force);

	return (red + green + blue) / 3.0;

}