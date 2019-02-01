/**
 * postprocessing v5.6.0 build Fri Feb 01 2019
 * https://github.com/vanruesc/postprocessing
 * Copyright 2019 Raoul van Rüschen, Zlib
 */
import { ShaderMaterial, Uniform, Vector2, PerspectiveCamera, Scene, OrthographicCamera, Mesh, PlaneBufferGeometry, WebGLRenderTarget, LinearFilter, RGBFormat, Color, MeshDepthMaterial, RGBADepthPacking, MeshNormalMaterial, DepthTexture, DepthStencilFormat, UnsignedInt248Type, RGBAFormat, RepeatWrapping, NearestFilter, DataTexture, FloatType, Vector3, MeshBasicMaterial, Vector4, Texture, Matrix4, LinearMipMapLinearFilter, Box2 } from 'three';

/**
 * The Disposable contract.
 *
 * Implemented by objects that can free internal resources.
 *
 * @interface
 */

class Disposable {

	/**
	 * Frees internal resources.
	 */

	dispose() {}

}

/**
 * The initializable contract.
 *
 * Implemented by objects that can be initialized.
 *
 * @interface
 */

class Initializable {

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - A renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel.
	 */

	initialize(renderer, alpha) {}

}

var fragment = "uniform sampler2D previousLuminanceBuffer;\r\nuniform sampler2D currentLuminanceBuffer;\r\nuniform float minLuminance;\r\nuniform float delta;\r\nuniform float tau;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n\r\n\tfloat previousLuminance = texture2D(previousLuminanceBuffer, vUv, MIP_LEVEL_1X1).r;\r\n\tfloat currentLuminance = texture2D(currentLuminanceBuffer, vUv, MIP_LEVEL_1X1).r;\r\n\r\n\tpreviousLuminance = max(minLuminance, previousLuminance);\r\n\tcurrentLuminance = max(minLuminance, currentLuminance);\r\n\r\n\t// Adapt the luminance using Pattanaik's technique.\r\n\tfloat adaptedLum = previousLuminance + (currentLuminance - previousLuminance) * (1.0 - exp(-delta * tau));\r\n\r\n\tgl_FragColor.r = adaptedLum;\r\n\r\n}\r\n";

var vertex = "varying vec2 vUv;\r\n\r\nvoid main() {\r\n\r\n\tvUv = uv;\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * An adaptive luminance shader material.
 */

class AdaptiveLuminanceMaterial extends ShaderMaterial {

	/**
	 * Constructs a new adaptive luminance material.
	 */

	constructor() {

		super({

			type: "AdaptiveLuminanceMaterial",

			defines: {

				MIP_LEVEL_1X1: "0.0"

			},

			uniforms: {

				previousLuminanceBuffer: new Uniform(null),
				currentLuminanceBuffer: new Uniform(null),
				minLuminance: new Uniform(0.01),
				delta: new Uniform(0.0),
				tau: new Uniform(1.0)

			},

			fragmentShader: fragment,
			vertexShader: vertex,

			depthWrite: false,
			depthTest: false

		});

	}

}

var fragment$1 = "uniform sampler2D inputBuffer;\r\n\r\nvarying vec2 vUv;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\nvarying vec2 vUv4;\r\nvarying vec2 vUv5;\r\n\r\nvoid main() {\r\n\r\n\tconst vec2 threshold = vec2(EDGE_THRESHOLD);\r\n\r\n\t// Calculate color deltas.\r\n\tvec4 delta;\r\n\tvec3 c = texture2D(inputBuffer, vUv).rgb;\r\n\r\n\tvec3 cLeft = texture2D(inputBuffer, vUv0).rgb;\r\n\tvec3 t = abs(c - cLeft);\r\n\tdelta.x = max(max(t.r, t.g), t.b);\r\n\r\n\tvec3 cTop = texture2D(inputBuffer, vUv1).rgb;\r\n\tt = abs(c - cTop);\r\n\tdelta.y = max(max(t.r, t.g), t.b);\r\n\r\n\t// Use a threshold to detect significant color edges.\r\n\tvec2 edges = step(threshold, delta.xy);\r\n\r\n\t// Discard if there is no edge.\r\n\tif(dot(edges, vec2(1.0)) == 0.0) {\r\n\r\n\t\tdiscard;\r\n\r\n\t}\r\n\r\n\t// Calculate right and bottom deltas.\r\n\tvec3 cRight = texture2D(inputBuffer, vUv2).rgb;\r\n\tt = abs(c - cRight);\r\n\tdelta.z = max(max(t.r, t.g), t.b);\r\n\r\n\tvec3 cBottom = texture2D(inputBuffer, vUv3).rgb;\r\n\tt = abs(c - cBottom);\r\n\tdelta.w = max(max(t.r, t.g), t.b);\r\n\r\n\t// Calculate the maximum delta in the direct neighborhood.\r\n\tfloat maxDelta = max(max(max(delta.x, delta.y), delta.z), delta.w);\r\n\r\n\t// Calculate left-left and top-top deltas.\r\n\tvec3 cLeftLeft = texture2D(inputBuffer, vUv4).rgb;\r\n\tt = abs(c - cLeftLeft);\r\n\tdelta.z = max(max(t.r, t.g), t.b);\r\n\r\n\tvec3 cTopTop = texture2D(inputBuffer, vUv5).rgb;\r\n\tt = abs(c - cTopTop);\r\n\tdelta.w = max(max(t.r, t.g), t.b);\r\n\r\n\t// Calculate the final maximum delta.\r\n\tmaxDelta = max(max(maxDelta, delta.z), delta.w);\r\n\r\n\t// Local contrast adaptation.\r\n\tedges *= step(0.5 * maxDelta, delta.xy);\r\n\r\n\tgl_FragColor = vec4(edges, 0.0, 0.0);\r\n\r\n}\r\n";

var vertex$1 = "uniform vec2 texelSize;\r\n\r\nvarying vec2 vUv;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\nvarying vec2 vUv4;\r\nvarying vec2 vUv5;\r\n\r\nvoid main() {\r\n\r\n\tvUv = uv;\r\n\r\n\t// Left and top texel coordinates.\r\n\tvUv0 = uv + texelSize * vec2(-1.0, 0.0);\r\n\tvUv1 = uv + texelSize * vec2(0.0, 1.0);\r\n\r\n\t// Right and bottom texel coordinates.\r\n\tvUv2 = uv + texelSize * vec2(1.0, 0.0);\r\n\tvUv3 = uv + texelSize * vec2(0.0, -1.0);\r\n\r\n\t// Left-left and top-top texel coordinates.\r\n\tvUv4 = uv + texelSize * vec2(-2.0, 0.0);\r\n\tvUv5 = uv + texelSize * vec2(0.0, 2.0);\r\n\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * A material that detects edges in a color texture.
 *
 * Mainly used for Subpixel Morphological Antialiasing.
 */

class ColorEdgesMaterial extends ShaderMaterial {

	/**
	 * Constructs a new color edges material.
	 *
	 * @param {Vector2} [texelSize] - The absolute screen texel size.
	 */

	constructor(texelSize = new Vector2()) {

		super({

			type: "ColorEdgesMaterial",

			defines: {

				EDGE_THRESHOLD: "0.1"

			},

			uniforms: {

				inputBuffer: new Uniform(null),
				texelSize: new Uniform(texelSize)

			},

			fragmentShader: fragment$1,
			vertexShader: vertex$1,

			depthWrite: false,
			depthTest: false

		});

	}

	/**
	 * Sets the edge detection sensitivity.
	 *
	 * A lower value results in more edges being detected at the expense of
	 * performance.
	 *
	 * 0.1 is a reasonable value, and allows to catch most visible edges.
	 * 0.05 is a rather overkill value, that allows to catch 'em all.
	 *
	 * If temporal supersampling is used, 0.2 could be a reasonable value,
	 * as low contrast edges are properly filtered by just 2x.
	 *
	 * @param {Number} threshold - The edge detection sensitivity. Range: [0.05, 0.5].
	 */

	setEdgeDetectionThreshold(threshold) {

		this.defines.EDGE_THRESHOLD = threshold.toFixed("2");
		this.needsUpdate = true;

	}

}

var fragment$2 = "#include <common>\r\n#include <dithering_pars_fragment>\r\n\r\nuniform sampler2D inputBuffer;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\n\r\nvoid main() {\r\n\r\n\t// Sample top left texel.\r\n\tvec4 sum = texture2D(inputBuffer, vUv0);\r\n\r\n\t// Sample top right texel.\r\n\tsum += texture2D(inputBuffer, vUv1);\r\n\r\n\t// Sample bottom right texel.\r\n\tsum += texture2D(inputBuffer, vUv2);\r\n\r\n\t// Sample bottom left texel.\r\n\tsum += texture2D(inputBuffer, vUv3);\r\n\r\n\t// Compute the average.\r\n\tgl_FragColor = sum * 0.25;\r\n\r\n\t#include <dithering_fragment>\r\n\r\n}\r\n";

