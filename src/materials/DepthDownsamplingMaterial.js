import { NoBlending, ShaderMaterial, Uniform, Vector2 } from "three";

import fragmentShader from "./glsl/depth-downsampling/shader.frag";
import vertexShader from "./glsl/depth-downsampling/shader.vert";

/**
 * A depth downsampling shader material.
 *
 * Based on an article by Eleni Maria Stea:
 * https://eleni.mutantstargoat.com/hikiko/depth-aware-upsampling-6
 */

export class DepthDownsamplingMaterial extends ShaderMaterial {

	/**
	 * Constructs a new depth downsampling material.
	 */

	constructor() {

		super({
			name: "DepthDownsamplingMaterial",
			defines: {
				DEPTH_PACKING: "0"
			},
			uniforms: {
				depthBuffer: new Uniform(null),
				normalBuffer: new Uniform(null),
				texelSize: new Uniform(new Vector2())
			},
			blending: NoBlending,
			depthWrite: false,
			depthTest: false,
			fragmentShader,
			vertexShader
		});

		/** @ignore */
		this.toneMapped = false;

	}

	/**
	 * Sets the depth buffer.
	 *
	 * @param {Texture} buffer - The depth texture.
	 * @param {DepthPackingStrategies} [depthPacking=BasicDepthPacking] - The depth packing strategy.
	 */

	setDepthBuffer(buffer, depthPacking = BasicDepthPacking) {

		this.uniforms.depthBuffer.value = buffer;
		this.defines.DEPTH_PACKING = depthPacking.toFixed(0);
		this.needsUpdate = true;

	}

	/**
	 * The current depth packing.
	 *
	 * @type {DepthPackingStrategies}
	 * @deprecated Removed without replacement.
	 */

	get depthPacking() {

		return Number(this.defines.DEPTH_PACKING);

	}

	/**
	 * Sets the depth packing.
	 *
	 * @type {DepthPackingStrategies}
	 * @deprecated Use setDepthBuffer() instead.
	 */

	set depthPacking(value) {

		this.defines.DEPTH_PACKING = value.toFixed(0);
		this.needsUpdate = true;

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
