'use strict';

/* globals $, app, socket, bootbox, define */

define('admin/plugins/archiver', ['settings'], (Settings) => {
	const ACP = {};

	ACP.init = function () {
		Settings.load('archiver', $('.archiver-settings'));

		$('#save').on('click', () => {
			Settings.save('archiver', $('.archiver-settings'), () => {
				app.alert({
					type: 'success',
					alert_id: 'archiver-saved',
					title: 'Settings Saved',
					message: 'Plugin settings saved successfully',
				});
			});
		});


		$('#test').on('click', () => {
			socket.emit('plugins.archiver.test', {}, (err, payload) => {
				if (err) {
					return app.alertError(err.message);
				}

				bootbox.alert(`\
					<p>Archiver is currently: ${payload.active ? 'ENABLED' : 'DISABLED'}</p>\
					<p>When executed, the following tids will be archived: <blockquote>${payload.tids.join(', ')}</blockquote></p>\
					<p>The configured action is to <strong>${payload.action}</strong> the listed tids</p>\
				`);
			});
		});

		$('#execute').on('click', () => {
			bootbox.confirm('Execute archival process now?', (ok) => {
				if (ok) {
					socket.emit('plugins.archiver.run', {});
				}
			});
		});
	};

	return ACP;
});
