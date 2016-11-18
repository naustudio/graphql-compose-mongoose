'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.projectionHelper = projectionHelper;
function projectionHelper(resolveParams) {
  var projection = resolveParams.projection;
  if (projection) {
    (function () {
      var flatProjection = {};
      (0, _keys2.default)(projection).forEach(function (key) {
        if (projection[key].$meta || projection[key].$slice || projection[key].$elemMatch) {
          // pass MongoDB projection operators https://docs.mongodb.com/v3.2/reference/operator/projection/meta/
          flatProjection[key] = projection[key];
        } else {
          // if not projection operator, then flatten projection
          flatProjection[key] = !!projection[key];
        }
      });
      resolveParams.query = resolveParams.query.select(flatProjection); // eslint-disable-line
    })();
  }
}