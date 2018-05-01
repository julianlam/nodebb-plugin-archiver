'use strict';

var Archiver = module.parent.exports;

module.exports.test = function (socket, data, callback) {
	Archiver.findTids(function (err, tids) {
		callback(err, {
			tids: tids,
			config: Archiver.getConfig(),
		});
	});
};

module.exports.run = function (socket, data, callback) {
	Archiver.execute();
	callback();
};