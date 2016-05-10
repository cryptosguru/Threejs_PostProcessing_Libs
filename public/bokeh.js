window.addEventListener("load", function loadAssets() {

	window.removeEventListener("load", loadAssets);

	var loadingManager = new THREE.LoadingManager();
	var cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager);

	var assets = {};

	loadingManager.onProgress = function(item, loaded, total) {

		if(loaded === total) { setupScene(assets); }

	};

	var path = "textures/skies/space3/";
	var format = ".jpg";
	var urls = [
		path + "px" + format, path + "nx" + format,
		path + "py" + format, path + "ny" + format,
		path + "pz" + format, path + "nz" + format
	];

	cubeTextureLoader.load(urls, function(textureCube) {

		var shader = THREE.ShaderLib.cube;
		shader.uniforms.tCube.value = textureCube;

		var skyBoxMaterial = new THREE.ShaderMaterial( {
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader,
			uniforms: shader.uniforms,
			depthWrite: false,
			side: THREE.BackSide,
			fog: false
		});

		assets.sky = new THREE.Mesh(new THREE.BoxGeometry(2000, 2000, 2000), skyBoxMaterial);

	});

});

function setupScene(assets) {

	var viewport = document.getElementById("viewport");
	viewport.removeChild(viewport.children[0]);

	// Renderer and Scene.

	var renderer = new THREE.WebGLRenderer({antialias: true, logarithmicDepthBuffer: true});
	renderer.setClearColor(0x000000);
	renderer.setSize(window.innerWidth, window.innerHeight);
	viewport.appendChild(renderer.domElement);

	var scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x2d200f, 0.0025);

	// Camera.

	var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.target.set(0, 0, 0);
	controls.enablePan = false;
	controls.minDistance = 2.5;
	camera.position.set(3, 1, 3);
	camera.lookAt(controls.target);

	scene.add(camera);

	// Overlays.

	var stats = new Stats();
	stats.setMode(0);
	stats.dom.id = "stats";
	var aside = document.getElementById("aside");
	aside.style.visibility = "visible";
	aside.appendChild(stats.dom);

	var gui = new dat.GUI();
	aside.appendChild(gui.domElement.parentNode);

	// Hide interface on alt key press.
	document.addEventListener("keydown", function(event) {

		if(event.altKey) {

			event.preventDefault();
			aside.style.visibility = (aside.style.visibility === "hidden") ? "visible" : "hidden";

		}

	});

	// Lights.

	var ambientLight = new THREE.AmbientLight(0x888888);
	var directionalLight = new THREE.DirectionalLight(0xffbbaa);

	directionalLight.position.set(1440, 200, 2000);
	directionalLight.target.position.copy(scene.position);

	scene.add(ambientLight);
	scene.add(directionalLight);

	// Sky.

	camera.add(assets.sky);

	// Objects.

	var geometry = new THREE.SphereBufferGeometry(1, 64, 64);
	var material = new THREE.MeshBasicMaterial({
		color: 0xffff00,
		envMap: assets.sky.material.uniforms.tCube.value
	});

	mesh = new THREE.Mesh(geometry, material);
	scene.add(mesh);

	// Post-Processing.

	var composer = new POSTPROCESSING.EffectComposer(renderer, true);
	var renderPass = new POSTPROCESSING.RenderPass(scene, camera);
	composer.addPass(renderPass);

	var pass = new POSTPROCESSING.BokehPass(camera, {
		focus: 0.0,
		aperture: 0.007,
		maxBlur: 0.025
	});

	pass.renderToScreen = true;
	composer.addPass(pass);

	// Shader settings.

	var params = {
		"focus": pass.bokehMaterial.uniforms.focus.value,
		"aperture": pass.bokehMaterial.uniforms.aperture.value,
		"max blur": pass.bokehMaterial.uniforms.maxBlur.value,
		"realistic version": function() { window.location.href = "bokeh2.html"; }
	};

	gui.add(params, "focus").min(0.0).max(1.0).step(0.001).onChange(function() { pass.bokehMaterial.uniforms.focus.value = params["focus"]; });
	gui.add(params, "aperture").min(0.0).max(0.05).step(0.0001).onChange(function() { pass.bokehMaterial.uniforms.aperture.value = params["aperture"]; });
	gui.add(params, "max blur").min(0.0).max(0.1).step(0.001).onChange(function() { pass.bokehMaterial.uniforms.maxBlur.value = params["max blur"]; });
	gui.add(params, "realistic version");

	/**
	 * Handles resizing.
	 */

	window.addEventListener("resize", function resize() {

		var width = window.innerWidth;
		var height = window.innerHeight;

		composer.setSize(width, height);
		camera.aspect = width / height;
		camera.updateProjectionMatrix();

	});

	/**
	 * Animation loop.
	 */

	var TWO_PI = 2.0 * Math.PI;
	var clock = new THREE.Clock(true);

	(function render(now) {

		requestAnimationFrame(render);

		stats.begin();

		composer.render(clock.getDelta());

		stats.end();

	}());

};
