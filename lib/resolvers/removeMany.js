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

exports.default = removeMany;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _filter = require('./helpers/filter');

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function removeMany(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver removeMany() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver removeMany() should be instance of TypeComposer.');
  }

  var outputTypeName = 'RemoveMany' + typeComposer.getTypeName() + 'Payload';
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
    name: 'removeMany',
    kind: 'mutation',
    description: 'Remove many documents without returning them: ' + 'Use Query.remove mongoose method. ' + 'Do not apply mongoose defaults, setters, hooks and validation. ',
    outputType: outputType,
    args: _extends({}, (0, _filter.filterHelperArgs)(typeComposer, model, _extends({
      filterTypeName: 'FilterRemoveMany' + typeComposer.getTypeName() + 'Input',
      isRequired: true,
      model: model
    }, opts && opts.filter))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var filterData = resolveParams.args && resolveParams.args.filter || {};

      if (!((typeof filterData === 'undefined' ? 'undefined' : _typeof(filterData)) === 'object') || (0, _keys2.default)(filterData).length === 0) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.removeMany resolver requires ' + 'at least one value in args.filter'));
      }

      resolveParams.query = model.find();
      (0, _filter.filterHelper)(resolveParams);
      resolveParams.query = resolveParams.query.remove();

      return (resolveParams.beforeQuery ? _promise2.default.resolve(resolveParams.beforeQuery(resolveParams.query)) : resolveParams.query.exec()).then(function (res) {
        if (res.result && res.result.ok) {
          return {
            numAffected: res.result.n
          };
        }

        return _promise2.default.reject(res);
      });
    })
  });

  return resolver;
}