#ifdef TEXTURE_PRECISION_HIGH

	uniform mediump sampler2D map;

#else

	uniform lowp sampler2D map;

#endif

#if defined(ASPECT_CORRECTION) || defined(UV_TRANSFORM)

	varying vec2 vUv2;

#endif

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	#if defined(ASPECT_CORRECTION) || defined(UV_TRANSFORM)

		vec4 texel = texelToLinear(texture2D(map, vUv2));

	#else

		vec4 texel = texelToLinear(texture2D(map, uv));

	#endif

	outputColor = TEXEL;

}
