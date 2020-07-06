uniform sampler2D aoBuffer;
uniform float luminanceInfluence;

#ifdef DEPTH_AWARE_UPSAMPLING

	#ifdef GL_FRAGMENT_PRECISION_HIGH

		uniform highp sampler2D normalDepthBuffer;

	#else

		uniform mediump sampler2D normalDepthBuffer;

	#endif

#endif

#ifdef COLORIZE

	uniform vec3 color;

#endif

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {

	float aoLinear = texture2D(aoBuffer, uv).r;

	#if defined(DEPTH_AWARE_UPSAMPLING) && __VERSION__ == 300

		// Gather normals and depth in a 2x2 neighborhood.
		vec4 normalDepth[4] = vec4[](
			textureOffset(normalDepthBuffer, uv, ivec2(0, 0)),
			textureOffset(normalDepthBuffer, uv, ivec2(0, 1)),
			textureOffset(normalDepthBuffer, uv, ivec2(1, 0)),
			textureOffset(normalDepthBuffer, uv, ivec2(1, 1))
		);

		// Determine the smoothness of the surface around this fragment.
		float dot01 = dot(normalDepth[0].rgb, normalDepth[1].rgb);
		float dot02 = dot(normalDepth[0].rgb, normalDepth[2].rgb);
		float dot03 = dot(normalDepth[0].rgb, normalDepth[3].rgb);

		float minDot = min(dot01, min(dot02, dot03));
		float s = step(THRESHOLD, minDot);

		// Find the best AO based on depth.
		float smallestDistance = 1.0;
		int index;

		for(int i = 0; i < 4; ++i) {

			float distance = abs(depth - normalDepth[i].a);

			if(distance < smallestDistance) {

				smallestDistance = distance;
				index = i;

			}

		}
 
		// Fetch the exact AO texel that corresponds to the best depth.
		ivec2 offsets[4] = ivec2[](
			ivec2(0, 0), ivec2(0, 1),
			ivec2(1, 0), ivec2(1, 1)
		);

		ivec2 coord = ivec2(uv * vec2(textureSize(aoBuffer, 0))) + offsets[index];
		float aoNearest = texelFetch(aoBuffer, coord, 0).r;

		// Smooth surfaces benefit more from linear filtering.
		float ao = mix(aoNearest, aoLinear, s);

	#else

		float ao = aoLinear;

	#endif

	// Fade AO based on luminance.
	float l = linearToRelativeLuminance(inputColor.rgb);
	ao = mix(ao, 1.0, l * luminanceInfluence);

	#ifdef COLORIZE

		outputColor = vec4(1.0 - (1.0 - ao) * (1.0 - color), inputColor.a);

	#else

		outputColor = vec4(vec3(ao), inputColor.a);

	#endif

}
