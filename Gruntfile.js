module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		wiredep: {
			task: {
				src: [
					'public/**/*.html',   // .html support...
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
				sourceMap: true
			},
			dist: {
				files: {
					'public/stylesheets/main.css': 'public/stylesheets/main.scss'
				}
			}
		},
		uglify: {
			main: {
				files: {
					'public/scripts/timelord.min.js' : 'public/scripts/timelord.js'
				},
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
					base: ['public'],
					livereload: true
				}
			}
		},
		watch: {
			stylesheets: {
				files: ['public/**/*.scss'],
				tasks: ['sass'],
				options: {
					livereload: true
				}
			},
			scripts: {
				files: ['public/**/*.js', '!public/**/*.min.js'],
				tasks: ['uglify'],
				options: {
					livereload: true
				}
			},
			pages: {
				files: ['public/**/*.html'],
				tasks: ['wiredep'],
				options: {
					livereload: true
				}
			},
		}
	});

	grunt.event.on('watch', function(action, filepath, target) {
		grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
	});

	grunt.loadNpmTasks('grunt-wiredep');
	grunt.loadNpmTasks('grunt-sass');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-contrib-uglify');

	// Default task(s).
	grunt.registerTask('default', ['wiredep', 'sass', 'uglify', 'connect', 'watch']);

};
