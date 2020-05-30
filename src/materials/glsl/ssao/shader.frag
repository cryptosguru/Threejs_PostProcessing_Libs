#include <common>
#include <packing>

#ifdef GL_FRAGMENT_PRECISION_HIGH

	uniform highp sampler2D normalDepthBuffer;

#else

	uniform mediump sampler2D normalDepthBuffer;

#endif

uniform sampler2D noiseTexture;

uniform mat4 inverseProjectionMatrix;
uniform mat4 projectionMatrix;
uniform vec2 texelSize;

uniform float projectionScale;
uniform float cameraNear;
uniform float cameraFar;
uniform float intensity;
uniform float bias;

uniform vec2 distanceCutoff;
uniform vec2 proximityCutoff;

varying vec2 vUv;
varying vec2 vUv2;

float getViewZ(const in float depth) {

	#ifdef PERSPECTIVE_CAMERA

		return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);

	#else

		return orthographicDepthToViewZ(depth, cameraNear, cameraFar);

	#endif

}

vec3 getViewPosition(const in vec2 screenPosition, const in float depth, const in float viewZ) {

	float clipW = projectionMatrix[2][3] * viewZ + projectionMatrix[3][3];
	vec4 clipPosition = vec4((vec3(screenPosition, depth) - 0.5) * 2.0, 1.0);
	clipPosition *= clipW; // Unproject.

	return (inverseProjectionMatrix * clipPosition).xyz;

}

float getAmbientOcclusion(const in vec3 p, const in vec3 n, const in float depth, const in vec2 uv) {

	// Calculate the screen space radius for this fragment.
	float radius = -projectionScale * RADIUS / p.z;

	// Get a random starting angle.
	float noise = texture2D(noiseTexture, vUv2).r;
	float baseAngle = noise * PI2;

	float inv_samples = (1.0 / SAMPLES_FLOAT);
	float rings = (SPIRAL_TURNS * PI2);

	float occlusion = 0.0;

	for(int i = 0; i < SAMPLES_INT; ++i) {

		float alpha = (float(i) + 0.5) * inv_samples;
		float angle = alpha * rings + baseAngle;

		vec2 coord = uv + alpha * radius * vec2(cos(angle), sin(angle)) * texelSize;
		float sampleDepth = texture2D(normalDepthBuffer, coord).a;
		float viewZ = getViewZ(sampleDepth);

		#ifdef PERSPECTIVE_CAMERA

			float linearSampleDepth = viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);

		#else

			float linearSampleDepth = sampleDepth;

		#endif

		float proximity = abs(depth - linearSampleDepth);

		if(proximity < proximityCutoff.y) {

			float falloff = 1.0 - smoothstep(proximityCutoff.x, proximityCutoff.y, proximity);

			vec3 Q = getViewPosition(coord, sampleDepth, viewZ);
			vec3 v = Q - p;

			float vv = dot(v, v);
			float vn = dot(v, n) - bias;

			float f = max(RADIUS_SQ - vv, 0.0) / RADIUS_SQ;
			occlusion += (f * f * f * max(vn / (0.01 + vv), 0.0)) * falloff;

		}

	}

	return occlusion / (4.0 * SAMPLES_FLOAT);

}

void main() {

	vec4 normalDepth = texture2D(normalDepthBuffer, vUv);

	float ao = 1.0;
	float depth = normalDepth.a;
	float viewZ = getViewZ(depth);

	#ifdef PERSPECTIVE_CAMERA

		float linearDepth = viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);

	#else

		float linearDepth = depth;

	#endif

	// Skip fragments of objects that are too far away.
	if(linearDepth < distanceCutoff.y) {

		vec3 viewPosition = getViewPosition(vUv, depth, viewZ);
		vec3 viewNormal = unpackRGBToNormal(normalDepth.rgb);
		ao -= getAmbientOcclusion(viewPosition, viewNormal, linearDepth, vUv);

		// Fade AO based on depth.
		float d = smoothstep(distanceCutoff.x, distanceCutoff.y, linearDepth);
		ao = mix(ao, 1.0, d);
		ao = clamp(pow(ao, 1.0 + intensity), 0.0, 1.0);

	}

	gl_FragColor.r = ao;

}
