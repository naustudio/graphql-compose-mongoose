'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = findByIds;

var _graphql = require('graphql');

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _graphqlCompose = require('graphql-compose');

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _limit = require('./helpers/limit');

var _sort = require('./helpers/sort');

var _projection = require('./helpers/projection');

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findByIds(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver findByIds() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver findByIds() should be instance of TypeComposer.');
  }

  return new _graphqlCompose.Resolver({
    outputType: new _graphql.GraphQLList(typeComposer.getType()),
    name: 'findByIds',
    kind: 'query',
    args: _extends({
      _ids: {
        name: '_ids',
        type: new _graphql.GraphQLNonNull(new _graphql.GraphQLList(_mongoid2.default))
      }
    }, (0, _limit.limitHelperArgs)(_extends({}, opts && opts.limit)), (0, _sort.sortHelperArgs)(model, _extends({
      sortTypeName: 'SortFindByIds' + typeComposer.getTypeName() + 'Input'
    }, opts && opts.sort))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var args = resolveParams.args || {};

      if (!Array.isArray(args._ids)) {
        return _promise2.default.resolve([]);
      }

      var selector = {};
      selector._id = {
        $in: args._ids.filter(function (id) {
          return _mongoose2.default.Types.ObjectId.isValid(id);
        }).map(function (id) {
          return _mongoose2.default.Types.ObjectId(id);
        }) };

      resolveParams.query = model.find(selector); // eslint-disable-line
      (0, _projection.projectionHelper)(resolveParams);
      (0, _limit.limitHelper)(resolveParams);
      (0, _sort.sortHelper)(resolveParams);
      return resolveParams.query.exec();
    }, { resolverName: 'findByIds' })
  });
}