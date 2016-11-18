'use strict';

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* © 2016 NauStud.io
 * @author Quy Tran
 */
var makeProtection = function makeProtection(func) {
	return function (resolveParams) {
		var request = resolveParams.info.rootValue && resolveParams.info.rootValue.request;
		var promise = new _promise2.default(function (resolve, reject) {
			if (request && request.authorize) {
				var authorizePromise = request.authorize(resolveParams);
				authorizePromise.then(function (passed) {
					if (passed) {
						var result = func(resolveParams);
						result.then(function (value) {
							resolve(value);
						}).catch(function (err) {
							reject(err);
						});
					} else {
						reject((0, _stringify2.default)({
							message: 'Don\'t have permission',
							errorCode: 401
						}));
					}
				});
			} else {
				var result = func(resolveParams);
				result.then(function (value) {
					resolve(value);
				}).catch(function (err) {
					reject(err);
				});
			}
		});
		return promise;
	};
};

module.exports.makeProtection = makeProtection;