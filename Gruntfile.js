module.exports = function(grunt) {
	//Project configuration.
	grunt.initConfig({
		qunit: {
			options: {
				timeout: 30000,
				"--web-security": "no",
				coverage: {
					src: ["js/*.js" ],
					instrumentedFiles: "temp/",
					htmlReport: "build/report/coverage",
					lcovReport: "build/report/lcov",
					linesThresholdPct: 0
				}
			},
			files: ['test/*.html']
		},
		coveralls: {
			options: {
				force: true
			},
			main_target: {
				src: "build/report/lcov/lcov.info"
			}
		}
	});

	// Load plugin
	grunt.loadNpmTasks("grunt-coveralls");
	grunt.loadNpmTasks("grunt-qunit-istanbul");

	// Task to run tests
	grunt.registerTask('default', 'qunit');
};

