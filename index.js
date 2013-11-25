var	cronJob = require('cron').CronJob,
	async = require('async'),
	fs = require('fs'),
	path = require('path'),

	winston = module.parent.require('winston'),
	RDB = module.parent.require('./redis'),
	Topics = module.parent.require('./topics'),
	ThreadTools = module.parent.require('./threadTools'),

	Archiver = {};

Archiver.config = {};

Archiver.start = function() {
	// Setup
	RDB.hmget('config', 'archiver:active', 'archiver:type', 'archiver:cutoff', function(err, values) {
		Archiver.config = {
			active: values[0] || '0',
			type: values[1] || 'activity',
			cutoff: values[2] || '7'
		};

		// Cron
		if (Archiver.config.active === '1') {
			new cronJob(/*'0 0 0 * * *'*/new Date(Date.now() + 1500), function() {
				if (process.env.NODE_ENV === 'development') {
					winston.info('[plugin.archiver] Checking for expired topics');
				}

				Archiver.execute();
			}, null, true);
		}
	});
};

Archiver.execute = function() {
	var	cutoffDate = Date.now() - (60000 * 60 * 24 * parseInt(Archiver.config.cutoff, 10));

	RDB.smembers('topics:tid', function(err, tids) {
		async.each(tids, function(tid, next) {
			Topics.getTopicData(tid, function(err, topicObj) {
				console.log(topicObj.lastposttime);
				switch(Archiver.config.type) {
					case 'hard':
						if (topicObj.timestamp <= cutoffDate) {
							if (process.env.NODE_ENV === 'development') {
								winston.info('[plugin.archiver] Locking topic ' + tid);
							}

							ThreadTools.lock(topicObj.tid);
						}
						break;

					case 'activity':
						if (topicObj.lastposttime <= cutoffDate) {
							if (process.env.NODE_ENV === 'development') {
								winston.info('[plugin.archiver] Locking topic ' + tid);
							}

							ThreadTools.lock(topicObj.tid);
						}
						break;
				}

				next();
			});
		}, function(err) {
			if (process.env.NODE_ENV === 'development') {
				winston.info('[plugin.archiver] Finished archiving topics.');
			}

		});
	});
};

Archiver.admin = {
	menu: function(custom_header, callback) {
		custom_header.plugins.push({
			"route": '/plugins/archiver',
			"icon": 'icon-edit',
			"name": 'Archiver'
		});

		return custom_header;
	},
	route: function(custom_routes, callback) {
		fs.readFile(path.join(__dirname, 'admin.tpl'), function(err, tpl) {
			custom_routes.routes.push({
				route: '/plugins/archiver',
				method: "get",
				options: function(req, res, callback) {
					callback({
						req: req,
						res: res,
						route: '/plugins/archiver',
						name: 'Archiver',
						content: tpl
					});
				}
			});

			callback(null, custom_routes);
		});
	}
};

module.exports = {
	start: Archiver.start,
	admin: Archiver.admin
};