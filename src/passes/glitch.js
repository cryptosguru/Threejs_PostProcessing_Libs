import { GlitchMaterial } from "../materials";
import { Pass } from "./pass";
import THREE from "three";

/**
 * A glitch pass.
 *
 * @class GlitchPass
 * @constructor
 * @extends Pass
 * @param {Object} [options] - The options.
 * @param {Texture} [options.perturbMap] - A perturbation map.
 * @param {Number} [options.dtSize=64] - The size of the generated noise map.
 */

export class GlitchPass extends Pass {

	constructor(options) {

		super();

		this.needsSwap = true;

		if(options === undefined) { options = {}; }
		if(options.dtSize === undefined) { options.dtSize = 64; }

		/**
		 * Glitch shader material.
		 *
		 * @property material
		 * @type GlitchMaterial
		 * @private
		 */

		this.material = new GlitchMaterial();

		this.quad.material = this.material;

		/**
		 * A perturbation map.
		 *
		 * If none is provided, a noise texture will be created.
		 * The texture will automatically be destroyed when the 
		 * EffectComposer is deleted.
		 *
		 * @property perturbMap
		 * @type Texture
		 */

		if(options.perturbMap !== undefined) {

			this.perturbMap = options.perturbMap;
			this.perturbMap.generateMipmaps = false;
			this.material.uniforms.tPerturb.value = this.perturbMap;

		} else {

			this.perturbMap = null;
			this.generatePerturbMap(options.dtSize);

		}

		/**
		 * The effect mode.
		 *
		 * Check the Mode enumeration for available modes.
		 *
		 * @property mode
		 * @type GlitchPass.Mode
		 * @default GlitchPass.Mode.SPORADIC
		 */

		this.mode = GlitchPass.Mode.SPORADIC;

		/**
		 * Counter for glitch activation/deactivation.
		 *
		 * @property counter
		 * @type Number
		 * @private
		 */

		this.counter = 0;

		/**
		 * A random break point for the sporadic glitch activation.
		 *
		 * @property breakPoint
		 * @type Number
		 * @private
		 */

		this.breakPoint = 0;
		this.generateTrigger();

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

		let uniforms = this.material.uniforms;

		uniforms.tDiffuse.value = readBuffer;
		uniforms.seed.value = Math.random();
		uniforms.active.value = true;

		if(this.counter % this.breakPoint === 0 || this.mode === GlitchPass.Mode.CONSTANT_WILD) {

			uniforms.amount.value = Math.random() / 30.0;
			uniforms.angle.value = THREE.Math.randFloat(-Math.PI, Math.PI);
			uniforms.seedX.value = THREE.Math.randFloat(-1.0, 1.0);
			uniforms.seedY.value = THREE.Math.randFloat(-1.0, 1.0);
			uniforms.distortionX.value = THREE.Math.randFloat(0.0, 1.0);
			uniforms.distortionY.value = THREE.Math.randFloat(0.0, 1.0);
			this.counter = 0;
			this.generateTrigger();

		} else if(this.counter % this.breakPoint < this.breakPoint / 5 || this.mode === GlitchPass.Mode.CONSTANT_MILD) {

			uniforms.amount.value = Math.random() / 90.0;
			uniforms.angle.value = THREE.Math.randFloat(-Math.PI, Math.PI);
			uniforms.distortionX.value = THREE.Math.randFloat(0.0, 1.0);
			uniforms.distortionY.value = THREE.Math.randFloat(0.0, 1.0);
			uniforms.seedX.value = THREE.Math.randFloat(-0.3, 0.3);
			uniforms.seedY.value = THREE.Math.randFloat(-0.3, 0.3);

		} else if(this.mode === GlitchPass.Mode.SPORADIC) {

			uniforms.active.value = false;

		}

		++this.counter;

		if(this.renderToScreen) {

			renderer.render(this.scene, this.camera);

		} else {

			renderer.render(this.scene, this.camera, writeBuffer, false);

		}

	}

	/**
	 * Creates a random break point for the glitch effect.
	 *
	 * @method generateTrigger
	 */

	generateTrigger() {

		this.breakPoint = THREE.Math.randInt(120, 240);

	}

	/**
	 * Destroys the currently set texture, if any, and 
	 * generates a simple noise map.
	 *
	 * @method generatePerturbMap
	 * @private
	 * @param {Number} size - The texture size.
	 */

	generatePerturbMap(size) {

		let i, x;
		let l = size * size;
		let data = new Float32Array(l * 3);

		for(i = 0; i < l; ++i) {

			x = THREE.Math.randFloat(0, 1);

			data[i * 3] = x;
			data[i * 3 + 1] = x;
			data[i * 3 + 2] = x;

		}

		if(this.perturbMap !== null) { this.perturbMap.dispose(); }

		this.perturbMap = new THREE.DataTexture(data, size, size, THREE.RGBFormat, THREE.FloatType);
		this.perturbMap.needsUpdate = true;

		this.material.uniforms.tPerturb.value = this.perturbMap;

	}

}

/**
 * A glitch mode enumeration.
 *
 * SPORADIC is the default mode (randomly timed glitches).
 *
 * @property GlitchPass.Mode
 * @type Object
 * @static
 * @final
 */

GlitchPass.Mode = Object.freeze({
	SPORADIC: 0,
	CONSTANT_MILD: 1,
	CONSTANT_WILD: 2
});
