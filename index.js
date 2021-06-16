'use strict';

const	cronJob = require('cron').CronJob;
const async = require('async');

const winston = require.main.require('winston');
const nconf = require.main.require('nconf');
const db = require.main.require('./src/database');
const topics = require.main.require('./src/topics');
const meta = require.main.require('./src/meta');
const categories = require.main.require('./src/categories');

const Archiver = module.exports;

const archiveCron = new cronJob('0 0 0 * * *', (() => {
	winston.verbose('[plugin.archiver] Checking for expired topics');
	Archiver.execute();
}), null, false);

Archiver.start = async (data) => {
	const SocketPlugins = require.main.require('./src/socket.io/plugins');
	SocketPlugins.archiver = require('./websockets');

	function render(req, res, next) {
		categories.getAllCategories(req.user.uid, (err, categories) => {
			if (err) {
				return next();
			}

			categories = categories.map(category => ({
				cid: category.cid,
				name: category.name,
			}));

			res.render('admin/plugins/archiver', {
				categories: categories,
			});
		});
	}

	data.router.get('/admin/plugins/archiver', data.middleware.admin.buildHeader, render);
	data.router.get('/api/admin/plugins/archiver', render);

	const pubsub = require.main.require('./src/pubsub');
	pubsub.on('action:settings.set.archiver', onSettingsSave);

	const { active } = await meta.settings.get('archiver');
	if (active === 'on') {
		reStartCronJobs();
	}
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
	meta.settings.get('archiver', (err, values) => {
		if (err) {
			return callback(err);
		}
		try {
			if (typeof values.cids === 'string') {
				values.cids = JSON.parse(values.cids).map(cid => parseInt(cid, 10));
			}
		} catch (e) {
			winston.error('[plugins/archiver] Invalid cids value, disabling archiver.');
			values.active = 'off';
		}

		const config = {
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

Archiver.findTids = async () => {
	let { cutoff, cids, lowerBound } = await meta.settings.get('archiver');
	cutoff = Date.now() - (60000 * 60 * 24 * parseInt(cutoff || 7, 10));
	lowerBound = lowerBound || 0;

	try {
		if (typeof cids === 'string') {
			cids = JSON.parse(cids).map(cid => parseInt(cid, 10));
		}
	} catch (e) {
		winston.error('[plugins/archiver] Invalid cids value, disabling archiver.');
		cids = [];
	}

	const sets = [];
	if (cids.length) {
		cids.forEach(cid => sets.push(`cid:${cid}:tids`));
	} else {
		sets.push('topics:tid');
	}

	winston.verbose(`[plugins/archiver] Proceeding with sets: ${sets.toString()}`);
	const results = await Promise.all(
		sets.map(async set => await db.getSortedSetRevRangeByScore(set, 0, -1, cutoff, parseInt(lowerBound, 10)))
	);

	return results
		.reduce((memo, cur) => memo.concat(cur))
		.filter((cid, idx, set) => idx === set.indexOf(cid));	// filter dupes
};

Archiver.execute = async () => {
	const now = Date.now();
	let { type, cutoff, action, uid } = await meta.settings.get('archiver');
	type = type || 'activity';
	cutoff = Date.now() - (60000 * 60 * 24 * parseInt(cutoff, 10));
	action = action || 'lock';
	uid = uid || 1;

	const tids = await Archiver.findTids();
	async.eachLimit(tids, 5, (tid, next) => {
		topics.getTopicData(tid, (err, topicObj) => {
			if (err) {
				return next(err);
			}
			switch (type) {
				case 'hard':
					if (topicObj.timestamp <= cutoff) {
						winston.info(`[plugin.archiver] Archiving (${action}) topic ${tid}`);
						return topics.tools[action](topicObj.tid, uid, next);
					}
					break;

				case 'activity':
					if (topicObj.lastposttime <= cutoff) {
						winston.info(`[plugin.archiver] Archiving (${action}) topic ${tid}`);
						return topics.tools[action](topicObj.tid, uid, next);
					}
					break;

				default:
					return next();
			}

			process.nextTick(next);
		});
	}, (err) => {
		if (err) {
			return winston.error(`[plugin.archiver] Unable to archive topics: ${err.message}`);
		}

		winston.info('[plugin.archiver] Finished archiving topics.');

		// Update lowerBound
		winston.info(`[plugin.archiver] Updating lower bound value to: ${now}`);
		meta.settings.set('archiver', {
			lowerBound: now,
		});
	});
};

Archiver.admin = {
	menu: function (custom_header, callback) {
		custom_header.plugins.push({
			route: '/plugins/archiver',
			icon: 'icon-edit',
			name: 'Archiver',
		});

		callback(null, custom_header);
	},
};

module.exports = {
	start: Archiver.start,
	admin: Archiver.admin,
	execute: Archiver.execute,
	findTids: Archiver.findTids,
	getConfig: getConfig,
};
