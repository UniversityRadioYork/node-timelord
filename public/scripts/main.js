$(function () {

	$.getJSON('/scripts/config.json', function (config) {

		Timelord.init($, config);

	});

});
