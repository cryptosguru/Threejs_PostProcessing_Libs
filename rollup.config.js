import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import babel from "rollup-plugin-babel";
import glsl from "rollup-plugin-glsl";
import { string } from "rollup-plugin-string";
import { terser } from "rollup-plugin-terser";

const pkg = require("./package.json");
const date = (new Date()).toDateString();

const banner = `/**
 * ${pkg.name} v${pkg.version} build ${date}
 * ${pkg.homepage}
 * Copyright ${date.slice(-4)} ${pkg.author.name}
 * @license ${pkg.license}
 */`;

const production = (process.env.NODE_ENV === "production");
const external = Object.keys(pkg.peerDependencies);
const globals = Object.assign({}, ...external.map((value) => ({
	[value]: value.replace(/-/g, "").toUpperCase()
})));

const worker = {

	input: "src/images/smaa/utils/worker.js",
	plugins: [resolve()].concat(production ? [terser(), babel()] : []),
	output: {
		file: "src/images/smaa/utils/worker.tmp",
		format: "iife"
	}

}

const lib = {

	module: {
		input: "src/index.js",
		external,
		plugins: [resolve(), glsl({
			include: ["**/*.frag", "**/*.vert"],
			compress: production,
			sourceMap: false
		}), string({
			include: ["**/*.tmp"]
		})],
		output: [{
			file: pkg.module,
			format: "esm",
			globals,
			banner
		}, {
			file: pkg.main,
			format: "esm",
			globals
		}, {
			file: pkg.main.replace(".js", ".min.js"),
			format: "esm",
			globals
		}]
	},

	main: {
		input: pkg.main,
		external,
		plugins: [babel()],
		output: {
			file: pkg.main,
			format: "umd",
			name: pkg.name.replace(/-/g, "").toUpperCase(),
			globals,
			banner
		}
	},

	min: {
		input: pkg.main.replace(".js", ".min.js"),
		external,
		plugins: [terser(), babel()],
		output: {
			file: pkg.main.replace(".js", ".min.js"),
			format: "umd",
			name: pkg.name.replace(/-/g, "").toUpperCase(),
			globals,
			banner
		}
	}

};

const demo = {

	module: {
		input: "demo/src/index.js",
		external,
		plugins: [resolve(), commonjs(), glsl({
			include: ["**/*.frag", "**/*.vert"],
			compress: production,
			sourceMap: false
		}), string({
			include: ["**/*.tmp"]
		})],
		output: [{
			file: "public/demo/index.js",
			format: "esm",
			globals
		}].concat(production ? [{
			file: "public/demo/index.min.js",
			format: "esm",
			globals
		}] : [])
	},

	main: {
		input: production ? "public/demo/index.js" : "demo/src/index.js",
		external,
		plugins: production ? [babel()] : [resolve(), commonjs(), glsl({
			include: ["**/*.frag", "**/*.vert"],
			compress: false,
			sourceMap: false
		}), string({
			include: ["**/*.tmp"]
		})],
		output: [{
			file: "public/demo/index.js",
			format: "iife",
			globals
		}]
	},

	min: {
		input: "public/demo/index.min.js",
		external,
		plugins: [terser(), babel()],
		output: {
			file: "public/demo/index.min.js",
			format: "iife",
			globals
		}
	}

};

export default [worker].concat(production ? [
	lib.module, lib.main, lib.min,
	demo.module, demo.main, demo.min
] : [demo.main]);
