'use strict';

var _promise = require('babel-runtime/core-js/promise');

var _promise2 = _interopRequireDefault(_promise);

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

exports.default = updateById;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _record = require('./helpers/record');

var _findById = require('./findById');

var _findById2 = _interopRequireDefault(_findById);

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateById(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver updateById() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver updateById() should be instance of TypeComposer.');
  }

  var findByIdResolver = (0, _findById2.default)(model, typeComposer);

  var outputTypeName = 'UpdateById' + typeComposer.getTypeName() + 'Payload';
  var outputType = _typeStorage2.default.getOrSet(outputTypeName, new _graphql.GraphQLObjectType({
    name: outputTypeName,
    fields: {
      recordId: {
        type: _mongoid2.default,
        description: 'Updated document ID'
      },
      record: {
        type: typeComposer.getType(),
        description: 'Updated document'
      }
    }
  }));

  var resolver = new _graphqlCompose.Resolver({
    name: 'updateById',
    kind: 'mutation',
    description: 'Update one document: ' + '1) Retrieve one document by findById. ' + '2) Apply updates to mongoose document. ' + '3) Mongoose applies defaults, setters, hooks and validation. ' + '4) And save it.',
    outputType: outputType,
    args: _extends({}, (0, _record.recordHelperArgs)(typeComposer, _extends({
      recordTypeName: 'UpdateById' + typeComposer.getTypeName() + 'Input',
      requiredFields: ['_id'],
      isRequired: true
    }, opts && opts.record))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var recordData = resolveParams.args && resolveParams.args.record || {};

      if (!((typeof recordData === 'undefined' ? 'undefined' : _typeof(recordData)) === 'object')) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.updateById resolver requires args.record value'));
      }

      if (!recordData._id) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.updateById resolver requires args.record._id value'));
      }

      resolveParams.args._id = recordData._id;
      delete recordData._id;
      resolveParams.projection = resolveParams.projection && resolveParams.projection.record || {};

      return findByIdResolver.resolve(resolveParams).then(function (doc) {
        if (resolveParams.beforeRecordMutate) {
          return resolveParams.beforeRecordMutate(doc);
        }
        return doc;
      })
      // save changes to DB
      .then(function (doc) {
        if (!doc) {
          return _promise2.default.reject('Document not found');
        }
        if (recordData) {
          doc.set(recordData);
          return doc.save(resolveParams);
        }
        return doc;
      })
      // prepare output payload
      .then(function (record) {
        if (record) {
          return {
            record: record,
            recordId: typeComposer.getRecordIdFn()(record)
          };
        }

        return null;
      });
    }, { resolverName: 'updateById' })
  });

  return resolver;
}
