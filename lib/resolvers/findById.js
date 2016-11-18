'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findById;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _projection = require('./helpers/projection');

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function findById(model, typeComposer, opts // eslint-disable-line no-unused-vars
) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver findById() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver findById() should be instance of TypeComposer.');
  }

  return new _graphqlCompose.Resolver({
    outputType: typeComposer.getType(),
    name: 'findById',
    kind: 'query',
    args: {
      _id: {
        name: '_id',
        type: new _graphql.GraphQLNonNull(_mongoid2.default)
      }
    },
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var args = resolveParams.args || {};

      if (args._id) {
        resolveParams.query = model.findById(args._id); // eslint-disable-line
        (0, _projection.projectionHelper)(resolveParams);
        return resolveParams.query.exec();
      }
      return _promise2.default.resolve(null);
    })
  });
}