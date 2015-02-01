'use strict';
/* globals module, require, process */

var	cronJob = require('cron').CronJob,
	async = require('async'),

	winston = module.parent.require('winston'),
	db = module.parent.require('./database'),
	Topics = module.parent.require('./topics'),
	meta = module.parent.require('./meta'),
	ThreadTools = module.parent.require('./threadTools'),

	Archiver = {};

Archiver.config = {};

Archiver.start = function(data, callback) {
	function render(req, res, next) {
		res.render('admin/plugins/archiver', {});
	}

	data.router.get('/admin/plugins/archiver', data.middleware.admin.buildHeader, render);
	data.router.get('/api/admin/plugins/archiver', render);

	// Setup
	meta.settings.get('archiver', function(err, values) {
	// db.getObjectFields('config', ['archiver:active', 'archiver:type', 'archiver:cutoff'], function(err, values) {
		Archiver.config = {
			active: values.active === 'on' ? true : false,
			type: values.type || 'activity',
			cutoff: values.cutoff || '7'
		};

		// Cron
		if (Archiver.config.active) {
			new cronJob('0 0 0 * * *', function() {
				if (process.env.NODE_ENV === 'development') {
					winston.info('[plugin.archiver] Checking for expired topics');
				}

				Archiver.execute();
			}, null, true);
		}

		callback();
	});
};

Archiver.execute = function() {
	var	cutoffDate = Date.now() - (60000 * 60 * 24 * parseInt(Archiver.config.cutoff, 10));

	db.getSortedSetRevRangeByScore('topics:tid', 0, -1, cutoffDate, -Infinity, function(err, tids) {
		async.eachLimit(tids, 5, function(tid, next) {
			Topics.getTopicData(tid, function(err, topicObj) {
				
				switch(Archiver.config.type) {
					case 'hard':
						if (topicObj.timestamp <= cutoffDate) {
							if (process.env.NODE_ENV === 'development') {
								winston.info('[plugin.archiver] Locking topic ' + tid);
							}

							ThreadTools.lock(topicObj.tid, 0, next);
						}
						break;

					case 'activity':
						if (topicObj.lastposttime <= cutoffDate) {
							if (process.env.NODE_ENV === 'development') {
								winston.info('[plugin.archiver] Locking topic ' + tid);
							}

							ThreadTools.lock(topicObj.tid, 0, next);
						}
						break;

					default:
						next();
						break;
				}
			});
		}, function() {
			if (process.env.NODE_ENV === 'development') {
				winston.info('[plugin.archiver] Finished archiving topics.');
			}

		});
	});
};

Archiver.admin = {
	menu: function(custom_header, callback) {
		custom_header.plugins.push({
			'route': '/plugins/archiver',
			'icon': 'icon-edit',
			'name': 'Archiver'
		});

		callback(null, custom_header);
	}
};

module.exports = {
	start: Archiver.start,
	admin: Archiver.admin
};
