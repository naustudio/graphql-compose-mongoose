'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
/* eslint-disable no-param-reassign */

exports.default = removeOne;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _filter = require('./helpers/filter');

var _sort = require('./helpers/sort');

var _projection = require('./helpers/projection');

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function removeOne(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver removeOne() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver removeOne() should be instance of TypeComposer.');
  }

  var outputTypeName = 'RemoveOne' + typeComposer.getTypeName() + 'Payload';
  var outputType = _typeStorage2.default.getOrSet(outputTypeName, new _graphql.GraphQLObjectType({
    name: outputTypeName,
    fields: {
      recordId: {
        type: _mongoid2.default,
        description: 'Removed document ID'
      },
      record: {
        type: typeComposer.getType(),
        description: 'Removed document'
      }
    }
  }));

  var resolver = new _graphqlCompose.Resolver({
    name: 'removeOne',
    kind: 'mutation',
    description: 'Remove one document: ' + '1) Remove with hooks via findOneAndRemove. ' + '2) Return removed document.',
    outputType: outputType,
    args: _extends({}, (0, _filter.filterHelperArgs)(typeComposer, model, _extends({
      filterTypeName: 'FilterRemoveOne' + typeComposer.getTypeName() + 'Input',
      model: model
    }, opts && opts.filter)), (0, _sort.sortHelperArgs)(model, _extends({
      sortTypeName: 'SortRemoveOne' + typeComposer.getTypeName() + 'Input'
    }, opts && opts.sort))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      resolveParams.query = model.findOneAndRemove({});
      (0, _filter.filterHelper)(resolveParams);
      (0, _sort.sortHelper)(resolveParams);
      (0, _projection.projectionHelper)(resolveParams);

      return (resolveParams.beforeQuery ? _promise2.default.resolve(resolveParams.beforeQuery(resolveParams.query)) : resolveParams.query.exec()).then(function (record) {
        if (record) {
          return {
            record: record,
            recordId: typeComposer.getRecordIdFn()(record)
          };
        }

        return null;
      });
    }, { resolverName: 'count' })
  });

  return resolver;
}