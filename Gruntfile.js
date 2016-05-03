module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		wiredep: {
			task: {
				src: [
					'bin/**/*.html',   // .html support...
				],
				overrides: {
					"bootstrap": {
						"main": [
							"less/bootstrap.less",
							"dist/css/bootstrap.css",
							"dist/js/bootstrap.js"
						]
					}
				}
			}
		},
		sass: {
			options: {
				sourceMap: true,
				outputStyle: 'compressed'
			},
			dist: {
				files: {
					'bin/stylesheets/main.css': 'src/stylesheets/main.scss'
				}
			}
		},
		uglify: {
			main: {
				files: [
					{
						expand: true,
						cwd: 'src/scripts/',
						src: '**/*.js',
						dest: 'bin/scripts/',
						ext: '.min.js'
					}
				],
				options: {
					sourceMap: true
				}
			}
		},
		connect: {
			server: {
				options: {
					port: 8000,
					hostname: '*',
					base: ['bin'],
					livereload: true
				}
			},
		},
		watch: {
			stylesheets: {
				files: ['src/**/*.scss'],
				tasks: ['sass'],
				options: {
					livereload: true
				}
			},
			scripts: {
				files: ['src/**/*.js'],
				tasks: ['uglify'],
				options: {
					livereload: true
				}
			},
			pages: {
				files: ['src/**/*.html'],
				tasks: ['wiredep'],
				options: {
					livereload: true
				}
			},
		},
		copy: {
			main: {
				files: [
					{
						expand: true,
						cwd: 'src/',
						src: '**/*.html',
						dest: 'bin/'
					},
					{
						src: 'config.json',
						dest: 'bin/config.json'
					},
				]
			}
		},
		clean: {
			main: {
				src: [
					"bin/*",
					"!bin/bower_components/**"
				]
			}
		},
		auto_install: {
			main: {
				local: {}
			}
		}
	});

	grunt.loadNpmTasks('grunt-wiredep');
	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-auto-install');

	// Default task(s).
	grunt.registerTask('default', ['build', 'connect', 'watch']);

	// Just for compiling things
	grunt.registerTask('build', ['clean', 'build:noclean']);

	grunt.registerTask('build:noclean', ['auto_install', 'copy', 'wiredep', 'sass', 'uglify']);

};
