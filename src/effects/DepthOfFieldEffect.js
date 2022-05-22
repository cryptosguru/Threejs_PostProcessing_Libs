import { BasicDepthPacking, LinearFilter, sRGBEncoding, Uniform, UnsignedByteType, WebGLRenderTarget } from "three";
import { BokehMaterial, CircleOfConfusionMaterial, MaskFunction, MaskMaterial } from "../materials";
import { ColorChannel, KernelSize, Resolution } from "../core";
import { KawaseBlurPass, ShaderPass } from "../passes";
import { viewZToOrthographicDepth } from "../utils";
import { BlendFunction } from "./blending/BlendFunction";
import { Effect, EffectAttribute } from "./Effect";

import fragmentShader from "./glsl/depth-of-field/shader.frag";

/**
 * A depth of field effect.
 *
 * Based on a graphics study by Adrian Courrèges and an article by Steve Avery:
 * https://www.adriancourreges.com/blog/2016/09/09/doom-2016-graphics-study/
 * https://pixelmischiefblog.wordpress.com/2016/11/25/bokeh-depth-of-field/
 */

export class DepthOfFieldEffect extends Effect {

	/**
	 * Constructs a new depth of field effect.
	 *
	 * @param {Camera} camera - The main camera.
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.worldFocusDistance] - The focus distance in world units.
	 * @param {Number} [options.worldFocusRange] - The focus distance in world units.
	 * @param {Number} [options.focusDistance=0.0] - The normalized focus distance. Range is [0.0, 1.0].
	 * @param {Number} [options.focusRange=0.1] - The focus range. Range is [0.0, 1.0].
	 * @param {Number} [options.focalLength=0.1] - Deprecated.
	 * @param {Number} [options.bokehScale=1.0] - The scale of the bokeh blur.
	 * @param {Number} [options.width=Resolution.AUTO_SIZE] - The render width.
	 * @param {Number} [options.height=Resolution.AUTO_SIZE] - The render height.
	 */

	constructor(camera, {
		blendFunction = BlendFunction.NORMAL,
		worldFocusDistance,
		worldFocusRange,
		focusDistance = 0.0,
		focalLength = 0.1,
		focusRange = focalLength,
		bokehScale = 1.0,
		width = Resolution.AUTO_SIZE,
		height = Resolution.AUTO_SIZE
	} = {}) {

		super("DepthOfFieldEffect", fragmentShader, {
			blendFunction,
			attributes: EffectAttribute.DEPTH,
			uniforms: new Map([
				["nearColorBuffer", new Uniform(null)],
				["farColorBuffer", new Uniform(null)],
				["nearCoCBuffer", new Uniform(null)],
				["scale", new Uniform(1.0)]
			])
		});

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.camera = camera;

		/**
		 * A render target for intermediate results.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTarget = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTarget.texture.name = "DoF.Intermediate";
		this.renderTarget.texture.generateMipmaps = false;

		/**
		 * A render target for masked background colors (premultiplied with CoC).
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetMasked = this.renderTarget.clone();
		this.renderTargetMasked.texture.name = "DoF.Masked.Far";

		/**
		 * A render target for the blurred foreground colors.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetNear = this.renderTarget.clone();
		this.renderTargetNear.texture.name = "DoF.Bokeh.Near";
		this.uniforms.get("nearColorBuffer").value = this.renderTargetNear.texture;

		/**
		 * A render target for the blurred background colors.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetFar = this.renderTarget.clone();
		this.renderTargetFar.texture.name = "DoF.Bokeh.Far";
		this.uniforms.get("farColorBuffer").value = this.renderTargetFar.texture;

		/**
		 * A render target for the circle of confusion.
		 *
		 * - Negative values are stored in the `RED` channel (foreground).
		 * - Positive values are stored in the `GREEN` channel (background).
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetCoC = this.renderTarget.clone();
		this.renderTargetCoC.texture.name = "DoF.CoC";

		/**
		 * A render target that stores a blurred copy of the circle of confusion.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetCoCBlurred = this.renderTargetCoC.clone();
		this.renderTargetCoCBlurred.texture.name = "DoF.CoC.Blurred";
		this.uniforms.get("nearCoCBuffer").value = this.renderTargetCoCBlurred.texture;

		/**
		 * A circle of confusion pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.cocPass = new ShaderPass(new CircleOfConfusionMaterial(camera));
		const cocMaterial = this.cocMaterial;
		cocMaterial.focusDistance = focusDistance;
		cocMaterial.focusRange = focusRange;

		if(worldFocusDistance !== undefined) {

			cocMaterial.worldFocusDistance = worldFocusDistance;

		}

		if(worldFocusRange !== undefined) {

			cocMaterial.worldFocusRange = worldFocusRange;

		}

		/**
		 * This pass blurs the foreground CoC buffer to soften edges.
		 *
		 * @type {KawaseBlurPass}
		 * @deprecated Use getBlurPass() instead.
		 */

		this.blurPass = new KawaseBlurPass({ kernelSize: KernelSize.MEDIUM, width, height });

		const resolution = this.blurPass.getResolution();
		resolution.addEventListener("change", (e) => this.setSize(
			resolution.getBaseWidth(),
			resolution.getBaseHeight()
		));

		/**
		 * A mask pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.maskPass = new ShaderPass(new MaskMaterial(this.renderTargetCoC.texture));
		const maskMaterial = this.maskPass.fullscreenMaterial;
		maskMaterial.maskFunction = MaskFunction.MULTIPLY;
		maskMaterial.colorChannel = ColorChannel.GREEN;

		/**
		 * A bokeh blur pass for the foreground colors.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.bokehNearBasePass = new ShaderPass(new BokehMaterial(false, true));
		this.bokehNearBasePass.fullscreenMaterial.cocBuffer = this.renderTargetCoCBlurred.texture;

		/**
		 * A bokeh fill pass for the foreground colors.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.bokehNearFillPass = new ShaderPass(new BokehMaterial(true, true));
		this.bokehNearFillPass.fullscreenMaterial.cocBuffer = this.renderTargetCoCBlurred.texture;

		/**
		 * A bokeh blur pass for the background colors.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.bokehFarBasePass = new ShaderPass(new BokehMaterial(false, false));
		this.bokehFarBasePass.fullscreenMaterial.cocBuffer = this.renderTargetCoC.texture;

		/**
		 * A bokeh fill pass for the background colors.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.bokehFarFillPass = new ShaderPass(new BokehMaterial(true, false));
		this.bokehFarFillPass.fullscreenMaterial.cocBuffer = this.renderTargetCoC.texture;


		/**
		 * A target position that should be kept in focus. Set to `null` to disable auto focus.
		 *
		 * @type {Vector3}
		 */

		this.target = null;

		this.bokehScale = bokehScale;

	}

