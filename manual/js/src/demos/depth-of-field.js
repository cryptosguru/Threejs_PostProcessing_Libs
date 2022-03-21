import {
	CubeTextureLoader,
	FogExp2,
	LoadingManager,
	PerspectiveCamera,
	Scene,
	sRGBEncoding,
	VSMShadowMap,
	WebGLRenderer
} from "three";

import {
	BlendFunction,
	DepthOfFieldEffect,
	EffectComposer,
	EffectPass,
	KernelSize,
	RenderPass,
	TextureEffect
} from "postprocessing";

import { Pane } from "tweakpane";
import { SpatialControls } from "spatial-controls";
import { calculateVerticalFoV, FPSMeter, toRecord } from "../utils";
import * as Domain from "../objects/Domain";

function load() {

	const assets = new Map();
	const loadingManager = new LoadingManager();
	const cubeTextureLoader = new CubeTextureLoader(loadingManager);

	const path = document.baseURI + "img/textures/skies/sunset/";
	const format = ".png";
	const urls = [
		path + "px" + format, path + "nx" + format,
		path + "py" + format, path + "ny" + format,
		path + "pz" + format, path + "nz" + format
	];

	return new Promise((resolve, reject) => {

		loadingManager.onLoad = () => resolve(assets);
		loadingManager.onError = (url) => reject(new Error(`Failed to load ${url}`));

		cubeTextureLoader.load(urls, (t) => {

			t.encoding = sRGBEncoding;
			assets.set("sky", t);

		});

	});

}

window.addEventListener("load", () => load().then((assets) => {

	// Renderer

	const renderer = new WebGLRenderer({
		powerPreference: "high-performance",
		antialias: false,
		stencil: false,
		depth: false
	});

	renderer.debug.checkShaderErrors = (window.location.hostname === "localhost");
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.outputEncoding = sRGBEncoding;
	renderer.setClearColor(0x000000, 0);
	renderer.physicallyCorrectLights = true;
	renderer.shadowMap.type = VSMShadowMap;
	renderer.shadowMap.autoUpdate = false;
	renderer.shadowMap.needsUpdate = true;
	renderer.shadowMap.enabled = true;

	const container = document.querySelector(".viewport");
	container.append(renderer.domElement);

	// Camera & Controls

	const camera = new PerspectiveCamera();
	const controls = new SpatialControls(camera.position, camera.quaternion, renderer.domElement);
	const settings = controls.settings;
	settings.rotation.setSensitivity(2.2);
	settings.rotation.setDamping(0.05);
	settings.translation.setDamping(0.1);
	controls.setPosition(0, 0, 1);
	controls.lookAt(0, 0, 0);

	// Scene, Lights, Objects

	const scene = new Scene();
	scene.fog = new FogExp2(0x0a0809, 0.06);
	scene.background = assets.get("sky");
	scene.add(Domain.createLights());
	scene.add(Domain.createEnvironment(scene.background));
	scene.add(Domain.createActors(scene.background));

	// Post Processing

	const context = renderer.getContext();
	const composer = new EffectComposer(renderer, {
		multisampling: Math.min(4, context.getParameter(context.MAX_SAMPLES))
	});

	const effect = new DepthOfFieldEffect(camera, {
		kernelSize: KernelSize.SMALL,
		worldFocusDistance: 2,
		worldFocusRange: 5,
		bokehScale: 2.0,
		height: 480
	});

	const effectPass = new EffectPass(camera, effect);

	// BEGIN DEBUG
	const cocDebugPass = new EffectPass(camera, new TextureEffect({ texture: effect.cocTexture }));
	effectPass.renderToScreen = true;
	cocDebugPass.renderToScreen = true;
	cocDebugPass.enabled = false;
	cocDebugPass.fullscreenMaterial.encodeOutput = false;
	// END DEBUG

	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(effectPass);
	composer.addPass(cocDebugPass);

	// Settings

	const fpsMeter = new FPSMeter();
	const cocMaterial = effect.cocMaterial;
	const pane = new Pane({ container: container.querySelector(".tp") });
	pane.addMonitor(fpsMeter, "fps", { label: "FPS" });

	const folder = pane.addFolder({ title: "Settings" });
	folder.addInput(cocDebugPass, "enabled", { label: "debug" });
	folder.addInput(effect.resolution, "height", {
		options: [360, 480, 720, 1080].reduce(toRecord, {}),
		label: "resolution"
	});

	folder.addInput(effect.blurPass, "kernelSize", { options: KernelSize });
	folder.addInput(cocMaterial, "worldFocusDistance", { min: 0, max: 50, step: 0.1 });
	folder.addInput(cocMaterial, "worldFocusRange", { min: 0, max: 20, step: 0.1 });
	folder.addInput(effect, "bokehScale", { min: 0, max: 5, step: 1e-2 });
	folder.addInput(effect.blendMode.opacity, "value", { label: "opacity", min: 0, max: 1, step: 0.01 });
	folder.addInput(effect.blendMode, "blendFunction", { options: BlendFunction });

	// Resize Handler

	function onResize() {

		const width = container.clientWidth, height = container.clientHeight;
		camera.aspect = width / height;
		camera.fov = calculateVerticalFoV(90, Math.max(camera.aspect, 16 / 9));
		camera.updateProjectionMatrix();
		composer.setSize(width, height);

	}

	window.addEventListener("resize", onResize);
	onResize();

	// Render Loop

	requestAnimationFrame(function render(timestamp) {

		fpsMeter.update(timestamp);
		controls.update(timestamp);
		composer.render();
		requestAnimationFrame(render);

	});

}));
