window.Timelord = class Timelord

	###
	@param {jQuery} $
	@param {Object} config
	###
	constructor: ($, config) ->
		@_$ = $
		@_config = config
		@routeobinfo =
			s1: false
			s2: false
		@news = false
		setTimeout "window.location = window.location.href", 18000000
		this.loop()
		this.updateView()

	loop: () ->
		init = moment();
		this.updateTime init
		this.updateNewsMessage init
		this.update101 init
		now = moment()
		if (now.seconds() - init.seconds()) is 0
			timeout = (1000 - now.milliseconds())
		else
			timeout = 0
		setTimeout this.loop, timeout

	updateTime: (time) ->
		this._$ "#time"
		.text time.format "HH:mm:ss"
		this._$ "#date"
		.text time.format "Do MMMM YYYY"

	update101: (time) ->
		if this.endTime101
			if this.endTime101.diff(t) < 0
				this._$ "#countdown101"
				.text "-#{this.msToString this.endTime101.diff time}"
			else
				this._$ "#countdown101"
				.text this.msToString this.endTime101.diff time
		else
			this._$ "#countdown101"
			.text ""

		if this.startTime101
			this._$ "#countUP101"
			.text this.msToString this.startTime101.diff time
		else
			this._$ "#countUP101"
			.text ""

	msToString: (ms) ->
		hours = Math.round ms / 36e5.toString()
		mins = Math.round (ms % 36e5) / 6e4.toString()
		secs = Math.round (ms % 6e4) / 1000.toString()
		"#{pad "00", hours}:#{pad "00", mins}:#{pad "00", secs}"

	pad: (padding, str) ->
		"#{padding.substring 0, padding.length - str.length}#{str}"

	updateNewsMessage: (time) ->
		second = time.seconds()
		minute = time.minutes()

		this.news = (
			minute < 2 ||
				(
					minute == 59 &&
						second >= 15
				)
		)

		if this.news
			if minute is 59
				if second < 45
					this.setCurrentShowName "News intro in #{45 - second}...", "news"
				else if second <= 52
					this.setCurrentShowName "#{52 - second} until voice over...", "news"
				else
					this.setCurrentShowName "#{this._config.short_name} News", "news"
			else if minute is 0
				this.setCurrentShowName "#{this._config.short_name} News", "news"
			else
				this.setCurrentShowName "News ends in #{60 - second}...", "news"

	###
	Triggers all the API calls to update the view
	###
	updateView: () ->
		this.updateStudioInfo()
		this.updateShowInfo()
		this.updateSong()
		this.updateAlerts()
		this.updateBreakingNews()

	###
	Call the API breakingNews endpoint and sets the news alert accordingly
	###
	updateBreakingNews: () ->
		this.callAPI
			url: this._config.api_endpoints.breakingNews,
			success: (data) ->
				if data.payload? and data.payload.content?
					this.setBreakingNews data.payload.content
				else
					console.error "Invalid JSON returned"
			complete: () ->
				setTimeout this.updateBreakingNews, this._config.request_timeout

	###
	Calls the API statusAtTime endpoint and sets the current studio information.
	###
	updateStudioInfo: () ->
		this.callAPI
			url: this._config.api_endpoints.statusAtTime
			success: (data) ->
				if data.payload? and data.payload.studio?
					this.setStudio data.payload.studio
					this.setStudioPowerLevel data.payload
				else
					console.error "Invalid JSON returned"
			complete () ->
				setTimeout this.updateStudioInfo, this._config.request_timeout

	###
	Calls the API currentAndNext endpoint and sets the current and next shows.
	###
	updateShowInfo: () ->
		this.callAPI
			url: this._config.api_endpoints.currentAndNext,
			data: this._config.next_show_filtering,
			success: (data) ->
				if data.payload?
					this.setShows data.payload
				else
					console.error "Invalid JSON returned"
			complete: () ->
				setTimeout this.updateShowInfo, this._config.request_timeout

	###
	Calls for the Icecast JSON and sets the song currently being broadcast.
	###
	updateSong: () ->
		this._$.get
			url: this._config.icecast_json_url
			dataType: "json"
			success: (data) ->
				song = data["mounts"]["/live-high"]["title"]
				if song is " - URY"
					song = "";
				this.setSong song
			complete: () ->
				setTimeout this.updateSong, this._config.request_timeout
			error: () ->
				this.setSong ""

	###
	Calls the API isSilence, isObitHappening and remoteStreams
	endpoints and sets the alerts and studio power levels
	###
	updateAlerts: () ->
		this.updateSilenceAlert()
		this.updateOBAlerts()
		this.updateObitAlert()

	###
	Calls the API remoteStreams endpoint and sets the ob alerts
	###
	updateOBAlerts: () ->
		this.callAPI
			url: this._config.api_endpoints.remoteStreams
			success: (data) ->
				if data.payload?
					this.setOBAlerts data.payload
				else
					console.error "Invalid JSON returned"
			complete: () ->
				setTimeout this.updateOBAlerts, this._config.request_timeout

	###
	Calls the API isObitHappening endpoint and sets the obit alert
	###
	updateObitAlert: () ->
		this.callAPI
			url: this._config.api_endpoints.isObitHappening
			success: (data) ->
				if data.payload?
					this.setObitAlert data.payload
				else
					console.error "Invalid JSON returned"
			complete: () ->
				setTimeout this.updateObitAlert, this._config.request_timeout

	###
	Calls the API isSilence endpoint and sets the Silence alert
	###
	updateSilenceAlert: () ->
		this.callAPI
			url: this._config.api_endpoints.isSilence
			success: (data) ->
				if data.payload?
					this.setSilenceAlert data.payload
				else
					console.error "Invalid JSON returned"
			complete: () ->
				setTimeout this.updateSilenceAlert, this._config.request_timeout

	###
	Sets the OB alerts

	@param {Object} data
	###
	setOBAlerts: (data) ->
		for i in this.routeobinfo
			if data[i]?
				this.setAlert "ob#{i}", "good"
				if this.routeobinfo["#{i}"] isnt true and this.routeobinfo["#{i}"] isnt false
					clearTimeout this.routeobinfo["#{i}"]
				this.routeobinfo["#{i}"] = true
			else if this.routeobinfo["#{i}"] isnt false
				this.setAlert "ob#{i}", "bad"
				if this.routeobinfo["#{i}"] is true
					this.routeobinfo["#{i}"] = setTimeout (() ->
						this.routeobinfo["#{i}"] = false).bind(this)
					, 30000
			else
				this.resetAlert "ob#{i}"

	###
	Sets the studio power levels

	@param {Object} data
	###
	setStudioPowerLevel: (data) ->
		for i in [1, 2]
			if data["s#{i}power"]?
				if data.studio is i
					this.setAlert "s#{i}", "good"
				else
					this.setAlert "s#{i}", "standby"
			else
				this.resetAlert "s#{i}"

	###
	Sets the breaking news alert

	@param {String|null|false} news
	###
	setBreakingNews: (news) ->
		if news? and news isnt false
			this._$ "#breaking-news"
			.removeClass "hidden"
			.html news
			this._$ "#hide-when-breaking-news"
			.addClass "hidden"
		else
			this._$ "#breaking-news"
			.addClass "hidden"
			this._$ "#hide-when-breaking-news"
			.removeClass "hidden"

	###
	Sets the Obit alert

	@param {Boolean} obit
	###
	setObitAlert: (obit) ->
		if obit
			this.setAlert "obit", "worse"
		else
			this.resetAlert "obit"

	###
	Sets the Silence alert

	@param {Number} time
	###
	setSilenceAlert: (time) ->
		if time >= this._config.silence_timeouts.long
			this.setBreakingNews "RADIO SILENCE DETECTED"
		else
			this.setBreakingNews false

		if time >= this._config.silence_timeouts.short
			this.setAlert "dead", "bad"
		else
			this.resetAlert "dead"

	###
	Sets the current studio in use.

	Updates the current studio display
	@param {Number} studio
	###
	setStudio: (studio) ->
		this._$ "#studio"
		.removeClass "studio1"
		.removeClass "studio2"
		.removeClass "studio3"
		.removeClass "studio4"

		this._$ "#studio"
		.addClass "studio#{studio}"

		studioText = switch studio
			when 1,2 then "Studio #{studio} is On Air"
			when 3 then "Jukebox is On Air"
			when 4 then "Outside Broadcast"
			else
				"Unknown Output"

		this._$ "#studio"
		.text studioText

	###
	Sets the current show name with an optional class

	@param {String} name
	@param {String} className (optional) Used to highlight the news program
	###
	setCurrentShowName: (name, className) ->
		this._$ "#current-show-title .content"
		.html "<span class='#{className}'>#{name}</span>"

	###
	Sets the current song name

	@param {String} song
	###
	setSong: (song) ->
		this._$ "#current-song"
		.find ".content"
		.text song

	###
	Sets the current and next show names

	@param {Object} shows
	###
	setShows: (shows) ->
		unless this.news
			this.setCurrentShowName shows.current.title
		this.setNextShowsInfo shows.next

	###
	Sets the next show names and times

	@param {Array} shows
	###
	setNextShowsInfo: (shows) ->
		if not shows[0]?
			this._$ "#next-shows"
			.addClass "hidden"
		else
			this._$ "#next-shows"
			.removeClass "hidden"
			for i in [0, 1, 2]
				show = this._$ "#next-shows #next#{i}"
				show.find ".name"
				.text shows[i].title
				show.find ".time"
				.text moment shows[i].start_time * 1000
				.format "HH:mm"

	###
	Removes all classes from the alert

	@param {String} alert
	###
	resetAlert: (alert) ->
		this._$ "#alerts ##{alert}"
		.removeClass "good"
		.removeClass "standby"
		.removeClass "worse"
		.removeClass "bad"

	###
	Adds the class status to the alert, removing other classes

	@param {String} alert
	@param {String} status
	###
	setAlert: (alert, status) ->
		this.resetAlert alert
		this._$ "#alerts ##{alert}"
		.addClass status

	###
	Calls the URY API

	This method abstracts away from the
	$.ajax method so be careful.

	options.url needs to be relative to the API URL.
		I.E. "selector/remotestreams/" not
		"https://ury.org.uk/api/v2/selector/remotestreams/".
		This is so the API URL is only used in one place in the code.

	options.data will have 'api_key' automatically added to it so you don't need to worry about.
		However if you must overwrite it, you can do so.

	options.error will be set to refresh the page if you don't specify a method.

	options.global will be set to false unless specified.

	@param {Object} options
	###
	callAPI: (options) ->
		unless options.hasOwnProperty "url"
			console.error "URL is required for this method"

		options.url = this._config.api_url + options.url;

		unless options.hasOwnProperty "data"
			options.data = {}

		unless options.data.hasOwnProperty "api_key"
			options.data.api_key = this._config.api_key

		unless options.hasOwnProperty "error"
			options.error = () -> # Refresh the page
				console.error "Failed to call API"
				if this._config.refresh_on_error
					window.location = window.location.href

		unless options.hasOwnProperty "global"
			options.global = false;

		this._$.get options