	/**
	 * The circle of confusion texture.
	 *
	 * @type {Texture}
	 */

	get cocTexture() {

		return this.renderTargetCoC.texture;

	}

	/**
	 * The circle of confusion material.
	 *
	 * @type {CircleOfConfusionMaterial}
	 */

	get cocMaterial() {

		return this.cocPass.fullscreenMaterial;

	}

	/**
	 * The circle of confusion material.
	 *
	 * @deprecated Use cocMaterial instead.
	 * @type {CircleOfConfusionMaterial}
	 */

	get circleOfConfusionMaterial() {

		return this.cocMaterial;

	}

	/**
	 * Returns the circle of confusion material.
	 *
	 * @deprecated Use cocMaterial instead.
	 * @return {CircleOfConfusionMaterial} The material.
	 */

	getCircleOfConfusionMaterial() {

		return this.circleOfConfusionMaterial;

	}

	/**
	 * Returns the pass that blurs the foreground CoC buffer to soften edges.
	 *
	 * @deprecated Use blurPass instead.
	 * @return {KawaseBlurPass} The blur pass.
	 */

	getBlurPass() {

		return this.blurPass;

	}

	/**
	 * The resolution of this effect.
	 *
	 * @type {Resolution}
	 */

	get resolution() {

		return this.blurPass.getResolution();

	}

	/**
	 * Returns the resolution settings.
	 *
	 * @deprecated Use resolution instead.
	 * @return {Resolution} The resolution.
	 */

	getResolution() {

		return this.blurPass.getResolution();

	}

	/**
	 * The current bokeh scale.
	 *
	 * @type {Number}
	 */

	get bokehScale() {

		return this.uniforms.get("scale").value;

	}

	set bokehScale(value) {

		const passes = [
			this.bokehNearBasePass,
			this.bokehNearFillPass,
			this.bokehFarBasePass,
			this.bokehFarFillPass
		];

		for(const p of passes) {

			p.fullscreenMaterial.setScale(value);

		}

		this.maskPass.fullscreenMaterial.setStrength(value);
		this.uniforms.get("scale").value = value;

	}

	/**
	 * Returns the current bokeh scale.
	 *
	 * @deprecated Use bokehScale instead.
	 * @return {Number} The scale.
	 */

	getBokehScale() {

		return this.bokehScale;

	}

	/**
	 * Sets the bokeh scale.
	 *
	 * @deprecated Use bokehScale instead.
	 * @param {Number} value - The scale.
	 */

	setBokehScale(value) {

		this.bokehScale = value;

	}

	/**
	 * Returns the current auto focus target.
	 *
	 * @deprecated Use target instead.
	 * @return {Vector3} The target.
	 */

	getTarget() {

		return this.target;

	}

