vec3 getViewPosition( vec2 screenPosition, float depth ){

	vec4 clipSpacePosition = vec4(screenPosition * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
	vec4 viewSpacePosition = viewMatrix * clipSpacePosition;

	return viewSpacePosition.xyz / viewSpacePosition.w;

}

vec4 ssao( vec3 noise ){

	vec3 packedNormal = unpackRGBToNormal(texture(tNormal, vUv).rgb);
	vec3 viewNormal = normalize(packedNormal);

	// Can be usefull for double sided
	// if( viewNormal.z < 0.0 ) viewNormal = -viewNormal;

	float rawDepth = texture(tDepth, vUv).r;
	float ssao = 1.0;

	if( rawDepth < 0.999 ){

		vec3 viewPos = getViewPosition(vUv, rawDepth);

		vec3 randomVec = normalize(noise); 
		vec3 tangent = normalize(randomVec - viewNormal * dot(randomVec, viewNormal));
		vec3 bitangent = cross(viewNormal, tangent);
		mat3 tbn = mat3(tangent, bitangent, viewNormal);

		float occlusion = 0.0;

		for( int i = 0; i < SSAO_SAMPLES; i++ ){

			vec3 sampleDir = tbn * ssaoKernel[i];
			vec3 samplePos = viewPos + (sampleDir * ssaoRadius);

			vec4 offset = projectionMatrix * vec4(samplePos, 1.0);
			offset.xyz /= offset.w;
			offset.xy = offset.xy * 0.5 + 0.5;

			if( offset.x < 0.0 || offset.x > 1.0 || offset.y < 0.0 || offset.y > 1.0 ) continue;

			float sampleRawDepth = texture(tDepth, offset.xy).r;

			if( sampleRawDepth >= 0.999 ) continue;

			vec3 sampleViewPos = getViewPosition(offset.xy, sampleRawDepth);

			float depthDelta = abs(viewPos.z - sampleViewPos.z);
			float rangeCheck = smoothstep(0.0, 0.5, ssaoRadius / (depthDelta + 0.0001));

			float bias = ssaoBias * (1.0 / (1.0 + abs(viewPos.z)));

			float depthDiff = sampleViewPos.z - samplePos.z;
			if( depthDiff > bias && depthDiff < ssaoRadius ){

				occlusion += rangeCheck; 

			}

		}

		occlusion = 1.0 - (occlusion / float(SSAO_SAMPLES));

		ssao = pow(clamp(occlusion, 0.0, 1.0), ssaoStrength); 

	}

	ssao = clamp(ssao, 0.0, 1.0);

	return vec4(vec3(ssao), 1.0);

}