var vertex$2 = "uniform vec2 texelSize;\r\nuniform vec2 halfTexelSize;\r\nuniform float kernel;\r\n\r\n/* Packing multiple texture coordinates into one varying and using a swizzle to\r\nextract them in the fragment shader still causes a dependent texture read. */\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\n\r\nvoid main() {\r\n\r\n\tvec2 dUv = (texelSize * vec2(kernel)) + halfTexelSize;\r\n\r\n\tvUv0 = vec2(uv.x - dUv.x, uv.y + dUv.y);\r\n\tvUv1 = vec2(uv.x + dUv.x, uv.y + dUv.y);\r\n\tvUv2 = vec2(uv.x + dUv.x, uv.y - dUv.y);\r\n\tvUv3 = vec2(uv.x - dUv.x, uv.y - dUv.y);\r\n\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * An optimised convolution shader material.
 *
 * This material supports dithering.
 *
 * Based on the GDC2003 Presentation by Masaki Kawase, Bunkasha Games:
 *  Frame Buffer Postprocessing Effects in DOUBLE-S.T.E.A.L (Wreckless)
 * and an article by Filip Strugar, Intel:
 *  An investigation of fast real-time GPU-based image blur algorithms
 *
 * Further modified according to Apple's
 * [Best Practices for Shaders](https://goo.gl/lmRoM5).
 */

class ConvolutionMaterial extends ShaderMaterial {

	/**
	 * Constructs a new convolution material.
	 *
	 * @param {Vector2} [texelSize] - The absolute screen texel size.
	 */

	constructor(texelSize = new Vector2()) {

		super({

			type: "ConvolutionMaterial",

			uniforms: {

				inputBuffer: new Uniform(null),
				texelSize: new Uniform(new Vector2()),
				halfTexelSize: new Uniform(new Vector2()),
				kernel: new Uniform(0.0)

			},

			fragmentShader: fragment$2,
			vertexShader: vertex$2,

			depthWrite: false,
			depthTest: false

		});

		this.setTexelSize(texelSize.x, texelSize.y);

		/**
		 * The current kernel size.
		 *
		 * @type {KernelSize}
		 */

		this.kernelSize = KernelSize.LARGE;

	}

	/**
	 * Returns the kernel.
	 *
	 * @return {Float32Array} The kernel.
	 */

	getKernel() {

		return kernelPresets[this.kernelSize];

	}

	/**
	 * Sets the texel size.
	 *
	 * @param {Number} x - The texel width.
	 * @param {Number} y - The texel height.
	 */

	setTexelSize(x, y) {

		this.uniforms.texelSize.value.set(x, y);
		this.uniforms.halfTexelSize.value.set(x, y).multiplyScalar(0.5);

	}

}

/**
 * The Kawase blur kernel presets.
 *
 * @type {Float32Array[]}
 * @private
 */

const kernelPresets = [
	new Float32Array([0.0, 0.0]),
	new Float32Array([0.0, 1.0, 1.0]),
	new Float32Array([0.0, 1.0, 1.0, 2.0]),
	new Float32Array([0.0, 1.0, 2.0, 2.0, 3.0]),
	new Float32Array([0.0, 1.0, 2.0, 3.0, 4.0, 4.0, 5.0]),
	new Float32Array([0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 7.0, 8.0, 9.0, 10.0])
];

/**
 * A kernel size enumeration.
 *
 * @type {Object}
 * @property {Number} VERY_SMALL - A very small kernel that matches a 7x7 Gauss blur kernel.
 * @property {Number} SMALL - A small kernel that matches a 15x15 Gauss blur kernel.
 * @property {Number} MEDIUM - A medium sized kernel that matches a 23x23 Gauss blur kernel.
 * @property {Number} LARGE - A large kernel that matches a 35x35 Gauss blur kernel.
 * @property {Number} VERY_LARGE - A very large kernel that matches a 63x63 Gauss blur kernel.
 * @property {Number} HUGE - A huge kernel that matches a 127x127 Gauss blur kernel.
 */

const KernelSize = {

	VERY_SMALL: 0,
	SMALL: 1,
	MEDIUM: 2,
	LARGE: 3,
	VERY_LARGE: 4,
	HUGE: 5

};

var fragment$3 = "uniform sampler2D inputBuffer;\r\nuniform float opacity;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n\r\n\tvec4 texel = texture2D(inputBuffer, vUv);\r\n\tgl_FragColor = opacity * texel;\r\n\r\n}\r\n";

/**
 * A simple copy shader material.
 */

class CopyMaterial extends ShaderMaterial {

	/**
	 * Constructs a new copy material.
	 */

	constructor() {

		super({

			type: "CopyMaterial",

			uniforms: {

				inputBuffer: new Uniform(null),
				opacity: new Uniform(1.0)

			},

			fragmentShader: fragment$3,
			vertexShader: vertex,

			depthWrite: false,
			depthTest: false

		});

	}

}

var fragment$4 = "#include <packing>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nuniform sampler2D depthBuffer;\r\nuniform float cameraNear;\r\nuniform float cameraFar;\r\n\r\nvarying float vViewZ;\r\nvarying vec4 vProjTexCoord;\r\n\r\nvoid main() {\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\t// Transform into Cartesian coordinate (not mirrored).\r\n\tvec2 projTexCoord = (vProjTexCoord.xy / vProjTexCoord.w) * 0.5 + 0.5;\r\n\tprojTexCoord = clamp(projTexCoord, 0.002, 0.998);\r\n\r\n\tfloat fragCoordZ = unpackRGBAToDepth(texture2D(depthBuffer, projTexCoord));\r\n\r\n\t#ifdef PERSPECTIVE_CAMERA\r\n\r\n\t\tfloat viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);\r\n\r\n\t#else\r\n\r\n\t\tfloat viewZ = orthographicDepthToViewZ(fragCoordZ, cameraNear, cameraFar);\r\n\r\n\t#endif\r\n\r\n\tfloat depthTest = (-vViewZ > -viewZ) ? 1.0 : 0.0;\r\n\r\n\tgl_FragColor.rg = vec2(0.0, depthTest);\r\n\r\n}\r\n";

var vertex$3 = "#include <common>\r\n#include <morphtarget_pars_vertex>\r\n#include <skinning_pars_vertex>\r\n#include <clipping_planes_pars_vertex>\r\n\r\nvarying float vViewZ;\r\nvarying vec4 vProjTexCoord;\r\n\r\nvoid main() {\r\n\r\n\t#include <skinbase_vertex>\r\n\r\n\t#include <begin_vertex>\r\n\t#include <morphtarget_vertex>\r\n\t#include <skinning_vertex>\r\n\t#include <project_vertex>\r\n\r\n\tvViewZ = mvPosition.z;\r\n\tvProjTexCoord = gl_Position;\r\n\r\n\t#include <clipping_planes_vertex>\r\n\r\n}\r\n";

/**
 * A depth comparison shader material.
 */

class DepthComparisonMaterial extends ShaderMaterial {

	/**
	 * Constructs a new depth comparison material.
	 *
	 * @param {Texture} [depthTexture=null] - A depth texture.
	 * @param {PerspectiveCamera} [camera] - A camera.
	 */

	constructor(depthTexture = null, camera) {

		super({

			type: "DepthComparisonMaterial",

			uniforms: {

				depthBuffer: new Uniform(depthTexture),
				cameraNear: new Uniform(0.3),
				cameraFar: new Uniform(1000)

			},

			fragmentShader: fragment$4,
			vertexShader: vertex$3,

			depthWrite: false,
			depthTest: false,

			morphTargets: true,
			skinning: true

		});

		this.adoptCameraSettings(camera);

	}

	/**
	 * Adopts the settings of the given camera.
	 *
	 * @param {Camera} [camera=null] - A camera.
	 */

	adoptCameraSettings(camera = null) {

		if(camera !== null) {

			this.uniforms.cameraNear.value = camera.near;
			this.uniforms.cameraFar.value = camera.far;

			if(camera instanceof PerspectiveCamera) {

				this.defines.PERSPECTIVE_CAMERA = "1";

			} else {

				delete this.defines.PERSPECTIVE_CAMERA;

			}

		}

	}

}

var fragmentTemplate = "#include <common>\r\n#include <packing>\r\n#include <dithering_pars_fragment>\r\n\r\nuniform sampler2D inputBuffer;\r\nuniform sampler2D depthBuffer;\r\n\r\nuniform vec2 resolution;\r\nuniform vec2 texelSize;\r\n\r\nuniform float cameraNear;\r\nuniform float cameraFar;\r\nuniform float aspect;\r\nuniform float time;\r\n\r\nvarying vec2 vUv;\r\n\r\nfloat readDepth(const in vec2 uv) {\r\n\r\n\t#if DEPTH_PACKING == 3201\r\n\r\n\t\treturn unpackRGBAToDepth(texture2D(depthBuffer, uv));\r\n\r\n\t#else\r\n\r\n\t\treturn texture2D(depthBuffer, uv).r;\r\n\r\n\t#endif\r\n\r\n}\r\n\r\nFRAGMENT_HEAD\r\n\r\nvoid main() {\r\n\r\n\tFRAGMENT_MAIN_UV\r\n\r\n\tvec4 color0 = texture2D(inputBuffer, UV);\r\n\tvec4 color1 = vec4(0.0);\r\n\r\n\tFRAGMENT_MAIN_IMAGE\r\n\r\n\tgl_FragColor = color0;\r\n\r\n\t#include <dithering_fragment>\r\n\r\n}\r\n";

var vertexTemplate = "uniform vec2 resolution;\r\nuniform vec2 texelSize;\r\n\r\nuniform float cameraNear;\r\nuniform float cameraFar;\r\nuniform float aspect;\r\nuniform float time;\r\n\r\nvarying vec2 vUv;\r\n\r\nVERTEX_HEAD\r\n\r\nvoid main() {\r\n\r\n\tvUv = uv;\r\n\r\n\tVERTEX_MAIN_SUPPORT\r\n\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * An effect material for compound shaders.
 *
 * This material supports dithering.
 *
 * @implements {Resizable}
 */

class EffectMaterial extends ShaderMaterial {

	/**
	 * Constructs a new effect material.
	 *
	 * @param {Map<String, String>} shaderParts - A collection of shader snippets.
	 * @param {Map<String, String>} defines - A collection of preprocessor macro definitions.
	 * @param {Map<String, Uniform>} uniforms - A collection of uniforms.
	 * @param {Camera} [camera=null] - A camera.
	 * @param {Boolean} [dithering=false] - Whether dithering should be enabled.
	 */

	constructor(shaderParts, defines, uniforms, camera = null, dithering = false) {

		super({

			type: "EffectMaterial",

			defines: {

				DEPTH_PACKING: "0"

			},

			uniforms: {

				inputBuffer: new Uniform(null),
				depthBuffer: new Uniform(null),

				resolution: new Uniform(new Vector2()),
				texelSize: new Uniform(new Vector2()),

				cameraNear: new Uniform(0.3),
				cameraFar: new Uniform(1000.0),
				aspect: new Uniform(1.0),
				time: new Uniform(0.0)

			},

			fragmentShader: fragmentTemplate.replace(Section.FRAGMENT_HEAD, shaderParts.get(Section.FRAGMENT_HEAD))
				.replace(Section.FRAGMENT_MAIN_UV, shaderParts.get(Section.FRAGMENT_MAIN_UV))
				.replace(Section.FRAGMENT_MAIN_IMAGE, shaderParts.get(Section.FRAGMENT_MAIN_IMAGE)),

			vertexShader: vertexTemplate.replace(Section.VERTEX_HEAD, shaderParts.get(Section.VERTEX_HEAD))
				.replace(Section.VERTEX_MAIN_SUPPORT, shaderParts.get(Section.VERTEX_MAIN_SUPPORT)),

			dithering: dithering,
			depthWrite: false,
			depthTest: false

		});

		if(defines !== null) {

			for(const entry of defines.entries()) {

				this.defines[entry[0]] = entry[1];

			}

		}

		if(uniforms !== null) {

			for(const entry of uniforms.entries()) {

				this.uniforms[entry[0]] = entry[1];

			}

		}

		this.adoptCameraSettings(camera);

	}

	/**
	 * The current depth packing.
	 *
	 * @type {Number}
	 */

	get depthPacking() {

		return Number.parseInt(this.defines.DEPTH_PACKING);

	}

	/**
	 * Sets the depth packing.
	 *
	 * Use `BasicDepthPacking` or `RGBADepthPacking` if your depth texture
	 * contains packed depth.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set depthPacking(value) {

		this.defines.DEPTH_PACKING = value.toFixed(0);

	}

	/**
	 * Sets the resolution.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		width = Math.max(width, 1.0);
		height = Math.max(height, 1.0);

		this.uniforms.resolution.value.set(width, height);
		this.uniforms.texelSize.value.set(1.0 / width, 1.0 / height);
		this.uniforms.aspect.value = width / height;

	}

	/**
	 * Adopts the settings of the given camera.
	 *
	 * @param {Camera} [camera=null] - A camera.
	 */

	adoptCameraSettings(camera = null) {

		if(camera !== null) {

			this.uniforms.cameraNear.value = camera.near;
			this.uniforms.cameraFar.value = camera.far;

			if(camera instanceof PerspectiveCamera) {

				this.defines.PERSPECTIVE_CAMERA = "1";

			} else {

				delete this.defines.PERSPECTIVE_CAMERA;

			}

		}

	}

}

/**
 * An enumeration of shader code placeholders.
 *
 * @type {Object}
 * @property {String} FRAGMENT_HEAD - A placeholder for function and variable declarations inside the fragment shader.
 * @property {String} FRAGMENT_MAIN_UV - A placeholder for UV transformations inside the fragment shader.
 * @property {String} FRAGMENT_MAIN_IMAGE - A placeholder for color calculations inside the fragment shader.
 * @property {String} VERTEX_HEAD - A placeholder for function and variable declarations inside the vertex shader.
 * @property {String} VERTEX_MAIN_SUPPORT - A placeholder for supporting calculations inside the vertex shader.
 */

const Section = {

	FRAGMENT_HEAD: "FRAGMENT_HEAD",
	FRAGMENT_MAIN_UV: "FRAGMENT_MAIN_UV",
	FRAGMENT_MAIN_IMAGE: "FRAGMENT_MAIN_IMAGE",
	VERTEX_HEAD: "VERTEX_HEAD",
	VERTEX_MAIN_SUPPORT: "VERTEX_MAIN_SUPPORT"

};

var fragment$5 = "#include <common>\r\n#include <dithering_pars_fragment>\r\n\r\nuniform sampler2D inputBuffer;\r\nuniform vec2 lightPosition;\r\nuniform float exposure;\r\nuniform float decay;\r\nuniform float density;\r\nuniform float weight;\r\nuniform float clampMax;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n\r\n\tvec2 coord = vUv;\r\n\r\n\t// Calculate the vector from this pixel to the light position in screen space.\r\n\tvec2 delta = coord - lightPosition;\r\n\tdelta *= 1.0 / SAMPLES_FLOAT * density;\r\n\r\n\t// A decreasing illumination factor.\r\n\tfloat illuminationDecay = 1.0;\r\n\r\n\tvec4 sample;\r\n\tvec4 color = vec4(0.0);\r\n\r\n\t/* Estimate the probability of occlusion at each pixel by summing samples\r\n\talong a ray to the light position. */\r\n\tfor(int i = 0; i < SAMPLES_INT; ++i) {\r\n\r\n\t\tcoord -= delta;\r\n\t\tsample = texture2D(inputBuffer, coord);\r\n\r\n\t\t// Apply the sample attenuation scale/decay factors.\r\n\t\tsample *= illuminationDecay * weight;\r\n\t\tcolor += sample;\r\n\r\n\t\t// Update the exponential decay factor.\r\n\t\tilluminationDecay *= decay;\r\n\r\n\t}\r\n\r\n\tgl_FragColor = clamp(color * exposure, 0.0, clampMax);\r\n\r\n\t#include <dithering_fragment>\r\n\r\n}\r\n";

/**
 * A crepuscular rays shader material.
 *
 * This material supports dithering.
 *
 * References:
 *
 * Thibaut Despoulain, 2012:
 *  [(WebGL) Volumetric Light Approximation in Three.js](
 *  http://bkcore.com/blog/3d/webgl-three-js-volumetric-light-godrays.html)
 *
 * Nvidia, GPU Gems 3, 2008:
 *  [Chapter 13. Volumetric Light Scattering as a Post-Process](
 *  https://developer.nvidia.com/gpugems/GPUGems3/gpugems3_ch13.html)
 */

class GodRaysMaterial extends ShaderMaterial {

	/**
	 * Constructs a new god rays material.
	 *
	 * @param {Vector2} [lightPosition] - The light position in screen space.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.density=0.96] - The density of the light rays.
	 * @param {Number} [options.decay=0.93] - An illumination decay factor.
	 * @param {Number} [options.weight=0.4] - A light ray weight factor.
	 * @param {Number} [options.exposure=0.6] - A constant attenuation coefficient.
	 * @param {Number} [options.clampMax=1.0] - An upper bound for the saturation of the overall effect.
	 */

	constructor(lightPosition = new Vector2(), options = {}) {

		const settings = Object.assign({
			exposure: 0.6,
			density: 0.93,
			decay: 0.96,
			weight: 0.4,
			clampMax: 1.0
		}, options);

		super({

			type: "GodRaysMaterial",

			defines: {

				SAMPLES_INT: "60",
				SAMPLES_FLOAT: "60.0"

			},

			uniforms: {

				inputBuffer: new Uniform(null),
				lightPosition: new Uniform(lightPosition),

				exposure: new Uniform(settings.exposure),
				decay: new Uniform(settings.decay),
				density: new Uniform(settings.density),
				weight: new Uniform(settings.weight),
				clampMax: new Uniform(settings.clampMax)

			},

			fragmentShader: fragment$5,
			vertexShader: vertex,

			depthWrite: false,
			depthTest: false

		});

	}

	/**
	 * The amount of samples per pixel.
	 *
	 * @type {Number}
	 */

	get samples() {

		return Number.parseInt(this.defines.SAMPLES_INT);

	}

	/**
	 * Sets the amount of samples per pixel.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		value = Math.floor(value);

		this.defines.SAMPLES_INT = value.toFixed(0);
		this.defines.SAMPLES_FLOAT = value.toFixed(1);
		this.needsUpdate = true;

	}

}

var fragment$6 = "#include <common>\r\n\r\nuniform sampler2D inputBuffer;\r\nuniform float distinction;\r\nuniform vec2 range;\r\n\r\nvarying vec2 vUv;\r\n\r\nvoid main() {\r\n\r\n\tvec4 texel = texture2D(inputBuffer, vUv);\r\n\tfloat l = linearToRelativeLuminance(texel.rgb);\r\n\r\n\t#ifdef RANGE\r\n\r\n\t\tfloat low = step(range.x, l);\r\n\t\tfloat high = step(l, range.y);\r\n\r\n\t\t// Apply the mask.\r\n\t\tl *= low * high;\r\n\r\n\t#endif\r\n\r\n\tl = pow(abs(l), distinction);\r\n\r\n\t#ifdef COLOR\r\n\r\n\t\tgl_FragColor = vec4(texel.rgb * l, texel.a);\r\n\r\n\t#else\r\n\r\n\t\tgl_FragColor = vec4(l, l, l, texel.a);\r\n\r\n\t#endif\r\n\r\n}\r\n";

/**
 * A luminance shader material.
 *
 * This shader produces a greyscale luminance map that describes the absolute
 * amount of light emitted by a scene. It can also be configured to output
 * colours that are scaled with their respective luminance value. Additionally,
 * a range may be provided to mask out undesired texels.
 *
 * The alpha channel will remain unaffected in all cases.
 *
 * On luminance coefficients:
 *  http://www.poynton.com/notes/colour_and_gamma/ColorFAQ.html#RTFToC9
 *
 * Coefficients for different colour spaces:
 *  https://hsto.org/getpro/habr/post_images/2ab/69d/084/2ab69d084f9a597e032624bcd74d57a7.png
 *
 * Luminance range reference:
 *  https://cycling74.com/2007/05/23/your-first-shader/#.Vty9FfkrL4Z
 */

class LuminanceMaterial extends ShaderMaterial {

	/**
	 * Constructs a new luminance material.
	 *
	 * @param {Boolean} [colorOutput=false] - Defines whether the shader should output colours scaled with their luminance value.
	 * @param {Vector2} [luminanceRange] - If provided, the shader will mask out texels that aren't in the specified luminance range.
	 */

	constructor(colorOutput = false, luminanceRange = null) {

		const maskLuminance = (luminanceRange !== null);

		super({

			type: "LuminanceMaterial",

			uniforms: {

				inputBuffer: new Uniform(null),
				distinction: new Uniform(1.0),
				range: new Uniform(maskLuminance ? luminanceRange : new Vector2())

			},

			fragmentShader: fragment$6,
			vertexShader: vertex

		});

		this.setColorOutputEnabled(colorOutput);
		this.setLuminanceRangeEnabled(maskLuminance);

	}

	/**
	 * Enables or disables color output.
	 *
	 * @param {Boolean} enabled - Whether color output should be enabled.
	 */

	setColorOutputEnabled(enabled) {

		if(enabled) {

			this.defines.COLOR = "1";

		} else {

			delete this.defines.COLOR;

		}

		this.needsUpdate = true;

	}

	/**
	 * Enables or disables the luminance mask.
	 *
	 * @param {Boolean} enabled - Whether the luminance mask should be enabled.
	 */

	setLuminanceRangeEnabled(enabled) {

		if(enabled) {

			this.defines.RANGE = "1";

		} else {

			delete this.defines.RANGE;

		}

		this.needsUpdate = true;

	}

}

var fragment$7 = "uniform sampler2D maskTexture;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\n\r\nvoid main() {\r\n\r\n\tvec2 c0 = texture2D(maskTexture, vUv0).rg;\r\n\tvec2 c1 = texture2D(maskTexture, vUv1).rg;\r\n\tvec2 c2 = texture2D(maskTexture, vUv2).rg;\r\n\tvec2 c3 = texture2D(maskTexture, vUv3).rg;\r\n\r\n\tfloat d0 = (c0.x - c1.x) * 0.5;\r\n\tfloat d1 = (c2.x - c3.x) * 0.5;\r\n\tfloat d = length(vec2(d0, d1));\r\n\r\n\tfloat a0 = min(c0.y, c1.y);\r\n\tfloat a1 = min(c2.y, c3.y);\r\n\tfloat visibilityFactor = min(a0, a1);\r\n\r\n\tgl_FragColor.rg = (1.0 - visibilityFactor > 0.001) ? vec2(d, 0.0) : vec2(0.0, d);\r\n\r\n}\r\n";

var vertex$4 = "uniform vec2 texelSize;\r\n\r\nvarying vec2 vUv0;\r\nvarying vec2 vUv1;\r\nvarying vec2 vUv2;\r\nvarying vec2 vUv3;\r\n\r\nvoid main() {\r\n\r\n\tvUv0 = vec2(uv.x + texelSize.x, uv.y);\r\n\tvUv1 = vec2(uv.x - texelSize.x, uv.y);\r\n\tvUv2 = vec2(uv.x, uv.y + texelSize.y);\r\n\tvUv3 = vec2(uv.x, uv.y - texelSize.y);\r\n\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * An outline edge detection shader material.
 */

class OutlineEdgesMaterial extends ShaderMaterial {

	/**
	 * Constructs a new outline edge detection material.
	 *
	 * @param {Vector2} [texelSize] - The absolute screen texel size.
	 */

	constructor(texelSize = new Vector2()) {

		super({

			type: "OutlineEdgesMaterial",

			uniforms: {

				maskTexture: new Uniform(null),
				texelSize: new Uniform(new Vector2())

			},

			fragmentShader: fragment$7,
			vertexShader: vertex$4,

			depthWrite: false,
			depthTest: false

		});

		this.setTexelSize(texelSize.x, texelSize.y);

	}

	/**
	 * Sets the texel size.
	 *
	 * @param {Number} x - The texel width.
	 * @param {Number} y - The texel height.
	 */

	setTexelSize(x, y) {

		this.uniforms.texelSize.value.set(x, y);

	}

}

var fragment$8 = "#define sampleLevelZeroOffset(t, coord, offset) texture2D(t, coord + float(offset) * texelSize, 0.0)\r\n\r\nuniform sampler2D inputBuffer;\r\nuniform sampler2D areaTexture;\r\nuniform sampler2D searchTexture;\r\n\r\nuniform vec2 texelSize;\r\n\r\nvarying vec2 vUv;\r\nvarying vec4 vOffset[3];\r\nvarying vec2 vPixCoord;\r\n\r\nvec2 round(vec2 x) {\r\n\r\n\treturn sign(x) * floor(abs(x) + 0.5);\r\n\r\n}\r\n\r\nfloat searchLength(vec2 e, float bias, float scale) {\r\n\r\n\t// Not required if searchTexture accesses are set to point.\r\n\t// const vec2 SEARCH_TEX_PIXEL_SIZE = 1.0 / vec2(66.0, 33.0);\r\n\t// e = vec2(bias, 0.0) + 0.5 * SEARCH_TEX_PIXEL_SIZE + e * vec2(scale, 1.0) * vec2(64.0, 32.0) * SEARCH_TEX_PIXEL_SIZE;\r\n\r\n\te.r = bias + e.r * scale;\r\n\r\n\treturn 255.0 * texture2D(searchTexture, e, 0.0).r;\r\n\r\n}\r\n\r\nfloat searchXLeft(vec2 texCoord, float end) {\r\n\r\n\t/* @PSEUDO_GATHER4\r\n\tThis texCoord has been offset by (-0.25, -0.125) in the vertex shader to\r\n\tsample between edge, thus fetching four edges in a row.\r\n\tSampling with different offsets in each direction allows to disambiguate\r\n\twhich edges are active from the four fetched ones. */\r\n\r\n\tvec2 e = vec2(0.0, 1.0);\r\n\r\n\tfor(int i = 0; i < MAX_SEARCH_STEPS_INT; ++i) {\r\n\r\n\t\te = texture2D(inputBuffer, texCoord, 0.0).rg;\r\n\t\ttexCoord -= vec2(2.0, 0.0) * texelSize;\r\n\r\n\t\tif(!(texCoord.x > end && e.g > 0.8281 && e.r == 0.0)) { break; }\r\n\r\n\t}\r\n\r\n\t// Correct the previously applied offset (-0.25, -0.125).\r\n\ttexCoord.x += 0.25 * texelSize.x;\r\n\r\n\t// The searches are biased by 1, so adjust the coords accordingly.\r\n\ttexCoord.x += texelSize.x;\r\n\r\n\t// Disambiguate the length added by the last step.\r\n\ttexCoord.x += 2.0 * texelSize.x; // Undo last step.\r\n\ttexCoord.x -= texelSize.x * searchLength(e, 0.0, 0.5);\r\n\r\n\treturn texCoord.x;\r\n\r\n}\r\n\r\nfloat searchXRight(vec2 texCoord, float end) {\r\n\r\n\tvec2 e = vec2(0.0, 1.0);\r\n\r\n\tfor(int i = 0; i < MAX_SEARCH_STEPS_INT; ++i) {\r\n\r\n\t\te = texture2D(inputBuffer, texCoord, 0.0).rg;\r\n\t\ttexCoord += vec2(2.0, 0.0) * texelSize;\r\n\r\n\t\tif(!(texCoord.x < end && e.g > 0.8281 && e.r == 0.0)) { break; }\r\n\r\n\t}\r\n\r\n\ttexCoord.x -= 0.25 * texelSize.x;\r\n\ttexCoord.x -= texelSize.x;\r\n\ttexCoord.x -= 2.0 * texelSize.x;\r\n\ttexCoord.x += texelSize.x * searchLength(e, 0.5, 0.5);\r\n\r\n\treturn texCoord.x;\r\n\r\n}\r\n\r\nfloat searchYUp(vec2 texCoord, float end) {\r\n\r\n\tvec2 e = vec2(1.0, 0.0);\r\n\r\n\tfor(int i = 0; i < MAX_SEARCH_STEPS_INT; ++i) {\r\n\r\n\t\te = texture2D(inputBuffer, texCoord, 0.0).rg;\r\n\t\ttexCoord += vec2(0.0, 2.0) * texelSize; // Changed sign.\r\n\r\n\t\tif(!(texCoord.y > end && e.r > 0.8281 && e.g == 0.0)) { break; }\r\n\r\n\t}\r\n\r\n\ttexCoord.y -= 0.25 * texelSize.y; // Changed sign.\r\n\ttexCoord.y -= texelSize.y; // Changed sign.\r\n\ttexCoord.y -= 2.0 * texelSize.y; // Changed sign.\r\n\ttexCoord.y += texelSize.y * searchLength(e.gr, 0.0, 0.5); // Changed sign.\r\n\r\n\treturn texCoord.y;\r\n\r\n}\r\n\r\nfloat searchYDown(vec2 texCoord, float end) {\r\n\r\n\tvec2 e = vec2(1.0, 0.0);\r\n\r\n\tfor(int i = 0; i < MAX_SEARCH_STEPS_INT; ++i ) {\r\n\r\n\t\te = texture2D(inputBuffer, texCoord, 0.0).rg;\r\n\t\ttexCoord -= vec2(0.0, 2.0) * texelSize; // Changed sign.\r\n\r\n\t\tif(!(texCoord.y < end && e.r > 0.8281 && e.g == 0.0)) { break; }\r\n\r\n\t}\r\n\r\n\ttexCoord.y += 0.25 * texelSize.y; // Changed sign.\r\n\ttexCoord.y += texelSize.y; // Changed sign.\r\n\ttexCoord.y += 2.0 * texelSize.y; // Changed sign.\r\n\ttexCoord.y -= texelSize.y * searchLength(e.gr, 0.5, 0.5); // Changed sign.\r\n\r\n\treturn texCoord.y;\r\n\r\n}\r\n\r\nvec2 area(vec2 dist, float e1, float e2, float offset) {\r\n\r\n\t// Rounding prevents precision errors of bilinear filtering.\r\n\tvec2 texCoord = AREATEX_MAX_DISTANCE * round(4.0 * vec2(e1, e2)) + dist;\r\n\r\n\t// Scale and bias for texel space translation.\r\n\ttexCoord = AREATEX_PIXEL_SIZE * texCoord + (0.5 * AREATEX_PIXEL_SIZE);\r\n\r\n\t// Move to proper place, according to the subpixel offset.\r\n\ttexCoord.y += AREATEX_SUBTEX_SIZE * offset;\r\n\r\n\treturn texture2D(areaTexture, texCoord, 0.0).rg;\r\n\r\n}\r\n\r\nvoid main() {\r\n\r\n\tvec4 weights = vec4(0.0);\r\n\tvec4 subsampleIndices = vec4(0.0);\r\n\tvec2 e = texture2D(inputBuffer, vUv).rg;\r\n\r\n\tif(e.g > 0.0) {\r\n\r\n\t\t// Edge at north.\r\n\t\tvec2 d;\r\n\r\n\t\t// Find the distance to the left.\r\n\t\tvec2 coords;\r\n\t\tcoords.x = searchXLeft(vOffset[0].xy, vOffset[2].x);\r\n\t\tcoords.y = vOffset[1].y; // vOffset[1].y = vUv.y - 0.25 * texelSize.y (@CROSSING_OFFSET)\r\n\t\td.x = coords.x;\r\n\r\n\t\t/* Now fetch the left crossing edges, two at a time using bilinear\r\n\t\tfiltering. Sampling at -0.25 (see @CROSSING_OFFSET) enables to discern what\r\n\t\tvalue each edge has. */\r\n\t\tfloat e1 = texture2D(inputBuffer, coords, 0.0).r;\r\n\r\n\t\t// Find the distance to the right.\r\n\t\tcoords.x = searchXRight(vOffset[0].zw, vOffset[2].y);\r\n\t\td.y = coords.x;\r\n\r\n\t\t/* Translate distances to pixel units for better interleave arithmetic and\r\n\t\tmemory accesses. */\r\n\t\td = d / texelSize.x - vPixCoord.x;\r\n\r\n\t\t// The area texture is compressed quadratically.\r\n\t\tvec2 sqrtD = sqrt(abs(d));\r\n\r\n\t\t// Fetch the right crossing edges.\r\n\t\tcoords.y -= texelSize.y; // WebGL port note: Added.\r\n\t\tfloat e2 = sampleLevelZeroOffset(inputBuffer, coords, ivec2(1, 0)).r;\r\n\r\n\t\t// Pattern recognised, now get the actual area.\r\n\t\tweights.rg = area(sqrtD, e1, e2, subsampleIndices.y);\r\n\r\n\t}\r\n\r\n\tif(e.r > 0.0) {\r\n\r\n\t\t// Edge at west.\r\n\t\tvec2 d;\r\n\r\n\t\t// Find the distance to the top.\r\n\t\tvec2 coords;\r\n\t\tcoords.y = searchYUp(vOffset[1].xy, vOffset[2].z);\r\n\t\tcoords.x = vOffset[0].x; // vOffset[1].x = vUv.x - 0.25 * texelSize.x;\r\n\t\td.x = coords.y;\r\n\r\n\t\t// Fetch the top crossing edges.\r\n\t\tfloat e1 = texture2D(inputBuffer, coords, 0.0).g;\r\n\r\n\t\t// Find the distance to the bottom.\r\n\t\tcoords.y = searchYDown(vOffset[1].zw, vOffset[2].w);\r\n\t\td.y = coords.y;\r\n\r\n\t\t// Distances in pixel units.\r\n\t\td = d / texelSize.y - vPixCoord.y;\r\n\r\n\t\t// The area texture is compressed quadratically.\r\n\t\tvec2 sqrtD = sqrt(abs(d));\r\n\r\n\t\t// Fetch the bottom crossing edges.\r\n\t\tcoords.y -= texelSize.y; // WebGL port note: Added.\r\n\t\tfloat e2 = sampleLevelZeroOffset(inputBuffer, coords, ivec2(0, 1)).g;\r\n\r\n\t\t// Get the area for this direction.\r\n\t\tweights.ba = area(sqrtD, e1, e2, subsampleIndices.x);\r\n\r\n\t}\r\n\r\n\tgl_FragColor = weights;\r\n\r\n}\r\n";

var vertex$5 = "uniform vec2 texelSize;\r\n\r\nvarying vec2 vUv;\r\nvarying vec4 vOffset[3];\r\nvarying vec2 vPixCoord;\r\n\r\nvoid main() {\r\n\r\n\tvUv = uv;\r\n\r\n\tvPixCoord = uv / texelSize;\r\n\r\n\t// Offsets for the searches (see @PSEUDO_GATHER4).\r\n\tvOffset[0] = uv.xyxy + texelSize.xyxy * vec4(-0.25, 0.125, 1.25, 0.125); // Changed sign in Y and W components.\r\n\tvOffset[1] = uv.xyxy + texelSize.xyxy * vec4(-0.125, 0.25, -0.125, -1.25); //Changed sign in Y and W components.\r\n\r\n\t// This indicates the ends of the loops.\r\n\tvOffset[2] = vec4(vOffset[0].xz, vOffset[1].yw) + vec4(-2.0, 2.0, -2.0, 2.0) * texelSize.xxyy * MAX_SEARCH_STEPS_FLOAT;\r\n\r\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);\r\n\r\n}\r\n";

/**
 * Subpixel Morphological Antialiasing.
 *
 * This material computes weights for detected edges.
 */

class SMAAWeightsMaterial extends ShaderMaterial {

	/**
	 * Constructs a new SMAA weights material.
	 *
	 * @param {Vector2} [texelSize] - The absolute screen texel size.
	 */

	constructor(texelSize = new Vector2()) {

		super({

			type: "SMAAWeightsMaterial",

			defines: {

				// Configurable settings:
				MAX_SEARCH_STEPS_INT: "8",
				MAX_SEARCH_STEPS_FLOAT: "8.0",

				// Non-configurable settings:
				AREATEX_MAX_DISTANCE: "16.0",
				AREATEX_PIXEL_SIZE: "(1.0 / vec2(160.0, 560.0))",
				AREATEX_SUBTEX_SIZE: "(1.0 / 7.0)",
				SEARCHTEX_SIZE: "vec2(66.0, 33.0)",
				SEARCHTEX_PACKED_SIZE: "vec2(64.0, 16.0)"

			},

			uniforms: {

				inputBuffer: new Uniform(null),
				areaTexture: new Uniform(null),
				searchTexture: new Uniform(null),
				texelSize: new Uniform(texelSize)

			},

			fragmentShader: fragment$8,
			vertexShader: vertex$5,

			depthWrite: false,
			depthTest: false

		});

	}

	/**
	 * Sets the maximum amount of steps performed in the horizontal/vertical
	 * pattern searches, at each side of the pixel.
	 *
	 * In number of pixels, it's actually the double. So the maximum line length
	 * perfectly handled by, for example 16, is 64 (perfectly means that longer
	 * lines won't look as good, but are still antialiased).
	 *
	 * @param {Number} steps - The search steps. Range: [0, 112].
	 */

	setOrthogonalSearchSteps(steps) {

		this.defines.MAX_SEARCH_STEPS_INT = steps.toFixed("0");
		this.defines.MAX_SEARCH_STEPS_FLOAT = steps.toFixed("1");
		this.needsUpdate = true;

	}

}

/**
 * An abstract pass.
 *
 * Passes that do not rely on the depth buffer should explicitly disable the
 * depth test and depth write in their respective shader materials.
 *
 * @implements {Initializable}
 * @implements {Resizable}
 * @implements {Disposable}
 */

class Pass {

	/**
	 * Constructs a new pass.
	 *
	 * @param {String} [name] - The name of this pass. Does not have to be unique.
	 * @param {Scene} [scene] - The scene to render. The default scene contains a single mesh that fills the screen.
	 * @param {Camera} [camera] - The camera. The default camera perfectly captures the screen mesh.
	 */

	constructor(name = "Pass", scene = new Scene(), camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)) {

		/**
		 * The name of this pass.
		 *
		 * @type {String}
		 */

		this.name = name;

		/**
		 * The scene to render.
		 *
		 * @type {Scene}
		 * @protected
		 */

		this.scene = scene;

		/**
		 * The camera.
		 *
		 * @type {Camera}
		 * @protected
		 */

		this.camera = camera;

		/**
		 * A quad mesh that fills the screen.
		 *
		 * @type {Mesh}
		 * @private
		 */

		this.quad = null;

		/**
		 * Indicates whether the {@link EffectComposer} should swap the frame
		 * buffers after this pass has finished rendering.
		 *
		 * Set this to `false` if this pass doesn't render to the output buffer or
		 * the screen. Otherwise, the contents of the input buffer will be lost.
		 *
		 * @type {Boolean}
		 */

		this.needsSwap = true;

		/**
		 * Indicates whether the {@link EffectComposer} should prepare a depth
		 * texture for this pass.
		 *
		 * Set this to `true` if this pass relies on depth information from a
		 * preceding {@link RenderPass}.
		 *
		 * @type {Boolean}
		 */

		this.needsDepthTexture = false;

		/**
		 * Indicates whether this pass should render to screen.
		 *
		 * @type {Boolean}
		 */

		this.renderToScreen = false;

		/**
		 * Indicates whether this pass should be executed.
		 *
		 * @type {Boolean}
		 */

		this.enabled = true;

	}

	/**
	 * Returns the current fullscreen material.
	 *
	 * @return {Material} The current fullscreen material, or null if there is none.
	 */

	getFullscreenMaterial() {

		return (this.quad !== null) ? this.quad.material : null;

	}

	/**
	 * Sets the fullscreen material.
	 *
	 * The material will be assigned to the quad mesh that fills the screen. The
	 * screen quad will be created once a material is assigned via this method.
	 *
	 * @protected
	 * @param {Material} material - A fullscreen material.
	 */

	setFullscreenMaterial(material) {

		let quad = this.quad;

		if(quad !== null) {

			quad.material = material;

		} else {

			quad = new Mesh(new PlaneBufferGeometry(2, 2), material);
			quad.frustumCulled = false;

			if(this.scene !== null) {

				this.scene.add(quad);
				this.quad = quad;

			}

		}

	}

	/**
	 * Returns the current depth texture.
	 *
	 * @return {Texture} The current depth texture, or null if there is none.
	 */

	getDepthTexture() {

		return null;

	}

	/**
	 * Sets the depth texture.
	 *
	 * You may override this method if your pass relies on the depth information
	 * of a preceding {@link RenderPass}.
	 *
	 * @param {Texture} depthTexture - A depth texture.
	 * @param {Number} [depthPacking=0] - The depth packing.
	 */

	setDepthTexture(depthTexture, depthPacking = 0) {}

	/**
	 * Renders the effect.
	 *
	 * This is an abstract method that must be overridden.
	 *
	 * @abstract
	 * @throws {Error} An error is thrown if the method is not overridden.
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		throw new Error("Render method not implemented!");

	}

	/**
	 * Updates this pass with the renderer's size.
	 *
	 * You may override this method in case you want to be informed about the main
	 * render size.
	 *
	 * The {@link EffectComposer} calls this method before this pass is
	 * initialized and every time its own size is updated.
	 *
	 * @param {Number} width - The renderer's width.
	 * @param {Number} height - The renderer's height.
	 * @example this.myRenderTarget.setSize(width, height);
	 */

	setSize(width, height) {}

	/**
	 * Performs initialization tasks.
	 *
	 * By overriding this method you gain access to the renderer. You'll also be
	 * able to configure your custom render targets to use the appropriate format
	 * (RGB or RGBA).
	 *
	 * The provided renderer can be used to warm up special off-screen render
	 * targets by performing a preliminary render operation.
	 *
	 * The {@link EffectComposer} calls this method when this pass is added to its
	 * queue, but not before its size has been set.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 * @example if(!alpha) { this.myRenderTarget.texture.format = RGBFormat; }
	 */

	initialize(renderer, alpha) {}

	/**
	 * Performs a shallow search for disposable properties and deletes them. The
	 * pass will be inoperative after this method was called!
	 *
	 * Disposable objects:
	 *  - WebGLRenderTarget
	 *  - Material
	 *  - Texture
	 *
	 * The {@link EffectComposer} calls this method when it is being destroyed.
	 * You may, however, use it independently to free memory when you are certain
	 * that you don't need this pass anymore.
	 */

	dispose() {

		const material = this.getFullscreenMaterial();

		if(material !== null) {

			material.dispose();

		}

		for(const key of Object.keys(this)) {

			if(this[key] !== null && typeof this[key].dispose === "function") {

				this[key].dispose();
				this[key] = null;

			}

		}

	}

}

/**
 * An efficient, incremental blur pass.
 *
 * Note: This pass allows the input and output buffer to be the same.
 */

class BlurPass extends Pass {

	/**
	 * Constructs a new blur pass.
	 *
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.resolutionScale=0.5] - The render texture resolution scale, relative to the screen render size.
	 * @param {Number} [options.kernelSize=KernelSize.LARGE] - The blur kernel size.
	 */

	constructor(options = {}) {

		super("BlurPass");

		/**
		 * A render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetX = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetX.texture.name = "Blur.TargetX";
		this.renderTargetX.texture.generateMipmaps = false;

		/**
		 * A second render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetY = this.renderTargetX.clone();
		this.renderTargetY.texture.name = "Blur.TargetY";

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The current resolution scale.
		 *
		 * @type {Number}
		 * @private
		 */

		this.resolutionScale = (options.resolutionScale !== undefined) ? options.resolutionScale : 0.5;

		/**
		 * A convolution shader material.
		 *
		 * @type {ConvolutionMaterial}
		 * @private
		 */

		this.convolutionMaterial = new ConvolutionMaterial();

		/**
		 * A convolution shader material that uses dithering.
		 *
		 * @type {ConvolutionMaterial}
		 * @private
		 */

		this.ditheredConvolutionMaterial = new ConvolutionMaterial();
		this.ditheredConvolutionMaterial.dithering = true;

		/**
		 * Whether the blurred result should also be dithered using noise.
		 *
		 * @type {Boolean}
		 */

		this.dithering = false;

		this.kernelSize = options.kernelSize;

	}

	/**
	 * The absolute width of the internal render targets.
	 *
	 * @type {Number}
	 */

	get width() {

		return this.renderTargetX.width;

	}

	/**
	 * The absolute height of the internal render targets.
	 *
	 * @type {Number}
	 */

	get height() {

		return this.renderTargetX.height;

	}

	/**
	 * The kernel size.
	 *
	 * @type {KernelSize}
	 */

	get kernelSize() {

		return this.convolutionMaterial.kernelSize;

	}

	/**
	 * @type {KernelSize}
	 */

	set kernelSize(value = KernelSize.LARGE) {

		this.convolutionMaterial.kernelSize = value;
		this.ditheredConvolutionMaterial.kernelSize = value;

	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 */

	getResolutionScale() {

		return this.resolutionScale;

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 */

	setResolutionScale(scale) {

		this.resolutionScale = scale;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Blurs the input buffer and writes the result to the output buffer. The
	 * input buffer remains intact, unless its also the output buffer.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const scene = this.scene;
		const camera = this.camera;

		const renderTargetX = this.renderTargetX;
		const renderTargetY = this.renderTargetY;

		let material = this.convolutionMaterial;
		let uniforms = material.uniforms;
		const kernel = material.getKernel();

		let lastRT = inputBuffer;
		let destRT;
		let i, l;

		this.setFullscreenMaterial(material);

		// Apply the multi-pass blur.
		for(i = 0, l = kernel.length - 1; i < l; ++i) {

			// Alternate between targets.
			destRT = ((i % 2) === 0) ? renderTargetX : renderTargetY;

			uniforms.kernel.value = kernel[i];
			uniforms.inputBuffer.value = lastRT.texture;
			renderer.render(scene, camera, destRT);

			lastRT = destRT;

		}

		if(this.dithering) {

			material = this.ditheredConvolutionMaterial;
			uniforms = material.uniforms;
			this.setFullscreenMaterial(material);

		}

		uniforms.kernel.value = kernel[i];
		uniforms.inputBuffer.value = lastRT.texture;
		renderer.render(scene, camera, this.renderToScreen ? null : outputBuffer);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);

		width = Math.max(1, Math.floor(width * this.resolutionScale));
		height = Math.max(1, Math.floor(height * this.resolutionScale));

		this.renderTargetX.setSize(width, height);
		this.renderTargetY.setSize(width, height);

		this.convolutionMaterial.setTexelSize(1.0 / width, 1.0 / height);
		this.ditheredConvolutionMaterial.setTexelSize(1.0 / width, 1.0 / height);

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialize(renderer, alpha) {

		if(!alpha) {

			this.renderTargetX.texture.format = RGBFormat;
			this.renderTargetY.texture.format = RGBFormat;

		}

	}

}

/**
 * A pass that disables the stencil test.
 */

class ClearMaskPass extends Pass {

	/**
	 * Constructs a new clear mask pass.
	 */

	constructor() {

		super("ClearMaskPass", null, null);

		this.needsSwap = false;

	}

	/**
	 * Disables the global stencil test.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		renderer.state.buffers.stencil.setTest(false);

	}

}

/**
 * Used for saving the original clear color of the renderer.
 *
 * @type {Color}
 * @private
 */

const color = new Color();

/**
 * A pass that clears the input buffer or the screen.
 *
 * You can prevent specific bits from being cleared by setting either the
 * autoClearColor, autoClearStencil or autoClearDepth properties of the renderer
 * to false.
 */

class ClearPass extends Pass {

	/**
	 * Constructs a new clear pass.
	 *
	 * @param {Object} [options] - Additional options.
	 * @param {Color} [options.clearColor=null] - An override clear color.
	 * @param {Number} [options.clearAlpha=0.0] - An override clear alpha.
	 */

	constructor(options = {}) {

		super("ClearPass", null, null);

		this.needsSwap = false;

		/**
		 * The clear color.
		 *
		 * @type {Color}
		 */

		this.clearColor = (options.clearColor !== undefined) ? options.clearColor : null;

		/**
		 * The clear alpha.
		 *
		 * @type {Number}
		 */

		this.clearAlpha = (options.clearAlpha !== undefined) ? options.clearAlpha : 0.0;

	}

	/**
	 * Clears the input buffer or the screen.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const clearColor = this.clearColor;

		let clearAlpha;

		if(clearColor !== null) {

			color.copy(renderer.getClearColor());
			clearAlpha = renderer.getClearAlpha();
			renderer.setClearColor(clearColor, this.clearAlpha);

		}

		renderer.setRenderTarget(this.renderToScreen ? null : inputBuffer);
		renderer.clear();

		if(clearColor !== null) {

			renderer.setClearColor(color, clearAlpha);

		}

	}

}

/**
 * A pass that renders a given scene directly on screen or into the read buffer
 * for further processing.
 */

class RenderPass extends Pass {

	/**
	 * Constructs a new render pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Object} [options] - Additional options.
	 * @param {Material} [options.overrideMaterial=null] - An override material for the scene.
	 * @param {Color} [options.clearColor=null] - An override clear color.
	 * @param {Number} [options.clearAlpha=1.0] - An override clear alpha.
	 * @param {Boolean} [options.clearDepth=false] - Whether depth should be cleared explicitly.
	 * @param {Boolean} [options.clear=true] - Whether all buffers should be cleared.
	 */

	constructor(scene, camera, options = {}) {

		super("RenderPass", scene, camera);

		this.needsSwap = false;

		/**
		 * A clear pass.
		 *
		 * @type {ClearPass}
		 */

		this.clearPass = new ClearPass(options);

		/**
		 * An override material.
		 *
		 * @type {Material}
		 */

		this.overrideMaterial = (options.overrideMaterial !== undefined) ? options.overrideMaterial : null;

		/**
		 * Indicates whether the depth buffer should be cleared explicitly.
		 *
		 * @type {Boolean}
		 */

		this.clearDepth = (options.clearDepth !== undefined) ? options.clearDepth : false;

		/**
		 * Indicates whether the color, depth and stencil buffers should be cleared.
		 *
		 * Even with clear set to true you can prevent specific buffers from being
		 * cleared by setting either the autoClearColor, autoClearStencil or
		 * autoClearDepth properties of the renderer to false.
		 *
		 * @type {Boolean}
		 */

		this.clear = (options.clear !== undefined) ? options.clear : true;

	}

	/**
	 * Renders the scene.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const scene = this.scene;
		const renderTarget = this.renderToScreen ? null : inputBuffer;
		const overrideMaterial = scene.overrideMaterial;

		if(this.clear) {

			this.clearPass.renderToScreen = this.renderToScreen;
			this.clearPass.render(renderer, inputBuffer);

		} else if(this.clearDepth) {

			renderer.setRenderTarget(renderTarget);
			renderer.clearDepth();

		}

		scene.overrideMaterial = this.overrideMaterial;
		renderer.render(scene, this.camera, renderTarget);
		scene.overrideMaterial = overrideMaterial;

	}

}

/**
 * A pass that renders the depth of a given scene.
 */

class DepthPass extends Pass {

	/**
	 * Constructs a new depth pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.resolutionScale=0.5] - The render texture resolution scale, relative to the screen render size.
	 * @param {WebGLRenderTarget} [options.renderTarget] - A custom render target.
	 */

	constructor(scene, camera, options = {}) {

		super("DepthPass");

		this.needsSwap = false;

		/**
		 * A render pass.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.renderPass = new RenderPass(scene, camera, {
			overrideMaterial: new MeshDepthMaterial({
				depthPacking: RGBADepthPacking,
				morphTargets: true,
				skinning: true
			}),
			clearColor: new Color(0xffffff),
			clearAlpha: 1.0
		});

		/**
		 * A render target that contains the scene depth.
		 *
		 * @type {WebGLRenderTarget}
		 */

		this.renderTarget = options.renderTarget;

		if(this.renderTarget === undefined) {

			this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter
			});

			this.renderTarget.texture.name = "DepthPass.Target";
			this.renderTarget.texture.generateMipmaps = false;

		}

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The current resolution scale.
		 *
		 * @type {Number}
		 * @private
		 */

		this.resolutionScale = (options.resolutionScale !== undefined) ? options.resolutionScale : 0.5;

	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 */

	getResolutionScale() {

		return this.resolutionScale;

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 */

	setResolutionScale(scale) {

		this.resolutionScale = scale;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Renders the scene depth.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const renderTarget = this.renderToScreen ? null : this.renderTarget;
		this.renderPass.render(renderer, renderTarget, renderTarget);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);

		this.renderTarget.setSize(
			Math.max(1, Math.floor(width * this.resolutionScale)),
			Math.max(1, Math.floor(height * this.resolutionScale))
		);

	}

}

/**
 * A blend function enumeration.
 *
 * @type {Object}
 * @property {Number} SKIP - No blending. The effect will not be included in the final shader.
 * @property {Number} ADD - Additive blending. Fast, but may produce washed out results.
 * @property {Number} ALPHA - Alpha blending. Blends based on the alpha value of the new color. Opacity will be ignored.
 * @property {Number} AVERAGE - Average blending.
 * @property {Number} COLOR_BURN - Color dodge.
 * @property {Number} COLOR_DODGE - Color burn.
 * @property {Number} DARKEN - Prioritize darker colors.
 * @property {Number} DIFFERENCE - Color difference.
 * @property {Number} EXCLUSION - Color exclusion.
 * @property {Number} LIGHTEN - Prioritize lighter colors.
 * @property {Number} MULTIPLY - Color multiplication.
 * @property {Number} DIVIDE - Color division.
 * @property {Number} NEGATION - Color negation.
 * @property {Number} NORMAL - Normal blending. The new color overwrites the old one.
 * @property {Number} OVERLAY - Color overlay.
 * @property {Number} REFLECT - Color reflection.
 * @property {Number} SCREEN - Screen blending. The two colors are effectively projected on a white screen simultaneously.
 * @property {Number} SOFT_LIGHT - Soft light blending.
 * @property {Number} SUBTRACT - Color subtraction.
 */

const BlendFunction = {

	SKIP: 0,
	ADD: 1,
	ALPHA: 2,
	AVERAGE: 3,
	COLOR_BURN: 4,
	COLOR_DODGE: 5,
	DARKEN: 6,
	DIFFERENCE: 7,
	EXCLUSION: 8,
	LIGHTEN: 9,
	MULTIPLY: 10,
	DIVIDE: 11,
	NEGATION: 12,
	NORMAL: 13,
	OVERLAY: 14,
	REFLECT: 15,
	SCREEN: 16,
	SOFT_LIGHT: 17,
	SUBTRACT: 18

};

var addBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn min(x + y, 1.0) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var alphaBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn y * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, y.a), x.a);\r\n\r\n}\r\n";

var averageBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (x + y) * 0.5 * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var colorBurnBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y == 0.0) ? y : max(1.0 - (1.0 - x) / y, 0.0);\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var colorDodgeBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y == 1.0) ? y : min(x / (1.0 - y), 1.0);\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var darkenBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn min(x, y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var differenceBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn abs(x - y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var exclusionBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (x + y - 2.0 * x * y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var lightenBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn max(x, y) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var multiplyBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn x * y * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var divideBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y > 0.0) ? min(x / y, 1.0) : 1.0;\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var negationBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (1.0 - abs(1.0 - x - y)) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var normalBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn y * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var overlayBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (x < 0.5) ? (2.0 * x * y) : (1.0 - 2.0 * (1.0 - x) * (1.0 - y));\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var reflectBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y == 1.0) ? y : min(x * x / (1.0 - y), 1.0);\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var screenBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn (1.0 - (1.0 - x) * (1.0 - y)) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var softLightBlendFunction = "float blend(const in float x, const in float y) {\r\n\r\n\treturn (y < 0.5) ?\r\n\t\t(2.0 * x * y + x * x * (1.0 - 2.0 * y)) :\r\n\t\t(sqrt(x) * (2.0 * y - 1.0) + 2.0 * x * (1.0 - y));\r\n\r\n}\r\n\r\nvec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\tvec3 z = vec3(blend(x.r, y.r), blend(x.g, y.g), blend(x.b, y.b));\r\n\r\n\treturn z * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

var subtractBlendFunction = "vec3 blend(const in vec3 x, const in vec3 y, const in float opacity) {\r\n\r\n\treturn max(x + y - 1.0, 0.0) * opacity + x * (1.0 - opacity);\r\n\r\n}\r\n\r\nvec4 blend(const in vec4 x, const in vec4 y, const in float opacity) {\r\n\r\n\treturn vec4(blend(x.rgb, y.rgb, opacity), y.a);\r\n\r\n}\r\n";

/**
 * A blend function shader code catalogue.
 *
 * @type {Map<BlendFunction, String>}
 * @private
 */

const blendFunctions = new Map([
	[BlendFunction.SKIP, null],
	[BlendFunction.ADD, addBlendFunction],
	[BlendFunction.ALPHA, alphaBlendFunction],
	[BlendFunction.AVERAGE, averageBlendFunction],
	[BlendFunction.COLOR_BURN, colorBurnBlendFunction],
	[BlendFunction.COLOR_DODGE, colorDodgeBlendFunction],
	[BlendFunction.DARKEN, darkenBlendFunction],
	[BlendFunction.DIFFERENCE, differenceBlendFunction],
	[BlendFunction.EXCLUSION, exclusionBlendFunction],
	[BlendFunction.LIGHTEN, lightenBlendFunction],
	[BlendFunction.MULTIPLY, multiplyBlendFunction],
	[BlendFunction.DIVIDE, divideBlendFunction],
	[BlendFunction.NEGATION, negationBlendFunction],
	[BlendFunction.NORMAL, normalBlendFunction],
	[BlendFunction.OVERLAY, overlayBlendFunction],
	[BlendFunction.REFLECT, reflectBlendFunction],
	[BlendFunction.SCREEN, screenBlendFunction],
	[BlendFunction.SOFT_LIGHT, softLightBlendFunction],
	[BlendFunction.SUBTRACT, subtractBlendFunction]
]);

/**
 * A blend mode.
 */

class BlendMode {

	/**
	 * Constructs a new blend mode.
	 *
	 * @param {BlendFunction} blendFunction - The blend function to use.
	 * @param {Number} opacity - The opacity of the color that will be blended with the base color.
	 */

	constructor(blendFunction, opacity = 1.0) {

		/**
		 * The blend function.
		 *
		 * @type {BlendFunction}
		 */

		this.blendFunction = blendFunction;

		/**
		 * The opacity of the color that will be blended with the base color.
		 *
		 * @type {Uniform}
		 */

		this.opacity = new Uniform(opacity);

	}

	/**
	 * Returns the blend function shader code.
	 *
	 * @return {String} The blend function shader code.
	 */

	getShaderCode() {

		return blendFunctions.get(this.blendFunction);

	}

}

/**
 * An abstract effect.
 *
 * Effects can be combined using the {@link EffectPass}.
 *
 * @implements {Initializable}
 * @implements {Resizable}
 * @implements {Disposable}
 */

class Effect {

	/**
	 * Constructs a new effect.
	 *
	 * @param {String} name - The name of this effect. Doesn't have to be unique.
	 * @param {String} fragmentShader - The fragment shader. This shader is required.
	 * @param {Object} [options] - Additional options.
	 * @param {EffectAttribute} [options.attributes=EffectAttribute.NONE] - The effect attributes that determine the execution priority and resource requirements.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
	 * @param {Map<String, String>} [options.defines] - Custom preprocessor macro definitions. Keys are names and values are code.
	 * @param {Map<String, Uniform>} [options.uniforms] - Custom shader uniforms. Keys are names and values are uniforms.
	 * @param {Set<WebGLExtension>} [options.extensions] - WebGL extensions.
	 * @param {String} [options.vertexShader=null] - The vertex shader. Most effects don't need one.
	 */

	constructor(name, fragmentShader, options = {}) {

		const settings = Object.assign({
			attributes: EffectAttribute.NONE,
			blendFunction: BlendFunction.SCREEN,
			defines: new Map(),
			uniforms: new Map(),
			extensions: null,
			vertexShader: null
		}, options);

		/**
		 * The name of this effect.
		 *
		 * @type {String}
		 */

		this.name = name;

		/**
		 * The effect attributes.
		 *
		 * Effects that have the same attributes will be executed in the order in
		 * which they were registered. Some attributes imply a higher priority.
		 *
		 * @type {EffectAttribute}
		 */

		this.attributes = settings.attributes;

		/**
		 * The fragment shader.
		 *
		 * @type {String}
		 */

		this.fragmentShader = fragmentShader;

		/**
		 * The vertex shader.
		 *
		 * @type {String}
		 */

		this.vertexShader = settings.vertexShader;

		/**
		 * Preprocessor macro definitions.
		 *
		 * You'll need to call {@link EffectPass#recompile} after changing a macro.
		 *
		 * @type {Map<String, String>}
		 */

		this.defines = settings.defines;

		/**
		 * Shader uniforms.
		 *
		 * You may freely modify the values of these uniforms at runtime. However,
		 * uniforms must not be removed or added after the effect was created.
		 *
		 * @type {Map<String, Uniform>}
		 */

		this.uniforms = settings.uniforms;

		/**
		 * WebGL extensions that are required by this effect.
		 *
		 * You'll need to call {@link EffectPass#recompile} after adding or removing
		 * an extension.
		 *
		 * @type {Set<WebGLExtension>}
		 */

		this.extensions = settings.extensions;

		/**
		 * The blend mode of this effect.
		 *
		 * The result of this effect will be blended with the result of the previous
		 * effect using this blend mode.
		 *
		 * Feel free to adjust the opacity of the blend mode at runtime. However,
		 * you'll need to call {@link EffectPass#recompile} if you change the blend
		 * function.
		 *
		 * @type {BlendMode}
		 */

		this.blendMode = new BlendMode(settings.blendFunction);

	}

	/**
	 * Sets the depth texture.
	 *
	 * You may override this method if your effect requires direct access to the
	 * depth texture that is bound to the associated {@link EffectPass}.
	 *
	 * @param {Texture} depthTexture - A depth texture.
	 * @param {Number} [depthPacking=0] - The depth packing.
	 */

	setDepthTexture(depthTexture, depthPacking = 0) {}

	/**
	 * Updates the effect by performing supporting operations.
	 *
	 * This method is called by the {@link EffectPass} right before the main
	 * fullscreen render operation, even if the blend function is set to `SKIP`.
	 *
	 * You may override this method if you need to render additional off-screen
	 * textures or update custom uniforms.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {}

	/**
	 * Updates the size of this effect.
	 *
	 * You may override this method in case you want to be informed about the main
	 * render size.
	 *
	 * The {@link EffectPass} calls this method before this effect is initialized
	 * and every time its own size is updated.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 * @example this.myRenderTarget.setSize(width, height);
	 */

	setSize(width, height) {}

	/**
	 * Performs initialization tasks.
	 *
	 * By overriding this method you gain access to the renderer. You'll also be
	 * able to configure your custom render targets to use the appropriate format
	 * (RGB or RGBA).
	 *
	 * The provided renderer can be used to warm up special off-screen render
	 * targets by performing a preliminary render operation.
	 *
	 * The {@link EffectPass} calls this method during its own initialization
	 * which happens after the size has been set.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 * @example if(!alpha) { this.myRenderTarget.texture.format = RGBFormat; }
	 */

	initialize(renderer, alpha) {}

	/**
	 * Performs a shallow search for properties that define a dispose method and
	 * deletes them. The effect will be inoperative after this method was called!
	 *
	 * Disposable objects:
	 *  - render targets
	 *  - materials
	 *  - textures
	 *
	 * The {@link EffectPass} calls this method when it is being destroyed. Do not
	 * call this method directly.
	 */

	dispose() {

		for(const key of Object.keys(this)) {

			if(this[key] !== null && typeof this[key].dispose === "function") {

				this[key].dispose();
				this[key] = null;

			}

		}

	}

}

/**
 * An enumeration of effect attributes.
 *
 * Attributes can be concatenated using the bitwise OR operator.
 *
 * @type {Object}
 * @property {Number} CONVOLUTION - Describes effects that fetch additional samples from the input buffer. There cannot be more than one effect with this attribute per {@link EffectPass}.
 * @property {Number} DEPTH - Describes effects that require a depth texture.
 * @property {Number} NONE - No attributes. Most effects don't need to specify any attributes.
 * @example
 * const attributes = EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH;
 */

const EffectAttribute = {

	CONVOLUTION: 2,
	DEPTH: 1,
	NONE: 0

};

/**
 * An enumeration of WebGL extensions.
 *
 * @type {Object}
 * @property {String} DERIVATIVES - Enables derivatives by adding the functions dFdx, dFdy and fwidth.
 * @property {String} FRAG_DEPTH - Enables gl_FragDepthEXT to set a depth value of a fragment from within the fragment shader.
 * @property {String} DRAW_BUFFERS - Enables multiple render targets (MRT) support.
 * @property {String} SHADER_TEXTURE_LOD - Enables explicit control of texture LOD.
 */

const WebGLExtension = {

	DERIVATIVES: "derivatives",
	FRAG_DEPTH: "fragDepth",
	DRAW_BUFFERS: "drawBuffers",
	SHADER_TEXTURE_LOD: "shaderTextureLOD"

};

/**
 * Finds and collects substrings that match the given regular expression.
 *
 * @private
 * @param {RegExp} regExp - A regular expression.
 * @param {String} string - A string.
 * @return {String[]} The matching substrings.
 */

function findSubstrings(regExp, string) {

	const substrings = [];
	let result;

	while((result = regExp.exec(string)) !== null) {

		substrings.push(result[1]);

	}

	return substrings;

}

/**
 * Prefixes substrings within the given strings.
 *
 * @private
 * @param {String} prefix - A prefix.
 * @param {String[]} substrings - The substrings.
 * @param {Map<String, String>} strings - A collection of named strings.
 */

function prefixSubstrings(prefix, substrings, strings) {

	let prefixed, regExp;

	for(const substring of substrings) {

		prefixed = "$1" + prefix + substring.charAt(0).toUpperCase() + substring.slice(1);
		regExp = new RegExp("([^\\.])(\\b" + substring + "\\b)", "g");

		for(const entry of strings.entries()) {

			if(entry[1] !== null) {

				strings.set(entry[0], entry[1].replace(regExp, prefixed));

			}

		}

	}

}

/**
 * Integrates the given effect.
 *
 * @private
 * @param {String} prefix - A prefix.
 * @param {Effect} effect - An effect.
 * @param {Map<String, String>} shaderParts - The shader parts.
 * @param {Map<BlendFunction, BlendMode>} blendModes - The blend modes.
 * @param {Map<String, String>} defines - The macro definitions.
 * @param {Map<String, Uniform>} uniforms - The uniforms.
 * @param {EffectAttribute} attributes - The global, collective attributes.
 * @return {Object} The results.
 * @property {String[]} varyings - The varyings used by the given effect.
 * @property {Boolean} transformedUv - Indicates whether the effect transforms UV coordinates in the fragment shader.
 * @property {Boolean} readDepth - Indicates whether the effect actually uses depth in the fragment shader.
 */

function integrateEffect(prefix, effect, shaderParts, blendModes, defines, uniforms, attributes) {

	const functionRegExp = /(?:\w+\s+(\w+)\([\w\s,]*\)\s*{[^}]+})/g;
	const varyingRegExp = /(?:varying\s+\w+\s+(\w*))/g;

	const blendMode = effect.blendMode;
	const shaders = new Map([
		["fragment", effect.fragmentShader],
		["vertex", effect.vertexShader]
	]);

	const mainImageExists = (shaders.get("fragment") !== undefined && shaders.get("fragment").indexOf("mainImage") >= 0);
	const mainUvExists = (shaders.get("fragment") !== undefined && shaders.get("fragment").indexOf("mainUv") >= 0);

	let varyings = [], names = [];
	let transformedUv = false;
	let readDepth = false;

	if(shaders.get("fragment") === undefined) {

		console.error("Missing fragment shader", effect);

	} else if(mainUvExists && (attributes & EffectAttribute.CONVOLUTION) !== 0) {

		console.error("Effects that transform UV coordinates are incompatible with convolution effects", effect);

	} else if(!mainImageExists && !mainUvExists) {

		console.error("The fragment shader contains neither a mainImage nor a mainUv function", effect);

	} else {

		if(mainUvExists) {

			shaderParts.set(Section.FRAGMENT_MAIN_UV, shaderParts.get(Section.FRAGMENT_MAIN_UV) +
				"\t" + prefix + "MainUv(UV);\n");

			transformedUv = true;

		}

		if(shaders.get("vertex") !== null && shaders.get("vertex").indexOf("mainSupport") >= 0) {

			shaderParts.set(Section.VERTEX_MAIN_SUPPORT, shaderParts.get(Section.VERTEX_MAIN_SUPPORT) +
				"\t" + prefix + "MainSupport();\n");

			varyings = varyings.concat(findSubstrings(varyingRegExp, shaders.get("vertex")));
			names = names.concat(varyings).concat(findSubstrings(functionRegExp, shaders.get("vertex")));

		}

		names = names.concat(findSubstrings(functionRegExp, shaders.get("fragment")))
			.concat(Array.from(effect.uniforms.keys()))
			.concat(Array.from(effect.defines.keys()));

		// Store prefixed uniforms and macros.
		effect.uniforms.forEach((value, key) => uniforms.set(prefix + key.charAt(0).toUpperCase() + key.slice(1), value));
		effect.defines.forEach((value, key) => defines.set(prefix + key.charAt(0).toUpperCase() + key.slice(1), value));

		// Prefix varyings, functions, uniforms and macros.
		prefixSubstrings(prefix, names, defines);
		prefixSubstrings(prefix, names, shaders);

		// Collect unique blend modes.
		blendModes.set(blendMode.blendFunction, blendMode);

		if(mainImageExists) {

			let string = prefix + "MainImage(color0, UV, ";

			// The effect may sample depth in a different shader.
			if((attributes & EffectAttribute.DEPTH) !== 0 && shaders.get("fragment").indexOf("depth") >= 0) {

				string += "depth, ";
				readDepth = true;

			}

			string += "color1);\n\t";

			// Include the blend opacity uniform of this effect.
			const blendOpacity = prefix + "BlendOpacity";
			uniforms.set(blendOpacity, blendMode.opacity);

			// Blend the result of this effect with the input color.
			string += "color0 = blend" + blendMode.blendFunction +
				"(color0, color1, " + blendOpacity + ");\n\n\t";

			shaderParts.set(Section.FRAGMENT_MAIN_IMAGE,
				shaderParts.get(Section.FRAGMENT_MAIN_IMAGE) + string);

			shaderParts.set(Section.FRAGMENT_HEAD, shaderParts.get(Section.FRAGMENT_HEAD) +
				"uniform float " + blendOpacity + ";\n\n");

		}

		// Include the modified code in the final shader.
		shaderParts.set(Section.FRAGMENT_HEAD, shaderParts.get(Section.FRAGMENT_HEAD) +
			shaders.get("fragment") + "\n");

		if(shaders.get("vertex") !== null) {

			shaderParts.set(Section.VERTEX_HEAD, shaderParts.get(Section.VERTEX_HEAD) +
				shaders.get("vertex") + "\n");

		}

	}

	return { varyings, transformedUv, readDepth };

}

