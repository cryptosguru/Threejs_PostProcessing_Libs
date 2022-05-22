import { LinearFilter, UnsignedByteType, WebGLRenderTarget } from "three";
import { LuminanceMaterial } from "../materials";
import { Resolution } from "../core/Resolution";
import { Pass } from "./Pass";

/**
 * A pass that renders luminance.
 */

export class LuminancePass extends Pass {

	/**
	 * Constructs a new luminance pass.
	 *
	 * @param {Object} [options] - The options. See {@link LuminanceMaterial} for additional options.
	 * @param {Number} [options.width=Resolution.AUTO_SIZE] - The render width.
	 * @param {Number} [options.height=Resolution.AUTO_SIZE] - The render height.
	 * @param {WebGLRenderTarget} [options.renderTarget] - A custom render target.
	 */

	constructor({
		width = Resolution.AUTO_SIZE,
		height = Resolution.AUTO_SIZE,
		renderTarget,
		luminanceRange,
		colorOutput
	} = {}) {

		super("LuminancePass");

		this.fullscreenMaterial = new LuminanceMaterial(colorOutput, luminanceRange);
		this.needsSwap = false;

		/**
		 * The luminance render target.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTarget = renderTarget;

		if(this.renderTarget === undefined) {

			this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: LinearFilter,
				magFilter: LinearFilter,
				stencilBuffer: false,
				depthBuffer: false
			});

			this.renderTarget.texture.name = "LuminancePass.Target";
			this.renderTarget.texture.generateMipmaps = false;

		}

		/**
		 * The resolution.
		 *
		 * @type {Resolution}
		 * @readonly
		 */

		const resolution = this.resolution = new Resolution(this, width, height);
		resolution.addEventListener("change", (e) => this.setSize(resolution.baseWidth, resolution.baseHeight));

	}

	/**
	 * The luminance texture.
	 *
	 * @type {Texture}
	 */

	get texture() {

		return this.renderTarget.texture;

	}

	/**
	 * Returns the luminance texture.
	 *
	 * @deprecated Use texture instead.
	 * @return {Texture} The texture.
	 */

	getTexture() {

		return this.renderTarget.texture;

	}

	/**
	 * Returns the resolution settings.
	 *
	 * @deprecated Use resolution instead.
	 * @return {Resolution} The resolution.
	 */

	getResolution() {

		return this.resolution;

	}

	/**
	 * Renders the luminance.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest) {

		const material = this.fullscreenMaterial;
		material.inputBuffer = inputBuffer.texture;
		renderer.setRenderTarget(this.renderToScreen ? null : this.renderTarget);
		renderer.render(this.scene, this.camera);

	}

	/**
	 * Updates the size of this pass.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		const resolution = this.resolution;
		resolution.setBaseSize(width, height);
		this.renderTarget.setSize(resolution.width, resolution.height);

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - A renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel.
	 * @param {Number} frameBufferType - The type of the main frame buffers.
	 */

	initialize(renderer, alpha, frameBufferType) {

		if(frameBufferType !== undefined && frameBufferType !== UnsignedByteType) {

			this.fullscreenMaterial.defines.FRAMEBUFFER_PRECISION_HIGH = "1";

		}

	}

}
