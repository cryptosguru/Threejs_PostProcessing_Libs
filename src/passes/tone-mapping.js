import { LinearFilter, LinearMipMapLinearFilter, MeshBasicMaterial, RGBFormat, WebGLRenderTarget } from "three";
import { AdaptiveLuminosityMaterial, CopyMaterial, LuminosityMaterial, ToneMappingMaterial } from "../materials";
import { Pass } from "./pass.js";

/**
 * Rounds the given number up to the next power of two.
 *
 * @method ceil2
 * @private
 * @static
 * @param {Number} n - A number.
 * @return {Number} The next power of two.
 */

function ceil2(n) { return Math.pow(2, Math.max(0, Math.ceil(Math.log2(n)))); }

/**
 * A tone mapping pass that supports adaptive luminosity.
 *
 * If adaptivity is enabled, this pass generates a texture that represents the
 * luminosity of the current scene and adjusts it over time to simulate the
 * optic nerve responding to the amount of light it is receiving.
 *
 * Reference:
 *  GDC2007 - Wolfgang Engel, Post-Processing Pipeline
 *  http://perso.univ-lyon1.fr/jean-claude.iehl/Public/educ/GAMA/2007/gdc07/Post-Processing_Pipeline.pdf
 *
 * @class ToneMappingPass
 * @submodule passes
 * @extends Pass
 * @constructor
 * @param {Object} [options] - The options.
 * @param {Boolean} [options.adaptive=true] - Whether the tone mapping should use an adaptive luminance map.
 * @param {Number} [options.resolution=256] - The render texture resolution.
 * @param {Number} [options.distinction=1.0] - A luminance distinction factor.
 */

export class ToneMappingPass extends Pass {

