$(function () {

	$.getJSON('config.json', function (config) {

		Timelord.init($, moment, config);

	});

});
