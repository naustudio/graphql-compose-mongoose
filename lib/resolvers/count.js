'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
/* eslint-disable no-param-reassign */

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = count;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _filter = require('./helpers/filter');

var _auth = require('./helpers/auth');

function count(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver count() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver count() should be instance of TypeComposer.');
  }

  return new _graphqlCompose.Resolver({
    outputType: _graphql.GraphQLInt,
    name: 'count',
    kind: 'query',
    args: _extends({}, (0, _filter.filterHelperArgs)(typeComposer, model, _extends({
      filterTypeName: 'Filter' + typeComposer.getTypeName() + 'Input',
      model: model
    }, opts && opts.filter))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      resolveParams.query = model.find();
      (0, _filter.filterHelper)(resolveParams);
      return resolveParams.query.count().exec();
    })
  });
}