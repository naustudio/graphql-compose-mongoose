'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isObject = exports.toDottedObject = undefined;
exports.upperFirst = upperFirst;

var _toDottedObject = require('./toDottedObject');

var _toDottedObject2 = _interopRequireDefault(_toDottedObject);

var _is = require('./is');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.toDottedObject = _toDottedObject2.default;
exports.isObject = _is.isObject;
function upperFirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}