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

exports.default = createOne;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _record = require('./helpers/record');

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createOne(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver createOne() should be instance of Mongoose Model.');
  }

  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver createOne() should be instance of TypeComposer.');
  }

  var outputTypeName = 'CreateOne' + typeComposer.getTypeName() + 'Payload';
  var outputType = _typeStorage2.default.getOrSet(outputTypeName, new _graphql.GraphQLObjectType({
    name: outputTypeName,
    fields: {
      recordId: {
        type: _mongoid2.default,
        description: 'Created document ID'
      },
      record: {
        type: typeComposer.getType(),
        description: 'Created document'
      }
    }
  }));

  var resolver = new _graphqlCompose.Resolver({
    name: 'createOne',
    kind: 'mutation',
    description: 'Create one document with mongoose defaults, setters, hooks and validation',
    outputType: outputType,
    args: _extends({}, (0, _record.recordHelperArgs)(typeComposer, _extends({
      recordTypeName: 'CreateOne' + typeComposer.getTypeName() + 'Input',
      removeFields: ['id', '_id'],
      isRequired: true
    }, opts && opts.record))),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var recordData = resolveParams.args && resolveParams.args.record || {};

      if (!((typeof recordData === 'undefined' ? 'undefined' : _typeof(recordData)) === 'object') || (0, _keys2.default)(recordData).length === 0) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.createOne resolver requires ' + 'at least one value in args.record'));
      }

      // $FlowFixMe
      return _promise2.default.resolve(new model(recordData)).then(function (doc) {
        if (resolveParams.beforeRecordMutate) {
          return resolveParams.beforeRecordMutate(doc);
        }
        return doc;
      }).then(function (doc) {
        return doc.save(resolveParams);
      }).then(function (record) {
        if (record) {
          return {
            record: record,
            recordId: typeComposer.getRecordIdFn()(record)
          };
        }

        return null;
      });
    }, { resolverName: 'createOne' })
  });

  return resolver;
}
