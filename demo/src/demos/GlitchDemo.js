import { Color, PerspectiveCamera, TextureLoader, Vector3 } from "three";
import { SpatialControls } from "spatial-controls";
import { ProgressManager } from "../utils/ProgressManager.js";
import { PostProcessingDemo } from "./PostProcessingDemo.js";

import * as Sponza from "./objects/Sponza.js";

import {
	BlendFunction,
	ChromaticAberrationEffect,
	EdgeDetectionMode,
	EffectPass,
	GlitchMode,
	GlitchEffect,
	NoiseEffect,
	SMAAEffect,
	SMAAImageLoader,
	SMAAPreset
} from "../../../src";

/**
 * A glitch demo setup.
 */

export class GlitchDemo extends PostProcessingDemo {

	/**
	 * Constructs a new glitch demo.
	 *
	 * @param {EffectComposer} composer - An effect composer.
	 */

	constructor(composer) {

		super("glitch", composer);

		/**
		 * An effect.
		 *
		 * @type {Effect}
		 * @private
		 */

		this.effect = null;

		/**
		 * A pass.
		 *
		 * @type {Pass}
		 * @private
		 */

		this.pass = null;

	}

	/**
	 * Loads scene assets.
	 *
	 * @return {Promise} A promise that returns a collection of assets.
	 */

	load() {

		const assets = this.assets;
		const loadingManager = this.loadingManager;
		const textureLoader = new TextureLoader(loadingManager);
		const smaaImageLoader = new SMAAImageLoader(loadingManager);

		const anisotropy = Math.min(this.composer.getRenderer().capabilities.getMaxAnisotropy(), 8);

		return new Promise((resolve, reject) => {

			if(assets.size === 0) {

				loadingManager.onLoad = () => setTimeout(resolve, 250);
				loadingManager.onProgress = ProgressManager.updateProgress;
				loadingManager.onError = reject;

				Sponza.load(assets, loadingManager, anisotropy);

				textureLoader.load("textures/perturb.jpg", (t) => {

					assets.set("perturbation-map", t);

				});

				smaaImageLoader.load(([search, area]) => {

					assets.set("smaa-search", search);
					assets.set("smaa-area", area);

				});

			} else {

				resolve();

			}

		});

	}

	/**
	 * Creates the scene.
	 */

	initialize() {

		const scene = this.scene;
		const assets = this.assets;
		const composer = this.composer;
		const renderer = composer.getRenderer();

		// Camera.

		const aspect = window.innerWidth / window.innerHeight;
		const camera = new PerspectiveCamera(50, aspect, 0.5, 2000);
		camera.position.set(-9, 0.5, 0);
		this.camera = camera;

		// Controls.

		const target = new Vector3(0, 3, -3.5);
		const controls = new SpatialControls(camera.position, camera.quaternion, renderer.domElement);
		controls.settings.pointer.lock = false;
		controls.settings.translation.enabled = true;
		controls.settings.sensitivity.translation = 3.0;
		controls.lookAt(target);
		controls.setOrbitEnabled(false);
		this.controls = controls;

		// Sky.

		scene.background = new Color(0xeeeeee);

		// Lights.

		scene.add(...Sponza.createLights());

		// Objects.

		scene.add(assets.get(Sponza.tag));

		// Passes.

		const smaaEffect = new SMAAEffect(
			assets.get("smaa-search"),
			assets.get("smaa-area"),
			SMAAPreset.HIGH,
			EdgeDetectionMode.DEPTH
		);

		smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.05);

		const chromaticAberrationEffect = new ChromaticAberrationEffect();

		const glitchEffect = new GlitchEffect({
			perturbationMap: assets.get("perturbation-map"),
			chromaticAberrationOffset: chromaticAberrationEffect.offset
		});

		const noiseEffect = new NoiseEffect({
			blendFunction: BlendFunction.COLOR_DODGE
		});

		noiseEffect.blendMode.opacity.value = 0.1;

		const smaaPass = new EffectPass(camera, smaaEffect);
		const glitchPass = new EffectPass(camera, glitchEffect, noiseEffect);
		const chromaticAberrationPass = new EffectPass(camera, chromaticAberrationEffect);

		this.effect = glitchEffect;

		composer.addPass(smaaPass);
		composer.addPass(glitchPass);
		composer.addPass(chromaticAberrationPass);

	}

	/**
	 * Registers configuration options.
	 *
	 * @param {GUI} menu - A menu.
	 */

	registerOptions(menu) {

		const effect = this.effect;
		const perturbationMap = effect.getPerturbationMap();
		const uniforms = effect.uniforms;
		const delay = effect.delay;
		const duration = effect.duration;
		const strength = effect.strength;

		const params = {
			"glitch mode": effect.mode,
			"custom pattern": true,
			"min delay": delay.x,
			"max delay": delay.y,
			"min duration": duration.x,
			"max duration": duration.y,
			"weak glitches": strength.x,
			"strong glitches": strength.y,
			"glitch ratio": effect.ratio,
			"columns": uniforms.get("columns").value
		};

		menu.add(params, "glitch mode", GlitchMode).onChange(() => {

			effect.mode = Number(params["glitch mode"]);

		});

		menu.add(params, "custom pattern").onChange(() => {

			if(params["custom pattern"]) {

				effect.setPerturbationMap(perturbationMap);

			} else {

				effect.setPerturbationMap(effect.generatePerturbationMap(64));

			}

		});

		menu.add(params, "min delay").min(0.0).max(2.0).step(0.001).onChange(() => {

			delay.x = params["min delay"];

		});

		menu.add(params, "max delay").min(2.0).max(4.0).step(0.001).onChange(() => {

			delay.y = params["max delay"];

		});

		menu.add(params, "min duration").min(0.0).max(0.6).step(0.001).onChange(() => {

			duration.x = params["min duration"];

		});

		menu.add(params, "max duration").min(0.6).max(1.8).step(0.001).onChange(() => {

			duration.y = params["max duration"];

		});

		const folder = menu.addFolder("Strength");

		folder.add(params, "weak glitches").min(0.0).max(1.0).step(0.001).onChange(() => {

			strength.x = params["weak glitches"];

		});

		folder.add(params, "strong glitches").min(0.0).max(1.0).step(0.001).onChange(() => {

			strength.y = params["strong glitches"];

		});

		folder.open();

		menu.add(params, "glitch ratio").min(0.0).max(1.0).step(0.001).onChange(() => {

			effect.ratio = Number.parseFloat(params["glitch ratio"]);

		});

		menu.add(params, "columns").min(0.0).max(0.5).step(0.001).onChange(() => {

			uniforms.get("columns").value = params.columns;

		});

	}

}
