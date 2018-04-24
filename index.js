'use strict';
/* globals module, require, process */

var	cronJob = require('cron').CronJob,
	async = require('async'),

	winston = module.parent.require('winston'),
	db = module.parent.require('./database'),
	topics = module.parent.require('./topics'),
	meta = module.parent.require('./meta'),
	categories = module.parent.require('./categories'),

	Archiver = {};

Archiver.config = {};

Archiver.start = function(data, callback) {
	function render(req, res, next) {
		categories.getAllCategories(req.user.uid, function (err, categories) {
			categories = categories.map(function (category) {
				return {
					cid: category.cid,
					name: category.name
				}
			});

			res.render('admin/plugins/archiver', {
				categories: categories,
			});
		});
	}

	data.router.get('/admin/plugins/archiver', data.middleware.admin.buildHeader, render);
	data.router.get('/api/admin/plugins/archiver', render);

	// Setup
	meta.settings.get('archiver', function(err, values) {
		try {
			values.cids = JSON.parse(values.cids).map(cid => parseInt(cid, 10));
		} catch (e) {
			winston.error('[plugins/archiver] Invalid cids value, disabling archiver.');
			values.active === 'off';
		}

		Archiver.config = {
			active: values.active === 'on' ? true : false,
			type: values.type || 'activity',
			cutoff: values.cutoff || '7',
			lowerBound: parseInt(values.lowerBound, 10) || 0,
			cids: values.cids || [],
			uid: parseInt(values.uid, 10) || 1,
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

	var methods = [];
	if (Archiver.config.cids.length) {
		Archiver.config.cids.forEach(cid => methods.push('cid:' + cid + ':tids'));
	} else {
		methods.push('topics:tid');
	}

	winston.verbose('[plugins/archiver] Proceeding with sets: ' + methods.toString());
	methods = methods.map(set => async.apply(db.getSortedSetRevRangeByScore, set, 0, -1, cutoffDate, parseInt(Archiver.config.lowerBound, 10)));

	async.parallel(methods, function (err, results) {
		let tids = results.reduce(function (memo, cur) {
			return memo.concat(cur);
		}).filter((cid, idx, set) => idx === set.indexOf(cid));	// filter dupes

		async.eachLimit(tids, 5, function(tid, next) {
			topics.getTopicData(tid, function(err, topicObj) {
				switch(Archiver.config.type) {
					case 'hard':
						if (topicObj.timestamp <= cutoffDate) {
							winston.verbose('[plugin.archiver] Locking topic ' + tid);
							return topics.tools.lock(topicObj.tid, Archiver.config.uid, next);
						}
						break;

					case 'activity':
						if (topicObj.lastposttime <= cutoffDate) {
							winston.verbose('[plugin.archiver] Locking topic ' + tid);
							return topics.tools.lock(topicObj.tid, Archiver.config.uid, next);
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
			winston.verbose('[plugin.archiver] Updating lower bound value to: ' + now);
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
