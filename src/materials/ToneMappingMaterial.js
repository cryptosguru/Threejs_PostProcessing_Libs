import { ShaderMaterial, Uniform } from "three";

import fragment from "./glsl/tone-mapping/shader.frag";
import vertex from "./glsl/tone-mapping/shader.vert";

/**
 * Full-screen tone-mapping shader material.
 *
 * This material supports dithering.
 *
 * Reference:
 *  http://www.cis.rit.edu/people/faculty/ferwerda/publications/sig02_paper.pdf
 */

export class ToneMappingMaterial extends ShaderMaterial {

	/**
	 * Constructs a new tone mapping material.
	 */

	constructor() {

		super({

			type: "ToneMappingMaterial",

			uniforms: {

				tDiffuse: new Uniform(null),
				luminanceMap: new Uniform(null),
				averageLuminance: new Uniform(1.0),
				maxLuminance: new Uniform(16.0),
				middleGrey: new Uniform(0.6)

			},

			fragmentShader: fragment,
			vertexShader: vertex,

			depthWrite: false,
			depthTest: false

		});

	}

}
