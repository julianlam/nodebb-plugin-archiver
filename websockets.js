'use strict';

var async = require('async');

var Archiver = module.parent.exports;

module.exports.test = function (socket, data, callback) {
	async.parallel({
		tids: function (next) {
			Archiver.findTids(function (err, tids, cutOff) {
				next(err, tids);
			});
		},
		config: function (next) {
			Archiver.getConfig(next);
		},
	}, callback);
};

module.exports.run = function (socket, data, callback) {
	Archiver.execute();
	callback();
};