/**
 * An effect pass.
 *
 * Use this pass to combine {@link Effect} instances.
 */

class EffectPass extends Pass {

	/**
	 * Constructs a new effect pass.
	 *
	 * The provided effects will be organized and merged for optimal performance.
	 *
	 * @param {Camera} camera - The main camera. The camera's type and settings will be available to all effects.
	 * @param {...Effect} effects - The effects that will be rendered by this pass.
	 */

	constructor(camera, ...effects) {

		super("EffectPass");

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.mainCamera = camera;

		/**
		 * The effects, sorted by attribute priority, DESC.
		 *
		 * @type {Effect[]}
		 * @private
		 */

		this.effects = effects.sort((a, b) => (b.attributes - a.attributes));

		/**
		 * Indicates whether this pass should skip rendering.
		 *
		 * Effects will still be updated, even if this flag is true.
		 *
		 * @type {Boolean}
		 * @private
		 */

		this.skipRendering = false;

		/**
		 * Indicates whether dithering is enabled.
		 *
		 * @type {Boolean}
		 * @private
		 */

		this.quantize = false;

		/**
		 * The amount of shader uniforms that this pass uses.
		 *
		 * @type {Number}
		 * @private
		 */

		this.uniforms = 0;

		/**
		 * The amount of shader varyings that this pass uses.
		 *
		 * @type {Number}
		 * @private
		 */

		this.varyings = 0;

		/**
		 * A time offset.
		 *
		 * Elapsed time will start at this value.
		 *
		 * @type {Number}
		 */

		this.minTime = 1.0;

		/**
		 * The maximum time.
		 *
		 * If the elapsed time exceeds this value, it will be reset.
		 *
		 * @type {Number}
		 */

		this.maxTime = 1e3;

		this.setFullscreenMaterial(this.createMaterial());

	}

	/**
	 * Indicates whether dithering is enabled.
	 *
	 * Color quantization reduces banding artifacts but degrades performance.
	 *
	 * @type {Boolean}
	 */

	get dithering() {

		return this.quantize;

	}

	/**
	 * Enables or disables dithering.
	 *
	 * Note that some effects like bloom have their own dithering setting.
	 *
	 * @type {Boolean}
	 */

	set dithering(value) {

		if(this.quantize !== value) {

			const material = this.getFullscreenMaterial();

			if(material !== null) {

				material.dithering = value;
				material.needsUpdate = true;

			}

			this.quantize = value;

		}

	}

	/**
	 * Creates a compound shader material.
	 *
	 * @private
	 * @return {Material} The new material.
	 */

	createMaterial() {

		const blendRegExp = /\bblend\b/g;

		const shaderParts = new Map([
			[Section.FRAGMENT_HEAD, ""],
			[Section.FRAGMENT_MAIN_UV, ""],
			[Section.FRAGMENT_MAIN_IMAGE, ""],
			[Section.VERTEX_HEAD, ""],
			[Section.VERTEX_MAIN_SUPPORT, ""]
		]);

		const blendModes = new Map();
		const defines = new Map();
		const uniforms = new Map();
		const extensions = new Set();

		let id = 0, varyings = 0, attributes = 0;
		let transformedUv = false;
		let readDepth = false;
		let result;

		for(const effect of this.effects) {

			if(effect.blendMode.blendFunction === BlendFunction.SKIP) {

				continue;

			} else if((attributes & EffectAttribute.CONVOLUTION) !== 0 && (effect.attributes & EffectAttribute.CONVOLUTION) !== 0) {

				console.error("Convolution effects cannot be merged", effect);

			} else {

				attributes |= effect.attributes;

				result = integrateEffect(("e" + id++), effect, shaderParts, blendModes, defines, uniforms, attributes);

				varyings += result.varyings.length;
				transformedUv = transformedUv || result.transformedUv;
				readDepth = readDepth || result.readDepth;

				if(effect.extensions !== null) {

					// Collect the WebGL extensions that are required by this effect.
					for(const extension of effect.extensions) {

						extensions.add(extension);

					}

				}

			}

		}

		// Integrate the relevant blend functions.
		for(const blendMode of blendModes.values()) {

			shaderParts.set(Section.FRAGMENT_HEAD, shaderParts.get(Section.FRAGMENT_HEAD) +
				blendMode.getShaderCode().replace(blendRegExp, "blend" + blendMode.blendFunction) + "\n");

		}

		// Check if any effect relies on depth.
		if((attributes & EffectAttribute.DEPTH) !== 0) {

			// Only read depth if any effect actually uses this information.
			if(readDepth) {

				shaderParts.set(Section.FRAGMENT_MAIN_IMAGE, "float depth = readDepth(UV);\n\n\t" +
					shaderParts.get(Section.FRAGMENT_MAIN_IMAGE));

			}

			this.needsDepthTexture = true;

		}

		// Check if any effect transforms UVs in the fragment shader.
		if(transformedUv) {

			shaderParts.set(Section.FRAGMENT_MAIN_UV, "vec2 transformedUv = vUv;\n" +
				shaderParts.get(Section.FRAGMENT_MAIN_UV));

			defines.set("UV", "transformedUv");

		} else {

			defines.set("UV", "vUv");

		}

		shaderParts.forEach((value, key, map) => map.set(key, value.trim()));

		this.uniforms = uniforms.size;
		this.varyings = varyings;

		this.skipRendering = (id === 0);
		this.needsSwap = !this.skipRendering;

		const material = new EffectMaterial(shaderParts, defines, uniforms, this.mainCamera, this.dithering);

		if(extensions.size > 0) {

			// Enable required WebGL extensions.
			for(const extension of extensions) {

				material.extensions[extension] = true;

			}

		}

		return material;

	}

	/**
	 * Destroys the current fullscreen shader material and builds a new one.
	 *
	 * Warning: This method performs a relatively expensive shader recompilation.
	 */

	recompile() {

		let material = this.getFullscreenMaterial();
		let width = 0, height = 0;
		let depthTexture = null;
		let depthPacking = 0;

		if(material !== null) {

			const resolution = material.uniforms.resolution.value;
			width = resolution.x; height = resolution.y;
			depthTexture = material.uniforms.depthBuffer.value;
			depthPacking = material.depthPacking;
			material.dispose();

			this.uniforms = 0;
			this.varyings = 0;

		}

		material = this.createMaterial();
		material.setSize(width, height);
		this.setFullscreenMaterial(material);
		this.setDepthTexture(depthTexture, depthPacking);

	}

	/**
	 * Returns the current depth texture.
	 *
	 * @return {Texture} The current depth texture, or null if there is none.
	 */

	getDepthTexture() {

		const material = this.getFullscreenMaterial();

		return (material !== null) ? material.uniforms.depthBuffer.value : null;

	}

	/**
	 * Sets the depth texture.
	 *
	 * @param {Texture} depthTexture - A depth texture.
	 * @param {Number} [depthPacking=0] - The depth packing.
	 */

	setDepthTexture(depthTexture, depthPacking = 0) {

		const material = this.getFullscreenMaterial();

		material.uniforms.depthBuffer.value = depthTexture;
		material.depthPacking = depthPacking;
		material.needsUpdate = true;

		for(const effect of this.effects) {

			effect.setDepthTexture(depthTexture, depthPacking);

		}

		this.needsDepthTexture = (depthTexture === null);

	}

	/**
	 * Renders the effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const material = this.getFullscreenMaterial();
		const time = material.uniforms.time.value + delta;

		for(const effect of this.effects) {

			effect.update(renderer, inputBuffer, delta);

		}

		if(!this.skipRendering || this.renderToScreen) {

			material.uniforms.inputBuffer.value = inputBuffer.texture;
			material.uniforms.time.value = (time <= this.maxTime) ? time : this.minTime;
			renderer.render(this.scene, this.camera, this.renderToScreen ? null : outputBuffer);

		}

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.getFullscreenMaterial().setSize(width, height);

		for(const effect of this.effects) {

			effect.setSize(width, height);

		}

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialize(renderer, alpha) {

		const capabilities = renderer.capabilities;

		let max = Math.min(capabilities.maxFragmentUniforms, capabilities.maxVertexUniforms);

		if(this.uniforms > max) {

			console.warn("The current rendering context doesn't support more than " + max + " uniforms, but " + this.uniforms + " were defined");

		}

		max = capabilities.maxVaryings;

		if(this.varyings > max) {

			console.warn("The current rendering context doesn't support more than " + max + " varyings, but " + this.varyings + " were defined");

		}

		for(const effect of this.effects) {

			effect.initialize(renderer, alpha);

		}

	}

	/**
	 * Deletes disposable objects.
	 *
	 * This pass will be inoperative after this method was called!
	 */

	dispose() {

		super.dispose();

		for(const effect of this.effects) {

			effect.dispose();

		}

	}

}

/**
 * A mask pass.
 *
 * This pass requires that the input and output buffers have a stencil buffer.
 * You can enable the stencil buffer via the {@link EffectComposer} constructor.
 */

class MaskPass extends Pass {

