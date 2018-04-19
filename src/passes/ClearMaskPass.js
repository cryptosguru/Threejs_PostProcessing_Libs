import { Pass } from "./Pass.js";

/**
 * A pass that disables the stencil test.
 */

export class ClearMaskPass extends Pass {

	/**
	 * Constructs a new clear mask pass.
	 */

	constructor() {

		super("ClearMaskPass", null, null, null);

		this.needsSwap = false;

	}

	/**
	 * Disables the stencil test.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 */

	render(renderer) {

		renderer.state.buffers.stencil.setTest(false);

	}

}
