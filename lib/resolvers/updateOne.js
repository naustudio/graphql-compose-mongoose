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

exports.default = updateOne;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _skip = require('./helpers/skip');

var _record = require('./helpers/record');

var _filter = require('./helpers/filter');

var _sort = require('./helpers/sort');

var _findOne = require('./findOne');

var _findOne2 = _interopRequireDefault(_findOne);

var _mongoid = require('../types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _typeStorage = require('../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

var _auth = require('./helpers/auth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function updateOne(model, typeComposer, opts) {
  if (!model || !model.modelName || !model.schema) {
    throw new Error('First arg for Resolver updateOne() should be instance of Mongoose Model.');
  }
  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('Second arg for Resolver updateOne() should be instance of TypeComposer.');
  }

  var findOneResolver = (0, _findOne2.default)(model, typeComposer, opts);

  var outputTypeName = 'UpdateOne' + typeComposer.getTypeName() + 'Payload';
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
    name: 'updateOne',
    kind: 'mutation',
    description: 'Update one document: ' + '1) Retrieve one document via findOne. ' + '2) Apply updates to mongoose document. ' + '3) Mongoose applies defaults, setters, hooks and validation. ' + '4) And save it.',
    outputType: outputType,
    args: _extends({}, (0, _record.recordHelperArgs)(typeComposer, _extends({
      recordTypeName: 'UpdateOne' + typeComposer.getTypeName() + 'Input',
      removeFields: ['id', '_id'],
      isRequired: true
    }, opts && opts.record)), (0, _filter.filterHelperArgs)(typeComposer, model, _extends({
      filterTypeName: 'FilterUpdateOne' + typeComposer.getTypeName() + 'Input',
      model: model
    }, opts && opts.filter)), (0, _sort.sortHelperArgs)(model, _extends({
      sortTypeName: 'SortUpdateOne' + typeComposer.getTypeName() + 'Input'
    }, opts && opts.sort)), (0, _skip.skipHelperArgs)()),
    resolve: (0, _auth.makeProtection)(function (resolveParams) {
      var recordData = resolveParams.args && resolveParams.args.record || null;
      var filterData = resolveParams.args && resolveParams.args.filter || {};

      if (!((typeof filterData === 'undefined' ? 'undefined' : _typeof(filterData)) === 'object') || (0, _keys2.default)(filterData).length === 0) {
        return _promise2.default.reject(new Error(typeComposer.getTypeName() + '.updateOne resolver requires ' + 'at least one value in args.filter'));
      }

      resolveParams.projection = resolveParams.projection && resolveParams.projection.record || {};

      return findOneResolver.resolve(resolveParams).then(function (doc) {
        if (resolveParams.beforeRecordMutate) {
          return resolveParams.beforeRecordMutate(doc);
        }
        return doc;
      })
      // save changes to DB
      .then(function (doc) {
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
    }, { resolverName: 'updateOne' })
  });

  return resolver;
}