	/**
	 * Constructs a new mask pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use.
	 */

	constructor(scene, camera) {

		super("MaskPass", scene, camera);

		this.needsSwap = false;

		/**
		 * Inverse flag.
		 *
		 * @type {Boolean}
		 */

		this.inverse = false;

		/**
		 * Stencil buffer clear flag.
		 *
		 * @type {Boolean}
		 */

		this.clearStencil = true;

	}

	/**
	 * Renders the effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const context = renderer.context;
		const state = renderer.state;

		const scene = this.scene;
		const camera = this.camera;

		const writeValue = this.inverse ? 0 : 1;
		const clearValue = 1 - writeValue;

		// Don't update color or depth.
		state.buffers.color.setMask(false);
		state.buffers.depth.setMask(false);

		// Lock the buffers.
		state.buffers.color.setLocked(true);
		state.buffers.depth.setLocked(true);

		// Configure the stencil.
		state.buffers.stencil.setTest(true);
		state.buffers.stencil.setOp(context.REPLACE, context.REPLACE, context.REPLACE);
		state.buffers.stencil.setFunc(context.ALWAYS, writeValue, 0xffffffff);
		state.buffers.stencil.setClear(clearValue);

		// Clear the stencil.
		if(this.clearStencil) {

			if(this.renderToScreen) {

				renderer.setRenderTarget(null);
				renderer.clearStencil();

			} else {

				renderer.setRenderTarget(inputBuffer);
				renderer.clearStencil();

				renderer.setRenderTarget(outputBuffer);
				renderer.clearStencil();

			}

		}

		// Draw the mask.
		if(this.renderToScreen) {

			renderer.render(scene, camera, null);

		} else {

			renderer.render(scene, camera, inputBuffer);
			renderer.render(scene, camera, outputBuffer);

		}

		// Unlock the buffers.
		state.buffers.color.setLocked(false);
		state.buffers.depth.setLocked(false);

		// Only render where the stencil is set to 1.
		state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff);
		state.buffers.stencil.setOp(context.KEEP, context.KEEP, context.KEEP);

	}

}

/**
 * A pass that renders the normals of a given scene.
 */

class NormalPass extends Pass {

	/**
	 * Constructs a new normal pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.resolutionScale=0.5] - The render texture resolution scale, relative to the screen render size.
	 * @param {WebGLRenderTarget} [options.renderTarget] - A custom render target.
	 */

	constructor(scene, camera, options = {}) {

		super("NormalPass");

		this.needsSwap = false;

		/**
		 * A render pass.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.renderPass = new RenderPass(scene, camera, {
			overrideMaterial: new MeshNormalMaterial({
				morphTargets: true,
				skinning: true
			}),
			clearColor: new Color(0x7777ff),
			clearAlpha: 1.0
		});

		/**
		 * A render target that contains the scene normals.
		 *
		 * @type {WebGLRenderTarget}
		 */

		this.renderTarget = options.renderTarget;

		if(this.renderTarget === undefined) {

			this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				format: RGBFormat
			});

			this.renderTarget.texture.name = "NormalPass.Target";
			this.renderTarget.texture.generateMipmaps = false;

		}

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The current resolution scale.
		 *
		 * @type {Number}
		 * @private
		 */

		this.resolutionScale = (options.resolutionScale !== undefined) ? options.resolutionScale : 0.5;

	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 */

	getResolutionScale() {

		return this.resolutionScale;

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 */

	setResolutionScale(scale) {

		this.resolutionScale = scale;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Renders the scene normals.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		const renderTarget = this.renderToScreen ? null : this.renderTarget;
		this.renderPass.render(renderer, renderTarget, renderTarget);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);

		this.renderTarget.setSize(
			Math.max(1, Math.floor(width * this.resolutionScale)),
			Math.max(1, Math.floor(height * this.resolutionScale))
		);

	}

}

/**
 * A pass that renders the result from a previous pass to another render target.
 */

class SavePass extends Pass {

	/**
	 * Constructs a new save pass.
	 *
	 * @param {WebGLRenderTarget} [renderTarget] - A render target.
	 * @param {Boolean} [resize=true] - Whether the render target should adjust to the size of the input buffer.
	 */

	constructor(renderTarget, resize = true) {

		super("SavePass");

		this.setFullscreenMaterial(new CopyMaterial());

		this.needsSwap = false;

		/**
		 * The render target.
		 *
		 * @type {WebGLRenderTarget}
		 */

		this.renderTarget = renderTarget;

		if(renderTarget === undefined) {

			this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				stencilBuffer: false,
				depthBuffer: false
			});

			this.renderTarget.texture.name = "SavePass.Target";
			this.renderTarget.texture.generateMipmaps = false;

		}

		/**
		 * Indicates whether the render target should be resized automatically.
		 *
		 * @type {Boolean}
		 */

		this.resize = resize;

	}

	/**
	 * Saves the input buffer.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		this.getFullscreenMaterial().uniforms.inputBuffer.value = inputBuffer.texture;

		renderer.render(this.scene, this.camera, this.renderToScreen ? null : this.renderTarget);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		if(this.resize) {

			width = Math.max(1, width);
			height = Math.max(1, height);

			this.renderTarget.setSize(width, height);

		}

	}

}

/**
 * A shader pass.
 *
 * Renders any shader material as a fullscreen effect.
 *
 * This pass should not be used to create multiple chained effects. For a more
 * efficient solution, please refer to the {@link EffectPass}.
 */

class ShaderPass extends Pass {

	/**
	 * Constructs a new shader pass.
	 *
	 * @param {ShaderMaterial} material - A shader material.
	 * @param {String} [input="inputBuffer"] - The name of the input buffer uniform.
	 */

	constructor(material, input = "inputBuffer") {

		super("ShaderPass");

		this.setFullscreenMaterial(material);

		/**
		 * The input buffer uniform.
		 *
		 * @type {String}
		 * @private
		 */

		this.uniform = null;
		this.setInput(input);

	}

	/**
	 * Sets the name of the input buffer uniform.
	 *
	 * Most fullscreen materials modify texels from an input texture. This pass
	 * automatically assigns the main input buffer to the uniform identified by
	 * the given name.
	 *
	 * @param {String} input - The name of the input buffer uniform.
	 */

	setInput(input) {

		const material = this.getFullscreenMaterial();

		this.uniform = null;

		if(material !== null) {

			const uniforms = material.uniforms;

			if(uniforms[input] !== undefined) {

				this.uniform = uniforms[input];

			}

		}

	}

	/**
	 * Renders the effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, delta, stencilTest) {

		if(this.uniform !== null) {

			this.uniform.value = inputBuffer.texture;

		}

		renderer.render(this.scene, this.camera, this.renderToScreen ? null : outputBuffer);

	}

}

/**
 * The EffectComposer may be used in place of a normal WebGLRenderer.
 *
 * The auto clear behaviour of the provided renderer will be disabled to prevent
 * unnecessary clear operations.
 *
 * It is common practice to use a {@link RenderPass} as the first pass to
 * automatically clear the screen and render the scene to a texture for further
 * processing.
 *
 * @implements {Resizable}
 * @implements {Disposable}
 */

class EffectComposer {

	/**
	 * Constructs a new effect composer.
	 *
	 * @param {WebGLRenderer} [renderer] - The renderer that should be used.
	 * @param {Object} [options] - The options.
	 * @param {Boolean} [options.depthBuffer=true] - Whether the main render targets should have a depth buffer.
	 * @param {Boolean} [options.stencilBuffer=false] - Whether the main render targets should have a stencil buffer.
	 */

	constructor(renderer = null, options = {}) {

		const settings = Object.assign({
			depthBuffer: true,
			stencilBuffer: false
		}, options);

		/**
		 * The renderer.
		 *
		 * You may replace the renderer at any time by using
		 * {@link EffectComposer#replaceRenderer}.
		 *
		 * @type {WebGLRenderer}
		 */

		this.renderer = renderer;

		/**
		 * The input buffer.
		 *
		 * Reading from and writing to the same render target should be avoided.
		 * Therefore, two seperate yet identical buffers are used.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.inputBuffer = null;

		/**
		 * The output buffer.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.outputBuffer = null;

		if(this.renderer !== null) {

			this.renderer.autoClear = false;
			this.inputBuffer = this.createBuffer(settings.depthBuffer, settings.stencilBuffer);
			this.outputBuffer = this.inputBuffer.clone();

		}

		/**
		 * A copy pass used for copying masked scenes.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.copyPass = new ShaderPass(new CopyMaterial());

		/**
		 * The passes.
		 *
		 * @type {Pass[]}
		 * @private
		 */

		this.passes = [];

	}

	/**
	 * Replaces the current renderer with the given one. The DOM element of the
	 * current renderer will automatically be removed from its parent node and the
	 * DOM element of the new renderer will take its place.
	 *
	 * The auto clear mechanism of the provided renderer will be disabled.
	 *
	 * @param {WebGLRenderer} renderer - The new renderer.
	 * @return {WebGLRenderer} The old renderer.
	 */

	replaceRenderer(renderer) {

		const oldRenderer = this.renderer;

		let parent, oldSize, newSize;

		if(oldRenderer !== null && oldRenderer !== renderer) {

			this.renderer = renderer;
			this.renderer.autoClear = false;

			parent = oldRenderer.domElement.parentNode;
			oldSize = oldRenderer.getSize();
			newSize = renderer.getSize();

			if(parent !== null) {

				parent.removeChild(oldRenderer.domElement);
				parent.appendChild(renderer.domElement);

			}

			if(oldSize.width !== newSize.width || oldSize.height !== newSize.height) {

				this.setSize();

			}

		}

		return oldRenderer;

	}

	/**
	 * Retrieves the most relevant depth texture for the pass at the given index.
	 *
	 * @private
	 * @param {Number} index - The index of the pass that needs a depth texture.
	 * @return {DepthTexture} The depth texture, or null if there is none.
	 */

	getDepthTexture(index) {

		const passes = this.passes;

		let depthTexture = null;
		let inputBuffer = true;
		let i, pass;

		for(i = 0; i < index; ++i) {

			pass = passes[i];

			if(pass.needsSwap) {

				inputBuffer = !inputBuffer;

			} else if(pass instanceof RenderPass) {

				depthTexture = (inputBuffer ? this.inputBuffer : this.outputBuffer).depthTexture;

			}

		}

		return depthTexture;

	}

	/**
	 * Creates two depth texture attachments, one for the input buffer and one for
	 * the output buffer.
	 *
	 * Depth will be written to the depth texture when something is rendered into
	 * the respective render target and the involved materials have `depthWrite`
	 * enabled. Under normal circumstances, only a {@link RenderPass} will render
	 * depth.
	 *
	 * When a shader reads from a depth texture and writes to a render target that
	 * uses the same depth texture attachment, the depth information will be lost.
	 * This happens even if `depthWrite` is disabled. For that reason, two
	 * separate depth textures are used.
	 *
	 * @private
	 */

	createDepthTexture() {

		const depthTexture = new DepthTexture();

		if(this.inputBuffer.stencilBuffer) {

			depthTexture.format = DepthStencilFormat;
			depthTexture.type = UnsignedInt248Type;

		}

		this.inputBuffer.depthTexture = depthTexture;
		this.outputBuffer.depthTexture = depthTexture.clone();

	}

	/**
	 * Creates a new render target by replicating the renderer's canvas.
	 *
	 * The created render target uses a linear filter for texel minification and
	 * magnification. Its render texture format depends on whether the renderer
	 * uses the alpha channel. Mipmaps are disabled.
	 *
	 * @param {Boolean} depthBuffer - Whether the render target should have a depth buffer.
	 * @param {Boolean} stencilBuffer - Whether the render target should have a stencil buffer.
	 * @return {WebGLRenderTarget} A new render target that equals the renderer's canvas.
	 */

	createBuffer(depthBuffer, stencilBuffer) {

		const drawingBufferSize = this.renderer.getDrawingBufferSize();
		const alpha = this.renderer.context.getContextAttributes().alpha;

		const renderTarget = new WebGLRenderTarget(drawingBufferSize.width, drawingBufferSize.height, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: alpha ? RGBAFormat : RGBFormat,
			depthBuffer: depthBuffer,
			stencilBuffer: stencilBuffer
		});

		renderTarget.texture.name = "EffectComposer.Buffer";
		renderTarget.texture.generateMipmaps = false;

		return renderTarget;

	}

	/**
	 * Adds a pass, optionally at a specific index.
	 *
	 * @param {Pass} pass - A new pass.
	 * @param {Number} [index] - An index at which the pass should be inserted.
	 */

	addPass(pass, index) {

		const renderer = this.renderer;
		const drawingBufferSize = renderer.getDrawingBufferSize();

		pass.setSize(drawingBufferSize.width, drawingBufferSize.height);
		pass.initialize(renderer, renderer.context.getContextAttributes().alpha);

		if(index !== undefined) {

			this.passes.splice(index, 0, pass);

		} else {

			index = this.passes.push(pass) - 1;

		}

		if(pass.needsDepthTexture) {

			if(this.inputBuffer.depthTexture === null) {

				this.createDepthTexture();

			}

			pass.setDepthTexture(this.getDepthTexture(index));

		}

	}

	/**
	 * Removes a pass.
	 *
	 * @param {Pass} pass - The pass.
	 */

	removePass(pass) {

		this.passes.splice(this.passes.indexOf(pass), 1);

	}

	/**
	 * Renders all enabled passes in the order in which they were added.
	 *
	 * @param {Number} delta - The time between the last frame and the current one in seconds.
	 */

	render(delta) {

		const renderer = this.renderer;
		const copyPass = this.copyPass;

		let inputBuffer = this.inputBuffer;
		let outputBuffer = this.outputBuffer;

		let stencilTest = false;
		let context, state, buffer;

		for(const pass of this.passes) {

			if(pass.enabled) {

				pass.render(renderer, inputBuffer, outputBuffer, delta, stencilTest);

				if(pass.needsSwap) {

					if(stencilTest) {

						copyPass.renderToScreen = pass.renderToScreen;

						context = renderer.context;
						state = renderer.state;

						// Preserve the unaffected pixels.
						state.buffers.stencil.setFunc(context.NOTEQUAL, 1, 0xffffffff);
						copyPass.render(renderer, inputBuffer, outputBuffer, delta, stencilTest);
						state.buffers.stencil.setFunc(context.EQUAL, 1, 0xffffffff);

					}

					buffer = inputBuffer;
					inputBuffer = outputBuffer;
					outputBuffer = buffer;

				}

				if(pass instanceof MaskPass) {

					stencilTest = true;

				} else if(pass instanceof ClearMaskPass) {

					stencilTest = false;

				}

			}

		}

	}

	/**
	 * Sets the size of the buffers and the renderer's output canvas.
	 *
	 * Every pass will be informed of the new size. It's up to each pass how that
	 * information is used.
	 *
	 * If no width or height is specified, the render targets and passes will be
	 * updated with the current size of the renderer.
	 *
	 * @param {Number} [width] - The width.
	 * @param {Number} [height] - The height.
	 */

	setSize(width, height) {

		const renderer = this.renderer;

		let size, drawingBufferSize;

		if(width === undefined || height === undefined) {

			size = renderer.getSize();
			width = size.width; height = size.height;

		}

		// Update the logical render size.
		renderer.setSize(width, height);

		// The drawing buffer size takes the device pixel ratio into account.
		drawingBufferSize = renderer.getDrawingBufferSize();

		this.inputBuffer.setSize(drawingBufferSize.width, drawingBufferSize.height);
		this.outputBuffer.setSize(drawingBufferSize.width, drawingBufferSize.height);

		for(const pass of this.passes) {

			pass.setSize(drawingBufferSize.width, drawingBufferSize.height);

		}

	}

	/**
	 * Resets this composer by deleting all passes and creating new buffers.
	 */

	reset() {

		const renderTarget = this.createBuffer(
			this.inputBuffer.depthBuffer,
			this.inputBuffer.stencilBuffer
		);

		this.dispose();

		// Reanimate.
		this.inputBuffer = renderTarget;
		this.outputBuffer = renderTarget.clone();
		this.copyPass = new ShaderPass(new CopyMaterial());

	}

	/**
	 * Destroys this composer and all passes.
	 *
	 * This method deallocates all disposable objects created by the passes. It
	 * also deletes the main frame buffers of this composer.
	 */

	dispose() {

		for(const pass of this.passes) {

			pass.dispose();

		}

		this.passes = [];

		if(this.inputBuffer !== null) {

			this.inputBuffer.dispose();
			this.inputBuffer = null;

		}

		if(this.outputBuffer !== null) {

			this.outputBuffer.dispose();
			this.outputBuffer = null;

		}

		this.copyPass.dispose();

	}

}

/**
 * The Resizable contract.
 *
 * Implemented by objects that can be resized.
 *
 * @interface
 */

class Resizable {

	/**
	 * Sets the size of this object.
	 *
	 * @param {Number} width - The new width.
	 * @param {Number} height - The new height.
	 */

	setSize(width, height) {}

}

var fragment$9 = "uniform sampler2D texture;\r\n\r\n#ifdef ASPECT_CORRECTION\r\n\r\n\tvarying vec2 vUv2;\r\n\r\n#endif\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\t#ifdef ASPECT_CORRECTION\r\n\r\n\t\toutputColor = texture2D(texture, vUv2);\r\n\r\n\t#else\r\n\r\n\t\toutputColor = texture2D(texture, uv);\r\n\r\n\t#endif\r\n\r\n}\r\n";

/**
 * A bloom effect.
 *
 * This effect uses the fast Kawase convolution technique and a luminance filter
 * to blur bright highlights.
 */

class BloomEffect extends Effect {

	/**
	 * Constructs a new bloom effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
	 * @param {Number} [options.resolutionScale=0.5] - The render texture resolution scale, relative to the screen render size.
	 * @param {Number} [options.kernelSize=KernelSize.LARGE] - The blur kernel size.
	 * @param {Number} [options.distinction=1.0] - The luminance distinction factor. Raise this value to bring out the brighter elements in the scene.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.SCREEN,
			resolutionScale: 0.5,
			kernelSize: KernelSize.LARGE,
			distinction: 1.0
		}, options);

		super("BloomEffect", fragment$9, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["texture", new Uniform(null)]
			])

		});

		/**
		 * A render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTarget = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTarget.texture.name = "Bloom.Target";
		this.renderTarget.texture.generateMipmaps = false;

		this.uniforms.get("texture").value = this.renderTarget.texture;

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * A blur pass.
		 *
		 * @type {BlurPass}
		 * @private
		 */

		this.blurPass = new BlurPass(settings);

		/**
		 * A luminance shader pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.luminancePass = new ShaderPass(new LuminanceMaterial(true));

		this.distinction = settings.distinction;
		this.kernelSize = settings.kernelSize;

	}

	/**
	 * A texture that contains the intermediate result of this effect.
	 *
	 * This texture will be applied to the scene colors unless the blend function
	 * is set to `SKIP`.
	 *
	 * @type {Texture}
	 */

	get texture() {

		return this.renderTarget.texture;

	}

	/**
	 * Indicates whether dithering is enabled.
	 *
	 * @type {Boolean}
	 */

	get dithering() {

		return this.blurPass.dithering;

	}

	/**
	 * Enables or disables dithering.
	 *
	 * @type {Boolean}
	 */

	set dithering(value) {

		this.blurPass.dithering = value;

	}

	/**
	 * The blur kernel size.
	 *
	 * @type {KernelSize}
	 */

	get kernelSize() {

		return this.blurPass.kernelSize;

	}

	/**
	 * @type {KernelSize}
	 */

	set kernelSize(value) {

		this.blurPass.kernelSize = value;

	}

	/**
	 * The luminance distinction factor.
	 *
	 * @type {Number}
	 */

	get distinction() {

		return this.luminancePass.getFullscreenMaterial().uniforms.distinction.value;

	}

	/**
	 * @type {Number}
	 */

