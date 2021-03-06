'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
/* eslint-disable no-param-reassign */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = findMany;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _skip = require('./helpers/skip');

var _limit = require('./helpers/limit');

var _filter = require('./helpers/filter');

var _sort = require('./helpers/sort');

var _projection = require('./helpers/projection');

var _auth = require('./helpers/auth');

function findMany(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver findMany() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver findMany() should be instance of TypeComposer.');
  }

  return new _graphqlCompose.Resolver({
    outputType: new _graphql.GraphQLList(typeComposer.getType()),
    name: 'findMany',
    kind: 'query',
    args: _extends({}, (0, _filter.filterHelperArgs)(typeComposer, model, _extends({
      filterTypeName: 'FilterFindMany' + typeComposer.getTypeName() + 'Input',
      model: model
    }, opts && opts.filter)), (0, _skip.skipHelperArgs)(), (0, _limit.limitHelperArgs)(_extends({}, opts && opts.limit)), (0, _sort.sortHelperArgs)(model, _extends({
      sortTypeName: 'SortFindMany' + typeComposer.getTypeName() + 'Input'
    }, opts && opts.sort))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      resolveParams.query = model.find();
      (0, _filter.filterHelper)(resolveParams);
      (0, _skip.skipHelper)(resolveParams);
      (0, _limit.limitHelper)(resolveParams);
      (0, _sort.sortHelper)(resolveParams);
      (0, _projection.projectionHelper)(resolveParams);
      return resolveParams.query.exec();
    }, { resolverName: 'findMany' })
  });
}