import { BlendFunction } from "./blending/BlendFunction.js";
import { Effect } from "./Effect.js";

import fragmentShader from "./glsl/noise/shader.frag";

/**
 * A noise effect.
 */

export class NoiseEffect extends Effect {

	/**
	 * Constructs a new noise effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.SCREEN] - The blend function of this effect.
	 * @param {Boolean} [options.premultiply=false] - Whether the noise should be multiplied with the input color.
	 */

	constructor({ blendFunction = BlendFunction.SCREEN, premultiply = false } = {}) {

		super("NoiseEffect", fragmentShader, { blendFunction });

		this.premultiply = premultiply;

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
