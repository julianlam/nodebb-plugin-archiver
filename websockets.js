'use strict';

const async = require('async');

const meta = require.main.require('./src/meta');

const Archiver = module.parent.exports;

module.exports.test = async () => {
	const { active, action = 'lock' } = await meta.settings.get('archiver');
	const tids = await Archiver.findTids();

	return {
		action,
		tids,
		active: active === 'on',
	};
};

module.exports.run = function (socket, data, callback) {
	Archiver.execute();
	callback();
};
