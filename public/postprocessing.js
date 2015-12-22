/**
 * postprocessing v0.0.3 build Dec 22 2015
 * https://github.com/vanruesc/postprocessing
 * Copyright 2015 Raoul van Rüschen, Zlib
 */

(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
	typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
	factory((global.POSTPROCESSING = {}),global.THREE);
}(this, function (exports,THREE) { 'use strict';

	THREE = 'default' in THREE ? THREE['default'] : THREE;

	var shader$1 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform float opacity;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tgl_FragColor = opacity * texel;\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * A simple copy shader material.
	 *
	 * @class CopyMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function CopyMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null},
				opacity: {type: "f", value: 1.0}

			},

			fragmentShader: shader$1.fragment,
			vertexShader: shader$1.vertex,

		});

	}

	CopyMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	CopyMaterial.prototype.constructor = CopyMaterial;

	var shader = {
		fragment: "uniform sampler2D tDiffuse;\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tvec3 luma = vec3(0.299, 0.587, 0.114);\n\tfloat v = dot(texel.rgb, luma);\n\n\tgl_FragColor = vec4(v, v, v, texel.a);\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * A luminosity shader material.
	 * http://en.wikipedia.org/wiki/Luminosity
	 *
	 * @class LuminosityMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function LuminosityMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null}

			},

			fragmentShader: shader.fragment,
			vertexShader: shader.vertex,

		});

	}

	LuminosityMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	LuminosityMaterial.prototype.constructor = LuminosityMaterial;

	var shader$2 = {
		fragment: "uniform sampler2D lastLum;\nuniform sampler2D currentLum;\nuniform float delta;\nuniform float tau;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 lastLum = texture2D(lastLum, vUv, MIP_LEVEL_1X1);\n\tvec4 currentLum = texture2D(currentLum, vUv, MIP_LEVEL_1X1);\n\n\tfloat fLastLum = lastLum.r;\n\tfloat fCurrentLum = currentLum.r;\n\n\t// Better results with squared input luminance.\n\tfCurrentLum *= fCurrentLum;\n\n\t// Adapt the luminance using Pattanaik's technique.\n\tfloat fAdaptedLum = fLastLum + (fCurrentLum - fLastLum) * (1.0 - exp(-delta * tau));\n\t// fAdaptedLum = sqrt(fAdaptedLum);\n\n\tgl_FragColor = vec4(fAdaptedLum, fAdaptedLum, fAdaptedLum, 1.0);\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * An adaptive luminosity shader material.
	 *
	 * @class AdaptiveLuminosityMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function AdaptiveLuminosityMaterial() {

		THREE.ShaderMaterial.call(this, {

			defines: {

				MIP_LEVEL_1X1: 0.0

			},

			uniforms: {

				lastLum: {type: "t", value: null},
				currentLum: {type: "t", value: null},
				delta: {type: "f", value: 0.016},
				tau: {type: "f", value: 1.0}

			},

			fragmentShader: shader$2.fragment,
			vertexShader: shader$2.vertex,

		});

	}

	AdaptiveLuminosityMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	AdaptiveLuminosityMaterial.prototype.constructor = AdaptiveLuminosityMaterial;

	var shader$4 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform float middleGrey;\nuniform float maxLuminance;\n\n#ifdef ADAPTED_LUMINANCE\n\n\tuniform sampler2D luminanceMap;\n\n#else\n\n\tuniform float averageLuminance;\n\n#endif\n\nvarying vec2 vUv;\n\nconst vec3 LUM_CONVERT = vec3(0.299, 0.587, 0.114);\n\nvec3 toneMap(vec3 vColor) {\n\n\t#ifdef ADAPTED_LUMINANCE\n\n\t\t// Get the calculated average luminance.\n\t\tfloat fLumAvg = texture2D(luminanceMap, vec2(0.5, 0.5)).r;\n\n\t#else\n\n\t\tfloat fLumAvg = averageLuminance;\n\n\t#endif\n\n\t// Calculate the luminance of the current pixel.\n\tfloat fLumPixel = dot(vColor, LUM_CONVERT);\n\n\t// Apply the modified operator (Eq. 4).\n\tfloat fLumScaled = (fLumPixel * middleGrey) / fLumAvg;\n\n\tfloat fLumCompressed = (fLumScaled * (1.0 + (fLumScaled / (maxLuminance * maxLuminance)))) / (1.0 + fLumScaled);\n\treturn fLumCompressed * vColor;\n\n}\n\nvoid main() {\n\n\tvec4 texel = texture2D(tDiffuse, vUv);\n\tgl_FragColor = vec4(toneMap(texel.rgb), texel.a);\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * Full-screen tone-mapping shader material.
	 * http://www.graphics.cornell.edu/~jaf/publications/sig02_paper.pdf
	 *
	 * @class ToneMappingMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function ToneMappingMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null},
				luminanceMap: {type: "t", value: null},
				averageLuminance: {type: "f", value: 1.0},
				maxLuminance: {type: "f", value: 16.0},
				middleGrey: {type: "f", value: 0.6}

			},

			fragmentShader: shader$4.fragment,
			vertexShader: shader$4.vertex,

		});

	}

	ToneMappingMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	ToneMappingMaterial.prototype.constructor = ToneMappingMaterial;

	var shader$3 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform vec2 center;\nuniform vec2 tSize;\nuniform float angle;\nuniform float scale;\n\nvarying vec2 vUv;\n\nfloat pattern() {\n\n\tfloat s = sin(angle);\n\tfloat c = cos(angle);\n\n\tvec2 tex = vUv * tSize - center;\n\tvec2 point = vec2(c * tex.x - s * tex.y, s * tex.x + c * tex.y) * scale;\n\n\treturn (sin(point.x) * sin(point.y)) * 4.0;\n\n}\n\nvoid main() {\n\n\tvec4 color = texture2D(tDiffuse, vUv);\n\tfloat average = (color.r + color.g + color.b) / 3.0;\n\n\tgl_FragColor = vec4(vec3(average * 10.0 - 5.0 + pattern()), color.a);\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * A dot screen shader material.
	 *
	 * @class DotScreenMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function DotScreenMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null},
				tSize: {type: "v2", value: new THREE.Vector2(256.0, 256.0)},
				center: {type: "v2", value: new THREE.Vector2(0.5, 0.5)},
				angle: {type: "f", value: 1.57},
				scale: {type: "f", value: 1.0}

			},

			fragmentShader: shader$3.fragment,
			vertexShader: shader$3.vertex,

		});

	}

	DotScreenMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	DotScreenMaterial.prototype.constructor = DotScreenMaterial;

	var shader$5 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform sampler2D tDisp;\nuniform int byp;\nuniform float amount;\nuniform float angle;\nuniform float seed;\nuniform float seedX;\nuniform float seedY;\nuniform float distortionX;\nuniform float distortionY;\nuniform float colS;\n\nvarying vec2 vUv;\n\nfloat rand(vec2 co) {\n\n\treturn fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);\n\n}\n\nvoid main() {\n\n\tvec2 coord = vUv;\n\n\tfloat xs, ys;\n\tvec4 normal;\n\n\tvec2 offset;\n\tvec4 cr, cga, cb;\n\tvec4 snow, color;\n\n\tif(byp < 1) {\n\n\t\txs = floor(gl_FragCoord.x / 0.5);\n\t\tys = floor(gl_FragCoord.y / 0.5);\n\n\t\tnormal = texture2D(tDisp, coord * seed * seed);\n\n\t\tif(coord.y < distortionX + colS && coord.y > distortionX - colS * seed) {\n\n\t\t\tif(seedX > 0.0){\n\n\t\t\t\tcoord.y = 1.0 - (coord.y + distortionY);\n\n\t\t\t} else {\n\n\t\t\t\tcoord.y = distortionY;\n\n\t\t\t}\n\n\t\t}\n\n\t\tif(coord.x < distortionY + colS && coord.x > distortionY - colS * seed) {\n\n\t\t\tif(seedY > 0.0){\n\n\t\t\t\tcoord.x = distortionX;\n\n\t\t\t} else {\n\n\t\t\t\tcoord.x = 1. - (coord.x + distortionX);\n\n\t\t\t}\n\n\t\t}\n\n\t\tcoord.x += normal.x * seedX * (seed / 5.0);\n\t\tcoord.y += normal.y * seedY * (seed / 5.0);\n\n\t\t// Adopted from RGB shift shader.\n\t\toffset = amount * vec2(cos(angle), sin(angle));\n\t\tcr = texture2D(tDiffuse, coord + offset);\n\t\tcga = texture2D(tDiffuse, coord);\n\t\tcb = texture2D(tDiffuse, coord - offset);\n\t\tcolor = vec4(cr.r, cga.g, cb.b, cga.a);\n\t\tsnow = 200.0 * amount * vec4(rand(vec2(xs * seed,ys * seed * 50.0)) * 0.2);\n\t\tcolor += snow;\n\n\t} else {\n\n\t\tcolor = texture2D(tDiffuse, vUv);\n\n\t}\n\n\tgl_FragColor = color;\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * A glitch shader material.
	 * Based on https://github.com/staffantan/unityglitch
	 *
	 * @class GlitchMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function GlitchMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null},
				tDisp: {type: "t", value: null},
				byp: {type: "i", value: 0},
				amount: {type: "f", value: 0.8},
				angle: {type: "f", value: 0.02},
				seed: {type: "f", value: 0.02},
				seedX: {type: "f", value: 0.02},
				seedY: {type: "f", value: 0.02},
				distortionX: {type: "f", value: 0.5},
				distortionY: {type: "f", value: 0.6},
				colS: {type: "f", value: 0.05}

			},

			fragmentShader: shader$5.fragment,
			vertexShader: shader$5.vertex,

		});

	}

	GlitchMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	GlitchMaterial.prototype.constructor = GlitchMaterial;

	var shader$6 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform vec2 uImageIncrement;\nuniform float cKernel[KERNEL_SIZE_INT];\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec2 coord = vUv;\n\tvec4 sum = vec4(0.0, 0.0, 0.0, 0.0);\n\n\tfor(int i = 0; i < KERNEL_SIZE_INT; ++i) {\n\n\t\tsum += texture2D(tDiffuse, coord) * cKernel[i];\n\t\tcoord += uImageIncrement;\n\n\t}\n\n\tgl_FragColor = sum;\n\n}\n",
		vertex: "uniform vec2 uImageIncrement;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv - ((KERNEL_SIZE_FLOAT - 1.0) / 2.0) * uImageIncrement;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * Gauss kernel.
	 *
	 * Dropped [ sqrt(2 * pi) * sigma ] term (unnecessary when normalizing).
	 *
	 * @method gauss
	 * @param {Number} x - X.
	 * @param {Number} sigma - Sigma.
	 * @private
	 * @static
	 */

	function gauss(x, sigma) { return Math.exp(-(x * x) / (2.0 * sigma * sigma)); }

	/**
	 * A convolution shader material.
	 *
	 * @class ConvolutionMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function ConvolutionMaterial() {

		THREE.ShaderMaterial.call(this, {

			defines: {

				KERNEL_SIZE_FLOAT: 25.0,
				KERNEL_SIZE_INT: 25

			},

			uniforms: {

				tDiffuse: {type: "t", value: null},
				uImageIncrement: {type: "v2", value: new THREE.Vector2(0.001953125, 0.0)},
				cKernel: {type: "fv1", value: []}

			},

			fragmentShader: shader$6.fragment,
			vertexShader: shader$6.vertex,

		});

	}

	ConvolutionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	ConvolutionMaterial.prototype.constructor = ConvolutionMaterial;

	/**
	 * Creates a new kernel for this material.
	 *
	 * @param {Number} sigma - Sigma value.
	 * @private
	 */

	ConvolutionMaterial.prototype.buildKernel = function(sigma) {

		var i, values, sum, halfWidth;
		var kMaxKernelSize = 25;
		var kernelSize = 2 * Math.ceil(sigma * 3.0) + 1;

		if(kernelSize > kMaxKernelSize) { kernelSize = kMaxKernelSize; }

		halfWidth = (kernelSize - 1) * 0.5;
		values = this.uniforms.cKernel.value;
		values.length = 0;
		sum = 0.0;

		for(i = 0; i < kernelSize; ++i) {

			values[i] = gauss(i - halfWidth, sigma);
			sum += values[i];

		}

		// Normalize the kernel.
		for(i = 0; i < kernelSize; ++i) { values[i] /= sum; }

	};

	var shader$7 = {
		fragment: "uniform sampler2D tColor;\nuniform sampler2D tDepth;\nuniform float textureWidth;\nuniform float textureHeight;\n\nuniform float focalDepth;\nuniform float focalLength;\nuniform float fstop;\nuniform bool showFocus;\n\nuniform float znear;\nuniform float zfar;\n\nuniform bool manualdof;\nuniform bool vignetting;\nuniform bool shaderFocus;\nuniform bool noise;\nuniform bool depthblur;\nuniform bool pentagon;\n\nuniform vec2 focusCoords;\nuniform float maxblur;\nuniform float threshold;\nuniform float gain;\nuniform float bias;\nuniform float fringe;\nuniform float dithering;\n\nvarying vec2 vUv;\n\nconst float PI = 3.14159265;\nconst float TWO_PI = PI * 2.0;\nconst int samples = SAMPLES; // Samples on the first ring.\nconst int rings = RINGS;\nconst int maxringsamples = rings * samples;\n\nfloat ndofstart = 1.0; \nfloat ndofdist = 2.0;\nfloat fdofstart = 1.0;\nfloat fdofdist = 3.0;\n\nfloat CoC = 0.03; // Circle of Confusion size in mm (35mm film = 0.03mm).\n\nfloat vignout = 1.3;\nfloat vignin = 0.0;\nfloat vignfade = 22.0; \n\nfloat dbsize = 1.25;\nfloat feather = 0.4;\n\n/**\n * Pentagonal shape creation.\n */\n\nfloat penta(vec2 coords) {\n\n\tfloat scale = float(rings) - 1.3;\n\n\tvec4  HS0 = vec4( 1.0,          0.0,         0.0,  1.0);\n\tvec4  HS1 = vec4( 0.309016994,  0.951056516, 0.0,  1.0);\n\tvec4  HS2 = vec4(-0.809016994,  0.587785252, 0.0,  1.0);\n\tvec4  HS3 = vec4(-0.809016994, -0.587785252, 0.0,  1.0);\n\tvec4  HS4 = vec4( 0.309016994, -0.951056516, 0.0,  1.0);\n\tvec4  HS5 = vec4( 0.0        ,  0.0        , 1.0,  1.0);\n\n\tvec4  one = vec4(1.0);\n\n\tvec4 P = vec4((coords), vec2(scale, scale));\n\n\tvec4 dist = vec4(0.0);\n\tfloat inorout = -4.0;\n\n\tdist.x = dot(P, HS0);\n\tdist.y = dot(P, HS1);\n\tdist.z = dot(P, HS2);\n\tdist.w = dot(P, HS3);\n\n\tdist = smoothstep(-feather, feather, dist);\n\n\tinorout += dot(dist, one);\n\n\tdist.x = dot(P, HS4);\n\tdist.y = HS5.w - abs(P.z);\n\n\tdist = smoothstep(-feather, feather, dist);\n\tinorout += dist.x;\n\n\treturn clamp(inorout, 0.0, 1.0);\n\n}\n\n/**\n * Depth buffer blur.\n */\n\nfloat bdepth(vec2 coords) {\n\n\tfloat d = 0.0;\n\tfloat kernel[9];\n\tvec2 offset[9];\n\n\tvec2 wh = vec2(1.0 / textureWidth,1.0 / textureHeight) * dbsize;\n\n\toffset[0] = vec2(-wh.x, -wh.y);\n\toffset[1] = vec2(0.0, -wh.y);\n\toffset[2] = vec2(wh.x -wh.y);\n\n\toffset[3] = vec2(-wh.x,  0.0);\n\toffset[4] = vec2(0.0,   0.0);\n\toffset[5] = vec2(wh.x,  0.0);\n\n\toffset[6] = vec2(-wh.x, wh.y);\n\toffset[7] = vec2(0.0, wh.y);\n\toffset[8] = vec2(wh.x, wh.y);\n\n\tkernel[0] = 1.0 / 16.0; kernel[1] = 2.0 / 16.0; kernel[2] = 1.0 / 16.0;\n\tkernel[3] = 2.0 / 16.0; kernel[4] = 4.0 / 16.0; kernel[5] = 2.0 / 16.0;\n\tkernel[6] = 1.0 / 16.0; kernel[7] = 2.0 / 16.0; kernel[8] = 1.0 / 16.0;\n\n\tfor(int i = 0; i < 9; ++i) {\n\n\t\tfloat tmp = texture2D(tDepth, coords + offset[i]).r;\n\t\td += tmp * kernel[i];\n\n\t}\n\n\treturn d;\n\n}\n\n/**\n * Processing the sample.\n */\n\nvec3 color(vec2 coords, float blur) {\n\n\tvec3 col = vec3(0.0);\n\tvec2 texel = vec2(1.0 / textureWidth, 1.0 / textureHeight);\n\n\tcol.r = texture2D(tColor, coords + vec2(0.0, 1.0) * texel * fringe * blur).r;\n\tcol.g = texture2D(tColor, coords + vec2(-0.866, -0.5) * texel * fringe * blur).g;\n\tcol.b = texture2D(tColor, coords + vec2(0.866, -0.5) * texel * fringe * blur).b;\n\n\tvec3 lumcoeff = vec3(0.299, 0.587, 0.114);\n\tfloat lum = dot(col.rgb, lumcoeff);\n\tfloat thresh = max((lum - threshold) * gain, 0.0);\n\n\treturn col + mix(vec3(0.0), col, thresh * blur);\n\n}\n\n/**\n * Generating noise/pattern texture for dithering.\n */\n\nvec2 rand(vec2 coord) {\n\n\tfloat noiseX = ((fract(1.0 - coord.s * (textureWidth / 2.0)) * 0.25) + (fract(coord.t * (textureHeight / 2.0)) * 0.75)) * 2.0 - 1.0;\n\tfloat noiseY = ((fract(1.0 - coord.s * (textureWidth / 2.0)) * 0.75) + (fract(coord.t * (textureHeight / 2.0)) * 0.25)) * 2.0 - 1.0;\n\n\tif(noise) {\n\n\t\tnoiseX = clamp(fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453), 0.0, 1.0) * 2.0 - 1.0;\n\t\tnoiseY = clamp(fract(sin(dot(coord, vec2(12.9898, 78.233) * 2.0)) * 43758.5453), 0.0, 1.0) * 2.0 - 1.0;\n\n\t}\n\n\treturn vec2(noiseX, noiseY);\n\n}\n\n/**\n * Distance based edge smoothing.\n */\n\nvec3 debugFocus(vec3 col, float blur, float depth) {\n\n\tfloat edge = 0.002 * depth;\n\tfloat m = clamp(smoothstep(0.0, edge, blur), 0.0, 1.0);\n\tfloat e = clamp(smoothstep(1.0 - edge, 1.0, blur), 0.0, 1.0);\n\n\tcol = mix(col, vec3(1.0, 0.5, 0.0), (1.0 - m) * 0.6);\n\tcol = mix(col, vec3(0.0, 0.5, 1.0), ((1.0 - e) - (1.0 - m)) * 0.2);\n\n\treturn col;\n\n}\n\nfloat linearize(float depth) {\n\n\treturn -zfar * znear / (depth * (zfar - znear) - zfar);\n\n}\n\nfloat vignette() {\n\n\tfloat dist = distance(vUv.xy, vec2(0.5, 0.5));\n\tdist = smoothstep(vignout + (fstop / vignfade), vignin + (fstop / vignfade), dist);\n\n\treturn clamp(dist, 0.0, 1.0);\n\n}\n\nfloat gather(float i, float j, int ringsamples, inout vec3 col, float w, float h, float blur) {\n\n\tfloat rings2 = float(rings);\n\tfloat step = TWO_PI / float(ringsamples);\n\tfloat pw = cos(j * step) * i;\n\tfloat ph = sin(j * step) * i;\n\tfloat p = 1.0;\n\n\tif(pentagon) {\n\n\t\tp = penta(vec2(pw,ph));\n\n\t}\n\n\tcol += color(vUv.xy + vec2(pw * w, ph * h), blur) * mix(1.0, i / rings2, bias) * p;\n\n\treturn 1.0 * mix(1.0, i / rings2, bias) * p;\n\n}\n\nvoid main() {\n\n\t// Scene depth calculation.\n\n\tfloat depth = linearize(texture2D(tDepth, vUv.xy).x);\n\n\tif(depthblur) { depth = linearize(bdepth(vUv.xy)); }\n\n\t// Focal plane calculation.\n\n\tfloat fDepth = focalDepth;\n\n\tif(shaderFocus) { fDepth = linearize(texture2D(tDepth, focusCoords).x); }\n\n\t// Dof blur factor calculation.\n\n\tfloat blur = 0.0;\n\n\tfloat a, b, c, d, o;\n\n\tif(manualdof) {\n\n\t\ta = depth - fDepth; // Focal plane.\n\t\tb = (a - fdofstart) / fdofdist; // Far DoF.\n\t\tc = (-a - ndofstart) / ndofdist; // Near Dof.\n\t\tblur = (a > 0.0) ? b : c;\n\n\t} else {\n\n\t\tf = focalLength; // Focal length in mm.\n\t\td = fDepth * 1000.0; // Focal plane in mm.\n\t\to = depth * 1000.0; // Depth in mm.\n\n\t\ta = (o * f) / (o - f);\n\t\tb = (d * f) / (d - f);\n\t\tc = (d - f) / (d * fstop * CoC);\n\n\t\tblur = abs(a - b) * c;\n\t}\n\n\tblur = clamp(blur, 0.0, 1.0);\n\n\t// Calculation of pattern for dithering.\n\n\tvec2 noise = rand(vUv.xy) * dithering * blur;\n\n\t// Getting blur x and y step factor.\n\n\tfloat w = (1.0 / textureWidth) * blur * maxblur + noise.x;\n\tfloat h = (1.0 / textureHeight) * blur * maxblur + noise.y;\n\n\t// Calculation of final color.\n\n\tvec3 col = vec3(0.0);\n\n\tif(blur < 0.05) {\n\n\t\t// Some optimization thingy.\n\t\tcol = texture2D(tColor, vUv.xy).rgb;\n\n\t} else {\n\n\t\tcol = texture2D(tColor, vUv.xy).rgb;\n\t\tfloat s = 1.0;\n\t\tint ringsamples;\n\n\t\tfor(int i = 1; i <= rings; ++i) {\n\n\t\t\t// Unboxing.\n\t\t\tringsamples = i * samples;\n\n\t\t\tfor(int j = 0; j < maxringsamples; ++j) {\n\n\t\t\t\tif(j >= ringsamples) { break; }\n\n\t\t\t\ts += gather(float(i), float(j), ringsamples, col, w, h, blur);\n\n\t\t\t}\n\n\t\t}\n\n\t\tcol /= s; // Divide by sample count.\n\n\t}\n\n\tif(showFocus) { col = debugFocus(col, blur, depth); }\n\n\tif(vignetting) { col *= vignette(); }\n\n\tgl_FragColor.rgb = col;\n\tgl_FragColor.a = 1.0;\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * Depth-of-field shader with bokeh ported from GLSL shader by Martins Upitis.
	 * http://blenderartists.org/forum/showthread.php?237488-GLSL-depth-of-field-with-bokeh-v2-4-(update)
	 *
	 * @class BokehMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function BokehMaterial() {

		THREE.ShaderMaterial.call(this, {

			defines: {

				RINGS: 3,
				SAMPLES: 4

			},

			uniforms: {

				textureWidth: {type: "f", value: 1.0},
				textureHeight: {type: "f", value: 1.0},

				focalDepth: {type: "f", value: 1.0}, // Metres.
				focalLength: {type: "f", value: 24.0}, // Milimetres.
				fstop: {type: "f", value: 0.9},

				tColor: {type: "t", value: null},
				tDepth: {type: "t", value: null},

				maxblur: {type: "f", value: 1.0},

				showFocus: {type: "i", value: 0},
				manualdof: {type: "i", value: 0},
				vignetting: {type: "i", value: 0},
				depthblur: {type: "i", value: 0},

				threshold: {type: "f", value: 0.5},
				gain: {type: "f", value: 2.0},
				bias: {type: "f", value: 0.5},
				fringe: {type: "f", value: 0.7},

				/* Make sure that these are the same as your camera's. */
				znear: {type: "f", value: 0.1},
				zfar: {type: "f", value: 2000},

				noise: {type: "i", value: 1}, // Use noise instead of sampling.
				dithering: {type: "f", value: 0.0001},
				pentagon: {type: "i", value: 0},

				shaderFocus: {type: "i", value: 1}, // Disable if you use external focalDepth value

				/* Autofocus point on screen (0.0, 0.0 - leftLowerCorner, 1.0, 1.0 - upperRightCorner). If center of screen use vec2(0.5, 0.5) */
				focusCoords: {type: "v2", value: new THREE.Vector2()},

			},

			fragmentShader: shader$7.fragment,
			vertexShader: shader$7.vertex,

		});

	}

	BokehMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	BokehMaterial.prototype.constructor = BokehMaterial;

	var shader$8 = {
		fragment: "uniform sampler2D tDiffuse;\nuniform float time;\nuniform bool grayscale;\nuniform float nIntensity;\nuniform float sIntensity;\nuniform float sCount;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec4 cTextureScreen = texture2D(tDiffuse, vUv);\n\n\t// Noise.\n\n\tfloat x = vUv.x * vUv.y * time * 1000.0;\n\tx = mod(x, 13.0) * mod(x, 123.0);\n\tfloat dx = mod(x, 0.01);\n\n\tvec3 cResult = cTextureScreen.rgb + cTextureScreen.rgb * clamp(0.1 + dx * 100.0, 0.0, 1.0);\n\n\tvec2 sc = vec2(sin(vUv.y * sCount), cos(vUv.y * sCount));\n\n\t// Scanlines.\n\n\tcResult += cTextureScreen.rgb * vec3(sc.x, sc.y, sc.x) * sIntensity;\n\n\tcResult = cTextureScreen.rgb + clamp(nIntensity, 0.0, 1.0) * (cResult - cTextureScreen.rgb);\n\n\tif(grayscale) {\n\n\t\tcResult = vec3(cResult.r * 0.3 + cResult.g * 0.59 + cResult.b * 0.11);\n\n\t}\n\n\tgl_FragColor =  vec4(cResult, cTextureScreen.a);\n\n}\n",
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n",
	};

	/**
	 * Film grain & scanlines shader
	 *
	 * - ported from HLSL to WebGL / GLSL
	 * http://www.truevision3d.com/forums/showcase/staticnoise_colorblackwhite_scanline_shaders-t18698.0.html
	 *
	 * Screen Space Static Postprocessor
	 *
	 * Produces an analogue noise overlay similar to a film grain / TV static
	 *
	 * Original implementation and noise algorithm
	 * Pat "Hawthorne" Shearon
	 *
	 * Optimized scanlines + noise version with intensity scaling
	 * Georg "Leviathan" Steinrohder
	 *
	 * This version is provided under a Creative Commons Attribution 3.0 License
	 * http://creativecommons.org/licenses/by/3.0/
	 *
	 * @class FilmMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 */

	function FilmMaterial() {

		THREE.ShaderMaterial.call(this, {

			uniforms: {

				tDiffuse: {type: "t", value: null},
				time: {type: "f", value: 0.0},
				nIntensity: {type: "f", value: 0.5},
				sIntensity: {type: "f", value: 0.05},
				sCount: {type: "f", value: 4096.0},
				grayscale: {type: "i", value: 1}

			},

			fragmentShader: shader$8.fragment,
			vertexShader: shader$8.vertex,

		});

	}

	FilmMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	FilmMaterial.prototype.constructor = FilmMaterial;

	var shader$9 = {
		fragment: {
			generate: "uniform sampler2D tDiffuse;\nuniform float stepSize;\nuniform float decay;\nuniform float weight;\nuniform float exposure;\nuniform vec3 lightPosition;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tvec2 texCoord = vUv;\n\tfloat numSamples = float(NUM_SAMPLES);\n\n\t// Calculate vector from pixel to light source in screen space.\n\tvec2 deltaTexCoord = texCoord - lightPosition.st;\n\tfloat distance = length(deltaTexCoord);\n\n\t// Step vector (uv space).\n\tvec2 step = stepSize * deltaTexCoord / distance;\n\n\t// Number of iterations between pixel and sun.\n\tint iterations = int(distance / stepSize);\n\n\t// Set up illumination decay factor.\n\tfloat illuminationDecay = 1.0;\n\n\t// Sample color.\n\tvec4 sample;\n\n\t// Color accumulator.\n\tvec4 color = vec4(0.0);\n\n\t// Estimate the probability of occlusion at each pixel by summing samples along a ray to the light source.\n\tfor(int i = 0; i < NUM_SAMPLES; ++i) {\n\n\t\t// Don't do more than necessary.\n\t\tif(i <= iterations && texCoord.y < 1.0) {\n\n\t\t\tsample = texture2D(tDiffuse, texCoord);\n\n\t\t\t// Apply sample attenuation scale/decay factors.\n\t\t\tsample *= illuminationDecay * weight;\n\n\t\t\tcolor += sample;\n\n\t\t\t// Update exponential decay factor.\n\t\t\tilluminationDecay *= decay;\n\n\t\t}\n\n\t\ttexCoord -= step;\n\n\t}\n\n\t// Output final color with a further scale control factor.\n\tgl_FragColor = (color / numSamples) * exposure;\n\n}\n",
			combine: "uniform sampler2D tDiffuse;\nuniform sampler2D tGodRays;\nuniform float intensity;\n\nvarying vec2 vUv;\n\nvoid main() {\n\n\tgl_FragColor = texture2D(tDiffuse, vUv) + intensity * texture2D(tGodRays, vUv);\n\n}\n"
		},
		vertex: "varying vec2 vUv;\n\nvoid main() {\n\n\tvUv = uv;\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\n\n}\n"
	};

	/**
	 * Phase enumeration.
	 *
	 * Generate-phase:
	 *
	 *  The input is the depth map which is blurred along radial lines towards the "sun". 
	 *  The output is written to a render texture.
	 *
	 * Combine-phase:
	 *
	 *  The results of the previous pass are re-blurred two times with a decreased 
	 *  distance between samples.
	 *
	 * @property Phase
	 * @type Object
	 * @static
	 * @final
	 */

	var Phase = Object.freeze({
		GENERATE: 0,
		COMBINE: 1
	});

	/**
	 * A crepuscular rays shader material.
	 *
	 * References:
	 *
	 * Nvidia, GPU Gems 3 - Chapter 13:
	 *  Volumetric Light Scattering as a Post-Process
	 *  http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
	 *
	 * Crytek, Sousa - GDC2008:
	 *  Crysis Next Gen Effects
	 *  http://www.crytek.com/sites/default/files/GDC08_SousaT_CrysisEffects.ppt
	 *
	 * @class GodRaysMaterial
	 * @constructor
	 * @extends ShaderMaterial
	 * @param {Phase} [phase=Phase.GENERATE] - Determines which shader code to use. See Phase enumeration.
	 */

	function GodRaysMaterial(phase) {

		THREE.ShaderMaterial.call(this, {

			defines: {

				NUM_SAMPLES: 6

			},

			uniforms: (phase === Phase.COMBINE) ? {

				tDiffuse: {type: "t", value: null},
				tGodRays: {type: "t", value: null},
				intensity: {type: "f", value: 0.69},

			} : {

				tDiffuse: {type: "t", value: null},
				stepSize: {type: "f", value: 1.0},
				decay: {type: "f", value: 0.93},
				weight: {type: "f", value: 1.0},
				exposure: {type: "f", value: 1.0},
				lightPosition: {type: "v3", value: null}

			},

			fragmentShader: (phase === Phase.COMBINE) ? shader$9.fragment.combine : shader$9.fragment.generate,
			vertexShader: shader$9.vertex

		});

	}

	GodRaysMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
	GodRaysMaterial.prototype.constructor = GodRaysMaterial;

	/**
	 * An abstract render pass.
	 *
	 * @class Pass
	 * @constructor
	 * @param {Scene} [scene] - The scene to render.
	 * @param {Camera} [camera] - The camera will be added to the given scene if it has no parent.
	 */

	function Pass(scene, camera) {

		/**
		 * The scene to render.
		 *
		 * @property scene
		 * @type Scene
		 * @private
		 * @default Scene()
		 */

		this.scene = (scene !== undefined) ? scene : new THREE.Scene();

		/**
		 * The camera to render with.
		 *
		 * @property camera
		 * @type Camera
		 * @private
		 * @default OrthographicCamera(-1, 1, 1, -1, 0, 1)
		 */

		this.camera = (camera !== undefined) ? camera : new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

		if(this.camera.parent === null) { this.scene.add(this.camera); }

		/**
		 * Enabled flag.
		 *
		 * @property enabled
		 * @type Boolean
		 * @default true
		 */

		this.enabled = true;

		/**
		 * Render target swap flag.
		 *
		 * @property needsSwap
		 * @type Boolean
		 * @default false
		 */

		this.needsSwap = false;

	}

	/**
	 * Renders the scene.
	 * This is an abstract method that must be overriden.
	 *
	 * @method render
	 * @throws {Error} An error is thrown if the method is not overridden.
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	Pass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		throw new Error("Render method not implemented!");

	};

	/**
	 * Updates this pass with the new main render size.
	 * This is an abstract method that may be overriden in case  
	 * you want to react to render size changes.
	 *
	 * @method updateRenderSize
	 * @param {Number} w - The on-screen render width.
	 * @param {Number} h - The on-screen render height.
	 * @example
	 *  this.myRenderTarget.width = w / 2;
	 */

	Pass.prototype.updateRenderSize = function(w, h) {};

	/**
	 * A save pass.
	 *
	 * @class SavePass
	 * @constructor
	 * @extends Pass
	 * @param {Scene} renderTarget - The render target.
	 */

	function SavePass(renderTarget) {

		Pass.call(this);

		/**
		 * Copy shader material.
		 *
		 * @property material
		 * @type CopyMaterial
		 * @private
		 */

		this.material = new CopyMaterial();

		/**
		 * The render target.
		 *
		 * @property renderTarget
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTarget = renderTarget;

		if(this.renderTarget === undefined) {

			this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false
			});

		}

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	SavePass.prototype = Object.create(Pass.prototype);
	SavePass.prototype.constructor = SavePass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	SavePass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		this.material.uniforms.tDiffuse.value = readBuffer;
		this.quad.material = this.material;

		renderer.render(this.scene, this.camera, this.renderTarget, this.clear);

	};

	/**
	 * A mask pass.
	 *
	 * @class MaskPass
	 * @constructor
	 * @extends Pass
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 */

	function MaskPass(scene, camera) {

		Pass.call(this, scene, camera);

		/**
		 * Inverse flag.
		 *
		 * @property inverse
		 * @type Boolean
		 * @default false
		 */

		this.inverse = false;

		/**
		 * Clear flag.
		 *
		 * @property clear
		 * @type Boolean
		 * @default true
		 */

		this.clear = true;

	}

	MaskPass.prototype = Object.create(Pass.prototype);
	MaskPass.prototype.constructor = MaskPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 * @param {Boolean} maskActive - This flag is supposed to mask this pass, but it isn't used here :/ hm.
	 */

	MaskPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta, maskActive) {

		var context = renderer.context;
		var writeValue, clearValue;

		// Don't update color or depth.
		context.colorMask(false, false, false, false);
		context.depthMask(false);

		if(this.inverse) {

			writeValue = 0;
			clearValue = 1;

		} else {

			writeValue = 1;
			clearValue = 0;

		}

		context.enable(context.STENCIL_TEST);
		context.stencilOp(context.REPLACE, context.REPLACE, context.REPLACE);
		context.stencilFunc(context.ALWAYS, writeValue, 0xffffffff);
		context.clearStencil(clearValue);

		// Draw into the stencil buffer.
		renderer.render(this.scene, this.camera, readBuffer, this.clear);
		renderer.render(this.scene, this.camera, writeBuffer, this.clear);

		// Re-enable update of color and depth.
		context.colorMask(true, true, true, true);
		context.depthMask(true);

		// Only render where stencil is set to 1.
		context.stencilFunc(context.EQUAL, 1, 0xffffffff);
		context.stencilOp(context.KEEP, context.KEEP, context.KEEP);

	};

	/**
	 * A clear mask pass.
	 *
	 * @class ClearMaskPass
	 * @constructor
	 * @extends Pass
	 */

	function ClearMaskPass() {

		Pass.call(this, null, null);

	}

	ClearMaskPass.prototype = Object.create(Pass.prototype);
	ClearMaskPass.prototype.constructor = ClearMaskPass;

	/**
	 * This pass's render method disables the stencil test.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 * @param {Boolean} maskActive - This flag is supposed to mask this pass, but it isn't used here :/ hm.
	 */

	ClearMaskPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta, maskActive) {

		renderer.context.disable(context.STENCIL_TEST);

	};

	/**
	 * A shader pass.
	 *
	 * Used to render simple shader materials as 2D filters.
	 *
	 * @class ShaderPass
	 * @constructor
	 * @extends Pass
	 * @param {ShaderMaterial} material - The shader material to use.
	 * @param {String} [textureID=tDiffuse] - The texture uniform identifier.
	 */

	function ShaderPass(material, textureID) {

		Pass.call(this);

		/**
		 * The texture id used to set the read buffer render 
		 * texture in the shader.
		 *
		 * @property textureID
		 * @type String
		 * @default tDiffuse
		 */

		this.textureID = (textureID !== undefined) ? textureID : "tDiffuse";

		/**
		 * The shader material to use for rendering.
		 *
		 * @property material
		 * @type ShaderMaterial
		 */

		this.material = material;

		/**
		 * Render to screen flag.
		 *
		 * @property renderToScreen
		 * @type Boolean
		 * @default false
		 */

		this.renderToScreen = false;

		// Request target swapping.
		this.needsSwap = true;

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	ShaderPass.prototype = Object.create(Pass.prototype);
	ShaderPass.prototype.constructor = ShaderPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	ShaderPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		if(this.material.uniforms[this.textureID] !== undefined) {

			this.material.uniforms[this.textureID].value = readBuffer;

		}

		this.quad.material = this.material;

		if(this.renderToScreen) {

			renderer.render(this.scene, this.camera);

		} else {

			renderer.render(this.scene, this.camera, writeBuffer, this.clear);

		}

	};

	/**
	 * A render pass.
	 *
	 * @class RenderPass
	 * @constructor
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Material} overrideMaterial - An override material for the scene.
	 * @param {Color} clearColor - A clear color.
	 * @param {Number} clearAlpha - A clear alpha value.
	 */

	function RenderPass(scene, camera, overrideMaterial, clearColor, clearAlpha) {

		Pass.call(this, scene, camera);

		/**
		 * Override material.
		 *
		 * @property overrideMaterial
		 * @type Material
		 */

		this.overrideMaterial = overrideMaterial;

		/**
		 * Clear color.
		 *
		 * @property clearColor
		 * @type Color
		 */

		this.clearColor = clearColor;

		/**
		 * Clear alpha.
		 *
		 * @property clearAlpha
		 * @type Number
		 */

		this.clearAlpha = (clearAlpha !== undefined) ? clearAlpha : 1;

		/**
		 * Old clear color.
		 *
		 * @property oldClearColor
		 * @type Color
		 * @private
		 */

		this.oldClearColor = new THREE.Color();

		/**
		 * Old clear alpha.
		 *
		 * @property oldClearAlpha
		 * @type Number
		 * @private
		 */

		this.oldClearAlpha = 1.0;

		/**
		 * Clear flag.
		 *
		 * @property clear
		 * @type Boolean
		 * @default true
		 */

		this.clear = true;

	}

	RenderPass.prototype = Object.create(Pass.prototype);
	RenderPass.prototype.constructor = RenderPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	RenderPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		var clear = this.clearColor !== undefined;

		this.scene.overrideMaterial = this.overrideMaterial;

		if(clear) {

			this.oldClearColor.copy(renderer.getClearColor());
			this.oldClearAlpha = renderer.getClearAlpha();

			renderer.setClearColor(this.clearColor, this.clearAlpha);

		}

		renderer.render(this.scene, this.camera, readBuffer, this.clear);

		if(clear) {

			renderer.setClearColor(this.oldClearColor, this.oldClearAlpha);

		}

		this.scene.overrideMaterial = null;

	};

	/**
	 * A texture pass.
	 *
	 * @class TexturePass
	 * @constructor
	 * @extends Pass
	 * @param {Texture} texture - The texture.
	 * @param {Number} [opacity] - The opacity to apply to the texture.
	 */

	function TexturePass(texture, opacity) {

		Pass.call(this, new THREE.Scene(), new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));

		/**
		 * Copy shader material.
		 *
		 * @property material
		 * @type CopyMaterial
		 * @private
		 */

		this.material = new CopyMaterial();
		this.material.uniforms.tDiffuse.value = texture;
		this.material.uniforms.opacity.value = (opacity !== undefined) ? opacity : 1.0;

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	TexturePass.prototype = Object.create(Pass.prototype);
	TexturePass.prototype.constructor = TexturePass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	TexturePass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		this.quad.material = this.material;
		renderer.render(this.scene, this.camera, readBuffer);

	};

	/**
	 * Generates a texture that represents the luminosity of the current scene, adapted over time
	 * to simulate the optic nerve responding to the amount of light it is receiving.
	 * Based on a GDC2007 presentation by Wolfgang Engel titled "Post-Processing Pipeline"
	 *
	 * Full-screen tone-mapping shader based on http://www.graphics.cornell.edu/~jaf/publications/sig02_paper.pdf
	 *
	 * @class AdaptiveToneMappingPass
	 * @constructor
	 * @extends Pass
	 * @param {Boolean} adaptive - Adaptivity flag.
	 * @param {Number} [opacity] - The resolution.
	 */

	function AdaptiveToneMappingPass(adaptive, resolution) {

		Pass.call(this);

		/**
		 * Render resolution.
		 *
		 * @property adaptive
		 * @type Number
		 * @default 256
		 */

		this.resolution = (resolution !== undefined) ? resolution : 256;

		/**
		 * Adaptivity flag.
		 *
		 * @property adaptive
		 * @type Boolean
		 * @default false
		 */

		this.adaptive = (adaptive !== undefined) ? false : true;

		/**
		 * Initialisation flag.
		 *
		 * @property needsInit
		 * @type Boolean
		 * @default true
		 */

		this.needsInit = true;

		/**
		 * Luminance render target.
		 *
		 * @property luminanceRT
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.luminanceRT = null;

		/**
		 * Previous luminance render target.
		 *
		 * @property previousLuminanceRT
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.previousLuminanceRT = null;

		/**
		 * Current luminance render target.
		 *
		 * @property currentLuminanceRT
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.currentLuminanceRT = null;

		/**
		 * Copy shader material.
		 *
		 * @property materialCopy
		 * @type CopyMaterial
		 * @private
		 */

		this.materialCopy = new CopyMaterial();
		this.materialCopy.blending = THREE.NoBlending;
		this.materialCopy.depthTest = false;

		/**
		 * Luminance shader material.
		 *
		 * @property materialLuminance
		 * @type LuminosityMaterial
		 * @private
		 */

		this.materialLuminance = new LuminosityMaterial();
		this.materialLuminance.blending = THREE.NoBlending;

		/**
		 * Adaptive luminance shader material.
		 *
		 * @property materialAdaptiveLuminosity
		 * @type AdaptiveLuminosityMaterial
		 * @private
		 */

		this.materialAdaptiveLuminosity = new AdaptiveLuminosityMaterial();
		this.materialAdaptiveLuminosity.defines.MIP_LEVEL_1X1 = (Math.log(this.resolution) / Math.log(2.0)).toFixed(1);
		this.materialAdaptiveLuminosity.blending = THREE.NoBlending;

		/**
		 * Tone mapping shader material.
		 *
		 * @property materialToneMapping
		 * @type ToneMappingMaterial
		 * @private
		 */

		this.materialToneMapping = new ToneMappingMaterial();
		this.materialToneMapping.blending = THREE.NoBlending;

		// Swap the render targets in this pass.
		this.needsSwap = true;

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	AdaptiveToneMappingPass.prototype = Object.create(Pass.prototype);
	AdaptiveToneMappingPass.prototype.constructor = AdaptiveToneMappingPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	AdaptiveToneMappingPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		if(this.needsInit) {

			this.reset(renderer);
			this.luminanceRT.texture.type = readBuffer.texture.type;
			this.previousLuminanceRT.texture.type = readBuffer.texture.type;
			this.currentLuminanceRT.texture.type = readBuffer.texture.type;
			this.needsInit = false;

		}

		if(this.adaptive) {

			// Render the luminance of the current scene into a render target with mipmapping enabled.
			this.quad.material = this.materialLuminance;
			this.materialLuminance.uniforms.tDiffuse.value = readBuffer;
			renderer.render(this.scene, this.camera, this.currentLuminanceRT);

			// Use the new luminance values, the previous luminance and the frame delta to adapt the luminance over time.
			this.quad.material = this.materialAdaptiveLuminosity;
			this.materialAdaptiveLuminosity.uniforms.delta.value = delta;
			this.materialAdaptiveLuminosity.uniforms.lastLum.value = this.previousLuminanceRT;
			this.materialAdaptiveLuminosity.uniforms.currentLum.value = this.currentLuminanceRT;
			renderer.render(this.scene, this.camera, this.luminanceRT);

			// Copy the new adapted luminance value so that it can be used by the next frame.
			this.quad.material = this.materialCopy;
			this.materialCopy.uniforms.tDiffuse.value = this.luminanceRT;
			renderer.render(this.scene, this.camera, this.previousLuminanceRT);

		}

		this.quad.material = this.materialToneMapping;
		this.materialToneMapping.uniforms.tDiffuse.value = readBuffer;
		renderer.render(this.scene, this.camera, writeBuffer, this.clear);

	};

	/**
	 * Resets this pass.
	 *
	 * @method reset
	 * @param {WebGLRender} renderer - The renderer to use.
	 * @private
	 */

	AdaptiveToneMappingPass.prototype.reset = function(renderer) {

		// Create new render targets.
		if(this.luminanceRT !== null) { this.luminanceRT.dispose(); }
		if(this.currentLuminanceRT !== null) { this.currentLuminanceRT.dispose(); }
		if(this.previousLuminanceRT !== null) { this.previousLuminanceRT.dispose(); }

		var pars = {minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat};

		this.luminanceRT = new THREE.WebGLRenderTarget(this.resolution, this.resolution, pars);
		this.luminanceRT.texture.generateMipmaps = false;
		this.previousLuminanceRT = new THREE.WebGLRenderTarget(this.resolution, this.resolution, pars);
		this.previousLuminanceRT.texture.generateMipmaps = false;

		// Only mipmap the current luminosity. A down-sampled version is desired in the adaptive shader.
		pars.minFilter = THREE.LinearMipMapLinearFilter;
		this.currentLuminanceRT = new THREE.WebGLRenderTarget(this.resolution, this.resolution, pars);

		if(this.adaptive) {

			this.materialToneMapping.defines.ADAPTED_LUMINANCE = 1;
			this.materialToneMapping.uniforms.luminanceMap.value = this.luminanceRT;

		}

		//Put something in the adaptive luminance texture so that the scene can render initially.
		this.quad.material = new THREE.MeshBasicMaterial({color: 0x777777});
		this.materialLuminance.needsUpdate = true;
		this.materialAdaptiveLuminosity.needsUpdate = true;
		this.materialToneMapping.needsUpdate = true;
		// renderer.render(this.scene, this.camera, this.luminanceRT);
		// renderer.render(this.scene, this.camera, this.previousLuminanceRT);
		// renderer.render(this.scene, this.camera, this.currentLuminanceRT);

	};

	/**
	 * Sets whether this pass uses adaptive luminosity.
	 *
	 * @method setAdaptive
	 * @param {Boolean} adaptive - Adaptivity flag.
	 */

	AdaptiveToneMappingPass.prototype.setAdaptive = function( adaptive ) {

		if(adaptive) {

			this.adaptive = true;
			this.materialToneMapping.defines.ADAPTED_LUMINANCE = 1;
			this.materialToneMapping.uniforms.luminanceMap.value = this.luminanceRT;

		} else {

			this.adaptive = false;
			delete this.materialToneMapping.defines.ADAPTED_LUMINANCE;
			this.materialToneMapping.uniforms.luminanceMap.value = undefined;

		}

		this.materialToneMapping.needsUpdate = true;

	};

	/**
	 * Sets the adaption rate (tau) for the adaptive luminosity.
	 *
	 * @method setAdaptionRate
	 * @param {Number} tau - The new rate.
	 */

	AdaptiveToneMappingPass.prototype.setAdaptionRate = function(tau) {

		if(tau !== undefined) {

			this.materialAdaptiveLuminosity.uniforms.tau.value = Math.abs(tau);

		}

	};

	/**
	 * Sets the maximum luminosity value for the adaptive luminosity.
	 *
	 * @method setMaxLuminance
	 * @param {Number} maxLum - The new maximum luminosity.
	 */

	AdaptiveToneMappingPass.prototype.setMaxLuminance = function(maxLum) {

		if(maxLum !== undefined) {

			this.materialToneMapping.uniforms.maxLuminance.value = maxLum;

		}

	};

	/**
	 * Sets the average luminance value for tone-mapping.
	 *
	 * @method setAverageLuminance
	 * @param {Number} avgLum - The new average.
	 */

	AdaptiveToneMappingPass.prototype.setAverageLuminance = function(avgLum) {

		if(avgLum !== undefined) {

			this.materialToneMapping.uniforms.averageLuminance.value = avgLum;

		}

	};

	/**
	 * Sets the middle grey value for tone-mapping.
	 *
	 * @method setMiddleGrey
	 * @param {Number} middleGrey - The new middle grey value.
	 */

	AdaptiveToneMappingPass.prototype.setMiddleGrey = function(middleGrey) {

		if(middleGrey !== undefined) {

			this.materialToneMapping.uniforms.middleGrey.value = middleGrey;

		}

	};

	/**
	 * Deletes all render targets and materials.
	 *
	 * @method dispose
	 */

	AdaptiveToneMappingPass.prototype.dispose = function() {

		if(this.luminanceRT) { this.luminanceRT.dispose(); }
		if(this.previousLuminanceRT) { this.previousLuminanceRT.dispose(); }
		if(this.currentLuminanceRT) { this.currentLuminanceRT.dispose(); }
		if(this.materialLuminance) { this.materialLuminance.dispose(); }
		if(this.materialAdaptiveLuminosity) { this.materialAdaptiveLuminosity.dispose(); }
		if(this.materialCopy) { this.materialCopy.dispose(); }
		if(this.materialToneMapping) { this.materialToneMapping.dispose(); }

	};

	/**
	 * A render pass.
	 *
	 * @class RenderPass
	 * @constructor
	 * @extends Pass
	 * @param {Object} [options] - The options.
	 * @param {Vector2} [tSize=(256.0, 256.0)] - The pattern texture size.
	 * @param {Vector2} [center=(0.5, 0.5)] - The center.
	 * @param {Number} [angle=1.57] - The angle.
	 * @param {Number} [scale=1.0] - The scale.
	 */

	function DotScreenPass(options) {

		Pass.call(this);

		/**
		 * Dot screen shader material description.
		 *
		 * @property material
		 * @type DotScreenMaterial
		 * @private
		 */

		this.material = new DotScreenMaterial();

		if(options !== undefined) {

			if(options.tSize !== undefined) { this.material.uniforms.tSize.value.copy(options.tSize); }
			if(options.center !== undefined) { this.material.uniforms.center.value.copy(options.center); }
			if(options.angle !== undefined) { this.material.uniforms.angle.value = options.angle; }
			if(options.scale !== undefined) { this.material.uniforms.scale.value = options.scale; }

		}

		/**
		 * Render to screen flag.
		 *
		 * @property renderToScreen
		 * @type Boolean
		 * @default false
		 */

		this.renderToScreen = false;

		// Swap in this pass.
		this.needsSwap = true;

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	DotScreenPass.prototype = Object.create(Pass.prototype);
	DotScreenPass.prototype.constructor = DotScreenPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	DotScreenPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		this.material.uniforms.tDiffuse.value = readBuffer;
		this.material.uniforms.tSize.value.set(readBuffer.width, readBuffer.height);

		this.quad.material = this.material;

		if(this.renderToScreen) {

			renderer.render(this.scene, this.camera);

		} else {

			renderer.render(this.scene, this.camera, writeBuffer, false);

		}

	};

	/**
	 * A glitch pass.
	 *
	 * @class GlitchPass
	 * @constructor
	 * @param {Number} [dtSize=64] - The size of the generated displacement map.
	 */

	function GlitchPass(dtSize) {

		Pass.call(this);

		if(dtSize === undefined) { dtSize = 64; }

		/**
		 * Glitch shader material.
		 *
		 * @property material
		 * @type GlitchMaterial
		 * @private
		 */

		this.material = new GlitchMaterial();
		this.generateHeightmap(dtSize);

		/**
		 * Render to screen flag.
		 *
		 * @property renderToScreen
		 * @type Boolean
		 * @default false
		 */

		this.renderToScreen = false;

		// Swap in this pass.
		this.needsSwap = true;

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), this.material);
		this.scene.add(this.quad);

		/**
		 * The quad mesh to render.
		 *
		 * @property quad
		 * @type Mesh
		 */

		this.goWild = false;

		/**
		 * Counter for glitch activation/deactivation.
		 *
		 * @property curF
		 * @type Number
		 * @private
		 */

		this.curF = 0;

		// Create a new glitch point.
		this.generateTrigger();

	}

	GlitchPass.prototype = Object.create(Pass.prototype);
	GlitchPass.prototype.constructor = GlitchPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 */

	GlitchPass.prototype.render = function(renderer, writeBuffer, readBuffer) {

		var uniforms = this.material.uniforms;

		uniforms.tDiffuse.value = readBuffer;
		uniforms.seed.value = Math.random();
		uniforms.byp.value = 0;

		if(this.curF % this.randX === 0 || this.goWild) {

			uniforms.amount.value = Math.random() / 30;
			uniforms.angle.value = THREE.Math.randFloat(-Math.PI, Math.PI);
			uniforms.seedX.value = THREE.Math.randFloat(-1, 1);
			uniforms.seedY.value = THREE.Math.randFloat(-1, 1);
			uniforms.distortionX.value = THREE.Math.randFloat(0, 1);
			uniforms.distortionY.value = THREE.Math.randFloat(0, 1);
			this.curF = 0;
			this.generateTrigger();

		} else if(this.curF % this.randX < this.randX / 5) {

			uniforms.amount.value = Math.random() / 90;
			uniforms.angle.value = THREE.Math.randFloat(- Math.PI, Math.PI);
			uniforms.distortionX.value = THREE.Math.randFloat(0, 1);
			uniforms.distortionY.value = THREE.Math.randFloat(0, 1);
			uniforms.seedX.value = THREE.Math.randFloat(-0.3, 0.3);
			uniforms.seedY.value = THREE.Math.randFloat(-0.3, 0.3);

		} else if(!this.goWild) {

			uniforms.byp.value = 1;

		}

		++this.curF;

		if(this.renderToScreen) {

			renderer.render(this.scene, this.camera);

		} else {

			renderer.render(this.scene, this.camera, writeBuffer, false);

		}

	};

	/**
	 * Creates a new break point for the glitch effect.
	 *
	 * @method generateTrigger
	 */

	GlitchPass.prototype.generateTrigger = function() {

		this.randX = THREE.Math.randInt(120, 240);

	};

	/**
	 * Generates a randomised displacementmap for this pass.
	 *
	 * @method generateHeightmap
	 * @param {Number} size - The texture size.
	 */

	GlitchPass.prototype.generateHeightmap = function(size) {

		var length = size * size;
		var data = new Float32Array(length * 3);
		var i, val, t;

		for(i = 0; i < length; ++i) {

			val = THREE.Math.randFloat(0, 1);
			data[i * 3] = val;
			data[i * 3 + 1] = val;
			data[i * 3 + 2] = val;

		}

		t = new THREE.DataTexture(data, size, size, THREE.RGBFormat, THREE.FloatType);
		t.needsUpdate = true;

		this.material.uniforms.tDisp.value = t;

	};

	// A constant blur spread factor.
	var BLUR = 0.001953125;

	/**
	 * A bloom pass.
	 *
	 * This pass renders a scene with superimposed blur 
	 * by utilising an approximated gauss kernel.
	 *
	 * Since the effect will be written to the readBuffer 
	 * render texture, you'll need to use a ShaderPass with 
	 * a CopyMaterial to render the texture to screen.
	 *
	 * @class BloomPass
	 * @constructor
	 * @extends Pass
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.strength=1.0] - The bloom strength.
	 * @param {Number} [options.kernelSize=25] - The kernel size.
	 * @param {Number} [options.sigma=4.0] - The sigma value.
	 * @param {Number} [options.resolutionScale=0.25] - The render resolution scale, relative to the on-screen render size.
	 */

	function BloomPass(options) {

		Pass.call(this);

		if(options === undefined) { options = {}; }

		var kernelSize = (options.kernelSize !== undefined) ? options.kernelSize : 25;

		/**
		 * The resolution scale.
		 *
		 * @property resolutionScale
		 * @type Number
		 * @private
		 */

		this.resolutionScale = (options.resolution === undefined) ? 0.25 : THREE.Math.clamp(options.resolution, 0.0, 1.0);

		/**
		 * The horizontal blur factor.
		 *
		 * @property blurX
		 * @type Vector2
		 * @private
		 */

		this.blurX = new THREE.Vector2(BLUR, 0.0);

		/**
		 * The vertical blur factor.
		 *
		 * @property blurY
		 * @type Vector2
		 * @private
		 */

		this.blurY = new THREE.Vector2();

		/**
		 * A render target.
		 *
		 * @property renderTargetX
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetX = new THREE.WebGLRenderTarget(1, 1, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat
		});

		/**
		 * A second render target.
		 *
		 * @property renderTargetY
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetY = this.renderTargetX.clone();

		/**
		 * Copy shader material.
		 *
		 * @property copyMaterial
		 * @type CopyMaterial
		 * @private
		 */

		this.copyMaterial = new CopyMaterial();
		this.copyMaterial.blending = THREE.AdditiveBlending;
		this.copyMaterial.transparent = true;

		if(options.strength !== undefined) { this.copyMaterial.uniforms.opacity.value = options.strength; }

		/**
		 * Convolution shader material.
		 *
		 * @property convolutionMaterial
		 * @type ConvolutionMaterial
		 * @private
		 */

		this.convolutionMaterial = new ConvolutionMaterial();

		this.convolutionMaterial.buildKernel((options.sigma !== undefined) ? options.sigma : 4.0);
		this.convolutionMaterial.defines.KERNEL_SIZE_FLOAT = kernelSize.toFixed(1);
		this.convolutionMaterial.defines.KERNEL_SIZE_INT = kernelSize.toFixed(0);

		/**
		 * Clear flag. If set to true, the blurring will occur.
		 *
		 * @property clear
		 * @type Boolean
		 * @default true
		 */

		this.clear = false;

		/**
		 * The quad mesh to render.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	BloomPass.prototype = Object.create(Pass.prototype);
	BloomPass.prototype.constructor = BloomPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 * @param {Boolean} maskActive - Disable stencil test.
	 */

	BloomPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta, maskActive) {

		if(maskActive) { renderer.context.disable(renderer.context.STENCIL_TEST); }

		// Render quad with blurred scene into texture (convolution pass 1).
		this.quad.material = this.convolutionMaterial;
		this.convolutionMaterial.uniforms.tDiffuse.value = readBuffer;
		this.convolutionMaterial.uniforms.uImageIncrement.value.copy(this.blurX);
		renderer.render(this.scene, this.camera, this.renderTargetX, true);

		// Render quad with blurred scene into texture (convolution pass 2).
		this.convolutionMaterial.uniforms.tDiffuse.value = this.renderTargetX;
		this.convolutionMaterial.uniforms.uImageIncrement.value.copy(this.blurY);
		renderer.render(this.scene, this.camera, this.renderTargetY, true);

		// Render original scene with superimposed blur (-> onto readBuffer).
		this.quad.material = this.copyMaterial;
		this.copyMaterial.uniforms.tDiffuse.value = this.renderTargetY;

		if(maskActive) { renderer.context.enable(renderer.context.STENCIL_TEST); }

		renderer.render(this.scene, this.camera, readBuffer, this.clear);

	};

	/**
	 * Updates this pass with the main render size.
	 *
	 * @method updateRenderSize
	 * @param {Number} w - The on-screen render width.
	 * @param {Number} h - The on-screen render height.
	 */

	BloomPass.prototype.updateRenderSize = function(w, h) {

		this.renderTargetX.setSize(Math.floor(w * this.resolutionScale), Math.floor(h * this.resolutionScale));

		if(this.renderTargetX.width <= 0) { this.renderTargetX.width = 1; }
		if(this.renderTargetX.height <= 0) { this.renderTargetX.height = 1; }

		this.renderTargetY.setSize(this.renderTargetX.width, this.renderTargetX.height);

		// Scale the factor with the render target ratio.
		this.blurY.set(0.0, (w / h) * BLUR);

	};

	/**
	 * Depth-of-field pass using a bokeh shader.
	 *
	 * @class BokehPass
	 * @constructor
	 * @extends Pass
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Object} [params] - Additional parameters.
	 * @param {Number} [params.focus] - The focus.
	 * @param {Number} [params.aspect] - The aspect.
	 * @param {Number} [params.aperture] - The aperture.
	 * @param {Number} [params.maxBlur] - The maximum blur.
	 * @param {Number} [params.resolution] - The render resolution.
	 */

	function BokehPass(scene, camera, params) {

		Pass.call(this, scene, camera);

		if(params === undefined) { params = {}; }
		var resolution = (params.resolution !== undefined) ? resolution : 256;

		/**
		 * A render target.
		 *
		 * @property renderTargetColor
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetColor = new THREE.WebGLRenderTarget(resolution, resolution, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat
		});

		/**
		 * A render target for the depth.
		 *
		 * @property renderTargetDepth
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetDepth = this.renderTargetColor.clone();

		/**
		 * Depth shader material.
		 *
		 * @property depthMaterial
		 * @type MeshDepthMaterial
		 * @private
		 */

		this.depthMaterial = new THREE.MeshDepthMaterial();

		/**
		 * Bokeh shader material.
		 *
		 * @property bokehMaterial
		 * @type BokehMaterial
		 * @private
		 */

		this.bokehMaterial = new BokehMaterial();
		this.bokehMaterial.uniforms.tDepth.value = this.renderTargetDepth;

		if(params.focus !== undefined) { this.bokehMaterial.uniforms.focus.value = params.focus; }
		if(params.aspect !== undefined) { this.bokehMaterial.uniforms.aspect.value = params.aspect; }
		if(params.aperture !== undefined) { this.bokehMaterial.uniforms.aperture.value = params.aperture; }
		if(params.maxBlur !== undefined) { this.bokehMaterial.uniforms.maxBlur.value = params.maxBlur; }

		/**
		 * Render to screen flag.
		 *
		 * @property renderToScreen
		 * @type Boolean
		 * @default false
		 */

		this.renderToScreen = false;

		/**
		 * A scene to render the depth of field with.
		 *
		 * @property scene2
		 * @type Scene
		 * @private
		 */

		this.scene2  = new THREE.Scene();

		/**
		 * A camera to render the depth of field effect with.
		 *
		 * @property camera2
		 * @type Camera
		 * @private
		 */

		this.camera2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.scene2.add(this.camera2);

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene2.add(this.quad);

	}

	BokehPass.prototype = Object.create(Pass.prototype);
	BokehPass.prototype.constructor = BokehPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 * @param {Boolean} maskActive - Disable stencil test.
	 */

	BokehPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta, maskActive) {

		// Render depth into texture.
		this.scene.overrideMaterial = this.depthMaterial;
		renderer.render(this.scene, this.camera, this.renderTargetDepth, true);
		this.scene.overrideMaterial = null;

		// Render bokeh composite.
		this.quad.material = this.bokehMaterial;
		this.bokehMaterial.uniforms.tColor.value = readBuffer;

		if(this.renderToScreen) {

			renderer.render(this.scene2, this.camera2);

		} else {

			renderer.render(this.scene2, this.camera2, writeBuffer, this.clear);

		}

	};

	/**
	 * Depth-of-field pass using a bokeh shader.
	 *
	 * @class TexturePass
	 * @constructor
	 * @extends Pass
	 * @param {Object} [options] - The options.
	 * @param {Boolean} [options.grayscale=true] - Convert to greyscale.
	 * @param {Number} [options.noiseIntensity=0.5] - The noise intensity. 0.0 to 1.0.
	 * @param {Number} [options.scanlinesIntensity=0.05] - The scanline intensity. 0.0 to 1.0.
	 * @param {Number} [options.scanlinesCount=4096.0] - The number of scanlines. 0.0 to 4096.0.
	 */

	function FilmPass(options) {

		Pass.call(this);

		/**
		 * Film shader material.
		 *
		 * @property material
		 * @type FilmMaterial
		 * @private
		 */

		this.material = new FilmMaterial();

		if(options !== undefined) {

			if(options.grayscale !== undefined) { this.material.uniforms.grayscale.value = options.grayscale; }
			if(options.noiseIntensity !== undefined) { this.material.uniforms.nIntensity.value = options.noiseIntensity; }
			if(options.scanlinesIntensity !== undefined) { this.material.uniforms.sIntensity.value = options.scanlinesIntensity; }
			if(options.scanlinesCount !== undefined) { this.material.uniforms.sCount.value = options.scanlinesCount; }

		}

		/**
		 * Render to screen flag.
		 *
		 * @property renderToScreen
		 * @type Boolean
		 * @default false
		 */

		this.renderToScreen = false;

		// Swap targets in this pass.
		this.needsSwap = true;

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene.add(this.quad);

	}

	FilmPass.prototype = Object.create(Pass.prototype);
	FilmPass.prototype.constructor = FilmPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {Number} delta - The render delta time.
	 */

	FilmPass.prototype.render = function(renderer, writeBuffer, readBuffer, delta) {

		this.material.uniforms.tDiffuse.value = readBuffer;
		this.material.uniforms.time.value += delta;

		this.quad.material = this.material;

		if(this.renderToScreen) {

			renderer.render(this.scene, this.camera);

		} else {

			renderer.render(this.scene, this.camera, writeBuffer, false);

		}

	};

	/**
	 * A crepuscular rays pass.
	 *
	 * @class GodRaysPass
	 * @constructor
	 * @param {Scene} scene - The main scene. Used for depth rendering.
	 * @param {Camera} camera - The main camera. Used for depth rendering.
	 * @param {Vector3} lightSource - The most important light source.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.rayLength=1.0] - The maximum length of god rays. Valid values are 0.0 to 1.0.
	 * @param {Number} [options.decay=0.93] - A constant attenuation coefficient.
	 * @param {Number} [options.weight=1.0] - A constant attenuation coefficient.
	 * @param {Number} [options.exposure=1.0] - A constant attenuation coefficient.
	 * @param {Number} [options.intensity=0.69] - A constant factor for additive blending. The higher, the brighter the result.
	 * @param {Number} [options.resolutionScale=0.25] - The god rays render texture resolution scale relative to the on-screen render size.
	 * @param {Number} [options.samples=6] - The number of samples per pixel.
	 */

	function GodRaysPass(scene, camera, lightSource, options) {

		Pass.call(this, scene, camera);

		if(options === undefined) { options = {}; }

		/**
		 * The resolution scale.
		 *
		 * @property resolutionScale
		 * @type Number
		 * @private
		 */

		this.resolutionScale = (options.resolution === undefined) ? 0.25 : THREE.Math.clamp(options.resolution, 0.0, 1.0);

		/**
		 * The light source.
		 *
		 * @property lightSource
		 * @type Object3D
		 * @private
		 */

		this.lightSource = (lightSource !== undefined) ? lightSource : new THREE.Object3D();

		/**
		 * The light position in screen space.
		 *
		 * @property screenLightPos
		 * @type Vector3
		 * @private
		 */

		this.screenLightPos = new THREE.Vector3();

		/**
		 * A render target.
		 *
		 * @property renderTarget
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetX = new THREE.WebGLRenderTarget(1, 1, {
			minFilter: THREE.LinearFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat
		});

		/**
		 * Another render target for ping-ponging.
		 *
		 * @property renderTargetY
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetY = this.renderTargetX.clone();

		/**
		 * God rays shader material for the generate phase.
		 *
		 * @property godRaysGenerateMaterial
		 * @type GodRaysMaterial
		 * @private
		 */

		this.godRaysGenerateMaterial = new GodRaysMaterial(Phase.GENERATE);
		this.godRaysGenerateMaterial.uniforms.lightPosition.value = this.screenLightPos;

		if(options.samples !== undefined) { this.godRaysGenerateMaterial.defines.NUM_SAMPLES = options.samples; }
		if(options.decay !== undefined) { this.godRaysGenerateMaterial.uniforms.decay.value = options.decay; }
		if(options.weight !== undefined) { this.godRaysGenerateMaterial.uniforms.weight.value = options.weight; }

		/**
		 * The exposure coefficient.
		 *
		 * @property exposure
		 * @type Number
		 * @private
		 */

		if(options.exposure !== undefined) { this.godRaysGenerateMaterial.uniforms.exposure.value = options.exposure; }
		this.exposure = this.godRaysGenerateMaterial.uniforms.exposure.value;

		/**
		 * God rays shader material for the final composite phase.
		 *
		 * @property godRaysCombineMaterial
		 * @type GodRaysMaterial
		 * @private
		 */

		this.godRaysCombineMaterial = new GodRaysMaterial(Phase.COMBINE);

		if(options.intensity !== undefined) { this.godRaysCombineMaterial.uniforms.intensity.value = options.intensity; }

		/**
		 * A material used for masking the scene objects.
		 *
		 * @property maskMaterial
		 * @type MeshBasicMaterial
		 * @private
		 */

		this.maskMaterial = new THREE.MeshBasicMaterial({color: 0x000000});

		/**
		 * The maximum length of god-rays (in texture space [0.0, 1.0]).
		 * Translates to pre-computed step sizes for the 3 generate passes.
		 *
		 * @property stepSizes
		 * @type Float32Array
		 * @private
		 */

		var rayLength = (options.rayLength !== undefined) ? THREE.Math.clamp(options.rayLength, 0.0, 1.0) : 1.0;
		var NUM_SAMPLES = this.godRaysGenerateMaterial.defines.NUM_SAMPLES;

		this.stepSizes = new Float32Array(3);
		this.stepSizes[0] = rayLength * Math.pow(NUM_SAMPLES, -1.0);
		this.stepSizes[1] = rayLength * Math.pow(NUM_SAMPLES, -2.0);
		this.stepSizes[2] = rayLength * Math.pow(NUM_SAMPLES, -3.0);

		/**
		 * Render to screen flag.
		 *
		 * @property renderToScreen
		 * @type Boolean
		 * @default false
		 */

		this.renderToScreen = false;

		/**
		 * A scene to render the god rays with.
		 *
		 * @property scene2
		 * @type Scene
		 * @private
		 */

		this.scene2  = new THREE.Scene();

		/**
		 * A camera to render the god rays with.
		 *
		 * @property camera2
		 * @type Camera
		 * @private
		 */

		this.camera2 = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		this.scene2.add(this.camera2);

		/**
		 * The quad mesh to use for rendering the 2D effect.
		 *
		 * @property quad
		 * @type Mesh
		 * @private
		 */

		this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
		this.scene2.add(this.quad);

	}

	GodRaysPass.prototype = Object.create(Pass.prototype);
	GodRaysPass.prototype.constructor = GodRaysPass;

	/**
	 * Renders the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 */

	GodRaysPass.prototype.render = function(renderer, writeBuffer, readBuffer) {

		var clearColor;

		// Compute the screen light position and translate the coordinates to [-1, 1].
		this.screenLightPos.copy(this.lightSource.position).project(this.camera);
		this.screenLightPos.x = THREE.Math.clamp((this.screenLightPos.x + 1.0) * 0.5, 0.0, 1.0);
		this.screenLightPos.y = THREE.Math.clamp((this.screenLightPos.y + 1.0) * 0.55, 0.0, 1.0);

		// Don't show the rays from weird angles.
		this.godRaysGenerateMaterial.uniforms.exposure.value = this.computeAngleScalar() * this.exposure;

		// Render masked scene into texture.
		this.scene.overrideMaterial = this.maskMaterial;
		clearColor = renderer.getClearColor().getHex();
		renderer.setClearColor(0xffffff);
		renderer.render(this.scene, this.camera, this.renderTargetX, true);
		renderer.setClearColor(clearColor);
		this.scene.overrideMaterial = null;

		// God rays - Pass 1.
		this.quad.material = this.godRaysGenerateMaterial;
		this.godRaysGenerateMaterial.uniforms.stepSize.value = this.stepSizes[0];
		this.godRaysGenerateMaterial.uniforms.tDiffuse.value = this.renderTargetX;
		renderer.render(this.scene2, this.camera2, this.renderTargetY);

		// God rays - Pass 2.
		this.godRaysGenerateMaterial.uniforms.stepSize.value = this.stepSizes[1];
		this.godRaysGenerateMaterial.uniforms.tDiffuse.value = this.renderTargetY;
		renderer.render(this.scene2, this.camera2, this.renderTargetX);

		// God rays - Pass 3.
		this.godRaysGenerateMaterial.uniforms.stepSize.value = this.stepSizes[2];
		this.godRaysGenerateMaterial.uniforms.tDiffuse.value = this.renderTargetX;
		renderer.render(this.scene2, this.camera2, this.renderTargetY);

		// Final pass - Composite god-rays onto colors.
		this.quad.material = this.godRaysCombineMaterial;
		this.godRaysCombineMaterial.uniforms.tDiffuse.value = readBuffer;
		this.godRaysCombineMaterial.uniforms.tGodRays.value = this.renderTargetY;

		if(this.renderToScreen) {

			renderer.render(this.scene2, this.camera2);

		} else {

			renderer.render(this.scene2, this.camera2, writeBuffer);

		}

	};

	/**
	 * Computes the angle between the camera look direction and the light
	 * direction in order to create a scalar for the god rays exposure.
	 *
	 * @method computeAngleScalar
	 * @private
	 * @return {Number} A scalar in the range 0.0 to 1.0.
	 */

	// Computation helpers.
	var HALF_PI = Math.PI * 0.5;
	var localPoint = new THREE.Vector3(0, 0, -1);
	var cameraDirection = new THREE.Vector3();
	var lightDirection = new THREE.Vector3();

	GodRaysPass.prototype.computeAngleScalar = function() {

		// Save camera space point. Using lightDirection as a clipboard.
		lightDirection.copy(localPoint);
		// Camera space to world space.
		cameraDirection.copy(localPoint.applyMatrix4(this.camera.matrixWorld));
		// Restore local point.
		localPoint.copy(lightDirection);

		// Let these be one and the same point.
		lightDirection.copy(cameraDirection);
		// Now compute the actual directions.
		cameraDirection.sub(this.camera.position);
		lightDirection.sub(this.lightSource.position);

		// Compute the angle between the directions.
		// Don't allow acute angles and make a scalar out of it.
		return THREE.Math.clamp(cameraDirection.angleTo(lightDirection) - HALF_PI, 0.0, 1.0);

	};

	/**
	 * Updates this pass with the new main render size.
	 *
	 * @method updateRenderSize
	 * @param {Number} w - The on-screen render width.
	 * @param {Number} h - The on-screen render height.
	 */

	GodRaysPass.prototype.updateRenderSize = function(w, h) {

		this.renderTargetX.setSize(Math.floor(w * this.resolutionScale), Math.floor(h * this.resolutionScale));

		if(this.renderTargetX.width <= 0) { this.renderTargetX.width = 1; }
		if(this.renderTargetX.height <= 0) { this.renderTargetX.height = 1; }

		this.renderTargetY.setSize(this.renderTargetX.width, this.renderTargetX.height);

	};

	/**
	 * The effect composer may be used in place of a normal WebGLRenderer.
	 *
	 * The composer will disable the auto clear behaviour of the provided
	 * renderer in order to prevent unnecessary clear operations. 
	 * You might want to use a RenderPass as your first pass to automatically 
	 * clear the screen and render the scene to a texture for further processing. 
	 *
	 * @class EffectComposer
	 * @constructor
	 * @param {WebGLRenderer} renderer - The renderer that should be used.
	 * @param {WebGLRenderTarget} [renderTarget] - A render target to use for the post processing. If none is provided, a new one will be created.
	 */

	function EffectComposer(renderer, renderTarget) {

		var pixelRatio, width, height;

		/**
		 * The renderer.
		 *
		 * @property renderer
		 * @type WebGLRenderer
		 */

		this.renderer = renderer;
		this.renderer.autoClear = false;

		/**
		 * The render target.
		 *
		 * @property renderTarget1
		 * @type WebGLRenderTarget
		 * @private
		 */

		if(renderTarget === undefined) {

			pixelRatio = renderer.getPixelRatio();
			width = Math.floor(renderer.context.canvas.width / pixelRatio) || 1;
			height = Math.floor(renderer.context.canvas.height / pixelRatio) || 1;

			renderTarget = new THREE.WebGLRenderTarget(width, height, {
				minFilter: THREE.LinearFilter,
				magFilter: THREE.LinearFilter,
				format: THREE.RGBFormat,
				stencilBuffer: false
			});

		}

		this.renderTarget1 = renderTarget;

		/**
		 * A copy of the render target.
		 *
		 * @property renderTarget2
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTarget2 = renderTarget.clone();

		/**
		 * The write buffer. Alias for renderTarget1.
		 *
		 * @property writeBuffer
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.writeBuffer = this.renderTarget1;

		/**
		 * The read buffer. Alias for renderTarget2.
		 *
		 * @property readBuffer
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.readBuffer = this.renderTarget2;

		/**
		 * The render passes.
		 *
		 * @property passes
		 * @type Array
		 * @private
		 */

		this.passes = [];

		/**
		 * A copy pass.
		 *
		 * @property copyPass
		 * @type ShaderPass
		 * @private
		 */

		this.copyPass = new ShaderPass(new CopyMaterial());

	}

	/**
	 * Swaps the render targets on demand.
	 * You can toggle swapping in your pass 
	 * by setting the needsSwap flag.
	 *
	 * @method swapBuffers
	 * @private
	 */

	EffectComposer.prototype.swapBuffers = function() {

		var tmp = this.readBuffer;
		this.readBuffer = this.writeBuffer;
		this.writeBuffer = tmp;

	};

	/**
	 * Adds another pass.
	 *
	 * @method addPass
	 * @param {Pass} pass - A new pass.
	 */

	EffectComposer.prototype.addPass = function(pass) {

		this.passes.push(pass);
		pass.updateRenderSize(this.renderTarget1.width, this.renderTarget1.height);

	};

	/**
	 * Inserts a new pass at a specific index.
	 *
	 * @method insertPass
	 * @param {Pass} pass - The pass.
	 * @param {Number} index - The index.
	 */

	EffectComposer.prototype.insertPass = function(pass, index) {

		this.passes.splice(index, 0, pass);
		pass.updateRenderSize(this.renderTarget1.width, this.renderTarget1.height);

	};

	/**
	 * Renders all passes in order.
	 *
	 * @method render
	 * @param {Number} delta - The delta time between the last frame and the current one.
	 */

	EffectComposer.prototype.render = function(delta) {

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		var maskActive = false;
		var i, l, pass, context;

		for(i = 0, l = this.passes.length; i < l; ++i) {

			pass = this.passes[i];

			if(pass.enabled) {

				pass.render(this.renderer, this.writeBuffer, this.readBuffer, delta, maskActive);

				if(pass.needsSwap) {

					if(maskActive) {

						context = this.renderer.context;
						context.stencilFunc(context.NOTEQUAL, 1, 0xffffffff);
						this.copyPass.render(this.renderer, this.writeBuffer, this.readBuffer, delta);
						context.stencilFunc(context.EQUAL, 1, 0xffffffff);

					}

					this.swapBuffers();

				}

				if(pass instanceof MaskPass) {

					maskActive = true;

				} else if(pass instanceof ClearMaskPass) {

					maskActive = false;

				}

			}

		}

	};

	/**
	 * Resets the composer's render textures.
	 * Call this method when the size of the renderer's canvas changed or
	 * if you want to drop the old read/write buffers and create new ones.
	 *
	 * @method reset
	 * @param {WebGLRenderTarget} [renderTarget] - A new render target to use.
	 */

	EffectComposer.prototype.reset = function(renderTarget) {

		var pixelRatio, w, h;

		var i, l;

		if(renderTarget === undefined) {

			renderTarget = this.renderTarget1.clone();

			pixelRatio = this.renderer.getPixelRatio();

			renderTarget.width = Math.floor(this.renderer.context.canvas.width / pixelRatio);
			renderTarget.height = Math.floor(this.renderer.context.canvas.height / pixelRatio);

		}

		w = renderTarget.width;
		h = renderTarget.height;

		this.renderTarget1.dispose();
		this.renderTarget1 = renderTarget;
		this.renderTarget2.dispose();
		this.renderTarget2 = renderTarget.clone();

		this.writeBuffer = this.renderTarget1;
		this.readBuffer = this.renderTarget2;

		// Let all passes adjust to the render size.
		for(i = 0, l = this.passes.length; i < l; ++i) {

			this.passes[i].updateRenderSize(w, h);

		}

	};

	/**
	 * Sets the render size.
	 *
	 * @method setSize
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	EffectComposer.prototype.setSize = function(width, height) {

		this.renderTarget1.setSize(width, height);
		this.renderTarget2.setSize(width, height);

	};

	exports.EffectComposer = EffectComposer;
	exports.Pass = Pass;
	exports.SavePass = SavePass;
	exports.MaskPass = MaskPass;
	exports.ClearMaskPass = ClearMaskPass;
	exports.ShaderPass = ShaderPass;
	exports.RenderPass = RenderPass;
	exports.TexturePass = TexturePass;
	exports.AdaptiveToneMappingPass = AdaptiveToneMappingPass;
	exports.DotScreenPass = DotScreenPass;
	exports.GlitchPass = GlitchPass;
	exports.BloomPass = BloomPass;
	exports.BokehPass = BokehPass;
	exports.FilmPass = FilmPass;
	exports.GodRaysPass = GodRaysPass;
	exports.CopyMaterial = CopyMaterial;
	exports.LuminosityMaterial = LuminosityMaterial;
	exports.AdaptiveLuminosityMaterial = AdaptiveLuminosityMaterial;
	exports.ToneMappingMaterial = ToneMappingMaterial;
	exports.DotScreenMaterial = DotScreenMaterial;
	exports.GlitchMaterial = GlitchMaterial;
	exports.ConvolutionMaterial = ConvolutionMaterial;
	exports.BokehMaterial = BokehMaterial;
	exports.FilmMaterial = FilmMaterial;
	exports.GodRaysMaterial = GodRaysMaterial;

}));