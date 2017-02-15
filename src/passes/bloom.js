import { RGBFormat } from "three";
import { CombineMaterial, LuminosityMaterial } from "../materials";
import { BlurPass } from "./blur.js";
import { Pass } from "./pass.js";

/**
 * A bloom pass.
 *
 * This pass renders a scene with superimposed blur by utilising the fast Kawase
 * convolution approach.
 *
 * @class BloomPass
 * @submodule passes
 * @extends Pass
 * @constructor
 * @param {Object} [options] - The options.
 * @param {Number} [options.resolutionScale=0.5] - The render texture resolution scale, relative to the screen render size.
 * @param {Number} [options.kernelSize=KernelSize.LARGE] - The blur kernel size.
 * @param {Number} [options.intensity=1.0] - The strength of the bloom effect.
 * @param {Number} [options.distinction=1.0] - The luminance distinction factor. Raise this value to bring out the brighter elements in the scene.
 * @param {Number} [options.screenMode=true] - Whether the screen blend mode should be used for combining the bloom texture with the scene colors.
 */

export class BloomPass extends Pass {

	constructor(options = {}) {

		super();

		this.name = "BloomPass";

		/**
		 * A blur pass.
		 *
		 * @property blurPass
		 * @type BlurPass
		 * @private
		 */

		this.blurPass = new BlurPass(options);

		/**
		 * A render target.
		 *
		 * @property renderTargetX
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetX = this.blurPass.renderTargetX.clone();

		this.renderTargetX.texture.name = "Bloom.TargetX";

		/**
		 * A second render target.
		 *
		 * @property renderTargetY
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetY = this.blurPass.renderTargetY.clone();

		this.renderTargetY.texture.name = "Bloom.TargetY";

		/**
		 * Combine shader material.
		 *
		 * @property combineMaterial
		 * @type CombineMaterial
		 * @private
		 */

		this.combineMaterial = new CombineMaterial((options.screenMode !== undefined) ? options.screenMode : true);

		this.intensity = options.intensity;

		/**
		 * Luminance shader material.
		 *
		 * @property luminosityMaterial
		 * @type LuminosityMaterial
		 * @private
		 */

		this.luminosityMaterial = new LuminosityMaterial(true);

		this.distinction = options.distinction;

	}

	/**
	 * The resolution scale.
	 *
	 * You need to call
	 * {{#crossLink "EffectComposer/setSize:method"}}{{/crossLink}} after changing
	 * this value.
	 *
	 * @property resolutionScale
	 * @type Number
	 * @default 0.5
	 */

	get resolutionScale() { return this.blurPass.resolutionScale; }

	set resolutionScale(x) {

		this.blurPass.resolutionScale = x;

	}

	/**
	 * The blur kernel size.
	 *
	 * @property kernelSize
	 * @type KernelSize
	 * @default KernelSize.LARGE
	 */

	get kernelSize() { return this.blurPass.kernelSize; }

	set kernelSize(x) {

		this.blurPass.kernelSize = x;

	}

	/**
	 * The overall intensity of the effect.
	 *
	 * @property intensity
	 * @type Number
	 * @default 1.0
	 */

	get intensity() { return this.combineMaterial.uniforms.opacity2.value; }

	set intensity(x) {

		if(typeof x === "number") {

			this.combineMaterial.uniforms.opacity2.value = x;

		}

	}

	/**
	 * The luminance distinction factor.
	 *
	 * @property distinction
	 * @type Number
	 * @default 1.0
	 */

	get distinction() { return this.luminosityMaterial.uniforms.distinction.value; }

	set distinction(x) {

		if(typeof x === "number") {

			this.luminosityMaterial.uniforms.distinction.value = x;

		}

	}

	/**
	 * Renders the effect.
	 *
	 * Extracts a luminance map from the read buffer, blurs it and combines it
	 * with the read buffer.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer to use.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 */

	render(renderer, readBuffer, writeBuffer) {

		const quad = this.quad;
		const scene = this.scene;
		const camera = this.camera;
		const blurPass = this.blurPass;

		const luminosityMaterial = this.luminosityMaterial;
		const combineMaterial = this.combineMaterial;

		const renderTargetX = this.renderTargetX;
		const renderTargetY = this.renderTargetY;

		// Luminance filter.
		quad.material = luminosityMaterial;
		luminosityMaterial.uniforms.tDiffuse.value = readBuffer.texture;
		renderer.render(scene, camera, renderTargetX);

		// Convolution phase.
		blurPass.render(renderer, renderTargetX, renderTargetY);

		// Render the original scene with superimposed blur.
		quad.material = combineMaterial;
		combineMaterial.uniforms.texture1.value = readBuffer.texture;
		combineMaterial.uniforms.texture2.value = renderTargetY.texture;

		renderer.render(scene, camera, this.renderToScreen ? null : writeBuffer, this.clear);

	}

	/**
	 * Adjusts the format of the render targets.
	 *
	 * @method initialise
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 */

	initialise(renderer, alpha) {

		this.blurPass.initialise(renderer, alpha);

		if(!alpha) {

			this.renderTargetX.texture.format = RGBFormat;
			this.renderTargetY.texture.format = RGBFormat;

		}

	}

	/**
	 * Updates this pass with the renderer's size.
	 *
	 * @method setSize
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		this.blurPass.setSize(width, height);

		width = this.blurPass.renderTargetX.width;
		height = this.blurPass.renderTargetX.height;

		this.renderTargetX.setSize(width, height);
		this.renderTargetY.setSize(width, height);

	}

}