	set distinction(value = 1.0) {

		this.luminancePass.getFullscreenMaterial().uniforms.distinction.value = value;

	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 */

	getResolutionScale() {

		return this.blurPass.getResolutionScale();

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 */

	setResolutionScale(scale) {

		this.blurPass.setResolutionScale(scale);
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		const renderTarget = this.renderTarget;

		this.luminancePass.render(renderer, inputBuffer, renderTarget);
		this.blurPass.render(renderer, renderTarget, renderTarget);

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.blurPass.setSize(width, height);

		width = this.blurPass.width;
		height = this.blurPass.height;

		this.renderTarget.setSize(width, height);

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialize(renderer, alpha) {

		this.blurPass.initialize(renderer, alpha);

		if(!alpha) {

			this.renderTarget.texture.format = RGBFormat;

		}

	}

}

var fragment$a = "uniform float focus;\r\nuniform float dof;\r\nuniform float aperture;\r\nuniform float maxBlur;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\tvec2 aspectCorrection = vec2(1.0, aspect);\r\n\r\n\tfloat focusNear = clamp(focus - dof, 0.0, 1.0);\r\n\tfloat focusFar = clamp(focus + dof, 0.0, 1.0);\r\n\r\n\t// Calculate a DoF mask.\r\n\tfloat low = step(depth, focusNear);\r\n\tfloat high = step(focusFar, depth);\r\n\r\n\tfloat factor = (depth - focusNear) * low + (depth - focusFar) * high;\r\n\tvec2 dofBlur = vec2(clamp(factor * aperture, -maxBlur, maxBlur));\r\n\r\n\tvec2 dofblur9 = dofBlur * 0.9;\r\n\tvec2 dofblur7 = dofBlur * 0.7;\r\n\tvec2 dofblur4 = dofBlur * 0.4;\r\n\r\n\tvec4 color = inputColor;\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.0,   0.4 ) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.15,  0.37) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.29,  0.29) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.37,  0.15) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.40,  0.0 ) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.37, -0.15) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.29, -0.29) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.15, -0.37) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.15,  0.37) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.29,  0.29) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.37,  0.15) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.4,   0.0 ) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.37, -0.15) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.29, -0.29) * aspectCorrection) * dofBlur);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.15, -0.37) * aspectCorrection) * dofBlur);\r\n\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.15,  0.37) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.37,  0.15) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.37, -0.15) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.15, -0.37) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.15,  0.37) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.37,  0.15) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.37, -0.15) * aspectCorrection) * dofblur9);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.15, -0.37) * aspectCorrection) * dofblur9);\r\n\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.29,  0.29) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.40,  0.0 ) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.29, -0.29) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.29,  0.29) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.4,   0.0 ) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.29, -0.29) * aspectCorrection) * dofblur7);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.0,   0.4 ) * aspectCorrection) * dofblur7);\r\n\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.29,  0.29) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.4,   0.0 ) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.29, -0.29) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.0,  -0.4 ) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.29,  0.29) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.4,   0.0 ) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2(-0.29, -0.29) * aspectCorrection) * dofblur4);\r\n\tcolor += texture2D(inputBuffer, uv + (vec2( 0.0,   0.4 ) * aspectCorrection) * dofblur4);\r\n\r\n\toutputColor = color / 41.0;\r\n\r\n}\r\n";

/**
 * A depth of field (bokeh) shader effect.
 *
 * Original shader code by Martins Upitis:
 *  http://artmartinsh.blogspot.com/2010/02/glsl-lens-blur-filter-with-bokeh.html
 */

class BokehEffect extends Effect {

	/**
	 * Constructs a new bokeh effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.focus=0.5] - The focus distance ratio, ranging from 0.0 to 1.0.
	 * @param {Number} [options.dof=0.02] - Depth of field. An area in front of and behind the focal point that still appears sharp.
	 * @param {Number} [options.aperture=0.015] - Camera aperture scale. Bigger values for stronger blur and shallower depth of field.
	 * @param {Number} [options.maxBlur=1.0] - The maximum blur strength.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			focus: 0.5,
			dof: 0.02,
			aperture: 0.015,
			maxBlur: 1.0
		}, options);

		super("BokehEffect", fragment$a, {

			attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["focus", new Uniform(settings.focus)],
				["dof", new Uniform(settings.dof)],
				["aperture", new Uniform(settings.aperture)],
				["maxBlur", new Uniform(settings.maxBlur)]
			])

		});

	}

}

var fragment$b = "uniform float brightness;\r\nuniform float contrast;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec3 color = inputColor.rgb + vec3(brightness - 0.5);\r\n\r\n\tif(contrast > 0.0) {\r\n\r\n\t\tcolor /= vec3(1.0 - contrast);\r\n\r\n\t} else {\r\n\r\n\t\tcolor *= vec3(1.0 + contrast);\r\n\r\n\t}\r\n\r\n\toutputColor = vec4(min(color + vec3(0.5), 1.0), inputColor.a);\r\n\r\n}\r\n";

/**
 * A brightness/contrast effect.
 *
 * Reference: https://github.com/evanw/glfx.js
 */

class BrightnessContrastEffect extends Effect {

	/**
	 * Constructs a new brightness/contrast effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.brightness=0.0] - The brightness factor, ranging from -1 to 1, where 0 means no change.
	 * @param {Number} [options.contrast=0.0] - The contrast factor, ranging from -1 to 1, where 0 means no change.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			brightness: 0.0,
			contrast: 0.0
		}, options);

		super("BrightnessContrastEffect", fragment$b, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["brightness", new Uniform(settings.brightness)],
				["contrast", new Uniform(settings.contrast)]
			])

		});

	}

}

var fragment$c = "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tfloat sum = inputColor.r + inputColor.g + inputColor.b;\r\n\r\n\toutputColor = vec4(vec3(sum / 3.0), inputColor.a);\r\n\r\n}\r\n";

/**
 * A color average effect.
 */

class ColorAverageEffect extends Effect {

	/**
	 * Constructs a new color average effect.
	 *
	 * @param {BlendFunction} [blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 */

	constructor(blendFunction = BlendFunction.NORMAL) {

		super("ColorAverageEffect", fragment$c, { blendFunction });

	}

}

var fragment$d = "varying vec2 vUvR;\r\nvarying vec2 vUvB;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec4 color = inputColor;\r\n\r\n\tcolor.r = texture2D(inputBuffer, vUvR).r;\r\n\tcolor.b = texture2D(inputBuffer, vUvB).b;\r\n\r\n\toutputColor = color;\r\n\r\n}\r\n";

var vertex$6 = "uniform vec2 offset;\r\n\r\nvarying vec2 vUvR;\r\nvarying vec2 vUvB;\r\n\r\nvoid mainSupport() {\r\n\r\n\tvUvR = uv + offset;\r\n\tvUvB = uv - offset;\r\n\r\n}\r\n";

/**
 * A chromatic aberration effect.
 */

class ChromaticAberrationEffect extends Effect {

	/**
	 * Constructs a new chromatic aberration effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Vector2} [options.offset] - The color offset.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			offset: new Vector2(0.001, 0.0005)
		}, options);

		super("ChromaticAberrationEffect", fragment$d, {

			attributes: EffectAttribute.CONVOLUTION,
			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["offset", new Uniform(settings.offset)]
			]),

			vertexShader: vertex$6

		});

	}

	/**
	 * The color offset.
	 *
	 * @type {Vector2}
	 */

	get offset() {

		return this.uniforms.get("offset").value;

	}

	/**
	 * @type {Vector2}
	 */

	set offset(value) {

		this.uniforms.get("offset").value = value;

	}

}

var fragment$e = "void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\t#ifdef INVERTED\r\n\r\n\t\tvec3 color = vec3(1.0 - depth);\r\n\r\n\t#else\r\n\r\n\t\tvec3 color = vec3(depth);\r\n\r\n\t#endif\r\n\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * A depth visualization effect.
 *
 * Useful for debugging.
 */

class DepthEffect extends Effect {

	/**
	 * Constructs a new depth effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Boolean} [options.inverted=false] - Whether the depth values should be inverted.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			inverted: false
		}, options);

		super("DepthEffect", fragment$e, {

			attributes: EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction

		});

		this.inverted = settings.inverted;

	}

	/**
	 * Indicates whether depth will be inverted.
	 *
	 * @type {Boolean}
	 */

	get inverted() {

		return this.defines.has("INVERTED");

	}

	/**
	 * Enables or disables depth inversion.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set inverted(value) {

		value ? this.defines.set("INVERTED", "1") : this.defines.delete("INVERTED");

	}

}

var fragment$f = "uniform vec2 angle;\r\nuniform float scale;\r\n\r\nfloat pattern(const in vec2 uv) {\r\n\r\n\tvec2 point = scale * vec2(\r\n\t\tdot(angle.yx, vec2(uv.x, -uv.y)),\r\n\t\tdot(angle, uv)\r\n\t);\r\n\r\n\treturn (sin(point.x) * sin(point.y)) * 4.0;\r\n\r\n}\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec3 color = vec3(inputColor.rgb * 10.0 - 5.0 + pattern(uv * resolution));\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * A dot screen effect.
 */

class DotScreenEffect extends Effect {

	/**
	 * Constructs a new dot screen effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.angle=1.57] - The angle of the dot pattern.
	 * @param {Number} [options.scale=1.0] - The scale of the dot pattern.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			angle: Math.PI * 0.5,
			scale: 1.0
		}, options);

		super("DotScreenEffect", fragment$f, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["angle", new Uniform(new Vector2())],
				["scale", new Uniform(settings.scale)]
			])

		});

		this.setAngle(settings.angle);

	}

	/**
	 * Sets the pattern angle.
	 *
	 * @param {Number} [angle] - The angle of the dot pattern.
	 */

	setAngle(angle) {

		this.uniforms.get("angle").value.set(Math.sin(angle), Math.cos(angle));

	}

}

var fragment$g = "uniform float gamma;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\toutputColor = LinearToGamma(max(inputColor, 0.0), gamma);\r\n\r\n}\r\n";

/**
 * A gamma correction effect.
 */

class GammaCorrectionEffect extends Effect {

	/**
	 * Constructs a new gamma correction effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.gamma=2.0] - The gamma factor.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			gamma: 2.0
		}, options);

		super("GammaCorrectionEffect", fragment$g, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["gamma", new Uniform(settings.gamma)]
			])

		});

	}

}

var fragment$h = "uniform sampler2D perturbationMap;\r\n\r\nuniform bool active;\r\nuniform float columns;\r\nuniform float random;\r\nuniform vec2 seed;\r\nuniform vec2 distortion;\r\n\r\nvoid mainUv(inout vec2 uv) {\r\n\r\n\tif(active) {\r\n\r\n\t\tvec4 normal = texture2D(perturbationMap, uv * random * random);\r\n\r\n\t\tif(uv.y < distortion.x + columns && uv.y > distortion.x - columns * random) {\r\n\r\n\t\t\tfloat sx = clamp(ceil(seed.x), 0.0, 1.0);\r\n\t\t\tuv.y = sx * (1.0 - (uv.y + distortion.y)) + (1.0 - sx) * distortion.y;\r\n\r\n\t\t}\r\n\r\n\t\tif(uv.x < distortion.y + columns && uv.x > distortion.y - columns * random) {\r\n\r\n\t\t\tfloat sy = clamp(ceil(seed.y), 0.0, 1.0);\r\n\t\t\tuv.x = sy * distortion.x + (1.0 - sy) * (1.0 - (uv.x + distortion.x));\r\n\r\n\t\t}\r\n\r\n\t\tuv.x += normal.x * seed.x * (random * 0.2);\r\n\t\tuv.y += normal.y * seed.y * (random * 0.2);\r\n\r\n\t}\r\n\r\n}\r\n";

/**
 * A label for generated data textures.
 *
 * @type {String}
 * @private
 */

const generatedTexture = "Glitch.Generated";

/**
 * Returns a random float in the specified range.
 *
 * @private
 * @param {Number} low - The lowest possible value.
 * @param {Number} high - The highest possible value.
 * @return {Number} The random value.
 */

function randomFloat(low, high) {

	return low + Math.random() * (high - low);

}

/**
 * A glitch effect.
 *
 * This effect can influence the {@link ChromaticAberrationEffect}.
 *
 * Reference: https://github.com/staffantan/unityglitch
 *
 * Warning: This effect cannot be merged with convolution effects.
 */

class GlitchEffect extends Effect {

	/**
	 * Constructs a new glitch effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Vector2} [options.chromaticAberrationOffset] - A chromatic aberration offset. If provided, the glitch effect will influence this offset.
	 * @param {Vector2} [options.delay] - The minimum and maximum delay between glitch activations in seconds.
	 * @param {Vector2} [options.duration] - The minimum and maximum duration of a glitch in seconds.
	 * @param {Vector2} [options.strength] - The strength of weak and strong glitches.
	 * @param {Texture} [options.perturbationMap] - A perturbation map. If none is provided, a noise texture will be created.
	 * @param {Number} [options.dtSize=64] - The size of the generated noise map. Will be ignored if a perturbation map is provided.
	 * @param {Number} [options.columns=0.05] - The scale of the blocky glitch columns.
	 * @param {Number} [options.ratio=0.85] - The threshold for strong glitches.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			chromaticAberrationOffset: null,
			delay: new Vector2(1.5, 3.5),
			duration: new Vector2(0.6, 1.0),
			strength: new Vector2(0.3, 1.0),
			columns: 0.05,
			ratio: 0.85,
			perturbationMap: null,
			dtSize: 64
		}, options);

		super("GlitchEffect", fragment$h, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["perturbationMap", new Uniform(null)],
				["columns", new Uniform(settings.columns)],
				["active", new Uniform(false)],
				["random", new Uniform(0.02)],
				["seed", new Uniform(new Vector2())],
				["distortion", new Uniform(new Vector2())]
			])

		});

		/**
		 * The current perturbation map.
		 *
		 * @type {Texture}
		 * @private
		 */

		this.perturbationMap = null;

		this.setPerturbationMap((settings.perturbationMap === null) ?
			this.generatePerturbationMap(settings.dtSize) :
			settings.perturbationMap);

		this.perturbationMap.generateMipmaps = false;

		/**
		 * The minimum and maximum delay between glitch activations in seconds.
		 *
		 * @type {Vector2}
		 */

		this.delay = settings.delay;

		/**
		 * The minimum and maximum duration of a glitch in seconds.
		 *
		 * @type {Vector2}
		 */

		this.duration = settings.duration;

		/**
		 * A random glitch break point.
		 *
		 * @type {Number}
		 * @private
		 */

		this.breakPoint = new Vector2(
			randomFloat(this.delay.x, this.delay.y),
			randomFloat(this.duration.x, this.duration.y)
		);

		/**
		 * A time accumulator.
		 *
		 * @type {Number}
		 * @private
		 */

		this.time = 0;

		/**
		 * Random seeds.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.seed = this.uniforms.get("seed").value;

		/**
		 * A distortion vector.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.distortion = this.uniforms.get("distortion").value;

		/**
		 * The effect mode.
		 *
		 * @type {GlitchMode}
		 */

		this.mode = GlitchMode.SPORADIC;

		/**
		 * The strength of weak and strong glitches.
		 *
		 * @type {Vector2}
		 */

		this.strength = settings.strength;

		/**
		 * The threshold for strong glitches, ranging from 0 to 1 where 0 means no
		 * weak glitches and 1 means no strong ones. The default ratio of 0.85
		 * offers a decent balance.
		 *
		 * @type {Number}
		 */

		this.ratio = settings.ratio;

		/**
		 * The chromatic aberration offset.
		 *
		 * @type {Vector2}
		 */

		this.chromaticAberrationOffset = settings.chromaticAberrationOffset;

	}

	/**
	 * Indicates whether the glitch effect is currently active.
	 *
	 * @type {Boolean}
	 */

	get active() {

		return this.uniforms.get("active").value;

	}

	/**
	 * Returns the current perturbation map.
	 *
	 * @return {Texture} The current perturbation map.
	 */

	getPerturbationMap() {

		return this.perturbationMap;

	}

	/**
	 * Replaces the current perturbation map with the given one.
	 *
	 * The current map will be disposed if it was generated by this effect.
	 *
	 * @param {Texture} perturbationMap - The new perturbation map.
	 */

	setPerturbationMap(perturbationMap) {

		if(this.perturbationMap !== null && this.perturbationMap.name === generatedTexture) {

			this.perturbationMap.dispose();

		}

		perturbationMap.wrapS = perturbationMap.wrapT = RepeatWrapping;
		perturbationMap.magFilter = perturbationMap.minFilter = NearestFilter;

		this.perturbationMap = perturbationMap;
		this.uniforms.get("perturbationMap").value = perturbationMap;

	}

	/**
	 * Generates a perturbation map.
	 *
	 * @param {Number} [size=64] - The texture size.
	 * @return {DataTexture} The perturbation map.
	 */

	generatePerturbationMap(size = 64) {

		const pixels = size * size;
		const data = new Float32Array(pixels * 3);

		let i, x;

		for(i = 0; i < pixels; ++i) {

			x = Math.random();

			data[i * 3] = x;
			data[i * 3 + 1] = x;
			data[i * 3 + 2] = x;

		}

		const map = new DataTexture(data, size, size, RGBFormat, FloatType);
		map.name = generatedTexture;
		map.needsUpdate = true;

		return map;

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		const mode = this.mode;
		const breakPoint = this.breakPoint;
		const offset = this.chromaticAberrationOffset;
		const s = this.strength;

		let time = this.time;
		let active = false;
		let r = 0.0, a = 0.0;
		let trigger;

		if(mode !== GlitchMode.DISABLED) {

			if(mode === GlitchMode.SPORADIC) {

				time += delta;
				trigger = (time > breakPoint.x);

				if(time >= (breakPoint.x + breakPoint.y)) {

					breakPoint.set(
						randomFloat(this.delay.x, this.delay.y),
						randomFloat(this.duration.x, this.duration.y)
					);

					time = 0;

				}

			}

			r = Math.random();
			this.uniforms.get("random").value = r;

			if((trigger && r > this.ratio) || mode === GlitchMode.CONSTANT_WILD) {

				active = true;

				r *= s.y * 0.03;
				a = randomFloat(-Math.PI, Math.PI);

				this.seed.set(randomFloat(-s.y, s.y), randomFloat(-s.y, s.y));
				this.distortion.set(randomFloat(0.0, 1.0), randomFloat(0.0, 1.0));

			} else if(trigger || mode === GlitchMode.CONSTANT_MILD) {

				active = true;

				r *= s.x * 0.03;
				a = randomFloat(-Math.PI, Math.PI);

				this.seed.set(randomFloat(-s.x, s.x), randomFloat(-s.x, s.x));
				this.distortion.set(randomFloat(0.0, 1.0), randomFloat(0.0, 1.0));

			}

			this.time = time;

		}

		if(offset !== null) {

			if(active) {

				offset.set(Math.cos(a), Math.sin(a)).multiplyScalar(r);

			} else {

				offset.set(0.0, 0.0);

			}

		}

		this.uniforms.get("active").value = active;

	}

}

/**
 * A glitch mode enumeration.
 *
 * @type {Object}
 * @property {Number} DISABLED - No glitches.
 * @property {Number} SPORADIC - Sporadic glitches.
 * @property {Number} CONSTANT_MILD - Constant mild glitches.
 * @property {Number} CONSTANT_WILD - Constant wild glitches.
 */

const GlitchMode = {

	DISABLED: 0,
	SPORADIC: 1,
	CONSTANT_MILD: 2,
	CONSTANT_WILD: 3

};

/**
 * A vector.
 *
 * @type {Vector3}
 * @private
 */

const v = new Vector3();

/**
 * A god rays effect.
 */

class GodRaysEffect extends Effect {

	/**
	 * Constructs a new god rays effect.
	 *
	 * @param {Scene} scene - The main scene.
	 * @param {Camera} camera - The main camera.
	 * @param {Object3D} lightSource - The main light source.
	 * @param {Object} [options] - The options. See {@link GodRaysMaterial} for additional options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
	 * @param {Number} [options.resolutionScale=0.5] - The render texture resolution scale, relative to the screen render size.
	 * @param {Number} [options.samples=60.0] - The number of samples per pixel.
	 * @param {Number} [options.blur=true] - Whether the god rays should be blurred to reduce artifacts.
	 * @param {Number} [options.kernelSize=KernelSize.SMALL] - The blur kernel size. Has no effect if blur is disabled.
	 */

	constructor(scene, camera, lightSource, options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.SCREEN,
			resolutionScale: 0.5,
			samples: 60.0,
			blur: true,
			kernelSize: KernelSize.SMALL
		}, options);

		super("GodRaysEffect", fragment$9, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["texture", new Uniform(null)]
			])

		});

		/**
		 * The main scene.
		 *
		 * @type {Scene}
		 * @private
		 */

		this.scene = scene;

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.camera = camera;

		/**
		 * The light source.
		 *
		 * @type {Object3D}
		 */

		this.lightSource = lightSource;

		/**
		 * A scene that only contains the light source.
		 *
		 * @type {Scene}
		 * @private
		 */

		this.lightScene = new Scene();

		/**
		 * The light position in screen space.
		 *
		 * @type {Vector3}
		 * @private
		 */

		this.screenPosition = new Vector2();

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * A render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetX = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetX.texture.name = "GodRays.TargetX";
		this.renderTargetX.texture.generateMipmaps = false;

		this.uniforms.get("texture").value = this.renderTargetX.texture;

		/**
		 * A second render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetY = this.renderTargetX.clone();

		this.renderTargetY.texture.name = "GodRays.TargetY";

		/**
		 * A render target for the masked light scene.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetMask = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false
		});

		this.renderTargetMask.texture.name = "GodRays.Mask";
		this.renderTargetMask.texture.generateMipmaps = false;

		/**
		 * A pass that only renders the light source.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.renderPassLight = new RenderPass(this.lightScene, camera, {
			clearColor: new Color(0x000000)
		});

		/**
		 * A pass that renders the masked scene over the light source.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.renderPassMask = new RenderPass(scene, camera, {
			overrideMaterial: new MeshBasicMaterial({
				color: 0x000000,
				morphTargets: true,
				skinning: true
			})
		});

		this.renderPassMask.clear = false;

		/**
		 * A blur pass.
		 *
		 * @type {BlurPass}
		 * @private
		 */

		this.blurPass = new BlurPass(settings);

		/**
		 * A god rays pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.godRaysPass = new ShaderPass(new GodRaysMaterial(this.screenPosition, settings));

		this.blur = settings.blur;
		this.kernelSize = settings.kernelSize;
		this.samples = settings.samples;

	}

	/**
	 * A texture that contains the intermediate result of this effect.
	 *
	 * This texture will be applied to the scene colors unless the blend function
	 * is set to `SKIP`.
	 *
	 * @type {Texture}
	 */

	get texture() {

		return this.renderTargetX.texture;

	}

	/**
	 * The internal god rays material.
	 *
	 * @type {GodRaysMaterial}
	 */

	get godRaysMaterial() {

		return this.godRaysPass.getFullscreenMaterial();

	}

	/**
	 * Indicates whether dithering is enabled.
	 *
	 * @type {Boolean}
	 */

	get dithering() {

		return this.godRaysMaterial.dithering;

	}

	/**
	 * Enables or disables dithering.
	 *
	 * @type {Boolean}
	 */

	set dithering(value) {

		const material = this.godRaysMaterial;

		material.dithering = value;
		material.needsUpdate = true;

	}

	/**
	 * Indicates whether the god rays should be blurred to reduce artifacts.
	 *
	 * @type {Boolean}
	 */

	get blur() {

		return this.blurPass.enabled;

	}

	/**
	 * @type {Boolean}
	 */

	set blur(value) {

		this.blurPass.enabled = value;

	}

	/**
	 * The blur kernel size.
	 *
	 * @type {KernelSize}
	 */

	get kernelSize() {

		return this.blurPass.kernelSize;

	}

	/**
	 * @type {KernelSize}
	 */

	set kernelSize(value) {

		this.blurPass.kernelSize = value;

	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 */

	getResolutionScale() {

		return this.blurPass.getResolutionScale();

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 */

	setResolutionScale(scale) {

		this.blurPass.setResolutionScale(scale);
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * The number of samples per pixel.
	 *
	 * @type {Number}
	 */

	get samples() {

		return this.godRaysMaterial.samples;

	}

	/**
	 * This value must be carefully chosen. A higher value improves quality but
	 * also increases the GPU load.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		this.godRaysMaterial.samples = value;

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		const scene = this.scene;
		const lightSource = this.lightSource;
		const renderTargetMask = this.renderTargetMask;
		const renderTargetY = this.renderTargetY;

		let background, parent;

		// Compute the screen light position and translate it to [0.0, 1.0].
		v.copy(lightSource.position).project(this.camera);
		this.screenPosition.set(
			Math.max(0.0, Math.min(1.0, (v.x + 1.0) * 0.5)),
			Math.max(0.0, Math.min(1.0, (v.y + 1.0) * 0.5)),
		);

		parent = lightSource.parent;
		background = scene.background;
		scene.background = null;
		this.lightScene.add(lightSource);

		/* First, render the light source. Then render the scene into the same
		buffer using a mask override material with depth test enabled. */
		this.renderPassLight.render(renderer, renderTargetMask);
		this.renderPassMask.render(renderer, renderTargetMask);

		if(parent !== null) {

			parent.add(lightSource);

		}

		scene.background = background;
		inputBuffer = renderTargetMask;

		if(this.blur) {

			// Blur the masked scene to reduce artifacts.
			this.blurPass.render(renderer, inputBuffer, renderTargetY);
			inputBuffer = renderTargetY;

		}

		// Blur the masked scene along radial lines towards the light source.
		this.godRaysPass.render(renderer, inputBuffer, this.renderTargetX);

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.renderPassLight.setSize(width, height);
		this.renderPassMask.setSize(width, height);
		this.blurPass.setSize(width, height);
		this.godRaysPass.setSize(width, height);

		width = this.blurPass.width;
		height = this.blurPass.height;

		this.renderTargetMask.setSize(width, height);
		this.renderTargetX.setSize(width, height);
		this.renderTargetY.setSize(width, height);

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialize(renderer, alpha) {

		this.renderPassLight.initialize(renderer, alpha);
		this.renderPassMask.initialize(renderer, alpha);
		this.blurPass.initialize(renderer, alpha);
		this.godRaysPass.initialize(renderer, alpha);

		if(!alpha) {

			this.renderTargetMask.texture.format = RGBFormat;
			this.renderTargetX.texture.format = RGBFormat;
			this.renderTargetY.texture.format = RGBFormat;

		}

	}

}

var fragment$i = "uniform vec2 scale;\r\nuniform float lineWidth;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tfloat grid = 0.5 - max(abs(mod(uv.x * scale.x, 1.0) - 0.5), abs(mod(uv.y * scale.y, 1.0) - 0.5));\r\n\toutputColor = vec4(vec3(smoothstep(0.0, lineWidth, grid)), inputColor.a);\r\n\r\n}\r\n";

/**
 * A grid effect.
 */

class GridEffect extends Effect {

	/**
	 * Constructs a new grid effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.OVERLAY] - The blend function of this effect.
	 * @param {Number} [options.scale=1.0] - The scale of the grid pattern.
	 * @param {Number} [options.lineWidth=0.0] - The line width of the grid pattern.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.OVERLAY,
			scale: 1.0,
			lineWidth: 0.0
		}, options);

		super("GridEffect", fragment$i, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["scale", new Uniform(new Vector2())],
				["lineWidth", new Uniform(settings.lineWidth)]
			])

		});

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The grid scale, relative to the screen height.
		 *
		 * @type {Number}
		 * @private
		 */

		this.scale = Math.max(settings.scale, 1e-6);

		/**
		 * The grid line width.
		 *
		 * @type {Number}
		 * @private
		 */

		this.lineWidth = Math.max(settings.lineWidth, 0.0);

	}

	/**
	 * Returns the current grid scale.
	 *
	 * @return {Number} The grid scale.
	 */

	getScale() {

		return this.scale;

	}

	/**
	 * Sets the grid scale.
	 *
	 * @param {Number} scale - The new grid scale.
	 */

	setScale(scale) {

		this.scale = scale;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Returns the current grid line width.
	 *
	 * @return {Number} The grid line width.
	 */

	getLineWidth() {

		return this.lineWidth;

	}

	/**
	 * Sets the grid line width.
	 *
	 * @param {Number} lineWidth - The new grid line width.
	 */

	setLineWidth(lineWidth) {

		this.lineWidth = lineWidth;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);

		const aspect = width / height;
		const scale = this.scale * (height * 0.125);

		this.uniforms.get("scale").value.set(aspect * scale, scale);
		this.uniforms.get("lineWidth").value = (scale / height) + this.lineWidth;

	}

}

var fragment$j = "uniform vec3 hue;\r\nuniform float saturation;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\t// Hue.\r\n\tvec3 color = vec3(\r\n\t\tdot(inputColor.rgb, hue.xyz),\r\n\t\tdot(inputColor.rgb, hue.zxy),\r\n\t\tdot(inputColor.rgb, hue.yzx)\r\n\t);\r\n\r\n\t// Saturation.\r\n\tfloat average = (color.r + color.g + color.b) / 3.0;\r\n\tvec3 diff = average - color;\r\n\r\n\tif(saturation > 0.0) {\r\n\r\n\t\tcolor += diff * (1.0 - 1.0 / (1.001 - saturation));\r\n\r\n\t} else {\r\n\r\n\t\tcolor += diff * -saturation;\r\n\r\n\t}\r\n\r\n\toutputColor = vec4(min(color, 1.0), inputColor.a);\r\n\r\n}\r\n";

/**
 * A hue/saturation effect.
 *
 * Reference: https://github.com/evanw/glfx.js
 */

class HueSaturationEffect extends Effect {

	/**
	 * Constructs a new hue/saturation effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.hue=0.0] - The hue in radians.
	 * @param {Number} [options.saturation=0.0] - The saturation factor, ranging from -1 to 1, where 0 means no change.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			hue: 0.0,
			saturation: 0.0
		}, options);

		super("HueSaturationEffect", fragment$j, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["hue", new Uniform(new Vector3())],
				["saturation", new Uniform(settings.saturation)]
			])

		});

		this.setHue(settings.hue);

	}

	/**
	 * Sets the hue.
	 *
	 * @param {Number} hue - The hue in radians.
	 */

	setHue(hue) {

		const s = Math.sin(hue), c = Math.cos(hue);

		this.uniforms.get("hue").value.set(
			2.0 * c, -Math.sqrt(3.0) * s - c, Math.sqrt(3.0) * s - c
		).addScalar(1.0).divideScalar(3.0);

	}

}

var fragment$k = "void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec3 noise = vec3(rand(uv * time));\r\n\r\n\t#ifdef PREMULTIPLY\r\n\r\n\t\toutputColor = vec4(inputColor.rgb * noise, inputColor.a);\r\n\r\n\t#else\r\n\r\n\t\toutputColor = vec4(noise, inputColor.a);\r\n\r\n\t#endif\r\n\r\n}\r\n";

/**
 * A noise effect.
 */

class NoiseEffect extends Effect {

	/**
	 * Constructs a new noise effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
	 * @param {Boolean} [options.premultiply=false] - Whether the noise should be multiplied with the input color.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.SCREEN,
			premultiply: false
		}, options);

		super("NoiseEffect", fragment$k, { blendFunction: settings.blendFunction });

		this.premultiply = settings.premultiply;

	}

	/**
	 * Indicates whether the noise should be multiplied with the input color.
	 *
	 * @type {Boolean}
	 */

	get premultiply() {

		return this.defines.has("PREMULTIPLY");

	}

	/**
	 * Enables or disables noise premultiplication.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set premultiply(value) {

		value ? this.defines.set("PREMULTIPLY", "1") : this.defines.delete("PREMULTIPLY");

	}

}

var fragment$l = "uniform sampler2D edgeTexture;\r\nuniform sampler2D maskTexture;\r\n\r\nuniform vec3 visibleEdgeColor;\r\nuniform vec3 hiddenEdgeColor;\r\nuniform float pulse;\r\nuniform float edgeStrength;\r\n\r\n#ifdef USE_PATTERN\r\n\r\n\tuniform sampler2D patternTexture;\r\n\tvarying vec2 vUvPattern;\r\n\r\n#endif\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec2 edge = texture2D(edgeTexture, uv).rg;\r\n\tvec2 mask = texture2D(maskTexture, uv).rg;\r\n\r\n\t#ifndef X_RAY\r\n\r\n\t\tedge.y = 0.0;\r\n\r\n\t#endif\r\n\r\n\tedge *= (edgeStrength * mask.x * pulse);\r\n\tvec3 color = edge.x * visibleEdgeColor + edge.y * hiddenEdgeColor;\r\n\r\n\tfloat visibilityFactor = 0.0;\r\n\r\n\t#ifdef USE_PATTERN\r\n\r\n\t\tvec4 patternColor = texture2D(patternTexture, vUvPattern);\r\n\r\n\t\t#ifdef X_RAY\r\n\r\n\t\t\tfloat hiddenFactor = 0.5;\r\n\r\n\t\t#else\r\n\r\n\t\t\tfloat hiddenFactor = 0.0;\r\n\r\n\t\t#endif\r\n\r\n\t\tvisibilityFactor = (1.0 - mask.y > 0.0) ? 1.0 : hiddenFactor;\r\n\t\tvisibilityFactor *= (1.0 - mask.x) * patternColor.a;\r\n\t\tcolor += visibilityFactor * patternColor.rgb;\r\n\r\n\t#endif\r\n\r\n\toutputColor = vec4(color, max(max(edge.x, edge.y), visibilityFactor));\r\n\r\n}\r\n";

var vertex$7 = "uniform float patternScale;\r\n\r\nvarying vec2 vUvPattern;\r\n\r\nvoid mainSupport() {\r\n\r\n\tvUvPattern = uv * vec2(aspect, 1.0) * patternScale;\r\n\r\n}\r\n";

/**
 * An outline effect.
 */

class OutlineEffect extends Effect {

	/**
	 * Constructs a new outline effect.
	 *
	 * If you want dark outlines, remember to adjust the blend function.
	 *
	 * @param {Scene} scene - The main scene.
	 * @param {Camera} camera - The main camera.
	 * @param {Object} [options] - The options. See {@link BlurPass} and {@link OutlineEdgesMaterial} for additional parameters.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function.  Set this to `BlendFunction.ALPHA` for dark outlines.
	 * @param {Number} [options.patternTexture=null] - A pattern texture.
	 * @param {Number} [options.edgeStrength=1.0] - The edge strength.
	 * @param {Number} [options.pulseSpeed=0.0] - The pulse speed. A value of zero disables the pulse effect.
	 * @param {Number} [options.visibleEdgeColor=0xffffff] - The color of visible edges.
	 * @param {Number} [options.hiddenEdgeColor=0x22090a] - The color of hidden edges.
	 * @param {Boolean} [options.blur=false] - Whether the outline should be blurred.
	 * @param {Boolean} [options.xRay=true] - Whether hidden parts of selected objects should be visible.
	 */

	constructor(scene, camera, options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.SCREEN,
			patternTexture: null,
			edgeStrength: 1.0,
			pulseSpeed: 0.0,
			visibleEdgeColor: 0xffffff,
			hiddenEdgeColor: 0x22090a,
			blur: false,
			xRay: true
		}, options);

		super("OutlineEffect", fragment$l, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["maskTexture", new Uniform(null)],
				["edgeTexture", new Uniform(null)],
				["edgeStrength", new Uniform(settings.edgeStrength)],
				["visibleEdgeColor", new Uniform(new Color(settings.visibleEdgeColor))],
				["hiddenEdgeColor", new Uniform(new Color(settings.hiddenEdgeColor))],
				["pulse", new Uniform(1.0)]
			])

		});

		this.setPatternTexture(settings.patternTexture);
		this.xRay = settings.xRay;

		/**
		 * The main scene.
		 *
		 * @type {Scene}
		 * @private
		 */

		this.mainScene = scene;

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.mainCamera = camera;

		/**
		 * A depth render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetDepth = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter
		});

		this.renderTargetDepth.texture.name = "Outline.Depth";
		this.renderTargetDepth.texture.generateMipmaps = false;

		/**
		 * A render target for the outline mask.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetMask = this.renderTargetDepth.clone();

		this.renderTargetMask.texture.format = RGBFormat;
		this.renderTargetMask.texture.name = "Outline.Mask";

		this.uniforms.get("maskTexture").value = this.renderTargetMask.texture;

		/**
		 * A render target for the edge detection.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetEdges = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			depthBuffer: false,
			format: RGBFormat
		});

		this.renderTargetEdges.texture.name = "Outline.Edges";
		this.renderTargetEdges.texture.generateMipmaps = false;

		/**
		 * A render target for the blurred outline overlay.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetBlurredEdges = this.renderTargetEdges.clone();

		this.renderTargetBlurredEdges.texture.name = "Outline.BlurredEdges";

		/**
		 * A clear pass.
		 *
		 * @type {ClearPass}
		 * @private
		 */

		this.clearPass = new ClearPass({
			clearColor: new Color(0x000000),
			clearAlpha: 1.0
		});

		/**
		 * A depth pass.
		 *
		 * @type {DepthPass}
		 * @private
		 */

		this.depthPass = new DepthPass(this.mainScene, this.mainCamera);

		/**
		 * A depth comparison mask pass.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.maskPass = new RenderPass(this.mainScene, this.mainCamera, {
			overrideMaterial: new DepthComparisonMaterial(this.depthPass.renderTarget.texture, this.mainCamera),
			clearColor: new Color(0xffffff),
			clearAlpha: 1.0
		});

		/**
		 * A blur pass.
		 *
		 * @type {BlurPass}
		 * @private
		 */

		this.blurPass = new BlurPass(settings);

		this.kernelSize = settings.kernelSize;
		this.blur = settings.blur;

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * An outline edge detection pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.outlineEdgesPass = new ShaderPass(new OutlineEdgesMaterial(settings));
		this.outlineEdgesPass.getFullscreenMaterial().uniforms.maskTexture.value = this.renderTargetMask.texture;

		/**
		 * A list of objects to outline.
		 *
		 * @type {Object3D[]}
		 * @private
		 */

		this.selection = [];

		/**
		 * The current animation time.
		 *
		 * @type {Number}
		 * @private
		 */

		this.time = 0.0;

		/**
		 * The pulse speed. A value of zero disables the pulse effect.
		 *
		 * @type {Number}
		 */

		this.pulseSpeed = settings.pulseSpeed;

		/**
		 * A dedicated render layer for selected objects.
		 *
		 * This layer is set to 10 by default. If this collides with your own custom
		 * layers, please change it to a free layer before rendering!
		 *
		 * @type {Number}
		 */

		this.selectionLayer = 10;

		/**
		 * A clear flag.
		 *
		 * @type {Boolean}
		 * @private
		 */

		this.clear = false;

	}

	/**
	 * Indicates whether dithering is enabled.
	 *
	 * @type {Boolean}
	 */

	get dithering() {

		return this.blurPass.dithering;

	}

	/**
	 * Enables or disables dithering.
	 *
	 * @type {Boolean}
	 */

	set dithering(value) {

		this.blurPass.dithering = value;

	}

	/**
	 * The blur kernel size.
	 *
	 * @type {KernelSize}
	 */

	get kernelSize() {

		return this.blurPass.kernelSize;

	}

	/**
	 * @type {KernelSize}
	 */

