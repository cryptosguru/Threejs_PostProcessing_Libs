import {
	LinearFilter,
	RepeatWrapping,
	RGBFormat,
	Uniform,
	WebGLRenderTarget
} from "three";

import { BlendFunction } from "./blending/BlendFunction.js";
import { Resizer } from "../core";
import { NoiseTexture } from "../images";
import { SSAOMaterial } from "../materials";
import { ShaderPass } from "../passes";
import { Effect, EffectAttribute } from "./Effect.js";

import fragmentShader from "./glsl/ssao/shader.frag";

/**
 * A Screen Space Ambient Occlusion (SSAO) effect.
 *
 * For high quality visuals use two SSAO effect instances in a row with
 * different radii, one for rough AO and one for fine details.
 *
 * This effect supports depth-aware upsampling and should be rendered at a lower
 * resolution. If you intend to render SSAO at full resolution, do not provide a
 * downsampled normalDepthBuffer and make sure to disable depthAwareUpsampling.
 *
 * Based on "Scalable Ambient Obscurance" by Morgan McGuire et al. and
 * "Depth-aware upsampling experiments" by Eleni Maria Stea:
 * https://research.nvidia.com/publication/scalable-ambient-obscurance
 * https://eleni.mutantstargoat.com/hikiko/on-depth-aware-upsampling
 */

export class SSAOEffect extends Effect {

	/**
	 * Constructs a new SSAO effect.
	 *
	 * @todo Move normalBuffer to options.
	 * @param {Camera} camera - The main camera.
	 * @param {Texture} normalBuffer - A texture that contains the scene normals. May be null if a normalDepthBuffer is provided. See {@link NormalPass}.
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.MULTIPLY] - The blend function of this effect.
	 * @param {Number} [options.depthAwareUpsampling=true] - Enables or disables depth-aware upsampling. Has no effect if WebGL 2 is not supported.
	 * @param {Number} [options.normalDepthBuffer=null] - A texture that contains downsampled scene normals and depth. See {@link DepthDownsamplingPass}.
	 * @param {Number} [options.samples=9] - The amount of samples per pixel. Should not be a multiple of the ring count.
	 * @param {Number} [options.rings=7] - The amount of spiral turns in the occlusion sampling pattern. Should be a prime number.
	 * @param {Number} [options.distanceThreshold=0.97] - A global distance threshold at which the occlusion effect starts to fade out. Range [0.0, 1.0].
	 * @param {Number} [options.distanceFalloff=0.03] - The distance falloff. Influences the smoothness of the overall occlusion cutoff. Range [0.0, 1.0].
	 * @param {Number} [options.rangeThreshold=0.0005] - A local occlusion range threshold at which the occlusion starts to fade out. Range [0.0, 1.0].
	 * @param {Number} [options.rangeFalloff=0.001] - The occlusion range falloff. Influences the smoothness of the proximity cutoff. Range [0.0, 1.0].
	 * @param {Number} [options.luminanceInfluence=0.7] - Determines how much the luminance of the scene influences the ambient occlusion.
	 * @param {Number} [options.radius=0.1825] - The occlusion sampling radius, expressed as a resolution independent scale. Range [1e-6, 1.0].
	 * @param {Number} [options.intensity=1.0] - The intensity of the ambient occlusion.
	 * @param {Number} [options.bias=0.025] - An occlusion bias. Eliminates artifacts caused by depth discontinuities.
	 * @param {Number} [options.width=Resizer.AUTO_SIZE] - The render width.
	 * @param {Number} [options.height=Resizer.AUTO_SIZE] - The render height.
	 */

