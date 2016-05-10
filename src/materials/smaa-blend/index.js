import THREE from "three";

import fragment from "./glsl/shader.frag";
import vertex from "./glsl/shader.vert";

/**
 * Subpixel Morphological Antialiasing.
 *
 * This material is used to render the final antialiasing.
 *
 * @class SMAABlendMaterial
 * @submodule materials
 * @extends ShaderMaterial
 * @constructor
 * @param {Vector2} [texelSize] - The absolute screen texel size.
 */

export class SMAABlendMaterial extends THREE.ShaderMaterial {

	constructor(texelSize) {

		super({

			type: "SMAABlendMaterial",

			uniforms: {

				tDiffuse: {value: null},
				tWeights: {value: null},
				texelSize: {value: (texelSize !== undefined) ? texelSize : new THREE.Vector2()}

			},

			fragmentShader: fragment,
			vertexShader: vertex

		});

	}

}
