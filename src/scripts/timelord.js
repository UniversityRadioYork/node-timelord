window.Timelord = {

	_$: null,
	_config: null,

	routeobinfo: {
		s1: false,
		s2: false
	},

	news: false,

	/**
	 *
	 * @param {jQuery} $
	 * @param {Object} config
	 * @constructor
	 */
	init: function ($, config) {

		Timelord._$ = $;
		Timelord._config = config;

		// @TODO See if this can be removed
		setTimeout("window.location = window.location.href", 18000000);

		setInterval(Timelord.updateTime, 250);
		setInterval(Timelord.updateNewsMessage, 250);

		Timelord.updateView();

	},

	updateTime: function () {

		Timelord._$('#time').text(moment().format("HH:mm:ss"));
		Timelord._$('#date').text(moment().format("Do MMMM YYYY"));

	},

	updateNewsMessage: function () {

		var second = moment().seconds();
		var minute = moment().minutes();

		Timelord.news = (minute < 2 ||
			(
				minute == 59 &&
				second >= 15 &&
				second <= 52
			)
		);

		if (Timelord.news) {

			if (minute == 59) {

				if (second < 45) {

					Timelord.setCurrentShowName("News intro in " + (45 - second) + "...", 'news');

				} else if (second <= 52) {

					Timelord.setCurrentShowName((52 - second) + " until voice over...", 'news');

				} else {

					Timelord.setCurrentShowName(Timelord._config.short_name + ' News', 'news');

				}

			} else if (minute == 0) {

				Timelord.setCurrentShowName(Timelord._config.short_name + ' News', 'news');

			} else {

				Timelord.setCurrentShowName('News ends in ' + (60 - second) + '...', 'news');

			}

		}

	},

	/**
	 * Triggers all the API calls to update the view
	 */
	updateView: function () {

		// Update the Studio information
		Timelord.updateStudioInfo();

		// Set the current and next shows
		Timelord.updateShowInfo();

		// Update the alerts
		Timelord.updateAlerts();

		// Update the breaking news alert
		Timelord.updateBreakingNews();

	},

	/**
	 * Call the API breakingNews endpoint
	 * and sets the news alert accordingly
	 */
	updateBreakingNews: function () {

		Timelord.callAPI({
			url: Timelord._config.api_endpoints.breakingNews,
			success: function (data) {
				Timelord.setBreakingNews(data.payload);
			},
			complete: function () {
				setTimeout(Timelord.updateBreakingNews, Timelord._config.request_timeout);
			}
		});

	},

	/**
	 * Calls the API statusAtTime endpoint and
	 * sets the current studio information.
	 */
	updateStudioInfo: function () {

		Timelord.callAPI({
			url: Timelord._config.api_endpoints.statusAtTime,
			success: function (data) {
				Timelord.setStudio(data.payload.studio);
				Timelord.setStudioPowerLevel(data.payload);
			},
			complete: function () {
				setTimeout(Timelord.updateStudioInfo, Timelord._config.request_timeout);
			}
		});

	},

	/**
	 * Calls the API currentAndNext endpoint
	 * and sets the current and next shows.
	 */
	updateShowInfo: function () {

		Timelord.callAPI({
			url: Timelord._config.api_endpoints.currentAndNext,
			data: Timelord._config.next_show_filtering,
			success: function (data) {
				Timelord.setShows(data.payload);
			},
			complete: function () {
				setTimeout(Timelord.updateShowInfo, Timelord._config.request_timeout);
			}
		});

	},

	/**
	 * Calls the API isSilence, isObitHappening and
	 * remoteStreams endpoints and sets the alerts
	 * and studio power levels
	 */
	updateAlerts: function () {

		// Check for Silence
		Timelord.updateSilenceAlert();

		// Check for remote streams
		Timelord.updateOBAlerts();

		// Check for Obit
		Timelord.updateObitAlert();

	},

	/**
	 * Calls the API remoteStreams endpoint
	 * and sets the ob alerts
	 */
	updateOBAlerts: function () {

		Timelord.callAPI({
			url: Timelord._config.api_endpoints.remoteStreams,
			success: function (data) {
				Timelord.setOBAlerts(data.payload);
			},
			complete: function () {
				setTimeout(Timelord.updateOBAlerts, Timelord._config.request_timeout);
			}
		});

	},

	/**
	 * Calls the API isObitHappening endpoint
	 * and sets the obit alert
	 */
	updateObitAlert: function () {

		Timelord.callAPI({
			url: Timelord._config.api_endpoints.isObitHappening,
			success: function (data) {
				Timelord.setObitAlert(data.payload);
			},
			complete: function () {
				setTimeout(Timelord.updateObitAlert, Timelord._config.request_timeout);
			}
		});

	},

	/**
	 * Calls the API isSilence endpoint
	 * and sets the Silence alert
	 */
	updateSilenceAlert: function () {

		Timelord.callAPI({
			url: Timelord._config.api_endpoints.isSilence,
			success: function (data) {
				Timelord.setSilenceAlert(data.payload);
			},
			complete: function () {
				setTimeout(Timelord.updateSilenceAlert, Timelord._config.request_timeout);
			}
		});

	},

	/**
	 * Sets the OB alerts
	 *
	 * @param {Object} data
	 */
	setOBAlerts: function (data) {

		for (var i in Timelord.routeobinfo) {

			if (data[i]) {
				Timelord.setAlert('ob' + i, 'good');
				if (Timelord.routeobinfo[i] !== true &&
					Timelord.routeobinfo[i] !== false) {
					clearTimeout(Timelord.routeobinfo[i]);
				}
				Timelord.routeobinfo[i] = true;
			} else if (Timelord.routeobinfo[i] !== false) {
				Timelord.setAlert('ob' + i, 'bad');
				if (Timelord.routeobinfo[i] === true) {
					Timelord.routeobinfo[i] = setTimeout("Timelord.routeobinfo['" + i + "'] = false;", 30000);
				}
			} else {
				Timelord.resetAlert('ob' + i);
			}

		}

	},

	/**
	 * Sets the studio power levels
	 *
	 * @param {Object} data
	 */
	setStudioPowerLevel: function (data) {

		for (var i = 1; i <= 2; i++) {

			if (data['s' + i + 'power']) {
				if (data.studio == i) {
					Timelord.setAlert('s' + i, 'good');
				} else {
					Timelord.setAlert('s' + i, 'standby');
				}
			} else {
				Timelord.resetAlert('s' + i);
			}

		}

	},

	/**
	 * Sets the breaking news alert
	 *
	 * @param {String|null|false} news
	 */
	setBreakingNews: function (news) {

		if (news != null && news !== false) {
			Timelord._$('#breaking-news').removeClass('hidden').html(news);
			Timelord._$('#hide-when-breaking-news').addClass('hidden');
		} else {
			Timelord._$('#breaking-news').addClass('hidden');
			Timelord._$('#hide-when-breaking-news').removeClass('hidden');
		}

	},

	/**
	 * Sets the Obit alert
	 *
	 * @param {Boolean} obit
	 */
	setObitAlert: function (obit) {

		if (obit) {
			Timelord.setAlert('obit', 'worse');
		} else {
			Timelord.resetAlert('obit');
		}

	},

	/**
	 * Sets the Silence alert
	 *
	 * @param {Number} time
	 */
	setSilenceAlert: function (time) {

		if (time >= Timelord._config.silence_timeouts.long) {
			Timelord.setBreakingNews("RADIO SILENCE DETECTED");
		} else {
			Timelord.setBreakingNews(false);
		}

		if (time >= Timelord._config.silence_timeouts.short) {
			Timelord.setAlert('dead', 'bad');
		} else {
			Timelord.resetAlert('dead');
		}

	},

	/**
	 * Sets the current studio in use
	 *
	 * Update the current studio display
	 * @param {Number} studio
	 */
	setStudio: function (studio) {

		Timelord._$('#studio')
			.removeClass('studio1')
			.removeClass('studio2')
			.removeClass('studio3')
			.removeClass('studio4');

		Timelord._$('#studio').addClass('studio' + studio);

		switch (studio) {
			case 1:
			case 2:
				Timelord._$('#studio').html('Studio ' + studio + ' is On Air');
				break;
			case 3:
				Timelord._$('#studio').html('Jukebox is On Air');
				break;
			case 4:
				Timelord._$('#studio').html('Outside Broadcast');
				break;
			default:
				Timelord._$('#studio').html('Unknown Output');
				break;
		}

	},

	/**
	 * Sets the current show name with an optional class
	 *
	 * @param {String} name
	 * @param {String} className (optional) Used to highlight the news program
	 */
	setCurrentShowName: function (name, className) {

		Timelord._$('#current-show-title .content')
			.html('<span ' + (className ? 'class="' + className + '"' : '') + '>' + name + '</span>');

	},

	/**
	 * Sets the current and next show names
	 *
	 * @param {Object} shows
	 */
	setShows: function (shows) {

		if (!Timelord.news) {
			Timelord.setCurrentShowName(shows.current.title);
		}

		Timelord.setNextShowsInfo(shows.next);

	},

	/**
	 * Sets the next show names and times
	 *
	 * @param {Array} shows
	 */
	setNextShowsInfo: function (shows) {

		if (!shows || shows[0] == null) {
			Timelord._$('#next-shows').addClass('hidden');
		} else {
			Timelord._$('#next-shows').removeClass('hidden');

			for (var i = 0; i < 2; i++) {

				var show = Timelord._$('#next-shows #next' + i);

				show.find('.name').text(shows[i].title);
				show.find('.time').text(moment(shows[i].start_time * 1000).format("HH:mm"));

			}

		}

	},

	/**
	 * Removes all classes from the alert
	 *
	 * @param {String} alert
	 */
	resetAlert: function (alert) {

		Timelord._$('#alerts #' + alert)
			.removeClass('good')
			.removeClass('standby')
			.removeClass('worse')
			.removeClass('bad');

	},

	/**
	 * Adds the class status to the alert, removing other classes
	 *
	 * @param {String} alert
	 * @param {String} status
	 */
	setAlert: function (alert, status) {

		Timelord.resetAlert(alert);
		Timelord._$('#alerts #' + alert).addClass(status);

	},

	/**
	 * Calls the URY API
	 *
	 * This method abstracts away from the
	 * $.ajax method so be careful.
	 *
	 * options.url needs to be relative to the API URL.
	 *             I.E. "selector/remotestreams/" not
	 *             "https://ury.org.uk/api/v2/selector/remotestreams/".
	 *             This is so the API URL is only used in one place in the code.
	 *
	 * options.data will have 'api_key' automatically added to it so you don't need to worry about.
	 *              However if you must overwrite it, you can do so.
	 *
	 * options.error will be set to refresh the page if you don't specify a method.
	 *
	 * options.global will be set to false unless specified.
	 *
	 * @param {Object} options
	 */
	callAPI: function (options) {

		if (!options.hasOwnProperty("url")) {
			console.error("URL is required for this method");
		}

		options.url = Timelord._config.api_url + options.url;

		if (!options.hasOwnProperty("data")) {
			options.data = {};
		}

		if (!options.data.hasOwnProperty("api_key")) {
			options.data.api_key = Timelord._config.api_key;
		}

		if (!options.hasOwnProperty('error')) {
			options.error = function () {// Refresh the page
				console.error("Failed to call API");
				if(Timelord._config.refresh_on_error){
					window.location = window.location.href;
				}
			};
		}

		if (!options.hasOwnProperty("global")) {
			options.global = false;
		}

		Timelord._$.ajax(options);

	}

};