	set kernelSize(value = KernelSize.VERY_SMALL) {

		this.blurPass.kernelSize = value;

	}

	/**
	 * Indicates whether the outlines should be blurred.
	 *
	 * @type {Boolean}
	 */

	get blur() {

		return this.blurPass.enabled;

	}

	/**
	 * @type {Boolean}
	 */

	set blur(value) {

		this.blurPass.enabled = value;

		this.uniforms.get("edgeTexture").value = value ?
			this.renderTargetBlurredEdges.texture :
			this.renderTargetEdges.texture;

	}

	/**
	 * Indicates whether X-Ray outlines are enabled.
	 *
	 * @type {Boolean}
	 */

	get xRay() {

		return this.defines.has("X_RAY");

	}

	/**
	 * Enables or disables X-Ray outlines.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set xRay(value) {

		value ? this.defines.set("X_RAY", "1") : this.defines.delete("X_RAY");

	}

	/**
	 * Sets the pattern texture.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing the
	 * texture.
	 *
	 * @param {Texture} texture - The new texture.
	 */

	setPatternTexture(texture) {

		if(texture !== null) {

			texture.wrapS = texture.wrapT = RepeatWrapping;

			this.defines.set("USE_PATTERN", "1");
			this.uniforms.set("patternScale", new Uniform(1.0));
			this.uniforms.set("patternTexture", new Uniform(texture));
			this.vertexShader = vertex$7;

		} else {

			this.defines.delete("USE_PATTERN");
			this.uniforms.delete("patternScale");
			this.uniforms.delete("patternTexture");
			this.vertexShader = null;

		}

	}

	/**
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 */

