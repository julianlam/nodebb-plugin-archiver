'use strict';
/* globals module, require, process */

var	cronJob = require('cron').CronJob;
var async = require('async');

var winston = require.main.require('winston');
var nconf = require.main.require('nconf');
var db = require.main.require('./src/database');
var topics = require.main.require('./src/topics');
var meta = require.main.require('./src/meta');
var categories = require.main.require('./src/categories');

var Archiver = module.exports;

var archiveCron = new cronJob('0 0 0 * * *', function() {
	winston.verbose('[plugin.archiver] Checking for expired topics');
	Archiver.execute();
}, null, false);

Archiver.start = function(data, callback) {
	var SocketPlugins = require.main.require('./src/socket.io/plugins');
	SocketPlugins.archiver = require('./websockets');

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

	var pubsub = require.main.require('./src/pubsub');
	pubsub.on('action:settings.set.archiver', onSettingsSave);

	getConfig(function (err, config) {
		if (err) {
			return callback(err);
		}

		if (config.active) {
			reStartCronJobs();
		}

		callback();
	});
};

function onSettingsSave(data) {
	if (nconf.get('runJobs')) {
		if (data.active === 'on') {
			reStartCronJobs();
		} else {
			stopCronJobs();
		}
	}
}

function reStartCronJobs() {
	if (nconf.get('runJobs')) {
		stopCronJobs();
		archiveCron.start();
	}
}

function stopCronJobs() {
	if (nconf.get('runJobs')) {
		archiveCron.stop();
	}
}

function getConfig(callback) {
	meta.settings.get('archiver', function(err, values) {
		if (err) {
			return callback(err);
		}
		try {
			if (typeof values.cids === 'string') {
				values.cids = JSON.parse(values.cids).map(cid => parseInt(cid, 10));
			}
		} catch (e) {
			winston.error('[plugins/archiver] Invalid cids value, disabling archiver.');
			values.active === 'off';
		}

		var config = {
			active: values.active === 'on',
			action: values.action || 'lock',
			type: values.type || 'activity',
			cutoff: values.cutoff || '7',
			lowerBound: parseInt(values.lowerBound, 10) || 0,
			cids: values.cids || [],
			uid: parseInt(values.uid, 10) || 1,
		};
		callback(null, config);
	});
}

Archiver.findTids = function (callback) {
	getConfig(function (err, config) {
		if (err) {
			return callback(err);
		}
		var	cutoffDate = Date.now() - (60000 * 60 * 24 * parseInt(config.cutoff, 10));

		var methods = [];
		if (config.cids.length) {
			config.cids.forEach(cid => methods.push('cid:' + cid + ':tids'));
		} else {
			methods.push('topics:tid');
		}

		winston.verbose('[plugins/archiver] Proceeding with sets: ' + methods.toString());
		methods = methods.map(set => async.apply(db.getSortedSetRevRangeByScore, set, 0, -1, cutoffDate, parseInt(config.lowerBound, 10)));

		async.parallel(methods, function (err, results) {
			if (err) {
				return callback(err);
			}

			let tids = results.reduce(function (memo, cur) {
				return memo.concat(cur);
			}).filter((cid, idx, set) => idx === set.indexOf(cid));	// filter dupes

			callback(null, tids, cutoffDate);
		});
	});
};

Archiver.execute = function () {
	var now = Date.now();
	var config;
	async.waterfall([
		function (next) {
			getConfig(next);
		},
		function (_config, next) {
			config = _config;
			Archiver.findTids(next);
		},
		function (tids, cutoffDate, next) {
			async.eachLimit(tids, 5, function(tid, next) {
				topics.getTopicData(tid, function(err, topicObj) {
					if (err) {
						return next(err);
					}
					switch(config.type) {
						case 'hard':
							if (topicObj.timestamp <= cutoffDate) {
								winston.verbose('[plugin.archiver] Archiving (' + config.action + ') topic ' + tid);
								return topics.tools[config.action](topicObj.tid, config.uid, next);
							}
							break;

						case 'activity':
							if (topicObj.lastposttime <= cutoffDate) {
								winston.verbose('[plugin.archiver] Archiving (' + config.action + ') topic ' + tid);
								return topics.tools[config.action](topicObj.tid, config.uid, next);
							}
							break;

						default:
							return next();
							break;
					}

					process.nextTick(next);
				});
			}, next);
		},
	], function(err) {
		if (err) {
			return winston.error('[plugin.archiver] Unable to archive topics: ' + err.message);
		}

		winston.verbose('[plugin.archiver] Finished archiving topics.');

		// Update lowerBound
		winston.verbose('[plugin.archiver] Updating lower bound value to: ' + now);
		meta.settings.set('archiver', {
			lowerBound: now,
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
	admin: Archiver.admin,
	execute: Archiver.execute,
	findTids: Archiver.findTids,
	getConfig: getConfig,
};
