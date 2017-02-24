import { BokehMaterial } from "../materials";
import { Pass } from "./pass.js";

/**
 * A Depth of Field (DoF) pass using a bokeh shader.
 *
 * This pass requires a
 * {{#crossLink "EffectComposer/depthTexture:property"}}{{/crossLink}}.
 *
 * @class BokehPass
 * @submodule passes
 * @extends Pass
 * @constructor
 * @param {PerspectiveCamera} camera - The main camera. Used to obtain the aspect ratio and the near and far plane settings.
 * @param {Object} [options] - Additional parameters.
 * @param {Number} [options.focus=1.0] - Focus distance.
 * @param {Number} [options.aperture=0.025] - Camera aperture scale. Bigger values for shallower depth of field.
 * @param {Number} [options.maxBlur=1.0] - Maximum blur strength.
 */

export class BokehPass extends Pass {

	constructor(camera, options = {}) {

		super();

		this.name = "BokehPass";
		this.needsSwap = true;

		/**
		 * Bokeh shader material.
		 *
		 * @property bokehMaterial
		 * @type BokehMaterial
		 * @private
		 */

		this.bokehMaterial = new BokehMaterial(camera, options);

		this.quad.material = this.bokehMaterial;

	}

	/**
	 * Renders the effect.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 */

	render(renderer, readBuffer, writeBuffer) {

		this.bokehMaterial.uniforms.tDiffuse.value = readBuffer.texture;
		this.bokehMaterial.uniforms.tDepth.value = readBuffer.depthTexture;

		renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);

	}

	/**
	 * Updates this pass with the renderer's size.
	 *
	 * @method setSize
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.bokehMaterial.uniforms.aspect.value = width / height;

	}

}
