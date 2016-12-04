'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = removeById;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _projection = require('./helpers/projection');

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-param-reassign */

function removeById(model, typeComposer, opts // eslint-disable-line no-unused-vars
) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver removeById() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver removeById() should be instance of TypeComposer.');
  }

  var outputTypeName = 'RemoveById' + typeComposer.getTypeName() + 'Payload';
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
    name: 'removeById',
    kind: 'mutation',
    description: 'Remove one document: ' + '1) Retrieve one document and remove with hooks via findByIdAndRemove. ' + '2) Return removed document.',
    outputType: outputType,
    args: {
      _id: {
        name: '_id',
        type: new _graphql.GraphQLNonNull(_mongoid2.default)
      }
    },
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var args = resolveParams.args || {};

      if (!args._id) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.removeById resolver requires args._id value'));
      }

      resolveParams.query = model.findByIdAndRemove(args._id);
      (0, _projection.projectionHelper)(resolveParams);

      return (resolveParams.beforeQuery ? _promise2.default.resolve(resolveParams.beforeQuery(resolveParams.query)) : resolveParams.query.exec()).then(function (record) {
        if (record) {
          return {
            record: record,
            recordId: typeComposer.getRecordIdFn()(record)
          };
        }

        return {
          recordId: args._id
        };
      });
    }, { resolverName: 'removeById' })
  });

  return resolver;
}