import { Color, MeshDepthMaterial, NearestFilter, RGBADepthPacking, WebGLRenderTarget } from "three";
import { Resolution } from "../core/Resolution";
import { Pass } from "./Pass";
import { RenderPass } from "./RenderPass";

/**
 * A pass that renders depth into an RGBA buffer.
 */

export class DepthPass extends Pass {

	/**
	 * Constructs a new depth pass.
	 *
	 * @param {Scene} scene - The scene to render.
	 * @param {Camera} camera - The camera to use to render the scene.
	 * @param {Object} [options] - The options.
	 * @param {WebGLRenderTarget} [options.renderTarget] - A custom render target.
	 * @param {Number} [options.resolutionScale=1.0] - The resolution scale.
	 * @param {Number} [options.resolutionX=Resolution.AUTO_SIZE] - The horizontal resolution.
	 * @param {Number} [options.resolutionY=Resolution.AUTO_SIZE] - The vertical resolution.
	 * @param {Number} [options.width=Resolution.AUTO_SIZE] - Deprecated. Use resolutionX instead.
	 * @param {Number} [options.height=Resolution.AUTO_SIZE] - Deprecated. Use resolutionY instead.
	 */

	constructor(scene, camera, {
		renderTarget,
		resolutionScale = 1.0,
		width = Resolution.AUTO_SIZE,
		height = Resolution.AUTO_SIZE,
		resolutionX = width,
		resolutionY = height
	} = {}) {

		super("DepthPass");

		this.needsSwap = false;

		/**
		 * A render pass.
		 *
		 * @type {RenderPass}
		 * @private
		 */

		this.renderPass = new RenderPass(scene, camera, new MeshDepthMaterial({
			depthPacking: RGBADepthPacking
		}));

		const renderPass = this.renderPass;
		renderPass.skipShadowMapUpdate = true;
		renderPass.ignoreBackground = true;

		const clearPass = renderPass.getClearPass();
		clearPass.overrideClearColor = new Color(0xffffff);
		clearPass.overrideClearAlpha = 1;

		/**
		 * A render target that contains the scene depth.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTarget = renderTarget;

		if(this.renderTarget === undefined) {

			this.renderTarget = new WebGLRenderTarget(1, 1, {
				minFilter: NearestFilter,
				magFilter: NearestFilter,
				stencilBuffer: false
			});

			this.renderTarget.texture.name = "DepthPass.Target";

		}

		/**
		 * The resolution.
		 *
		 * @type {Resolution}
		 */

		const resolution = this.resolution = new Resolution(this, resolutionX, resolutionY, resolutionScale);
		resolution.addEventListener("change", (e) => this.setSize(resolution.baseWidth, resolution.baseHeight));

	}

	/**
	 * The depth texture.
	 *
	 * @type {Texture}
	 */

	get texture() {

		return this.renderTarget.texture;

	}

	/**
	 * Returns the depth texture.
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
	 * Returns the current resolution scale.
	 *
	 * @return {Number} The resolution scale.
	 * @deprecated Use resolution instead.
	 */

	getResolutionScale() {

		return this.resolution.scale;

	}

	/**
	 * Sets the resolution scale.
	 *
	 * @param {Number} scale - The new resolution scale.
	 * @deprecated Use resolution instead.
	 */

	setResolutionScale(scale) {

		this.resolution.scale = scale;

	}

	/**
	 * Renders the scene depth.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {WebGLRenderTarget} outputBuffer - A frame buffer that serves as the output render target unless this pass renders to screen.
	 * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
	 * @param {Boolean} [stencilTest] - Indicates whether a stencil mask is active.
	 */

	render(renderer, inputBuffer, outputBuffer, deltaTime, stencilTest) {

		const renderTarget = this.renderToScreen ? null : this.renderTarget;
		this.renderPass.render(renderer, renderTarget);

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

}