	/**
	 * Sets the auto focus target.
	 *
	 * @deprecated Use target instead.
	 * @param {Vector3} value - The target.
	 */

	setTarget(value) {

		this.target = value;

	}

	/**
	 * Calculates the focus distance from the camera to the given position.
	 *
	 * @param {Vector3} target - The target.
	 * @return {Number} The normalized focus distance.
	 */

	calculateFocusDistance(target) {

		const camera = this.camera;
		const distance = camera.position.distanceTo(target);
		return viewZToOrthographicDepth(-distance, camera.near, camera.far);

	}

	/**
	 * Sets the depth texture.
	 *
	 * @param {Texture} depthTexture - A depth texture.
	 * @param {DepthPackingStrategies} [depthPacking=BasicDepthPacking] - The depth packing.
	 */

	setDepthTexture(depthTexture, depthPacking = BasicDepthPacking) {

		this.circleOfConfusionMaterial.depthBuffer = depthTexture;
		this.circleOfConfusionMaterial.depthPacking = depthPacking;

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, deltaTime) {

		const renderTarget = this.renderTarget;
		const renderTargetCoC = this.renderTargetCoC;
		const renderTargetCoCBlurred = this.renderTargetCoCBlurred;
		const renderTargetMasked = this.renderTargetMasked;

		// Auto focus.
		if(this.target !== null) {

			const distance = this.calculateFocusDistance(this.target);
			this.circleOfConfusionMaterial.focusDistance = distance;

		}

		// Render the CoC and create a blurred version for soft near field blending.
		this.cocPass.render(renderer, null, renderTargetCoC);
		this.blurPass.render(renderer, renderTargetCoC, renderTargetCoCBlurred);

		// Prevent sharp colors from bleeding onto the background.
		this.maskPass.render(renderer, inputBuffer, renderTargetMasked);

		// Use the sharp CoC buffer and render the background bokeh.
		this.bokehFarBasePass.render(renderer, renderTargetMasked, renderTarget);
		this.bokehFarFillPass.render(renderer, renderTarget, this.renderTargetFar);

		// Use the blurred CoC buffer and render the foreground bokeh.
		this.bokehNearBasePass.render(renderer, inputBuffer, renderTarget);
		this.bokehNearFillPass.render(renderer, renderTarget, this.renderTargetNear);

	}

	/**
	 * Updates the size of internal render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		const resolution = this.resolution;
		resolution.setBaseSize(width, height);
		const w = resolution.width, h = resolution.height;

		let resizables = [
			this.cocPass,
			this.blurPass,
			this.maskPass,
			this.bokehNearBasePass,
			this.bokehNearFillPass,
			this.bokehFarBasePass,
			this.bokehFarFillPass
		];

		// These buffers require full resolution to prevent bleeding artifacts.
		resizables.push(this.renderTargetCoC, this.renderTargetMasked);
		resizables.forEach((r) => r.setSize(width, height));

		resizables = [
			this.renderTarget,
			this.renderTargetNear,
			this.renderTargetFar,
			this.renderTargetCoCBlurred
		];

		resizables.forEach((r) => r.setSize(w, h));

		// The bokeh blur passes operate on the low resolution buffers.
		const passes = [
			this.bokehNearBasePass,
			this.bokehNearFillPass,
			this.bokehFarBasePass,
			this.bokehFarFillPass
		];

		passes.forEach((p) => p.fullscreenMaterial.setSize(w, h));

	}

	/**
	 * Performs initialization tasks.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {Boolean} alpha - Whether the renderer uses the alpha channel or not.
	 * @param {Number} frameBufferType - The type of the main frame buffers.
	 */

	initialize(renderer, alpha, frameBufferType) {

		const initializables = [
			this.cocPass,
			this.maskPass,
			this.bokehNearBasePass,
			this.bokehNearFillPass,
			this.bokehFarBasePass,
			this.bokehFarFillPass
		];

		initializables.forEach((i) => i.initialize(renderer, alpha, frameBufferType));

		// The blur pass operates on the CoC buffer.
		this.blurPass.initialize(renderer, alpha, UnsignedByteType);

		if(frameBufferType !== undefined) {

			this.renderTarget.texture.type = frameBufferType;
			this.renderTargetNear.texture.type = frameBufferType;
			this.renderTargetFar.texture.type = frameBufferType;
			this.renderTargetMasked.texture.type = frameBufferType;

			if(renderer.outputEncoding === sRGBEncoding) {

				this.renderTarget.texture.encoding = sRGBEncoding;
				this.renderTargetNear.texture.encoding = sRGBEncoding;
				this.renderTargetFar.texture.encoding = sRGBEncoding;
				this.renderTargetMasked.texture.encoding = sRGBEncoding;

			}

		}

	}

}
