module.exports = function(grunt) {

	grunt.initConfig({

		name: "postprocessing",

		date: grunt.template.today("mmm dd yyyy"),
		pkg: grunt.file.readJSON("package.json"),

		banner: "/**\n" +
			" * <%= name %> v<%= pkg.version %> build <%= date %>\n" +
			" * <%= pkg.homepage %>\n" +
			" * Copyright <%= date.slice(-4) %> <%= pkg.author.name %>, <%= pkg.license %>\n" + 
			" */\n",

		jshint: {
			options: {
				jshintrc: true
			},
			files: ["Gruntfile.js", "src/**/*.js", "test/**/*.js"]
		},

		fsinline: {
			options: {
				append: "export default shader;"
			},
			copyShader: {
				src: "src/materials/copy/shader.js",
				dest: "src/materials/copy/inlined/shader.js"
			},
			luminosityShader: {
				src: "src/materials/luminosity/shader.js",
				dest: "src/materials/luminosity/inlined/shader.js"
			},
			adaptiveLuminosityShader: {
				src: "src/materials/adaptive-luminosity/shader.js",
				dest: "src/materials/adaptive-luminosity/inlined/shader.js"
			},
			dotScreenShader: {
				src: "src/materials/dot-screen/shader.js",
				dest: "src/materials/dot-screen/inlined/shader.js"
			},
			toneMappingShader: {
				src: "src/materials/tone-mapping/shader.js",
				dest: "src/materials/tone-mapping/inlined/shader.js"
			},
			glitchShader: {
				src: "src/materials/glitch/shader.js",
				dest: "src/materials/glitch/inlined/shader.js"
			},
			convolutionShader: {
				src: "src/materials/convolution/shader.js",
				dest: "src/materials/convolution/inlined/shader.js"
			},
			bokehShader: {
				src: "src/materials/bokeh/shader.js",
				dest: "src/materials/bokeh/inlined/shader.js"
			},
			filmShader: {
				src: "src/materials/film/shader.js",
				dest: "src/materials/film/inlined/shader.js"
			},
			godRaysShader: {
				src: "src/materials/god-rays/shader.js",
				dest: "src/materials/god-rays/inlined/shader.js"
			}
		},

		clean: {
			intermediates: ["src/materials/*/inlined"]
		},

		rollup: {
			options: {
				format: "umd",
				moduleName: "<%= name.toUpperCase() %>",
				banner: "<%= banner %>",
				plugins: [
					require("rollup-plugin-npm")({
						jsnext: true,
						skip: ["three"]
					})
				]
			},
			dist: {
				src: "src/index.js",
				dest: "build/<%= name %>.js"
			}
		},

		copy: {
			main: {
				files: [
					{expand: false, src: ["build/<%= name %>.js"], dest: "public/<%= name %>.js", filter: "isFile"},
				],
			},
		},

		uglify: {
			options: {
				banner: "<%= banner %>"
			},
			dist: {
				files: {
					"build/<%= name %>.min.js": ["build/<%= name %>.js"]
				}
			}
		},

		mocha: {
			test: {
				src: ["test/**/*.html"],
				options: {
					run: true
				}
			}
		},

		yuidoc: {
			compile: {
				name: "<%= name %>",
				description: "<%= pkg.description %>",
				version: "<%= pkg.version %>",
				url: "<%= pkg.homepage %>",
				options: {
					paths: "src",
					outdir: "docs"
				}
			}
		},

		watch: {
			files: ["<%= jshint.files %>"],
			tasks: ["jshint"]
		}

	});

	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-yuidoc");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-fs-inline");
	grunt.loadNpmTasks("grunt-rollup");
	grunt.loadNpmTasks("grunt-mocha");

	grunt.registerTask("default", ["build", "uglify", "mocha"]);
	grunt.registerTask("build", ["clean", "jshint", "fsinline", "rollup", "copy"]);
	grunt.registerTask("test", ["jshint", "mocha"]);

};
