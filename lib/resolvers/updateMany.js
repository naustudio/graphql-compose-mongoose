'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _iterator = require('babel-runtime/core-js/symbol/iterator');

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
/* eslint-disable no-param-reassign */

exports.default = updateMany;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _record = require('./helpers/record');

var _skip = require('./helpers/skip');

var _limit = require('./helpers/limit');

var _filter = require('./helpers/filter');

var _sort = require('./helpers/sort');

var _toDottedObject = require('../utils/toDottedObject');

var _toDottedObject2 = _interopRequireDefault(_toDottedObject);

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateMany(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver updateMany() should be instance of Mongoose Model.');
  }
  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver updateMany() should be instance of TypeComposer.');
  }

  var outputTypeName = 'UpdateMany' + typeComposer.getTypeName() + 'Payload';
  var outputType = _typeStorage2.default.getOrSet(outputTypeName, new _graphql.GraphQLObjectType({
    name: outputTypeName,
    fields: {
      numAffected: {
        type: _graphql.GraphQLInt,
        description: 'Affected documents number'
      }
    }
  }));

  var resolver = new _graphqlCompose.Resolver({
    name: 'updateMany',
    kind: 'mutation',
    description: 'Update many documents without returning them: ' + 'Use Query.update mongoose method. ' + 'Do not apply mongoose defaults, setters, hooks and validation. ',
    outputType: outputType,
    args: _extends({}, (0, _record.recordHelperArgs)(typeComposer, _extends({
      recordTypeName: 'UpdateMany' + typeComposer.getTypeName() + 'Input',
      removeFields: ['id', '_id'],
      isRequired: true
    }, opts && opts.record)), (0, _filter.filterHelperArgs)(typeComposer, model, _extends({
      filterTypeName: 'FilterUpdateMany' + typeComposer.getTypeName() + 'Input',
      model: model
    }, opts && opts.filter)), (0, _sort.sortHelperArgs)(model, _extends({
      sortTypeName: 'SortUpdateMany' + typeComposer.getTypeName() + 'Input'
    }, opts && opts.sort)), (0, _skip.skipHelperArgs)(), (0, _limit.limitHelperArgs)(_extends({}, opts && opts.limit))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var recordData = resolveParams.args && resolveParams.args.record || {};

      if (!((typeof recordData === 'undefined' ? 'undefined' : _typeof(recordData)) === 'object') || (0, _keys2.default)(recordData).length === 0) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.updateMany resolver requires ' + 'at least one value in args.record'));
      }

      resolveParams.query = model.find();
      (0, _filter.filterHelper)(resolveParams);
      (0, _skip.skipHelper)(resolveParams);
      (0, _sort.sortHelper)(resolveParams);
      (0, _limit.limitHelper)(resolveParams);

      resolveParams.query = resolveParams.query.setOptions({ multi: true }); // eslint-disable-line
      resolveParams.query.update({ $set: (0, _toDottedObject2.default)(recordData) });

      return (resolveParams.beforeQuery ? _promise2.default.resolve(resolveParams.beforeQuery(resolveParams.query)) : resolveParams.query.exec()).then(function (res) {
        if (res.ok) {
          return {
            numAffected: res.nModified
          };
        }

        return _promise2.default.reject(res);
      });
    }, { resolverName: 'updateMany' })
  });

  return resolver;
}