	constructor(options = {}) {

		super();

		this.name = "ToneMappingPass";
		this.needsSwap = true;

		/**
		 * Render target for the current limonosity.
		 *
		 * @property renderTargetLuminosity
		 * @type WebGLRenderTarget
		 * @private
		 * @todo Use RED format in WebGL 2.0.
		 */

		this.renderTargetLuminosity = new WebGLRenderTarget(1, 1, {
			minFilter: LinearMipMapLinearFilter,
			magFilter: LinearFilter,
			format: RGBFormat,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetLuminosity.texture.name = "ToneMapping.Luminosity";

		/**
		 * Adapted luminance render target.
		 *
		 * @property renderTargetLuminosity
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetAdapted = this.renderTargetLuminosity.clone();

		this.renderTargetAdapted.texture.name = "ToneMapping.AdaptedLuminosity";
		this.renderTargetAdapted.texture.generateMipmaps = false;
		this.renderTargetAdapted.texture.minFilter = LinearFilter;

		/**
		 * Render target that holds a copy of the adapted limonosity.
		 *
		 * @property renderTargetX
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetPrevious = this.renderTargetAdapted.clone();

		this.renderTargetPrevious.texture.name = "ToneMapping.PreviousLuminosity";

		/**
		 * Copy shader material used for saving the luminance map.
		 *
		 * @property copyMaterial
		 * @type CopyMaterial
		 * @private
		 */

		this.copyMaterial = new CopyMaterial();

		/**
		 * Luminosity shader material.
		 *
		 * @property luminosityMaterial
		 * @type LuminosityMaterial
		 * @private
		 */

		this.luminosityMaterial = new LuminosityMaterial();

		this.luminosityMaterial.uniforms.distinction.value = (options.distinction !== undefined) ? options.distinction : 1.0;

		/**
		 * Adaptive luminance shader material.
		 *
		 * @property adaptiveLuminosityMaterial
		 * @type AdaptiveLuminosityMaterial
		 * @private
		 */

		this.adaptiveLuminosityMaterial = new AdaptiveLuminosityMaterial();

		this.resolution = (options.resolution !== undefined) ? options.resolution : 256;

		/**
		 * Tone mapping shader material.
		 *
		 * @property toneMappingMaterial
		 * @type ToneMappingMaterial
		 * @private
		 */

		this.toneMappingMaterial = new ToneMappingMaterial();

		this.adaptive = (options.adaptive !== undefined) ? options.adaptive : true;

	}

	/**
	 * The resolution of the render targets. Must be a power of two.
	 *
	 * @property resolution
	 * @type Number
	 * @default 256
	 */

	get resolution() { return this.renderTargetLuminosity.width; }

	set resolution(x) {

		x = ceil2(x);

		this.renderTargetLuminosity.setSize(x, x);
		this.renderTargetPrevious.setSize(x, x);
		this.renderTargetAdapted.setSize(x, x);

		this.adaptiveLuminosityMaterial.defines.MIP_LEVEL_1X1 = (Math.round(Math.log(x)) / Math.log(2)).toFixed(1);
		this.adaptiveLuminosityMaterial.needsUpdate = true;

	}

	/**
	 * Whether this pass uses adaptive luminosity.
	 *
	 * @property adaptive
	 * @type Boolean
	 */

	get adaptive() { return this.toneMappingMaterial.defines.ADAPTED_LUMINANCE !== undefined; }

	set adaptive(x) {

		if(x) {

			this.toneMappingMaterial.defines.ADAPTED_LUMINANCE = "1";
			this.toneMappingMaterial.uniforms.luminanceMap.value = this.renderTargetAdapted.texture;

		} else {

			delete this.toneMappingMaterial.defines.ADAPTED_LUMINANCE;
			this.toneMappingMaterial.uniforms.luminanceMap.value = null;

		}

		this.toneMappingMaterial.needsUpdate = true;

	}

	/**
	 * Renders the effect.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 * @param {Number} delta - The render delta time.
	 */

	render(renderer, readBuffer, writeBuffer, delta) {

		const quad = this.quad;
		const scene = this.scene;
		const camera = this.camera;

		const adaptiveLuminosityMaterial = this.adaptiveLuminosityMaterial;
		const luminosityMaterial = this.luminosityMaterial;
		const toneMappingMaterial = this.toneMappingMaterial;

		const renderTargetPrevious = this.renderTargetPrevious;
		const renderTargetLuminosity = this.renderTargetLuminosity;
		const renderTargetAdapted = this.renderTargetAdapted;

		if(this.adaptive) {

			// Render the luminance of the current scene into a render target with mipmapping enabled.
			quad.material = luminosityMaterial;
			luminosityMaterial.uniforms.tDiffuse.value = readBuffer.texture;
			renderer.render(scene, camera, renderTargetLuminosity);

			// Use the new luminance values, the previous luminance and the frame delta to adapt the luminance over time.
			quad.material = adaptiveLuminosityMaterial;
			adaptiveLuminosityMaterial.uniforms.delta.value = delta;
			adaptiveLuminosityMaterial.uniforms.tPreviousLum.value = renderTargetPrevious.texture;
			adaptiveLuminosityMaterial.uniforms.tCurrentLum.value = renderTargetLuminosity.texture;
			renderer.render(scene, camera, renderTargetAdapted);

			// Copy the new adapted luminance value so that it can be used by the next frame.
			quad.material = this.copyMaterial;
			this.copyMaterial.uniforms.tDiffuse.value = renderTargetAdapted.texture;
			renderer.render(scene, camera, renderTargetPrevious);

		}

		// Apply the tone mapping to the colours.
		quad.material = toneMappingMaterial;
		toneMappingMaterial.uniforms.tDiffuse.value = readBuffer.texture;

		renderer.render(this.scene, this.camera, this.renderToScreen ? null : writeBuffer);

	}

	/**
	 * Renders something into the previous luminosity texture.
	 *
	 * @method initialise
	 * @param {WebGLRenderer} renderer - The renderer.
	 */

	initialise(renderer) {

		this.quad.material = new MeshBasicMaterial({ color: 0x7fffff });
		renderer.render(this.scene, this.camera, this.renderTargetPrevious);
		this.quad.material.dispose();

	}

}
