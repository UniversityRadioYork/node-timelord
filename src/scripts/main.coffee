$ () ->
	$.getJSON "config.json", (config) ->
		new Timelord $, config
