'use strict';
/* globals module, require, process */

var	cronJob = require('cron').CronJob,
	async = require('async'),

	winston = module.parent.require('winston'),
	db = module.parent.require('./database'),
	topics = module.parent.require('./topics'),
	meta = module.parent.require('./meta'),

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
		Archiver.config = {
			active: values.active === 'on' ? true : false,
			type: values.type || 'activity',
			cutoff: values.cutoff || '7',
			lowerBound: parseInt(values.lowerBound, 10) || 0,
		};

		// Cron
		if (Archiver.config.active) {
			// new cronJob(new Date(Date.now() + 1000), function () {	// For debugging purposes only
			new cronJob('0 0 0 * * *', function() {
				winston.verbose('[plugin.archiver] Checking for expired topics');
				Archiver.execute();
			}, null, true);
		}

		callback();
	});
};

Archiver.execute = function() {
	var	cutoffDate = Date.now() - (60000 * 60 * 24 * parseInt(Archiver.config.cutoff, 10));
	var now = Date.now();

	/**
	 * Hey, add a thing to do lock/unlock via specific uid.
	 */

	db.getSortedSetRevRangeByScore('topics:tid', 0, -1, cutoffDate, parseInt(Archiver.config.lowerBound, 10), function(err, tids) {
		async.eachLimit(tids, 5, function(tid, next) {
			topics.getTopicData(tid, function(err, topicObj) {
				switch(Archiver.config.type) {
					case 'hard':
						if (topicObj.timestamp <= cutoffDate) {
							winston.verbose('[plugin.archiver] Locking topic ' + tid);
							return topics.tools.lock(topicObj.tid, 0, next);
						}
						break;

					case 'activity':
						if (topicObj.lastposttime <= cutoffDate) {
							winston.verbose('[plugin.archiver] Locking topic ' + tid);
							return topics.tools.lock(topicObj.tid, 0, next);
						}
						break;

					default:
						return next();
						break;
				}
				
				process.nextTick(next);
			});
		}, function(err) {
			if (err) {
				return winston.error('[plugin.archiver] Unable to archive topics: ' + err.message);
			}

			winston.verbose('[plugin.archiver] Finished archiving topics.');

			// Update lowerBound
			meta.settings.set('archiver', {
				lowerBound: now,
			});
			Archiver.config.lowerBound = now;
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