	getResolutionScale() {

		return this.blurPass.getResolutionScale();

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 */

	setResolutionScale(scale) {

		this.blurPass.setResolutionScale(scale);
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Clears the current selection and selects a list of objects.
	 *
	 * @param {Object3D[]} objects - The objects that should be outlined. This array will be copied.
	 * @return {OutlinePass} This pass.
	 */

	setSelection(objects) {

		const selection = objects.slice(0);
		const selectionLayer = this.selectionLayer;

		let i, l;

		this.clearSelection();

		for(i = 0, l = selection.length; i < l; ++i) {

			selection[i].layers.enable(selectionLayer);

		}

		this.selection = selection;

		return this;

	}

	/**
	 * Clears the list of selected objects.
	 *
	 * @return {OutlinePass} This pass.
	 */

	clearSelection() {

		const selection = this.selection;
		const selectionLayer = this.selectionLayer;

		let i, l;

		for(i = 0, l = selection.length; i < l; ++i) {

			selection[i].layers.disable(selectionLayer);

		}

		this.selection = [];
		this.time = 0.0;
		this.clear = true;

		return this;

	}

	/**
	 * Selects an object.
	 *
	 * @param {Object3D} object - The object that should be outlined.
	 * @return {OutlinePass} This pass.
	 */

	selectObject(object) {

		object.layers.enable(this.selectionLayer);
		this.selection.push(object);

		return this;

	}

	/**
	 * Deselects an object.
	 *
	 * @param {Object3D} object - The object that should no longer be outlined.
	 * @return {OutlinePass} This pass.
	 */

	deselectObject(object) {

		const selection = this.selection;
		const index = selection.indexOf(object);

		if(index >= 0) {

			selection[index].layers.disable(this.selectionLayer);
			selection.splice(index, 1);

			if(selection.length === 0) {

				this.time = 0.0;
				this.clear = true;

			}

		}

		return this;

	}

	/**
	 * Sets the visibility of all selected objects.
	 *
	 * @private
	 * @param {Boolean} visible - Whether the selected objects should be visible.
	 */

	setSelectionVisible(visible) {

		const selection = this.selection;

		let i, l;

		for(i = 0, l = selection.length; i < l; ++i) {

			if(visible) {

				selection[i].layers.enable(0);

			} else {

				selection[i].layers.disable(0);

			}

		}

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		const mainScene = this.mainScene;
		const mainCamera = this.mainCamera;
		const pulse = this.uniforms.get("pulse");

		const background = mainScene.background;
		const mask = mainCamera.layers.mask;

		if(this.selection.length > 0) {

			mainScene.background = null;
			pulse.value = 1.0;

			if(this.pulseSpeed > 0.0) {

				pulse.value = 0.625 + Math.cos(this.time * this.pulseSpeed * 10.0) * 0.375;
				this.time += delta;

			}

			// Render a custom depth texture and ignore selected objects.
			this.setSelectionVisible(false);
			this.depthPass.render(renderer);
			this.setSelectionVisible(true);

			// Compare the depth of the selected objects with the depth texture.
			mainCamera.layers.mask = 1 << this.selectionLayer;
			this.maskPass.render(renderer, this.renderTargetMask);

			// Restore the camera layer mask and the scene background.
			mainCamera.layers.mask = mask;
			mainScene.background = background;

			// Detect the outline.
			this.outlineEdgesPass.render(renderer, null, this.renderTargetEdges);

			if(this.blur) {

				this.blurPass.render(renderer, this.renderTargetEdges, this.renderTargetBlurredEdges);

			}

		} else if(this.clear) {

			this.clearPass.render(renderer, this.renderTargetMask);

			this.clear = false;

		}

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.renderTargetMask.setSize(width, height);

		this.blurPass.setSize(width, height);
		this.maskPass.setSize(width, height);
		this.depthPass.setSize(width, height);

		width = this.blurPass.width;
		height = this.blurPass.height;

		this.renderTargetEdges.setSize(width, height);
		this.renderTargetBlurredEdges.setSize(width, height);

		this.outlineEdgesPass.getFullscreenMaterial().setTexelSize(1.0 / width, 1.0 / height);

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialize(renderer, alpha) {

		this.depthPass.initialize(renderer, alpha);
		this.maskPass.initialize(renderer, alpha);
		this.blurPass.initialize(renderer, alpha);

	}

}

var fragment$m = "uniform bool active;\r\nuniform vec2 d;\r\n\r\nvoid mainUv(inout vec2 uv) {\r\n\r\n\tif(active) {\r\n\r\n\t\tuv = vec2(\r\n\t\t\td.x * (floor(uv.x / d.x) + 0.5),\r\n\t\t\td.y * (floor(uv.y / d.y) + 0.5)\r\n\t\t);\r\n\r\n\t}\r\n\r\n}\r\n";

/**
 * A pixelation effect.
 *
 * Warning: This effect cannot be merged with convolution effects.
 */

class PixelationEffect extends Effect {

	/**
	 * Constructs a new pixelation effect.
	 *
	 * @param {Object} [granularity=30.0] - The pixel granularity.
	 */

	constructor(granularity = 30.0) {

		super("PixelationEffect", fragment$m, {

			uniforms: new Map([
				["active", new Uniform(false)],
				["d", new Uniform(new Vector2())]
			])

		});

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The pixel granularity.
		 *
		 * @type {Number}
		 * @private
		 */

		this.granularity = granularity;

	}

	/**
	 * Returns the pixel granularity.
	 *
	 * @return {Number} The granularity.
	 */

	getGranularity() {

		return this.granularity;

	}

	/**
	 * Sets the pixel granularity.
	 *
	 * A higher value yields coarser visuals.
	 *
	 * @param {Number} granularity - The new granularity.
	 */

	setGranularity(granularity) {

		granularity = Math.floor(granularity);

		if(granularity % 2 > 0) {

			granularity += 1;

		}

		const uniforms = this.uniforms;
		uniforms.get("active").value = (granularity > 0.0);
		uniforms.get("d").value.set(granularity, granularity)
			.divide(this.resolution);

		this.granularity = granularity;

	}

	/**
	 * Updates the granularity.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.setGranularity(this.granularity);

	}

}

var fragment$n = "uniform float focus;\r\nuniform float focalLength;\r\nuniform float maxBlur;\r\nuniform float luminanceThreshold;\r\nuniform float luminanceGain;\r\nuniform float bias;\r\nuniform float fringe;\r\n\r\n#ifdef MANUAL_DOF\r\n\r\n\tuniform vec4 dof;\r\n\r\n#endif\r\n\r\n#ifdef PENTAGON\r\n\r\n\tfloat pentagon(const in vec2 coords) {\r\n\r\n\t\tconst vec4 HS0 = vec4( 1.0,          0.0,         0.0, 1.0);\r\n\t\tconst vec4 HS1 = vec4( 0.309016994,  0.951056516, 0.0, 1.0);\r\n\t\tconst vec4 HS2 = vec4(-0.809016994,  0.587785252, 0.0, 1.0);\r\n\t\tconst vec4 HS3 = vec4(-0.809016994, -0.587785252, 0.0, 1.0);\r\n\t\tconst vec4 HS4 = vec4( 0.309016994, -0.951056516, 0.0, 1.0);\r\n\t\tconst vec4 HS5 = vec4( 0.0,          0.0,         1.0, 1.0);\r\n\r\n\t\tconst vec4 ONE = vec4(1.0);\r\n\r\n\t\tconst float P_FEATHER = 0.4;\r\n\t\tconst float N_FEATHER = -P_FEATHER;\r\n\r\n\t\tfloat inOrOut = -4.0;\r\n\r\n\t\tvec4 P = vec4(coords, vec2(RINGS_FLOAT - 1.3));\r\n\r\n\t\tvec4 dist = vec4(\r\n\t\t\tdot(P, HS0),\r\n\t\t\tdot(P, HS1),\r\n\t\t\tdot(P, HS2),\r\n\t\t\tdot(P, HS3)\r\n\t\t);\r\n\r\n\t\tdist = smoothstep(N_FEATHER, P_FEATHER, dist);\r\n\r\n\t\tinOrOut += dot(dist, ONE);\r\n\r\n\t\tdist.x = dot(P, HS4);\r\n\t\tdist.y = HS5.w - abs(P.z);\r\n\r\n\t\tdist = smoothstep(N_FEATHER, P_FEATHER, dist);\r\n\t\tinOrOut += dist.x;\r\n\r\n\t\treturn clamp(inOrOut, 0.0, 1.0);\r\n\r\n\t}\r\n\r\n#endif\r\n\r\nvec3 processTexel(const in vec2 coords, const in float blur) {\r\n\r\n\tvec2 scale = texelSize * fringe * blur;\r\n\r\n\tvec3 c = vec3(\r\n\t\ttexture2D(inputBuffer, coords + vec2(0.0, 1.0) * scale).r,\r\n\t\ttexture2D(inputBuffer, coords + vec2(-0.866, -0.5) * scale).g,\r\n\t\ttexture2D(inputBuffer, coords + vec2(0.866, -0.5) * scale).b\r\n\t);\r\n\r\n\t// Calculate the luminance of the constructed color.\r\n\tfloat luminance = linearToRelativeLuminance(c);\r\n\tfloat threshold = max((luminance - luminanceThreshold) * luminanceGain, 0.0);\r\n\r\n\treturn c + mix(vec3(0.0), c, threshold * blur);\r\n\r\n}\r\n\r\nfloat gather(const in float i, const in float j, const in float ringSamples,\r\n\tconst in vec2 uv, const in vec2 blurFactor, const in float blur, inout vec3 color) {\r\n\r\n\tfloat step = PI2 / ringSamples;\r\n\tvec2 wh = vec2(cos(j * step) * i, sin(j * step) * i);\r\n\r\n\t#ifdef PENTAGON\r\n\r\n\t\tfloat p = pentagon(wh);\r\n\r\n\t#else\r\n\r\n\t\tfloat p = 1.0;\r\n\r\n\t#endif\r\n\r\n\tcolor += processTexel(wh * blurFactor + uv, blur) * mix(1.0, i / RINGS_FLOAT, bias) * p;\r\n\r\n\treturn mix(1.0, i / RINGS_FLOAT, bias) * p;\r\n\r\n}\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\t// Translate depth into world space units.\r\n\tfloat linearDepth = (-cameraFar * cameraNear / (depth * (cameraFar - cameraNear) - cameraFar));\r\n\r\n\t#ifdef MANUAL_DOF\r\n\r\n\t\tfloat focalPlane = linearDepth - focus;\r\n\t\tfloat farDoF = (focalPlane - dof.z) / dof.w;\r\n\t\tfloat nearDoF = (-focalPlane - dof.x) / dof.y;\r\n\r\n\t\tfloat blur = (focalPlane > 0.0) ? farDoF : nearDoF;\r\n\r\n\t#else\r\n\r\n\t\tconst float CIRCLE_OF_CONFUSION = 0.03; // 35mm film = 0.03mm CoC.\r\n\r\n\t\tfloat focalPlaneMM = focus * 1000.0;\r\n\t\tfloat depthMM = linearDepth * 1000.0;\r\n\r\n\t\tfloat focalPlane = (depthMM * focalLength) / (depthMM - focalLength);\r\n\t\tfloat farDoF = (focalPlaneMM * focalLength) / (focalPlaneMM - focalLength);\r\n\t\tfloat nearDoF = (focalPlaneMM - focalLength) / (focalPlaneMM * focus * CIRCLE_OF_CONFUSION);\r\n\r\n\t\tfloat blur = abs(focalPlane - farDoF) * nearDoF;\r\n\r\n\t#endif\r\n\r\n\tconst int MAX_RING_SAMPLES = RINGS_INT * SAMPLES_INT;\r\n\r\n\tblur = clamp(blur, 0.0, 1.0);\r\n\tvec3 color = inputColor.rgb;\r\n\r\n\tif(blur >= 0.05) {\r\n\r\n\t\tvec2 blurFactor = blur * maxBlur * texelSize;\r\n\r\n\t\tfloat s = 1.0;\r\n\t\tint ringSamples;\r\n\r\n\t\tfor(int i = 1; i <= RINGS_INT; i++) {\r\n\r\n\t\t\tringSamples = i * SAMPLES_INT;\r\n\r\n\t\t\tfor(int j = 0; j < MAX_RING_SAMPLES; j++) {\r\n\r\n\t\t\t\tif(j >= ringSamples) {\r\n\r\n\t\t\t\t\tbreak;\r\n\r\n\t\t\t\t}\r\n\r\n\t\t\t\ts += gather(float(i), float(j), float(ringSamples), uv, blurFactor, blur, color);\r\n\r\n\t\t\t}\r\n\r\n\t\t}\r\n\r\n\t\tcolor /= s;\r\n\r\n\t}\r\n\r\n\t#ifdef SHOW_FOCUS\r\n\r\n\t\tfloat edge = 0.002 * linearDepth;\r\n\t\tfloat m = clamp(smoothstep(0.0, edge, blur), 0.0, 1.0);\r\n\t\tfloat e = clamp(smoothstep(1.0 - edge, 1.0, blur), 0.0, 1.0);\r\n\r\n\t\tcolor = mix(color, vec3(1.0, 0.5, 0.0), (1.0 - m) * 0.6);\r\n\t\tcolor = mix(color, vec3(0.0, 0.5, 1.0), ((1.0 - e) - (1.0 - m)) * 0.2);\r\n\r\n\t#endif\r\n\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * Depth of Field shader v2.4.
 *
 * Yields more realistic results but is also more demanding.
 *
 * Original shader code by Martins Upitis:
 *  http://blenderartists.org/forum/showthread.php?237488-GLSL-depth-of-field-with-bokeh-v2-4-(update)
 */

class RealisticBokehEffect extends Effect {

	/**
	 * Constructs a new bokeh effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.focus=0.5] - The focus distance ratio, ranging from 0.0 to 1.0.
	 * @param {Number} [options.focalLength=24.0] - The focal length of the main camera.
	 * @param {Number} [options.luminanceThreshold=0.5] - A luminance threshold.
	 * @param {Number} [options.luminanceGain=2.0] - A luminance gain factor.
	 * @param {Number} [options.bias=0.5] - A blur bias.
	 * @param {Number} [options.fringe=0.7] - A blur offset.
	 * @param {Number} [options.maxBlur=1.0] - The maximum blur strength.
	 * @param {Boolean} [options.rings=3] - The number of blur iterations.
	 * @param {Boolean} [options.samples=2] - The amount of samples taken per ring.
	 * @param {Boolean} [options.showFocus=false] - Whether the focal point should be highlighted. Useful for debugging.
	 * @param {Boolean} [options.manualDoF=false] - Enables manual control over the depth of field.
	 * @param {Boolean} [options.pentagon=false] - Enables pentagonal blur shapes. Requires a high number of rings and samples.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			focus: 0.5,
			focalLength: 24.0,
			luminanceThreshold: 0.5,
			luminanceGain: 2.0,
			bias: 0.5,
			fringe: 0.7,
			maxBlur: 1.0,
			rings: 3,
			samples: 2,
			showFocus: false,
			manualDoF: false,
			pentagon: false
		}, options);

		super("RealisticBokehEffect", fragment$n, {

			attributes: EffectAttribute.CONVOLUTION | EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["focus", new Uniform(settings.focus)],
				["focalLength", new Uniform(settings.focalLength)],
				["luminanceThreshold", new Uniform(settings.luminanceThreshold)],
				["luminanceGain", new Uniform(settings.luminanceGain)],
				["bias", new Uniform(settings.bias)],
				["fringe", new Uniform(settings.fringe)],
				["maxBlur", new Uniform(settings.maxBlur)]
			])

		});

		this.rings = settings.rings;
		this.samples = settings.samples;
		this.showFocus = settings.showFocus;
		this.manualDoF = settings.manualDoF;
		this.pentagon = settings.pentagon;

	}

	/**
	 * The amount of blur iterations.
	 *
	 * @type {Number}
	 */

	get rings() {

		return Number.parseInt(this.defines.get("RINGS_INT"));

	}

	/**
	 * Sets the amount of blur iterations.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set rings(value) {

		value = Math.floor(value);

		this.defines.set("RINGS_INT", value.toFixed(0));
		this.defines.set("RINGS_FLOAT", value.toFixed(1));

	}

	/**
	 * The amount of blur samples per ring.
	 *
	 * @type {Number}
	 */

	get samples() {

		return Number.parseInt(this.defines.get("SAMPLES_INT"));

	}

	/**
	 * Sets the amount of blur samples per ring.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		value = Math.floor(value);

		this.defines.set("SAMPLES_INT", value.toFixed(0));
		this.defines.set("SAMPLES_FLOAT", value.toFixed(1));

	}

	/**
	 * Indicates whether the focal point will be highlighted.
	 *
	 * @type {Boolean}
	 */

	get showFocus() {

		return this.defines.has("SHOW_FOCUS");

	}

	/**
	 * Enables or disables focal point highlighting.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set showFocus(value) {

		value ? this.defines.set("SHOW_FOCUS", "1") : this.defines.delete("SHOW_FOCUS");

	}

	/**
	 * Indicates whether the Depth of Field should be calculated manually.
	 *
	 * If enabled, the Depth of Field can be adjusted via the `dof` uniform.
	 *
	 * @type {Boolean}
	 */

	get manualDoF() {

		return this.defines.has("MANUAL_DOF");

	}

	/**
	 * Enables or disables manual Depth of Field.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set manualDoF(value) {

		if(value) {

			this.defines.set("MANUAL_DOF", "1");
			this.uniforms.set("dof", new Uniform(new Vector4(0.2, 1.0, 0.2, 2.0)));

		} else {

			this.defines.delete("MANUAL_DOF");
			this.uniforms.delete("dof");

		}

	}

	/**
	 * Indicates whether the blur shape should be pentagonal.
	 *
	 * @type {Boolean}
	 */

	get pentagon() {

		return this.defines.has("PENTAGON");

	}

	/**
	 * Enables or disables pentagonal blur.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set pentagon(value) {

		value ? this.defines.set("PENTAGON", "1") : this.defines.delete("PENTAGON");

	}

}

var fragment$o = "uniform float count;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec2 sl = vec2(sin(uv.y * count), cos(uv.y * count));\r\n\tvec3 scanlines = vec3(sl.x, sl.y, sl.x);\r\n\r\n\toutputColor = vec4(scanlines, inputColor.a);\r\n\r\n}\r\n";

/**
 * A scanline effect.
 */

class ScanlineEffect extends Effect {

	/**
	 * Constructs a new scanline effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.OVERLAY] - The blend function of this effect.
	 * @param {Number} [options.density=1.25] - The scanline density.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.OVERLAY,
			density: 1.25
		}, options);

		super("ScanlineEffect", fragment$o, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["count", new Uniform(0.0)]
			])

		});

		/**
		 * The original resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2();

		/**
		 * The amount of scanlines, relative to the screen height.
		 *
		 * @type {Number}
		 * @private
		 */

		this.density = settings.density;

	}

	/**
	 * Returns the current scanline density.
	 *
	 * @return {Number} The scanline density.
	 */

	getDensity() {

		return this.density;

	}

	/**
	 * Sets the scanline density.
	 *
	 * @param {Number} density - The new scanline density.
	 */

	setDensity(density) {

		this.density = density;
		this.setSize(this.resolution.x, this.resolution.y);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.uniforms.get("count").value = Math.round(height * this.density);

	}

}

var fragment$p = "uniform bool active;\r\nuniform vec2 center;\r\nuniform float waveSize;\r\nuniform float radius;\r\nuniform float maxRadius;\r\nuniform float amplitude;\r\n\r\nvarying float vSize;\r\n\r\nvoid mainUv(inout vec2 uv) {\r\n\r\n\tif(active) {\r\n\r\n\t\tvec2 aspectCorrection = vec2(aspect, 1.0);\r\n\t\tvec2 difference = uv * aspectCorrection - center * aspectCorrection;\r\n\t\tfloat distance = sqrt(dot(difference, difference)) * vSize;\r\n\r\n\t\tif(distance > radius) {\r\n\r\n\t\t\tif(distance < radius + waveSize) {\r\n\r\n\t\t\t\tfloat angle = (distance - radius) * PI2 / waveSize;\r\n\t\t\t\tfloat cosSin = (1.0 - cos(angle)) * 0.5;\r\n\r\n\t\t\t\tfloat extent = maxRadius + waveSize;\r\n\t\t\t\tfloat decay = max(extent - distance * distance, 0.0) / extent;\r\n\r\n\t\t\t\tuv -= ((cosSin * amplitude * difference) / distance) * decay;\r\n\r\n\t\t\t}\r\n\r\n\t\t}\r\n\r\n\t}\r\n\r\n}\r\n";

var vertex$8 = "uniform float size;\r\nuniform float cameraDistance;\r\n\r\nvarying float vSize;\r\n\r\nvoid mainSupport() {\r\n\r\n\tvSize = (0.1 * cameraDistance) / size;\r\n\r\n}\r\n";

/**
 * Half PI.
 *
 * @type {Number}
 * @private
 */

const HALF_PI = Math.PI * 0.5;

/**
 * A vector.
 *
 * @type {Vector3}
 * @private
 */

const v$1 = new Vector3();

/**
 * A vector.
 *
 * @type {Vector3}
 * @private
 */

const ab = new Vector3();

/**
 * A shock wave effect.
 *
 * Based on a Gist by Jean-Philippe Sarda:
 *  https://gist.github.com/jpsarda/33cea67a9f2ecb0a0eda
 *
 * Warning: This effect cannot be merged with convolution effects.
 */

class ShockWaveEffect extends Effect {

	/**
	 * Constructs a new shock wave effect.
	 *
	 * @param {Camera} camera - The main camera.
	 * @param {Vector3} [epicenter] - The world position of the shock wave epicenter.
	 * @param {Object} [options] - The options.
	 * @param {Number} [options.speed=2.0] - The animation speed.
	 * @param {Number} [options.maxRadius=1.0] - The extent of the shock wave.
	 * @param {Number} [options.waveSize=0.2] - The wave size.
	 * @param {Number} [options.amplitude=0.05] - The distortion amplitude.
	 */

	constructor(camera, epicenter = new Vector3(), options = {}) {

		const settings = Object.assign({
			speed: 2.0,
			maxRadius: 1.0,
			waveSize: 0.2,
			amplitude: 0.05
		}, options);

		super("ShockWaveEffect", fragment$p, {

			uniforms: new Map([
				["active", new Uniform(false)],
				["center", new Uniform(new Vector2(0.5, 0.5))],
				["cameraDistance", new Uniform(1.0)],
				["size", new Uniform(1.0)],
				["radius", new Uniform(-settings.waveSize)],
				["maxRadius", new Uniform(settings.maxRadius)],
				["waveSize", new Uniform(settings.waveSize)],
				["amplitude", new Uniform(settings.amplitude)]
			]),

			vertexShader: vertex$8

		});

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 */

		this.camera = camera;

		/**
		 * The epicenter.
		 *
		 * @type {Vector3}
		 * @example shockWavePass.epicenter = myMesh.position;
		 */

		this.epicenter = epicenter;

		/**
		 * The object position in screen space.
		 *
		 * @type {Vector3}
		 * @private
		 */

		this.screenPosition = this.uniforms.get("center").value;

		/**
		 * The speed of the shock wave animation.
		 *
		 * @type {Number}
		 */

		this.speed = settings.speed;

		/**
		 * A time accumulator.
		 *
		 * @type {Number}
		 * @private
		 */

		this.time = 0.0;

		/**
		 * Indicates whether the shock wave animation is active.
		 *
		 * @type {Boolean}
		 * @private
		 */

		this.active = false;

	}

	/**
	 * Emits the shock wave.
	 */

	explode() {

		this.time = 0.0;
		this.active = true;
		this.uniforms.get("active").value = true;

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		const epicenter = this.epicenter;
		const camera = this.camera;
		const uniforms = this.uniforms;

		let radius;

		if(this.active) {

			const waveSize = uniforms.get("waveSize").value;

			// Calculate direction vectors.
			camera.getWorldDirection(v$1);
			ab.copy(camera.position).sub(epicenter);

			// Don't render the effect if the object is behind the camera.
			if(v$1.angleTo(ab) > HALF_PI) {

				// Scale the effect based on distance to the object.
				uniforms.get("cameraDistance").value = camera.position.distanceTo(epicenter);

				// Calculate the screen position of the epicenter.
				v$1.copy(epicenter).project(camera);
				this.screenPosition.set((v$1.x + 1.0) * 0.5, (v$1.y + 1.0) * 0.5);

			}

			// Update the shock wave radius based on time.
			this.time += delta * this.speed;
			radius = this.time - waveSize;
			uniforms.get("radius").value = radius;

			if(radius >= (uniforms.get("maxRadius").value + waveSize) * 2.0) {

				this.active = false;
				uniforms.get("active").value = false;

			}


		}

	}

}

var fragment$q = "uniform float intensity;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tvec3 color = vec3(\r\n\t\tdot(inputColor.rgb, vec3(1.0 - 0.607 * intensity, 0.769 * intensity, 0.189 * intensity)),\r\n\t\tdot(inputColor.rgb, vec3(0.349 * intensity, 1.0 - 0.314 * intensity, 0.168 * intensity)),\r\n\t\tdot(inputColor.rgb, vec3(0.272 * intensity, 0.534 * intensity, 1.0 - 0.869 * intensity))\r\n\t);\r\n\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * A sepia effect.
 */

class SepiaEffect extends Effect {

	/**
	 * Constructs a new sepia effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.intensity=1.0] - The intensity of the effect.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			intensity: 1.0
		}, options);

		super("SepiaEffect", fragment$q, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["intensity", new Uniform(settings.intensity)]
			])

		});

	}

}

// Generated with SMAASearchImageData.generate().toCanvas().toDataURL(), not cropped, low dynamic range.
var searchImageDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEIAAAAhCAAAAABIXyLAAAAAOElEQVRIx2NgGAWjYBSMglEwEICREYRgFBZBqDCSLA2MGPUIVQETE9iNUAqLR5gIeoQKRgwXjwAAGn4AtaFeYLEAAAAASUVORK5CYII";

// Generated with SMAAAreaImageData.generate().toCanvas().toDataURL().
var areaImageDataURL = "data:image/png;base64,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";

var fragment$r = "uniform sampler2D weightMap;\r\n\r\nvarying vec2 vOffset0;\r\nvarying vec2 vOffset1;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\t// Fetch the blending weights for the current pixel.\r\n\tvec4 a;\r\n\ta.rb = texture2D(weightMap, uv).rb;\r\n\ta.g = texture2D(weightMap, vOffset1).g;\r\n\ta.a = texture2D(weightMap, vOffset0).a;\r\n\r\n\tvec4 color = inputColor;\r\n\r\n\t// Ignore tiny blending weights.\r\n\tif(dot(a, vec4(1.0)) >= 1e-5) {\r\n\r\n\t\t/* Up to four lines can be crossing a pixel (one through each edge).\r\n\t\tThe line with the maximum weight for each direction is favoured. */\r\n\r\n\t\tvec2 offset = vec2(\r\n\t\t\ta.a > a.b ? a.a : -a.b,\t// Left vs. right.\r\n\t\t\ta.g > a.r ? -a.g : a.r\t// Top vs. bottom (changed signs).\r\n\t\t);\r\n\r\n\t\t// Go in the direction with the maximum weight (horizontal vs. vertical).\r\n\t\tif(abs(offset.x) > abs(offset.y)) {\r\n\r\n\t\t\toffset.y = 0.0;\r\n\r\n\t\t} else {\r\n\r\n\t\t\toffset.x = 0.0;\r\n\r\n\t\t}\r\n\r\n\t\t// Fetch the opposite color and lerp by hand.\r\n\t\tvec4 oppositeColor = texture2D(inputBuffer, uv + sign(offset) * texelSize);\r\n\t\tfloat s = abs(offset.x) > abs(offset.y) ? abs(offset.x) : abs(offset.y);\r\n\r\n\t\t// Gamma correction.\r\n\t\tcolor.rgb = pow(abs(color.rgb), vec3(2.2));\r\n\t\toppositeColor.rgb = pow(abs(oppositeColor.rgb), vec3(2.2));\r\n\t\tcolor = mix(color, oppositeColor, s);\r\n\t\tcolor.rgb = pow(abs(color.rgb), vec3(1.0 / 2.2));\r\n\r\n\t}\r\n\r\n\toutputColor = color;\r\n\r\n}\r\n";

var vertex$9 = "varying vec2 vOffset0;\r\nvarying vec2 vOffset1;\r\n\r\nvoid mainSupport() {\r\n\r\n\tvOffset0 = uv + texelSize * vec2(1.0, 0.0);\r\n\tvOffset1 = uv + texelSize * vec2(0.0, -1.0); // Changed sign in Y component.\r\n\r\n}\r\n";

/**
 * Subpixel Morphological Antialiasing (SMAA) v2.8.
 *
 * Preset: SMAA 1x Medium (with color edge detection).
 *  https://github.com/iryoku/smaa/releases/tag/v2.8
 */

class SMAAEffect extends Effect {

	/**
	 * Constructs a new SMAA effect.
	 *
	 * @param {Image} searchImage - The SMAA search image. Preload this image using the {@link searchImageDataURL}.
	 * @param {Image} areaImage - The SMAA area image. Preload this image using the {@link areaImageDataURL}.
	 */

	constructor(searchImage, areaImage) {

		super("SMAAEffect", fragment$r, {

			attributes: EffectAttribute.CONVOLUTION,
			blendFunction: BlendFunction.NORMAL,

			uniforms: new Map([
				["weightMap", new Uniform(null)]
			]),

			vertexShader: vertex$9

		});

		/**
		 * A render target for the color edge detection.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetColorEdges = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			format: RGBFormat,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetColorEdges.texture.name = "SMAA.ColorEdges";
		this.renderTargetColorEdges.texture.generateMipmaps = false;

		/**
		 * A render target for the SMAA weights.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetWeights = this.renderTargetColorEdges.clone();

		this.renderTargetWeights.texture.name = "SMAA.Weights";
		this.renderTargetWeights.texture.format = RGBAFormat;

		this.uniforms.get("weightMap").value = this.renderTargetWeights.texture;

		/**
		 * A clear pass for the color edges buffer.
		 *
		 * @type {ClearPass}
		 * @private
		 */

		this.clearPass = new ClearPass({
			clearColor: new Color(0x000000),
			clearAlpha: 1.0
		});

		/**
		 * A color edge detection pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.colorEdgesPass = new ShaderPass(new ColorEdgesMaterial());

		/**
		 * An SMAA weights pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.weightsPass = new ShaderPass(new SMAAWeightsMaterial());

		this.weightsPass.getFullscreenMaterial().uniforms.searchTexture.value = (() => {

			const searchTexture = new Texture(searchImage);
			searchTexture.name = "SMAA.Search";
			searchTexture.magFilter = NearestFilter;
			searchTexture.minFilter = NearestFilter;
			searchTexture.format = RGBAFormat;
			searchTexture.generateMipmaps = false;
			searchTexture.needsUpdate = true;
			searchTexture.flipY = false;

			return searchTexture;

		})();

		this.weightsPass.getFullscreenMaterial().uniforms.areaTexture.value = (() => {

			const areaTexture = new Texture(areaImage);

			areaTexture.name = "SMAA.Area";
			areaTexture.minFilter = LinearFilter;
			areaTexture.format = RGBAFormat;
			areaTexture.generateMipmaps = false;
			areaTexture.needsUpdate = true;
			areaTexture.flipY = false;

			return areaTexture;

		})();

	}

	/**
	 * Sets the edge detection sensitivity.
	 *
	 * See {@link ColorEdgesMaterial#setEdgeDetectionThreshold} for more details.
	 *
	 * @param {Number} threshold - The edge detection sensitivity. Range: [0.05, 0.5].
	 */

	setEdgeDetectionThreshold(threshold) {

		this.colorEdgesPass.getFullscreenMaterial().setEdgeDetectionThreshold(threshold);

	}

	/**
	 * Sets the maximum amount of horizontal/vertical search steps.
	 *
	 * See {@link SMAAWeightsMaterial#setOrthogonalSearchSteps} for more details.
	 *
	 * @param {Number} steps - The search steps. Range: [0, 112].
	 */

	setOrthogonalSearchSteps(steps) {

		this.weightsPass.getFullscreenMaterial().setOrthogonalSearchSteps(steps);

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		this.clearPass.render(renderer, this.renderTargetColorEdges);
		this.colorEdgesPass.render(renderer, inputBuffer, this.renderTargetColorEdges);
		this.weightsPass.render(renderer, this.renderTargetColorEdges, this.renderTargetWeights);

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.renderTargetColorEdges.setSize(width, height);
		this.renderTargetWeights.setSize(width, height);

		this.colorEdgesPass.getFullscreenMaterial().uniforms.texelSize.value.copy(
			this.weightsPass.getFullscreenMaterial().uniforms.texelSize.value.set(
				1.0 / width, 1.0 / height));

	}

	/**
	 * The SMAA search image, encoded as a base64 data URL.
	 *
	 * Use this image data to create an Image instance and use it together with
	 * the area image to create an {@link SMAAEffect}.
	 *
	 * @type {String}
	 * @example
	 * const searchImage = new Image();
	 * searchImage.addEventListener("load", progress);
	 * searchImage.src = SMAAEffect.searchImageDataURL;
	 */

	static get searchImageDataURL() {

		return searchImageDataURL;

	}

	/**
	 * The SMAA area image, encoded as a base64 data URL.
	 *
	 * Use this image data to create an Image instance and use it together with
	 * the search image to create an {@link SMAAEffect}.
	 *
	 * @type {String}
	 * @example
	 * const areaImage = new Image();
	 * areaImage.addEventListener("load", progress);
	 * areaImage.src = SMAAEffect.areaImageDataURL;
	 */

	static get areaImageDataURL() {

		return areaImageDataURL;

	}

}

var fragment$s = "uniform sampler2D normalBuffer;\r\n\r\nuniform mat4 cameraProjectionMatrix;\r\nuniform mat4 cameraInverseProjectionMatrix;\r\n\r\nuniform vec2 radiusStep;\r\nuniform vec2 distanceCutoff;\r\nuniform vec2 proximityCutoff;\r\nuniform float seed;\r\nuniform float luminanceInfluence;\r\nuniform float scale;\r\nuniform float bias;\r\n\r\nfloat getViewZ(const in float depth) {\r\n\r\n\t#ifdef PERSPECTIVE_CAMERA\r\n\r\n\t\treturn perspectiveDepthToViewZ(depth, cameraNear, cameraFar);\r\n\r\n\t#else\r\n\r\n\t\treturn orthographicDepthToViewZ(depth, cameraNear, cameraFar);\r\n\r\n\t#endif\r\n\r\n}\r\n\r\nvec3 getViewPosition(const in vec2 screenPosition, const in float depth, const in float viewZ) {\r\n\r\n\tfloat clipW = cameraProjectionMatrix[2][3] * viewZ + cameraProjectionMatrix[3][3];\r\n\tvec4 clipPosition = vec4((vec3(screenPosition, depth) - 0.5) * 2.0, 1.0);\r\n\tclipPosition *= clipW; // Unproject.\r\n\r\n\treturn (cameraInverseProjectionMatrix * clipPosition).xyz;\r\n\r\n}\r\n\r\nfloat getOcclusion(const in vec3 p, const in vec3 n, const in vec3 sampleViewPosition) {\r\n\r\n\tvec3 viewDelta = sampleViewPosition - p;\r\n\tfloat d = length(viewDelta) * scale;\r\n\r\n\treturn max(0.0, dot(n, viewDelta) / d - bias) / (1.0 + pow2(d));\r\n\r\n}\r\n\r\nfloat getAmbientOcclusion(const in vec3 p, const in vec3 n, const in float depth, const in vec2 uv) {\r\n\r\n\tvec2 radius = radiusStep;\r\n\tfloat angle = rand(uv + seed) * PI2;\r\n\tfloat occlusionSum = 0.0;\r\n\r\n\t// Collect samples along a discrete spiral pattern.\r\n\tfor(int i = 0; i < SAMPLES_INT; ++i) {\r\n\r\n\t\tvec2 coord = uv + vec2(cos(angle), sin(angle)) * radius;\r\n\t\tradius += radiusStep;\r\n\t\tangle += ANGLE_STEP;\r\n\r\n\t\tfloat sampleDepth = readDepth(coord);\r\n\t\tfloat proximity = abs(depth - sampleDepth);\r\n\r\n\t\tif(sampleDepth < distanceCutoff.y && proximity < proximityCutoff.y) {\r\n\r\n\t\t\tfloat falloff = 1.0 - smoothstep(proximityCutoff.x, proximityCutoff.y, proximity);\r\n\t\t\tvec3 sampleViewPosition = getViewPosition(coord, sampleDepth, getViewZ(sampleDepth));\r\n\t\t\tocclusionSum += getOcclusion(p, n, sampleViewPosition) * falloff;\r\n\r\n\t\t}\r\n\r\n\t}\r\n\r\n\treturn occlusionSum / SAMPLES_FLOAT;\r\n\r\n}\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {\r\n\r\n\tfloat ao = 1.0;\r\n\r\n\t// Skip fragments of objects that are too far away.\r\n\tif(depth < distanceCutoff.y) {\r\n\r\n\t\tvec3 viewPosition = getViewPosition(uv, depth, getViewZ(depth));\r\n\t\tvec3 viewNormal = unpackRGBToNormal(texture2D(normalBuffer, uv).xyz);\r\n\t\tao -= getAmbientOcclusion(viewPosition, viewNormal, depth, uv);\r\n\r\n\t\t// Fade AO based on luminance and depth.\r\n\t\tfloat l = linearToRelativeLuminance(inputColor.rgb);\r\n\t\tao = mix(ao, 1.0, max(l * luminanceInfluence, smoothstep(distanceCutoff.x, distanceCutoff.y, depth)));\r\n\r\n\t}\r\n\r\n\toutputColor = vec4(vec3(ao), inputColor.a);\r\n\r\n}\r\n";

/**
 * A Screen Space Ambient Occlusion (SSAO) effect.
 *
 * SSAO is a method to approximate ambient occlusion in screen space.
 *
 * For high quality visuals use two SSAO effect instances in a row with
 * different radii, one for rough AO and one for fine details.
 *
 * This implementation uses a discrete spiral sampling pattern:
 *  https://jsfiddle.net/a16ff1p7
 */

class SSAOEffect extends Effect {

	/**
	 * Constructs a new SSAO effect.
	 *
	 * @param {Camera} camera - The main camera.
	 * @param {Texture} normalBuffer - A texture that contains the scene normals. See {@link NormalPass}.
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.MULTIPLY] - The blend function of this effect.
	 * @param {Number} [options.samples=11] - The amount of samples per pixel. Should not be a multiple of the ring count.
	 * @param {Number} [options.rings=4] - The amount of rings in the occlusion sampling pattern.
	 * @param {Number} [options.distanceThreshold=0.65] - A global distance threshold at which the occlusion effect starts to fade out. Range [0.0, 1.0].
	 * @param {Number} [options.distanceFalloff=0.1] - The distance falloff. Influences the smoothness of the overall occlusion cutoff. Range [0.0, 1.0].
	 * @param {Number} [options.rangeThreshold=0.0015] - A local occlusion range threshold at which the occlusion starts to fade out. Range [0.0, 1.0].
	 * @param {Number} [options.rangeFalloff=0.01] - The occlusion range falloff. Influences the smoothness of the proximity cutoff. Range [0.0, 1.0].
	 * @param {Number} [options.luminanceInfluence=0.7] - Determines how much the luminance of the scene influences the ambient occlusion.
	 * @param {Number} [options.radius=18.25] - The occlusion sampling radius.
	 * @param {Number} [options.scale=1.0] - The scale of the ambient occlusion.
	 * @param {Number} [options.bias=0.5] - An occlusion bias.
	 */

	constructor(camera, normalBuffer, options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.MULTIPLY,
			samples: 11,
			rings: 4,
			distanceThreshold: 0.65,
			distanceFalloff: 0.1,
			rangeThreshold: 0.0015,
			rangeFalloff: 0.01,
			luminanceInfluence: 0.7,
			radius: 18.25,
			scale: 1.0,
			bias: 0.5
		}, options);

		super("SSAOEffect", fragment$s, {

			attributes: EffectAttribute.DEPTH,
			blendFunction: settings.blendFunction,

			defines: new Map([
				["RINGS_INT", "0"],
				["SAMPLES_INT", "0"],
				["SAMPLES_FLOAT", "0.0"]
			]),

			uniforms: new Map([
				["normalBuffer", new Uniform(normalBuffer)],
				["cameraInverseProjectionMatrix", new Uniform(new Matrix4())],
				["cameraProjectionMatrix", new Uniform(new Matrix4())],
				["radiusStep", new Uniform(new Vector2())],
				["distanceCutoff", new Uniform(new Vector2())],
				["proximityCutoff", new Uniform(new Vector2())],
				["seed", new Uniform(Math.random())],
				["luminanceInfluence", new Uniform(settings.luminanceInfluence)],
				["scale", new Uniform(settings.scale)],
				["bias", new Uniform(settings.bias)]
			])

		});

		/**
		 * The current sampling radius.
		 *
		 * @type {Number}
		 * @private
		 */

		this.r = 0.0;

		/**
		 * The current resolution.
		 *
		 * @type {Vector2}
		 * @private
		 */

		this.resolution = new Vector2(1, 1);

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.camera = camera;

		this.samples = settings.samples;
		this.rings = settings.rings;
		this.radius = settings.radius;

		this.setDistanceCutoff(settings.distanceThreshold, settings.distanceFalloff);
		this.setProximityCutoff(settings.rangeThreshold, settings.rangeFalloff);

	}

	/**
	 * Updates the angle step constant.
	 *
	 * @private
	 */

	updateAngleStep() {

		this.defines.set("ANGLE_STEP", (Math.PI * 2.0 * this.rings / this.samples).toFixed(11));

	}

	/**
	 * Updates the radius step uniform.
	 *
	 * Note: The radius step is a uniform because it changes with the screen size.
	 *
	 * @private
	 */

	updateRadiusStep() {

		const r = this.r / this.samples;
		this.uniforms.get("radiusStep").value.set(r, r).divide(this.resolution);

	}

	/**
	 * The amount of occlusion samples per pixel.
	 *
	 * @type {Number}
	 */

	get samples() {

		return Number.parseInt(this.defines.get("SAMPLES_INT"));

	}

	/**
	 * Sets the amount of occlusion samples per pixel.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		value = Math.floor(value);

		this.defines.set("SAMPLES_INT", value.toFixed(0));
		this.defines.set("SAMPLES_FLOAT", value.toFixed(1));
		this.updateAngleStep();
		this.updateRadiusStep();

	}

	/**
	 * The amount of rings in the occlusion sampling spiral pattern.
	 *
	 * @type {Number}
	 */

	get rings() {

		return Number.parseInt(this.defines.get("RINGS_INT"));

	}

	/**
	 * Sets the amount of rings in the occlusion sampling spiral pattern.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set rings(value) {

		value = Math.floor(value);

		this.defines.set("RINGS_INT", value.toFixed(0));
		this.updateAngleStep();

	}

	/**
	 * The occlusion sampling radius.
	 *
	 * @type {Number}
	 */

	get radius() {

		return this.r;

	}

	/**
	 * Sets the occlusion sampling radius.
	 *
	 * @type {Number}
	 */

	set radius(value) {

		this.r = value;
		this.updateRadiusStep();

	}

	/**
	 * Sets the occlusion distance cutoff.
	 *
	 * @param {Number} threshold - The distance threshold. Range [0.0, 1.0].
	 * @param {Number} falloff - The falloff. Range [0.0, 1.0].
	 */

	setDistanceCutoff(threshold, falloff) {

		this.uniforms.get("distanceCutoff").value.set(threshold, Math.min(threshold + falloff, 1.0 - 1e-6));

	}

	/**
	 * Sets the occlusion proximity cutoff.
	 *
	 * @param {Number} threshold - The range threshold. Range [0.0, 1.0].
	 * @param {Number} falloff - The falloff. Range [0.0, 1.0].
	 */

	setProximityCutoff(threshold, falloff) {

		this.uniforms.get("proximityCutoff").value.set(threshold, Math.min(threshold + falloff, 1.0 - 1e-6));

	}

	/**
	 * Updates the camera projection matrix uniforms.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.resolution.set(width, height);
		this.updateRadiusStep();

		this.uniforms.get("cameraInverseProjectionMatrix").value.getInverse(this.camera.projectionMatrix);
		this.uniforms.get("cameraProjectionMatrix").value.copy(this.camera.projectionMatrix);

	}

}

var vertex$a = "uniform float scale;\r\n\r\nvarying vec2 vUv2;\r\n\r\nvoid mainSupport() {\r\n\r\n\tvUv2 = uv * vec2(aspect, 1.0) * scale;\r\n\r\n}\r\n";

/**
 * A texture effect.
 */

class TextureEffect extends Effect {

	/**
	 * Constructs a new texture effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Texture} [options.texture] - A texture.
	 * @param {Boolean} [options.aspectCorrection=false] - Whether the texture coordinates should be affected by the aspect ratio.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			texture: null,
			aspectCorrection: false
		}, options);

		super("TextureEffect", fragment$9, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["texture", new Uniform(settings.texture)]
			])

		});

		this.aspectCorrection = settings.aspectCorrection;

	}

	/**
	 * Indicates whether aspect correction is enabled.
	 *
	 * If enabled, the texture can be scaled using the `scale` uniform.
	 *
	 * @type {Boolean}
	 */

	get aspectCorrection() {

		return this.defines.has("ASPECT_CORRECTION");

	}

	/**
	 * Enables or disables aspect correction.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set aspectCorrection(value) {

		if(value) {

			this.defines.set("ASPECT_CORRECTION", "1");
			this.uniforms.set("scale", new Uniform(1.0));
			this.vertexShader = vertex$a;

		} else {

			this.defines.delete("ASPECT_CORRECTION");
			this.uniforms.delete("scale");
			this.vertexShader = null;

		}

	}

}

var fragment$t = "uniform sampler2D luminanceMap;\r\nuniform float middleGrey;\r\nuniform float maxLuminance;\r\nuniform float averageLuminance;\r\n\r\nvec3 toneMap(vec3 c) {\r\n\r\n\t#ifdef ADAPTED_LUMINANCE\r\n\r\n\t\t// Get the calculated average luminance by sampling the center.\r\n\t\tfloat lumAvg = texture2D(luminanceMap, vec2(0.5)).r;\r\n\r\n\t#else\r\n\r\n\t\tfloat lumAvg = averageLuminance;\r\n\r\n\t#endif\r\n\r\n\t// Calculate the luminance of the current pixel.\r\n\tfloat lumPixel = linearToRelativeLuminance(c);\r\n\r\n\t// Apply the modified operator (Reinhard Eq. 4).\r\n\tfloat lumScaled = (lumPixel * middleGrey) / lumAvg;\r\n\r\n\tfloat lumCompressed = (lumScaled * (1.0 + (lumScaled / (maxLuminance * maxLuminance)))) / (1.0 + lumScaled);\r\n\r\n\treturn lumCompressed * c;\r\n\r\n}\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\toutputColor = vec4(toneMap(inputColor.rgb), inputColor.a);\r\n\r\n}\r\n";

/**
 * A tone mapping effect that supports adaptive luminosity.
 *
 * If adaptivity is enabled, this effect generates a texture that represents the
 * luminosity of the current scene and adjusts it over time to simulate the
 * optic nerve responding to the amount of light it is receiving.
 *
 * Reference:
 *  GDC2007 - Wolfgang Engel, Post-Processing Pipeline
 *  http://perso.univ-lyon1.fr/jean-claude.iehl/Public/educ/GAMA/2007/gdc07/Post-Processing_Pipeline.pdf
 */

class ToneMappingEffect extends Effect {

	/**
	 * Constructs a new tone mapping effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Boolean} [options.adaptive=true] - Whether the tone mapping should use an adaptive luminance map.
	 * @param {Number} [options.resolution=256] - The render texture resolution of the luminance map.
	 * @param {Number} [options.distinction=1.0] - A luminance distinction factor.
	 * @param {Number} [options.middleGrey=0.6] - The middle grey factor.
	 * @param {Number} [options.maxLuminance=16.0] - The maximum luminance.
	 * @param {Number} [options.averageLuminance=1.0] - The average luminance.
	 * @param {Number} [options.adaptationRate=1.0] - The luminance adaptation rate.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			adaptive: true,
			resolution: 256,
			distinction: 1.0,
			middleGrey: 0.6,
			maxLuminance: 16.0,
			averageLuminance: 1.0,
			adaptationRate: 2.0
		}, options);

		super("ToneMappingEffect", fragment$t, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["luminanceMap", new Uniform(null)],
				["middleGrey", new Uniform(settings.middleGrey)],
				["maxLuminance", new Uniform(settings.maxLuminance)],
				["averageLuminance", new Uniform(settings.averageLuminance)]
			])

		});

		/**
		 * The render target for the current luminance.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 * @todo Use RED format in WebGL 2.0.
		 */

		this.renderTargetLuminance = new WebGLRenderTarget(1, 1, {
			minFilter: LinearMipMapLinearFilter,
			magFilter: LinearFilter,
			format: RGBFormat,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetLuminance.texture.name = "ToneMapping.Luminance";
		this.renderTargetLuminance.texture.generateMipmaps = true;

		/**
		 * The render target for adapted luminance.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetAdapted = this.renderTargetLuminance.clone();

		this.renderTargetAdapted.texture.name = "ToneMapping.AdaptedLuminance";
		this.renderTargetAdapted.texture.generateMipmaps = false;
		this.renderTargetAdapted.texture.minFilter = LinearFilter;

		/**
		 * A render target that holds a copy of the adapted luminance.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetPrevious = this.renderTargetAdapted.clone();

		this.renderTargetPrevious.texture.name = "ToneMapping.PreviousLuminance";

		/**
		 * A save pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.savePass = new SavePass(this.renderTargetPrevious, false);

		/**
		 * A luminance shader pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.luminancePass = new ShaderPass(new LuminanceMaterial());

		/**
		 * An adaptive luminance shader pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.adaptiveLuminancePass = new ShaderPass(new AdaptiveLuminanceMaterial());

		// Apply settings.
		this.adaptationRate = settings.adaptationRate;
		this.distinction = settings.distinction;
		this.resolution = settings.resolution;
		this.adaptive = settings.adaptive;

	}

	/**
	 * The resolution of the render targets.
	 *
	 * @type {Number}
	 */

	get resolution() {

		return this.renderTargetLuminance.width;

	}

	/**
	 * Sets the resolution of the internal render targets.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Number}
	 */

	set resolution(value) {

		// Round the given value to the next power of two.
		const exponent = Math.max(0, Math.ceil(Math.log2(value)));
		value = Math.pow(2, exponent);

		this.renderTargetLuminance.setSize(value, value);
		this.renderTargetPrevious.setSize(value, value);
		this.renderTargetAdapted.setSize(value, value);

		this.adaptiveLuminancePass.getFullscreenMaterial().defines.MIP_LEVEL_1X1 = exponent.toFixed(1);

	}

	/**
	 * Indicates whether this pass uses adaptive luminance.
	 *
	 * @type {Boolean}
	 */

	get adaptive() {

		return this.defines.has("ADAPTED_LUMINANCE");

	}

	/**
	 * Enables or disables adaptive luminance.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set adaptive(value) {

		if(value) {

			this.defines.set("ADAPTED_LUMINANCE", "1");
			this.uniforms.get("luminanceMap").value = this.renderTargetAdapted.texture;

		} else {

			this.defines.delete("ADAPTED_LUMINANCE");
			this.uniforms.get("luminanceMap").value = null;

		}

	}

	/**
	 * The luminance adaptation rate.
	 *
	 * @type {Number}
	 */

	get adaptationRate() {

		return this.adaptiveLuminancePass.getFullscreenMaterial().uniforms.tau.value;

	}

	/**
	 * @type {Number}
	 */

	set adaptationRate(value) {

		this.adaptiveLuminancePass.getFullscreenMaterial().uniforms.tau.value = value;

	}

	/**
	 * The luminance distinction factor.
	 *
	 * @type {Number}
	 */

	get distinction() {

		return this.luminancePass.getFullscreenMaterial().uniforms.distinction.value;

	}

	/**
	 * @type {Number}
	 */

	set distinction(value = 1.0) {

		this.luminancePass.getFullscreenMaterial().uniforms.distinction.value = value;

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [delta] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, delta) {

		if(this.adaptive) {

			// Render the luminance of the current scene into a mipmap render target.
			this.luminancePass.render(renderer, inputBuffer, this.renderTargetLuminance);

			// Use the frame delta to adapt the luminance over time.
			const uniforms = this.adaptiveLuminancePass.getFullscreenMaterial().uniforms;
			uniforms.previousLuminanceBuffer.value = this.renderTargetPrevious.texture;
			uniforms.currentLuminanceBuffer.value = this.renderTargetLuminance.texture;
			uniforms.delta.value = delta;
			this.adaptiveLuminancePass.render(renderer, null, this.renderTargetAdapted);

			// Save the adapted luminance for the next frame.
			this.savePass.render(renderer, this.renderTargetAdapted);

		}

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.savePass.setSize(width, height);

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialize(renderer, alpha) {

		const clearPass = new ClearPass({ clearColor: new Color(0x7fffff) });
		clearPass.render(renderer, this.renderTargetPrevious);
		clearPass.dispose();

	}

}

var fragment$u = "uniform float offset;\r\nuniform float darkness;\r\n\r\nvoid mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {\r\n\r\n\tconst vec2 center = vec2(0.5);\r\n\tvec3 color = inputColor.rgb;\r\n\r\n\t#ifdef ESKIL\r\n\r\n\t\tvec2 coord = (uv - center) * vec2(offset);\r\n\t\tcolor = mix(color, vec3(1.0 - darkness), dot(coord, coord));\r\n\r\n\t#else\r\n\r\n\t\tfloat d = distance(uv, center);\r\n\t\tcolor *= smoothstep(0.8, offset * 0.799, d * (darkness + offset));\r\n\r\n\t#endif\r\n\r\n\toutputColor = vec4(color, inputColor.a);\r\n\r\n}\r\n";

/**
 * A vignette effect.
 */

class VignetteEffect extends Effect {

	/**
	 * Constructs a new vignette effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Boolean} [options.eskil=false] - Enables Eskil's vignette technique.
	 * @param {Number} [options.offset=0.5] - The vignette offset.
	 * @param {Number} [options.darkness=0.5] - The vignette darkness.
	 */

	constructor(options = {}) {

		const settings = Object.assign({
			blendFunction: BlendFunction.NORMAL,
			eskil: false,
			offset: 0.5,
			darkness: 0.5
		}, options);

		super("VignetteEffect", fragment$u, {

			blendFunction: settings.blendFunction,

			uniforms: new Map([
				["offset", new Uniform(settings.offset)],
				["darkness", new Uniform(settings.darkness)]
			])

		});

		this.eskil = settings.eskil;

	}

	/**
	 * Indicates whether Eskil's vignette technique is enabled.
	 *
	 * @type {Boolean}
	 */

	get eskil() {

		return this.defines.has("ESKIL");

	}

	/**
	 * Enables or disables Eskil's vignette technique.
	 *
	 * You'll need to call {@link EffectPass#recompile} after changing this value.
	 *
	 * @type {Boolean}
	 */

	set eskil(value) {

		value ? this.defines.set("ESKIL", "1") : this.defines.delete("ESKIL");

	}

}

/**
 * Creates a new canvas from raw image data.
 *
 * @private
 * @param {Number} width - The image width.
 * @param {Number} height - The image height.
 * @param {Uint8ClampedArray} data - The image data.
 * @param {Number} channels - The color channels used for a single pixel.
 * @return {Canvas} The canvas.
 */

function createCanvas(width, height, data, channels) {

	const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
	const context = canvas.getContext("2d");

	const imageData = context.createImageData(width, height);
	const target = imageData.data;

	let x, y;
	let i, j;

	for(y = 0; y < height; ++y) {

		for(x = 0; x < width; ++x) {

			i = (y * width + x) * 4;
			j = (y * width + x) * channels;

			target[i] = (channels > 0) ? data[j] : 0;
			target[i + 1] = (channels > 1) ? data[j + 1] : 0;
			target[i + 2] = (channels > 2) ? data[j + 2] : 0;
			target[i + 3] = (channels > 3) ? data[j + 3] : 255;

		}

	}

	canvas.width = width;
	canvas.height = height;

	context.putImageData(imageData, 0, 0);

	return canvas;

}

/**
 * A container for raw image data.
 */

class RawImageData {

	/**
	 * Constructs a new image data container.
	 *
	 * @param {Number} [width=0] - The width of the image.
	 * @param {Number} [height=0] - The height of the image.
	 * @param {Uint8ClampedArray} [data=null] - The image data.
	 * @param {Number} [channels=4] - The amount of color channels used per pixel. Range [1, 4].
	 */

	constructor(width = 0, height = 0, data = null, channels = 4) {

		/**
		 * The width of the image.
		 *
		 * @type {Number}
		 */

		this.width = width;

		/**
		 * The height of the image.
		 *
		 * @type {Number}
		 */

		this.height = height;

		/**
		 * The image data.
		 *
		 * @type {Uint8ClampedArray}
		 */

		this.data = data;

		/**
		 * The amount of color channels used per pixel. Range [1, 4].
		 *
		 * @type {Number}
		 */

		this.channels = channels;

	}

	/**
	 * Creates a canvas from this image data.
	 *
	 * @return {Canvas} The canvas or null if it couldn't be created.
	 */

	toCanvas() {

		return (typeof document === "undefined") ? null : createCanvas(
			this.width,
			this.height,
			this.data,
			this.channels
		);

	}

}

/**
 * A box.
 *
 * @type {Box2}
 * @private
 */

const b0 = new Box2();

/**
 * A box.
 *
 * @type {Box2}
 * @private
 */

const b1 = new Box2();

/**
 * The orthogonal texture size.
 *
 * @type {Number}
 * @private
 */

const ORTHOGONAL_SIZE = 16;

/**
 * The diagonal texture size.
 *
 * @type {Number}
 * @private
 */

const DIAGONAL_SIZE = 20;

/**
 * The number of samples for calculating areas in the diagonal textures.
 * Diagonal areas are calculated using brute force sampling.
 *
 * @type {Number}
 * @private
 */

const DIAGONAL_SAMPLES = 30;

/**
 * The maximum distance for smoothing U-shapes.
 *
 * @type {Number}
 * @private
 */

const SMOOTH_MAX_DISTANCE = 32;

/**
 * Subsampling offsets for orthogonal areas.
 *
 * @type {Float32Array}
 * @private
 */

const orthogonalSubsamplingOffsets = new Float32Array([
	0.0,
	-0.25,
	0.25,
	-0.125,
	0.125,
	-0.375,
	0.375
]);

/**
 * Subsampling offset pairs for diagonal areas.
 *
 * @type {Float32Array[]}
 * @private
 */

const diagonalSubsamplingOffsets = [

	new Float32Array([0.0, 0.0]),
	new Float32Array([0.25, -0.25]),
	new Float32Array([-0.25, 0.25]),
	new Float32Array([0.125, -0.125]),
	new Float32Array([-0.125, 0.125])

];

/**
 * Orthogonal pattern positioning coordinates.
 *
 * Used for placing each pattern subtexture into a specific spot.
 *
 * @type {Uint8Array[]}
 * @private
 */

const orthogonalEdges = [

	new Uint8Array([0, 0]),
	new Uint8Array([3, 0]),
	new Uint8Array([0, 3]),
	new Uint8Array([3, 3]),

	new Uint8Array([1, 0]),
	new Uint8Array([4, 0]),
	new Uint8Array([1, 3]),
	new Uint8Array([4, 3]),

	new Uint8Array([0, 1]),
	new Uint8Array([3, 1]),
	new Uint8Array([0, 4]),
	new Uint8Array([3, 4]),

	new Uint8Array([1, 1]),
	new Uint8Array([4, 1]),
	new Uint8Array([1, 4]),
	new Uint8Array([4, 4])

];

/**
 * Diagonal pattern positioning coordinates.
 *
 * Used for placing each pattern subtexture into a specific spot.
 *
 * @type {Uint8Array[]}
 * @private
 */

const diagonalEdges = [

	new Uint8Array([0, 0]),
	new Uint8Array([1, 0]),
	new Uint8Array([0, 2]),
	new Uint8Array([1, 2]),

	new Uint8Array([2, 0]),
	new Uint8Array([3, 0]),
	new Uint8Array([2, 2]),
	new Uint8Array([3, 2]),

	new Uint8Array([0, 1]),
	new Uint8Array([1, 1]),
	new Uint8Array([0, 3]),
	new Uint8Array([1, 3]),

	new Uint8Array([2, 1]),
	new Uint8Array([3, 1]),
	new Uint8Array([2, 3]),
	new Uint8Array([3, 3])

];

/**
 * Linearly interpolates between two values.
 *
 * @private
 * @param {Number} a - The initial value.
 * @param {Number} b - The target value.
 * @param {Number} p - The interpolation value.
 * @return {Number} The interpolated value.
 */

function lerp(a, b, p) {

	return a + (b - a) * p;

}

/**
 * Clamps a value to the range [0, 1].
 *
 * @private
 * @param {Number} a - The value.
 * @return {Number} The saturated value.
 */

function saturate(a) {

	return Math.min(Math.max(a, 0.0), 1.0);

}

/**
 * A smoothing function for small U-patterns.
 *
 * @private
 * @param {Number} d - A smoothing factor.
 * @param {Box2} b - The area that should be smoothed.
 * @return {Box2} The smoothed area.
 */

function smoothArea(d, b) {

	const a1 = b.min;
	const a2 = b.max;

	const b1X = Math.sqrt(a1.x * 2.0) * 0.5;
	const b1Y = Math.sqrt(a1.y * 2.0) * 0.5;
	const b2X = Math.sqrt(a2.x * 2.0) * 0.5;
	const b2Y = Math.sqrt(a2.y * 2.0) * 0.5;

	const p = saturate(d / SMOOTH_MAX_DISTANCE);

	a1.set(lerp(b1X, a1.x, p), lerp(b1Y, a1.y, p));
	a2.set(lerp(b2X, a2.x, p), lerp(b2Y, a2.y, p));

	return b;

}

/**
 * Calculates the area under the line p1 -> p2, for the pixels (x, x + 1).
 *
 * @private
 * @param {Vector2} p1 - The starting point of the line.
 * @param {Vector2} p2 - The ending point of the line.
 * @param {Number} x - The pixel index.
 * @param {Vector2} result - A target vector to store the area in.
 * @return {Vector2} The area.
 */

function calculateOrthogonalArea(p1, p2, x, result) {

	const dX = p2.x - p1.x;
	const dY = p2.y - p1.y;

	const x1 = x;
	const x2 = x + 1.0;

	const y1 = p1.y + dY * (x1 - p1.x) / dX;
	const y2 = p1.y + dY * (x2 - p1.x) / dX;

	let a, a1, a2, t;

	// Check if x is inside the area.
	if((x1 >= p1.x && x1 < p2.x) || (x2 > p1.x && x2 <= p2.x)) {

		// Check if this is a trapezoid.
		if(Math.sign(y1) === Math.sign(y2) || Math.abs(y1) < 1e-4 || Math.abs(y2) < 1e-4) {

			a = (y1 + y2) / 2.0;

			if(a < 0.0) {

				result.set(Math.abs(a), 0.0);

			} else {

				result.set(0.0, Math.abs(a));

			}

		} else {

			// Two triangles.
			t = -p1.y * dX / dY + p1.x;

			a1 = (t > p1.x) ? y1 * (t - Math.trunc(t)) / 2.0 : 0.0;
			a2 = (t < p2.x) ? y2 * (1.0 - (t - Math.trunc(t))) / 2.0 : 0.0;

			a = (Math.abs(a1) > Math.abs(a2)) ? a1 : -a2;

			if(a < 0.0) {

				result.set(Math.abs(a1), Math.abs(a2));

			} else {

				result.set(Math.abs(a2), Math.abs(a1));

			}

		}

	} else {

		result.set(0, 0);

	}

	return result;

}

/**
 * Calculates the area for a given pattern and distances to the left and to the
 * right, biased by an offset.
 *
 * @private
 * @param {Number} pattern - A pattern index.
 * @param {Number} left - The left distance.
 * @param {Number} right - The right distance.
 * @param {Number} offset - An offset.
 * @param {Vector2} result - A target vector to store the area in.
 * @return {Vector2} The orthogonal area.
 */

function calculateOrthogonalAreaForPattern(pattern, left, right, offset, result) {

	const p1 = b0.min;
	const p2 = b0.max;
	const a1 = b1.min;
	const a2 = b1.max;
	const a = b1;

	/* o1           |
	 *      .-------´
	 * o2   |
	 *
	 *      <---d--->
	 */

	const o1 = 0.5 + offset;
	const o2 = 0.5 + offset - 1.0;
	const d = left + right + 1;

	switch(pattern) {

		case 0: {

			//    ------

			result.set(0, 0);

			break;

		}

		case 1: {

			/*   .------
			 *   |
			 *
			 * The offset is only applied to L patterns in the crossing edge side to
			 * make it converge with the unfiltered pattern 0.
			 * The pattern 0 must not be filtered to avoid artifacts.
			 */

			if(left <= right) {

				calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d / 2.0, 0.0), left, result);

			} else {

				result.set(0, 0);

			}

			break;

		}

		case 2: {

			/*    ------.
			 *          |
			 */

			if(left >= right) {

				calculateOrthogonalArea(p1.set(d / 2.0, 0.0), p2.set(d, o2), left, result);

			} else {

				result.set(0, 0);

			}

			break;

		}

		case 3: {

			/*   .------.
			 *   |      |
			 */

			calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d / 2.0, 0.0), left, a1);
			calculateOrthogonalArea(p1.set(d / 2.0, 0.0), p2.set(d, o2), left, a2);

			smoothArea(d, a);

			result.addVectors(a1, a2);

			break;

		}

		case 4: {

			/*   |
			 *   `------
			 */

			if(left <= right) {

				calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d / 2.0, 0.0), left, result);

			} else {

				result.set(0, 0);

			}

			break;

		}

		case 5: {

			/*   |
			 *   +------
			 *   |
			 */

			result.set(0, 0);

			break;

		}

		case 6: {

			/*   |
			 *   `------.
			 *          |
			 *
			 * A problem of not offseting L patterns (see above) is that for certain
			 * max search distances, the pixels in the center of a Z pattern will
			 * detect the full Z pattern, while the pixels in the sides will detect an
			 * L pattern. To avoid discontinuities, the full offsetted Z
			 * revectorization is blended with partially offsetted L patterns.
			 */

			if(Math.abs(offset) > 0.0) {

				calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d, o2), left, a1);
				calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d / 2.0, 0.0), left, a2);
				a2.add(calculateOrthogonalArea(p1.set(d / 2.0, 0.0), p2.set(d, o2), left, result));

				result.addVectors(a1, a2).divideScalar(2.0);

			} else {

				calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d, o2), left, result);

			}

