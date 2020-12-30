uniform mediump sampler2D luminanceBuffer0;
uniform sampler2D luminanceBuffer1;

uniform float minLuminance;
uniform float deltaTime;
uniform float tau;

varying vec2 vUv;

void main() {

	// This 1x1 buffer contains the previous luminance.
	float l0 = texture2D(luminanceBuffer0, vUv).r;

	// Get the current average scene luminance.
	#if __VERSION__ < 300

		float l1 = texture2DLodEXT(luminanceBuffer1, vUv, MIP_LEVEL_1X1).r;

	#else

		float l1 = textureLod(luminanceBuffer1, vUv, MIP_LEVEL_1X1).r;

	#endif

	l0 = max(minLuminance, l0);
	l1 = max(minLuminance, l1);

	// Adapt the luminance using Pattanaik's technique.
	float adaptedLum = l0 + (l1 - l0) * (1.0 - exp(-deltaTime * tau));

	gl_FragColor.r = adaptedLum;

}
