vec2 uvAtlas( vec2 uv, float column, float row, float columns, float rows ){

	vec2 tileSize = vec2(1.0 / columns, 1.0 / rows);
	
	float flippedRow = (rows - 1.0) - row;
	
	vec2 offset = vec2(column, flippedRow) * tileSize;

	return uv * tileSize + offset;

}
