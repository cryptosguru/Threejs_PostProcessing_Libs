import { LinearFilter, NearestFilter, RGBAFormat, RGBFormat, Texture, WebGLRenderTarget } from "three";
import { SMAABlendMaterial, SMAAColorEdgesMaterial, SMAAWeightsMaterial } from "../materials";
import { Pass } from "./pass.js";

/**
 * Subpixel Morphological Antialiasing (SMAA) v2.8.
 *
 * Preset: SMAA 1x Medium (with color edge detection).
 *  https://github.com/iryoku/smaa/releases/tag/v2.8
 *
 * @class SMAAPass
 * @submodule passes
 * @extends Pass
 * @constructor
 * @param {Image} Image - This pass requires an Image class to create internal textures. Provide window.Image in a browser environment.
 */

export class SMAAPass extends Pass {

	constructor(Image) {

		super();

		this.name = "SMAAPass";
		this.needsSwap = true;

		/**
		 * A render target for the color edge detection.
		 *
		 * @property renderTargetColorEdges
		 * @type WebGLRenderTarget
		 * @private
		 */

		this.renderTargetColorEdges = new WebGLRenderTarget(1, 1, {
			minFilter: LinearFilter,
			format: RGBFormat,
			stencilBuffer: false,
			depthBuffer: false
		});

		this.renderTargetColorEdges.texture.name = "SMAA.ColorEdges";
		this.renderTargetColorEdges.texture.generateMipmaps = false;

		/**
		 * A render target for the SMAA weights.
		 *
		 * @property renderTargetWeights
		 * @type Material
		 * @private
		 */

		this.renderTargetWeights = this.renderTargetColorEdges.clone();

		this.renderTargetWeights.texture.name = "SMAA.Weights";
		this.renderTargetWeights.texture.format = RGBAFormat;

		/**
		 * SMAA color edge detection shader material.
		 *
		 * @property colorEdgesMaterial
		 * @type SMAAColorEdgesMaterial
		 * @private
		 */

		this.colorEdgesMaterial = new SMAAColorEdgesMaterial();

		/**
		 * SMAA weights shader material.
		 *
		 * @property weightsMaterial
		 * @type SMAAWeightsMaterial
		 * @private
		 */

		this.weightsMaterial = new SMAAWeightsMaterial();

		const areaImage = new Image();
		areaImage.src = this.weightsMaterial.areaImage;

		const areaTexture = new Texture();
		areaTexture.image = areaImage;
		areaTexture.minFilter = LinearFilter;
		areaTexture.format = RGBFormat;
		areaTexture.generateMipmaps = false;
		areaTexture.needsUpdate = true;
		areaTexture.flipY = false;

		const searchImage = new Image();
		searchImage.src = this.weightsMaterial.searchImage;

		const searchTexture = new Texture();
		searchTexture.image = searchImage;
		searchTexture.magFilter = NearestFilter;
		searchTexture.minFilter = NearestFilter;
		searchTexture.generateMipmaps = false;
		searchTexture.needsUpdate = true;
		searchTexture.flipY = false;

		this.weightsMaterial.uniforms.tDiffuse.value = this.renderTargetColorEdges.texture;
		this.weightsMaterial.uniforms.tArea.value = areaTexture;
		this.weightsMaterial.uniforms.tSearch.value = searchTexture;

		/**
		 * SMAA blend shader material.
		 *
		 * @property blendMaterial
		 * @type SMAABlendMaterial
		 * @private
		 */

		this.blendMaterial = new SMAABlendMaterial();

		this.blendMaterial.uniforms.tWeights.value = this.renderTargetWeights.texture;

		this.quad.material = this.blendMaterial;

	}

	/**
	 * Antialiases the scene.
	 *
	 * @method render
	 * @param {WebGLRenderer} renderer - The renderer.
	 * @param {WebGLRenderTarget} readBuffer - The read buffer.
	 * @param {WebGLRenderTarget} writeBuffer - The write buffer.
	 */

	render(renderer, readBuffer, writeBuffer) {

		// Detect color edges.
		this.quad.material = this.colorEdgesMaterial;
		this.colorEdgesMaterial.uniforms.tDiffuse.value = readBuffer.texture;
		renderer.render(this.scene, this.camera, this.renderTargetColorEdges, true);

		// Compute edge weights.
		this.quad.material = this.weightsMaterial;
		renderer.render(this.scene, this.camera, this.renderTargetWeights, false);

		// Apply the antialiasing filter to the colors.
		this.quad.material = this.blendMaterial;
		this.blendMaterial.uniforms.tDiffuse.value = readBuffer.texture;

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

		this.renderTargetColorEdges.setSize(width, height);
		this.renderTargetWeights.setSize(width, height);

		this.colorEdgesMaterial.uniforms.texelSize.value.copy(
			this.weightsMaterial.uniforms.texelSize.value.copy(
				this.blendMaterial.uniforms.texelSize.value.set(
					1.0 / width, 1.0 / height
		)));

	}

}
