'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _iterator = require('babel-runtime/core-js/symbol/iterator');

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sortHelperArgs = undefined;

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };
/* eslint-disable no-use-before-define */

exports.sortHelper = sortHelper;
exports.getSortTypeFromModel = getSortTypeFromModel;

var _graphql = require('graphql');

var _getIndexesFromModel = require('../../utils/getIndexesFromModel');

var _typeStorage = require('../../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var sortHelperArgs = exports.sortHelperArgs = function sortHelperArgs(model, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for sortHelperArgs() should be instance of Mongoose Model.');
  }

  if (!opts || !opts.sortTypeName) {
    throw new Error('You should provide non-empty `sortTypeName` in options for sortHelperArgs().');
  }

  var gqSortType = getSortTypeFromModel(opts.sortTypeName, model);

  return {
    sort: {
      name: 'sort',
      type: gqSortType
    }
  };
};

function sortHelper(resolveParams) {
  var sort = resolveParams && resolveParams.args && resolveParams.args.sort;
  if (sort && (typeof sort === 'undefined' ? 'undefined' : _typeof(sort)) === 'object' && (0, _keys2.default)(sort).length > 0) {
    resolveParams.query = resolveParams.query.sort(sort); // eslint-disable-line
  }
}

function getSortTypeFromModel(typeName, model) {
  var indexes = (0, _getIndexesFromModel.extendByReversedIndexes)((0, _getIndexesFromModel.getIndexesFromModel)(model));

  var sortEnumValues = {};
  indexes.forEach(function (indexData) {
    var keys = (0, _keys2.default)(indexData);
    var name = keys.join('__').toUpperCase().replace(/[^_a-zA-Z0-9]/i, '__');
    if (indexData[keys[0]] === 1) {
      name = name + '_ASC';
    } else if (indexData[keys[0]] === -1) {
      name = name + '_DESC';
    }
    sortEnumValues[name] = {
      name: name,
      value: indexData
    };
  });

  return _typeStorage2.default.getOrSet(typeName, new _graphql.GraphQLEnumType({
    name: typeName,
    values: sortEnumValues
  }));
}