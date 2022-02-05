import { NoBlending, PerspectiveCamera, REVISION, ShaderMaterial, Uniform, Vector2 } from "three";

import fragmentTemplate from "./glsl/effect/shader.frag";
import vertexTemplate from "./glsl/effect/shader.vert";

/**
 * An enumeration of shader code placeholders used by the {@link EffectPass}.
 *
 * @type {Object}
 * @deprecated Use EffectMaterial.Section instead.
 */

export const Section = {
	FRAGMENT_HEAD: "FRAGMENT_HEAD",
	FRAGMENT_MAIN_UV: "FRAGMENT_MAIN_UV",
	FRAGMENT_MAIN_IMAGE: "FRAGMENT_MAIN_IMAGE",
	VERTEX_HEAD: "VERTEX_HEAD",
	VERTEX_MAIN_SUPPORT: "VERTEX_MAIN_SUPPORT"
};

/**
 * An effect material for compound shaders. Supports dithering.
 *
 * @implements {Resizable}
 */

export class EffectMaterial extends ShaderMaterial {

	/**
	 * Constructs a new effect material.
	 *
	 * @param {Map<String, String>} [shaderParts] - A collection of shader snippets. See {@link Section}.
	 * @param {Map<String, String>} [defines] - A collection of preprocessor macro definitions.
	 * @param {Map<String, Uniform>} [uniforms] - A collection of uniforms.
	 * @param {Camera} [camera] - A camera.
	 * @param {Boolean} [dithering=false] - Whether dithering should be enabled.
	 */

	constructor(shaderParts, defines, uniforms, camera, dithering = false) {

		super({
			name: "EffectMaterial",
			defines: {
				THREE_REVISION: REVISION,
				DEPTH_PACKING: "0",
				ENCODE_OUTPUT: "1"
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
			blending: NoBlending,
			depthWrite: false,
			depthTest: false,
			dithering
		});

		/** @ignore */
		this.toneMapped = false;

		if(shaderParts) {

			this.setShaderParts(shaderParts);

		}

		if(defines) {

			this.setDefines(defines);

		}

		if(uniforms) {

			this.setUniforms(uniforms);

		}

		this.adoptCameraSettings(camera);

	}

	/**
	 * The current depth packing.
	 *
	 * @type {DepthPackingStrategies}
	 * @deprecated Use getDepthPacking() instead.
	 */

	get depthPacking() {

		return this.getDepthPacking();

	}

	/**
	 * Sets the depth packing.
	 *
	 * @type {DepthPackingStrategies}
	 * @deprecated Use setDepthPacking() instead.
	 */

	set depthPacking(value) {

		this.setDepthPacking(value);

	}

	/**
	 * Returns the current depth packing strategy.
	 *
	 * @return {DepthPackingStrategies} The depth packing strategy.
	 */

	getDepthPacking() {

		return Number(this.defines.DEPTH_PACKING);

	}

	/**
	 * Sets the depth packing strategy.
	 *
	 * @param {DepthPackingStrategies} value - The depth packing strategy.
	 */

	setDepthPacking(value) {

		this.defines.DEPTH_PACKING = value.toFixed(0);
		this.needsUpdate = true;

	}

	/**
	 * Sets the shader parts.
	 *
	 * @param {Map<String, String>} shaderParts - A collection of shader snippets. See {@link Section}.
	 * @return {EffectMaterial} This material.
	 */

	setShaderParts(shaderParts) {

		this.fragmentShader = fragmentTemplate
			.replace(Section.FRAGMENT_HEAD, shaderParts.get(Section.FRAGMENT_HEAD))
			.replace(Section.FRAGMENT_MAIN_UV, shaderParts.get(Section.FRAGMENT_MAIN_UV))
			.replace(Section.FRAGMENT_MAIN_IMAGE, shaderParts.get(Section.FRAGMENT_MAIN_IMAGE));

		this.vertexShader = vertexTemplate
			.replace(Section.VERTEX_HEAD, shaderParts.get(Section.VERTEX_HEAD))
			.replace(Section.VERTEX_MAIN_SUPPORT, shaderParts.get(Section.VERTEX_MAIN_SUPPORT));

		this.needsUpdate = true;
		return this;

	}

	/**
	 * Sets the shader macros.
	 *
	 * @param {Map<String, String>} defines - A collection of preprocessor macro definitions.
	 * @return {EffectMaterial} This material.
	 */

	setDefines(defines) {

		for(const entry of defines.entries()) {

			this.defines[entry[0]] = entry[1];

		}

		this.needsUpdate = true;
		return this;

	}

	/**
	 * Sets the shader uniforms.
	 *
	 * @param {Map<String, Uniform>} uniforms - A collection of uniforms.
	 * @return {EffectMaterial} This material.
	 */

	setUniforms(uniforms) {

		for(const entry of uniforms.entries()) {

			this.uniforms[entry[0]] = entry[1];

		}

		return this;

	}

	/**
	 * Adopts the settings of the given camera.
	 *
	 * @param {Camera} camera - A camera.
	 */

	adoptCameraSettings(camera) {

		if(camera) {

			this.uniforms.cameraNear.value = camera.near;
			this.uniforms.cameraFar.value = camera.far;

			if(camera instanceof PerspectiveCamera) {

				this.defines.PERSPECTIVE_CAMERA = "1";

			} else {

				delete this.defines.PERSPECTIVE_CAMERA;

			}

			this.needsUpdate = true;

		}

	}

	/**
	 * Sets the resolution.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		const w = Math.max(width, 1);
		const h = Math.max(height, 1);

		this.uniforms.resolution.value.set(w, h);
		this.uniforms.texelSize.value.set(1.0 / w, 1.0 / h);
		this.uniforms.aspect.value = w / h;

	}

	/**
	 * An enumeration of shader code section placeholders used by the {@link EffectPass}.
	 *
	 * @type {Object}
	 * @property {String} FRAGMENT_HEAD - A placeholder for function and variable declarations inside the fragment shader.
	 * @property {String} FRAGMENT_MAIN_UV - A placeholder for UV transformations inside the fragment shader.
	 * @property {String} FRAGMENT_MAIN_IMAGE - A placeholder for color calculations inside the fragment shader.
	 * @property {String} VERTEX_HEAD - A placeholder for function and variable declarations inside the vertex shader.
	 * @property {String} VERTEX_MAIN_SUPPORT - A placeholder for supporting calculations inside the vertex shader.
	 */

	static get Section() {

		return Section;

	}

}