			break;

		}

		case 7: {

			/*   |
			 *   +------.
			 *   |      |
			 */

			calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d, o2), left, result);

			break;

		}

		case 8: {

			/*          |
			 *    ------´
			 */

			if(left >= right) {

				calculateOrthogonalArea(p1.set(d / 2.0, 0.0), p2.set(d, o1), left, result);

			} else {

				result.set(0, 0);

			}

			break;

		}

		case 9: {

			/*          |
			 *   .------´
			 *   |
			 */

			if(Math.abs(offset) > 0.0) {

				calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d, o1), left, a1);
				calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d / 2.0, 0.0), left, a2);
				a2.add(calculateOrthogonalArea(p1.set(d / 2.0, 0.0), p2.set(d, o1), left, result));

				result.addVectors(a1, a2).divideScalar(2.0);

			} else {

				calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d, o1), left, result);

			}

			break;

		}

		case 10: {

			/*          |
			 *    ------+
			 *          |
			 */

			result.set(0, 0);

			break;

		}

		case 11: {

			/*          |
			 *   .------+
			 *   |      |
			 */

			calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d, o1), left, result);

			break;

		}

		case 12: {

			/*   |      |
			 *   `------´
			 */

			calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d / 2.0, 0.0), left, a1);
			calculateOrthogonalArea(p1.set(d / 2.0, 0.0), p2.set(d, o1), left, a2);

			smoothArea(d, a);

			result.addVectors(a1, a2);

			break;

		}

		case 13: {

			/*   |      |
			 *   +------´
			 *   |
			 */

			calculateOrthogonalArea(p1.set(0.0, o2), p2.set(d, o1), left, result);

			break;

		}

		case 14: {

			/*   |      |
			 *   `------+
			 *          |
			 */

			calculateOrthogonalArea(p1.set(0.0, o1), p2.set(d, o2), left, result);

			break;

		}

		case 15: {

			/*   |      |
			 *   +------+
			 *   |      |
			 */

			result.set(0, 0);

			break;

		}

	}

	return result;

}

/**
 * Determines whether the given pixel is inside the specified area.
 *
 * @private
 * @param {Vector2} p1 - The lower bounds of the area.
 * @param {Vector2} p2 - The upper bounds of the area.
 * @param {Vector2} x - The X-coordinates.
 * @param {Vector2} y - The Y-coordinates.
 * @return {Vector2} Whether the pixel lies inside the area.
 */

function isInsideArea(p1, p2, x, y) {

	let result = p1.equals(p2);

	let xm, ym;
	let a, b, c;

	if(!result) {

		xm = (p1.x + p2.x) / 2.0;
		ym = (p1.y + p2.y) / 2.0;

		a = p2.y - p1.y;
		b = p1.x - p2.x;

		c = a * (x - xm) + b * (y - ym);

		result = (c > 0.0);

	}

	return result;

}

/**
 * Calculates the area under the line p1 -> p2 for the pixel p using brute force
 * sampling.
 *
 * @private
 * @param {Vector2} p1 - The lower bounds of the area.
 * @param {Vector2} p2 - The upper bounds of the area.
 * @param {Number} pX - The X-coordinates.
 * @param {Number} pY - The Y-coordinates.
 * @return {Number} The amount of pixels inside the area relative to the total amount of sampled pixels.
 */

function calculateDiagonalAreaForPixel(p1, p2, pX, pY) {

	let a;
	let x, y;
	let offsetX, offsetY;

	for(a = 0, y = 0; y < DIAGONAL_SAMPLES; ++y) {

		for(x = 0; x < DIAGONAL_SAMPLES; ++x) {

			offsetX = x / (DIAGONAL_SAMPLES - 1.0);
			offsetY = y / (DIAGONAL_SAMPLES - 1.0);

			if(isInsideArea(p1, p2, pX + offsetX, pY + offsetY)) {

				++a;

			}

		}

	}

	return a / (DIAGONAL_SAMPLES * DIAGONAL_SAMPLES);

}

/**
 * Calculates the area under the line p1 -> p2. This includes the pixel and its
 * opposite.
 *
 * @private
 * @param {Number} pattern - A pattern index.
 * @param {Vector2} p1 - The lower bounds of the area.
 * @param {Vector2} p2 - The upper bounds of the area.
 * @param {Number} left - The left distance.
 * @param {Float32Array} offset - An offset.
 * @param {Vector2} result - A target vector to store the area in.
 * @return {Vector2} The area.
 */

function calculateDiagonalArea(pattern, p1, p2, left, offset, result) {

	const e = diagonalEdges[pattern];
	const e1 = e[0];
	const e2 = e[1];

	if(e1 > 0) {

		p1.x += offset[0];
		p1.y += offset[1];

	}

	if(e2 > 0) {

		p2.x += offset[0];
		p2.y += offset[1];

	}

	return result.set(
		1.0 - calculateDiagonalAreaForPixel(p1, p2, 1.0 + left, 0.0 + left),
		calculateDiagonalAreaForPixel(p1, p2, 1.0 + left, 1.0 + left)
	);

}

/**
 * Calculates the area for a given pattern and distances to the left and to the
 * right, biased by an offset.
 *
 * @private
 * @param {Number} pattern - A pattern index.
 * @param {Number} left - The left distance.
 * @param {Number} right - The right distance.
 * @param {Float32Array} offset - An offset.
 * @param {Vector2} result - A target vector to store the area in.
 * @return {Vector2} The orthogonal area.
 */

function calculateDiagonalAreaForPattern(pattern, left, right, offset, result) {

	const p1 = b0.min;
	const p2 = b0.max;
	const a1 = b1.min;
	const a2 = b1.max;

	const d = left + right + 1;

	/* There is some Black Magic involved in the diagonal area calculations.
	 *
	 * Unlike orthogonal patterns, the "null" pattern (one without crossing edges)
	 * must be filtered, and the ends of both the "null" and L patterns are not
	 * known: L and U patterns have different endings, and the adjacent pattern is
	 * unknown. Therefore, a blend of both possibilites is computed.
	 */

	switch(pattern) {

		case 0: {

			/*         .-´
			 *       .-´
			 *     .-´
			 *   .-´
			 *   ´
			 */

			// First possibility.
			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);

			// Second possibility.
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			// Blend both possibilities together.
			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 1: {

			/*         .-´
			 *       .-´
			 *     .-´
			 *   .-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(0.0 + d, 0.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 2: {

			/*         .----
			 *       .-´
			 *     .-´
			 *   .-´
			 *   ´
			 */

			calculateDiagonalArea(pattern, p1.set(0.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 3: {

			/*
			 *         .----
			 *       .-´
			 *     .-´
			 *   .-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, result);

			break;

		}

		case 4: {

			/*         .-´
			 *       .-´
			 *     .-´
			 * ----´
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(0.0 + d, 0.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 5: {

			/*         .-´
			 *       .-´
			 *     .-´
			 * --.-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(0.0 + d, 0.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 6: {

			/*         .----
			 *       .-´
			 *     .-´
			 * ----´
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 0.0 + d), left, offset, result);

			break;

		}

		case 7: {

			/*         .----
			 *       .-´
			 *     .-´
			 * --.-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 0.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 8: {

			/*         |
			 *         |
			 *       .-´
			 *     .-´
			 *   .-´
			 *   ´
			 */

			calculateDiagonalArea(pattern, p1.set(0.0, 0.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 1.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 9: {

			/*         |
			 *         |
			 *       .-´
			 *     .-´
			 *   .-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 1.0 + d), left, offset, result);

			break;

		}

		case 10: {

			/*         |
			 *         .----
			 *       .-´
			 *     .-´
			 *   .-´
			 *   ´
			 */

			calculateDiagonalArea(pattern, p1.set(0.0, 0.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 11: {

			/*         |
			 *         .----
			 *       .-´
			 *     .-´
			 *   .-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 12: {

			/*         |
			 *         |
			 *       .-´
			 *     .-´
			 * ----´
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 1.0 + d), left, offset, result);

			break;

		}

		case 13: {

			/*         |
			 *         |
			 *       .-´
			 *     .-´
			 * --.-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 1.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 14: {

			/*         |
			 *         .----
			 *       .-´
			 *     .-´
			 * ----´
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

		case 15: {

			/*         |
			 *         .----
			 *       .-´
			 *     .-´
			 * --.-´
			 *   |
			 *   |
			 */

			calculateDiagonalArea(pattern, p1.set(1.0, 1.0), p2.set(1.0 + d, 1.0 + d), left, offset, a1);
			calculateDiagonalArea(pattern, p1.set(1.0, 0.0), p2.set(1.0 + d, 0.0 + d), left, offset, a2);

			result.addVectors(a1, a2).divideScalar(2.0);

			break;

		}

	}

	return result;

}

/**
 * Calculates orthogonal or diagonal patterns for a given offset.
 *
 * @param {RawImageData[]} patterns - The patterns to assemble.
 * @param {Number|Float32Array} offset - A pattern offset. Diagonal offsets are pairs.
 * @param {Boolean} orthogonal - Whether the patterns are orthogonal or diagonal.
 */

function generatePatterns(patterns, offset, orthogonal) {

	const result = new Vector2();

	let i, l;
	let x, y;
	let c;

	let pattern;
	let data, size;

	for(i = 0, l = patterns.length; i < l; ++i) {

		pattern = patterns[i];

		data = pattern.data;
		size = pattern.width;

		for(y = 0; y < size; ++y) {

			for(x = 0; x < size; ++x) {

				if(orthogonal) {

					calculateOrthogonalAreaForPattern(i, x, y, offset, result);

				} else {

					calculateDiagonalAreaForPattern(i, x, y, offset, result);

				}

				c = (y * size + x) * 2;

				data[c] = result.x * 255;
				data[c + 1] = result.y * 255;

			}

		}

	}

}

/**
 * Assembles orthogonal or diagonal patterns into the final area image.
 *
 * @param {Vector2} base - A base position.
 * @param {RawImageData[]} patterns - The patterns to assemble.
 * @param {Uint8Array[]} edges - Edge coordinate pairs, used for positioning.
 * @param {Number} size - The pattern size.
 * @param {Boolean} orthogonal - Whether the patterns are orthogonal or diagonal.
 * @param {RawImageData} target - The target image data.
 */

function assemble(base, patterns, edges, size, orthogonal, target) {

	const p = new Vector2();

	const dstData = target.data;
	const dstWidth = target.width;

	let i, l;
	let x, y;
	let c, d;

	let edge;
	let pattern;
	let srcData, srcWidth;

	for(i = 0, l = patterns.length; i < l; ++i) {

		edge = edges[i];
		pattern = patterns[i];

		srcData = pattern.data;
		srcWidth = pattern.width;

		for(y = 0; y < size; ++y) {

			for(x = 0; x < size; ++x) {

				p.fromArray(edge).multiplyScalar(size);
				p.add(base);
				p.x += x;
				p.y += y;

				c = (p.y * dstWidth + p.x) * 2;

				/* The texture coordinates of orthogonal patterns are compressed
				quadratically to reach longer distances for a given texture size. */
				d = orthogonal ? ((y * y * srcWidth + x * x) * 2) :
					((y * srcWidth + x) * 2);

				dstData[c] = srcData[d];
				dstData[c + 1] = srcData[d + 1];

			}

		}

	}

}

/**
 * SMAA area image data.
 *
 * This texture allows to obtain the area for a certain pattern and distances
 * to the left and to the right of the identified line.
 *
 * Based on the official python scripts:
 *  https://github.com/iryoku/smaa/tree/master/Scripts
 */

class SMAAAreaImageData {

	/**
	 * Creates a new area image.
	 *
	 * @return {RawImageData} The generated image data.
	 */

	static generate() {

		const width = 2 * 5 * ORTHOGONAL_SIZE;
		const height = orthogonalSubsamplingOffsets.length * 5 * ORTHOGONAL_SIZE;

		const data = new Uint8ClampedArray(width * height * 2);
		const result = new RawImageData(width, height, data, 2);

		const orthogonalPatternSize = Math.pow(ORTHOGONAL_SIZE - 1, 2) + 1;
		const diagonalPatternSize = DIAGONAL_SIZE;

		const orthogonalPatterns = [];
		const diagonalPatterns = [];

		const base = new Vector2();

		let i, l;

		// Prepare 16 image data sets for the orthogonal and diagonal subtextures.
		for(i = 0; i < 16; ++i) {

			orthogonalPatterns.push(new RawImageData(orthogonalPatternSize, orthogonalPatternSize,
				new Uint8ClampedArray(orthogonalPatternSize * orthogonalPatternSize * 2), 2));

			diagonalPatterns.push(new RawImageData(diagonalPatternSize, diagonalPatternSize,
				new Uint8ClampedArray(diagonalPatternSize * diagonalPatternSize * 2), 2));

		}

		for(i = 0, l = orthogonalSubsamplingOffsets.length; i < l; ++i) {

			// Generate 16 orthogonal patterns for each offset.
			generatePatterns(orthogonalPatterns, orthogonalSubsamplingOffsets[i], true);

			// Assemble the orthogonal patterns and place them on the left side.
			base.set(0, 5 * ORTHOGONAL_SIZE * i);
			assemble(base, orthogonalPatterns, orthogonalEdges, ORTHOGONAL_SIZE, true, result);

		}

		for(i = 0, l = diagonalSubsamplingOffsets.length; i < l; ++i) {

			// Generate 16 diagonal patterns for each offset.
			generatePatterns(diagonalPatterns, diagonalSubsamplingOffsets[i], false);

			// Assemble the diagonal patterns and place them on the right side.
			base.set(5 * ORTHOGONAL_SIZE, 4 * DIAGONAL_SIZE * i);
			assemble(base, diagonalPatterns, diagonalEdges, DIAGONAL_SIZE, false, result);

		}

		return result;

	}

}

/**
 * This dictionary returns which edges are active for a certain bilinear fetch:
 * it's the reverse lookup of the bilinear function.
 *
 * @type {Map}
 * @private
 */

const edges = new Map([

	[bilinear([0, 0, 0, 0]), [0, 0, 0, 0]],
	[bilinear([0, 0, 0, 1]), [0, 0, 0, 1]],
	[bilinear([0, 0, 1, 0]), [0, 0, 1, 0]],
	[bilinear([0, 0, 1, 1]), [0, 0, 1, 1]],

	[bilinear([0, 1, 0, 0]), [0, 1, 0, 0]],
	[bilinear([0, 1, 0, 1]), [0, 1, 0, 1]],
	[bilinear([0, 1, 1, 0]), [0, 1, 1, 0]],
	[bilinear([0, 1, 1, 1]), [0, 1, 1, 1]],

	[bilinear([1, 0, 0, 0]), [1, 0, 0, 0]],
	[bilinear([1, 0, 0, 1]), [1, 0, 0, 1]],
	[bilinear([1, 0, 1, 0]), [1, 0, 1, 0]],
	[bilinear([1, 0, 1, 1]), [1, 0, 1, 1]],

	[bilinear([1, 1, 0, 0]), [1, 1, 0, 0]],
	[bilinear([1, 1, 0, 1]), [1, 1, 0, 1]],
	[bilinear([1, 1, 1, 0]), [1, 1, 1, 0]],
	[bilinear([1, 1, 1, 1]), [1, 1, 1, 1]]

]);

/**
 * Linearly interpolates between two values.
 *
 * @private
 * @param {Number} a - The initial value.
 * @param {Number} b - The target value.
 * @param {Number} p - The interpolation value.
 * @return {Number} The interpolated value.
 */

function lerp$1(a, b, p) {

	return a + (b - a) * p;

}

/**
 * Calculates the bilinear fetch for a certain edge combination.
 *
 *     e[0]       e[1]
 *
 *              x <-------- Sample Position: (-0.25, -0.125)
 *     e[2]       e[3] <--- Current Pixel [3]: (0.0, 0.0)
 *
 * @private
 * @param {Number[]} e - The edge combination.
 * @return {Number} The interpolated value.
 */

function bilinear(e) {

	const a = lerp$1(e[0], e[1], 1.0 - 0.25);
	const b = lerp$1(e[2], e[3], 1.0 - 0.25);

	return lerp$1(a, b, 1.0 - 0.125);

}

/**
 * Computes the delta distance to add in the last step of searches to the left.
 *
 * @private
 * @param {Number[]} left - The left edge combination.
 * @param {Number[]} top - The top edge combination.
 * @return {Number} The left delta distance.
 */

function deltaLeft(left, top) {

	let d = 0;

	// If there is an edge, continue.
	if(top[3] === 1) {

		d += 1;

	}

	/* If an edge was previously found, there is another edge and there are no
	crossing edges, continue. */
	if(d === 1 && top[2] === 1 && left[1] !== 1 && left[3] !== 1) {

		d += 1;

	}

	return d;

}

/**
 * Computes the delta distance to add in the last step of searches to the right.
 *
 * @private
 * @param {Number[]} left - The left edge combination.
 * @param {Number[]} top - The top edge combination.
 * @return {Number} The right delta distance.
 */

function deltaRight(left, top) {

	let d = 0;

	// If there is an edge, and no crossing edges, continue.
	if(top[3] === 1 && left[1] !== 1 && left[3] !== 1) {

		d += 1;

	}

	/* If an edge was previously found, there is another edge and there are no
	crossing edges, continue. */
	if(d === 1 && top[2] === 1 && left[0] !== 1 && left[2] !== 1) {

		d += 1;

	}

	return d;

}

/**
 * SMAA search image data.
 *
 * This image stores information about how many pixels the line search
 * algorithm must advance in the last step.
 *
 * Based on the official python scripts:
 *  https://github.com/iryoku/smaa/tree/master/Scripts
 */

class SMAASearchImageData {

	/**
	 * Creates a new search image.
	 *
	 * @return {RawImageData} The generated image data.
	 */

	static generate() {

		const width = 66;
		const height = 33;

		const croppedWidth = 64;
		const croppedHeight = 16;

		const data = new Uint8ClampedArray(width * height);
		const croppedData = new Uint8ClampedArray(croppedWidth * croppedHeight);

		let x, y;
		let s, t, i;
		let e1, e2;

		// Calculate delta distances.
		for(y = 0; y < height; ++y) {

			for(x = 0; x < width; ++x) {

				s = 0.03125 * x;
				t = 0.03125 * y;

				if(edges.has(s) && edges.has(t)) {

					e1 = edges.get(s);
					e2 = edges.get(t);

					// Maximize the dynamic range to help the compression.
					data[y * width + x] = (127 * deltaLeft(e1, e2));
					data[y * width + x + (width / 2)] = (127 * deltaRight(e1, e2));

				}

			}

		}

		// Crop the result to powers-of-two to make it BC4-friendly.
		for(i = 0, y = height - croppedHeight; y < height; ++y) {

			for(x = 0; x < croppedWidth; ++x, ++i) {

				croppedData[i] = data[y * width + x];

			}

		}

		return new RawImageData(croppedWidth, croppedHeight, croppedData, 1);

	}

}

export { Disposable, Initializable, EffectComposer, Resizable, BlendFunction, BlendMode, BloomEffect, BokehEffect, BrightnessContrastEffect, ColorAverageEffect, ChromaticAberrationEffect, DepthEffect, DotScreenEffect, Effect, EffectAttribute, GammaCorrectionEffect, GlitchEffect, GlitchMode, GodRaysEffect, GridEffect, HueSaturationEffect, NoiseEffect, OutlineEffect, PixelationEffect, RealisticBokehEffect, ScanlineEffect, ShockWaveEffect, SepiaEffect, SMAAEffect, SSAOEffect, TextureEffect, ToneMappingEffect, VignetteEffect, WebGLExtension, RawImageData, SMAAAreaImageData, SMAASearchImageData, AdaptiveLuminanceMaterial, ColorEdgesMaterial, ConvolutionMaterial, CopyMaterial, DepthComparisonMaterial, EffectMaterial, GodRaysMaterial, KernelSize, LuminanceMaterial, OutlineEdgesMaterial, SMAAWeightsMaterial, BlurPass, ClearPass, ClearMaskPass, DepthPass, EffectPass, MaskPass, NormalPass, Pass, RenderPass, SavePass, ShaderPass };
