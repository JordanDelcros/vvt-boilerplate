const vec3 viewDirection = vec3(0.0, 0.0, -1.0);

float linearizeDepth( float depth ){

	float z = depth * 2.0 - 1.0;
	return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));

}