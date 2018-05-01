'use strict';
/* globals $, app, socket */

define('admin/plugins/archiver', ['settings'], function(Settings) {

	var ACP = {};

	ACP.init = function() {
		Settings.load('archiver', $('.archiver-settings'));

		$('#save').on('click', function() {
			Settings.save('archiver', $('.archiver-settings'), function() {
				app.alert({
					type: 'success',
					alert_id: 'archiver-saved',
					title: 'Settings Saved',
					message: 'Please reload your NodeBB to apply these settings',
					clickfn: function() {
						socket.emit('admin.reload');
					}
				});
			});
		});


		$('#test').on('click', function () {
			socket.emit('plugins.archiver.test', {}, function (err, payload) {
				if (err) {
					return app.alertError(err.message);
				}

				bootbox.alert('\
					<p>Archiver is currently: ' + (payload.config.active ? 'ENABLED': 'DISABLED') + '</p>\
					<p>When executed, the following tids will be archived: <blockquote>' + payload.tids.join(',') + '</blockquote></p>\
					<p>The configured action is to <strong>' + payload.config.action + '</strong> the listed tids</p>\
				');
			});
		});

		$('#execute').on('click', function () {
			bootbox.confirm('Execute archival process now?', function (ok) {
				if (ok) {
					socket.emit('plugins.archiver.run', {});
				}
			});
		});
	};

	return ACP;
});