	constructor(camera, normalBuffer, {
		blendFunction = BlendFunction.MULTIPLY,
		depthAwareUpsampling = true,
		normalDepthBuffer = null,
		samples = 9,
		rings = 7,
		distanceThreshold = 0.97,
		distanceFalloff = 0.03,
		rangeThreshold = 0.0005,
		rangeFalloff = 0.001,
		luminanceInfluence = 0.7,
		radius = 0.1825,
		intensity = 1.0,
		bias = 0.025,
		width = Resizer.AUTO_SIZE,
		height = Resizer.AUTO_SIZE
	} = {}) {

		super("SSAOEffect", fragmentShader, {

			blendFunction,
			attributes: EffectAttribute.DEPTH,

			uniforms: new Map([
				["aoBuffer", new Uniform(null)],
				["luminanceInfluence", new Uniform(luminanceInfluence)]
			])

		});

		/**
		 * A render target for the ambient occlusion shadows.
		 *
		 * @type {WebGLRenderTarget}
		 * @private
		 */

		this.renderTargetAO = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			stencilBuffer: false,
			depthBuffer: false,
			format: RGBFormat
		});

		this.renderTargetAO.texture.name = "AO.Target";
		this.renderTargetAO.texture.generateMipmaps = false;

		this.uniforms.get("aoBuffer").value = this.renderTargetAO.texture;

		/**
		 * The resolution of this effect.
		 *
		 * @type {Resizer}
		 */

		this.resolution = new Resizer(this, width, height);

		/**
		 * The current radius relative to the render height.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.r = 1.0;

		/**
		 * The main camera.
		 *
		 * @type {Camera}
		 * @private
		 */

		this.camera = camera;

		/**
		 * An SSAO pass.
		 *
		 * @type {ShaderPass}
		 * @private
		 */

		this.ssaoPass = new ShaderPass((() => {

			const noiseTexture = new NoiseTexture(64, 64);
			noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping;

			const material = new SSAOMaterial(camera);
			material.uniforms.noiseTexture.value = noiseTexture;
			material.uniforms.intensity.value = intensity;
			material.uniforms.bias.value = bias;

			if(normalDepthBuffer !== null) {

				material.uniforms.normalDepthBuffer.value = normalDepthBuffer;
				material.defines.NORMAL_DEPTH = "1";

				if(depthAwareUpsampling) {

					this.uniforms.set("normalDepthBuffer", new Uniform(normalDepthBuffer));
					this.defines.set("DEPTH_AWARE_UPSAMPLING", "1");
					this.defines.set("THRESHOLD", "0.997");

				}

			} else {

				material.uniforms.normalBuffer.value = normalBuffer;

			}

			return material;

		})());

		this.samples = samples;
		this.rings = rings;

		// @todo Special case treatment added for backwards-compatibility.
		this.radius = (radius > 1.0) ? (radius / 100.0) : radius;

		this.setDistanceCutoff(distanceThreshold, distanceFalloff);
		this.setProximityCutoff(rangeThreshold, rangeFalloff);

	}

	/**
	 * The SSAO material.
	 *
	 * @type {SSAOMaterial}
	 */

	get ssaoMaterial() {

		return this.ssaoPass.getFullscreenMaterial();

	}

	/**
	 * The amount of occlusion samples per pixel.
	 *
	 * @type {Number}
	 */

	get samples() {

		return Number(this.ssaoMaterial.defines.SAMPLES_INT);

	}

	/**
	 * Sets the amount of occlusion samples per pixel.
	 *
	 * @type {Number}
	 */

	set samples(value) {

		const material = this.ssaoMaterial;
		material.defines.SAMPLES_INT = value.toFixed(0);
		material.defines.SAMPLES_FLOAT = value.toFixed(1);
		material.needsUpdate = true;

	}

	/**
	 * The amount of spiral turns in the occlusion sampling pattern.
	 *
	 * @type {Number}
	 */

	get rings() {

		return Number(this.ssaoMaterial.defines.SPIRAL_TURNS);

	}

	/**
	 * Sets the amount of spiral turns in the occlusion sampling pattern.
	 *
	 * @type {Number}
	 */

	set rings(value) {

		const material = this.ssaoMaterial;
		material.defines.SPIRAL_TURNS = value.toFixed(1);
		material.needsUpdate = true;

	}

	/**
	 * The occlusion sampling radius.
	 *
	 * @type {Number}
	 */

	get radius() {

		return Number(this.r);

	}

	/**
	 * Sets the occlusion sampling radius. Range [1e-6, 1.0].
	 *
	 * @type {Number}
	 */

	set radius(value) {

		this.r = Math.min(Math.max(value, 1e-6), 1.0);

		const radius = this.r * this.resolution.height;
		const material = this.ssaoMaterial;
		material.defines.RADIUS = radius.toFixed(11);
		material.defines.RADIUS_SQ = (radius * radius).toFixed(11);
		material.needsUpdate = true;

	}

	/**
	 * Sets the occlusion distance cutoff.
	 *
	 * @param {Number} threshold - The distance threshold. Range [0.0, 1.0].
	 * @param {Number} falloff - The falloff. Range [0.0, 1.0].
	 */

	setDistanceCutoff(threshold, falloff) {

		this.ssaoMaterial.uniforms.distanceCutoff.value.set(
			Math.min(Math.max(threshold, 0.0), 1.0),
			Math.min(Math.max(threshold + falloff, 0.0), 1.0)
		);

	}

	/**
	 * Sets the occlusion proximity cutoff.
	 *
	 * @param {Number} threshold - The range threshold. Range [0.0, 1.0].
	 * @param {Number} falloff - The falloff. Range [0.0, 1.0].
	 */

	setProximityCutoff(threshold, falloff) {

		this.ssaoMaterial.uniforms.proximityCutoff.value.set(
			Math.min(Math.max(threshold, 0.0), 1.0),
			Math.min(Math.max(threshold + falloff, 0.0), 1.0)
		);

	}

	/**
	 * Sets the depth texture.
	 *
	 * @param {Texture} depthTexture - A depth texture.
	 * @param {Number} [depthPacking=0] - The depth packing.
	 */

	setDepthTexture(depthTexture, depthPacking = 0) {

		const material = this.ssaoMaterial;

		if(material.defines.NORMAL_DEPTH === undefined) {

			material.uniforms.normalDepthBuffer.value = depthTexture;
			material.depthPacking = depthPacking;

		}

	}

	/**
	 * Updates this effect.
	 *
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} inputBuffer - A frame buffer that contains the result of the previous pass.
	 * @param {Number} [deltaTime] - The time between the last frame and the current one in seconds.
	 */

	update(renderer, inputBuffer, deltaTime) {

		this.ssaoPass.render(renderer, null, this.renderTargetAO);

	}

	/**
	 * Updates the camera projection matrix uniforms and the size of internal
	 * render targets.
	 *
	 * @param {Number} width - The width.
	 * @param {Number} height - The height.
	 */

	setSize(width, height) {

		const resolution = this.resolution;
		resolution.base.set(width, height);

		const w = resolution.width;
		const h = resolution.height;

		this.renderTargetAO.setSize(w, h);
		this.ssaoMaterial.setTexelSize(1.0 / w, 1.0 / h);

		const camera = this.camera;
		const uniforms = this.ssaoMaterial.uniforms;
		uniforms.noiseScale.value.set(w, h).divideScalar(64.0);
		uniforms.inverseProjectionMatrix.value.getInverse(camera.projectionMatrix);
		uniforms.projectionMatrix.value.copy(camera.projectionMatrix);

		// Update the absolute radius.
		this.radius = this.r;

	}

}
