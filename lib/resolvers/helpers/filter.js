'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _from = require('babel-runtime/core-js/array/from');

var _from2 = _interopRequireDefault(_from);

var _defineProperty2 = require('babel-runtime/core-js/object/define-property');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

var _iterator = require('babel-runtime/core-js/symbol/iterator');

var _iterator2 = _interopRequireDefault(_iterator);

var _symbol = require('babel-runtime/core-js/symbol');

var _symbol2 = _interopRequireDefault(_symbol);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filterHelperArgs = exports.OPERATORS_FIELDNAME = undefined;

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };

exports.filterHelper = filterHelper;
exports.getIndexedFieldNames = getIndexedFieldNames;
exports.addFieldsWithOperator = addFieldsWithOperator;

var _graphql = require('graphql');

var _graphqlCompose = require('graphql-compose');

var _getIndexesFromModel = require('../../utils/getIndexesFromModel');

var _is = require('../../utils/is');

var _utils = require('../../utils');

var _typeStorage = require('../../typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { (0, _defineProperty3.default)(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return (0, _from2.default)(arr); } }
/* eslint-disable no-use-before-define */

var OPERATORS_FIELDNAME = exports.OPERATORS_FIELDNAME = '_operators';

var filterHelperArgs = exports.filterHelperArgs = function filterHelperArgs(typeComposer, model, opts) {
  if (!(typeComposer instanceof _graphqlCompose.TypeComposer)) {
    throw new Error('First arg for filterHelperArgs() should be instance of TypeComposer.');
  }

  if (!model || !model.modelName || !model.schema) {
    throw new Error('Second arg for filterHelperArgs() should be instance of MongooseModel.');
  }

  if (!opts || !opts.filterTypeName) {
    throw new Error('You should provide non-empty `filterTypeName` in options.');
  }

  var removeFields = [];
  if (opts.removeFields) {
    if (Array.isArray(opts.removeFields)) {
      removeFields.push.apply(removeFields, _toConsumableArray(opts.removeFields));
    } else {
      removeFields.push(opts.removeFields);
    }
  }

  if (opts.onlyIndexed) {
    (function () {
      var indexedFieldNames = getIndexedFieldNames(model);
      (0, _keys2.default)(typeComposer.getFields()).forEach(function (fieldName) {
        if (indexedFieldNames.indexOf(fieldName) === -1) {
          removeFields.push(fieldName);
        }
      });
    })();
  }

  var filterTypeName = opts.filterTypeName;
  var inputComposer = typeComposer.getInputTypeComposer().clone(filterTypeName);
  inputComposer.removeField(removeFields);

  if (opts.requiredFields) {
    inputComposer.makeRequired(opts.requiredFields);
  }

  if (!{}.hasOwnProperty.call(opts, 'operators') || opts.operators !== false) {
    addFieldsWithOperator(
    // $FlowFixMe
    'Operators' + opts.filterTypeName, inputComposer, model, opts.operators || {});
  }

  if (inputComposer.getFieldNames().length === 0) {
    return {};
  }

  return {
    filter: {
      name: 'filter',
      type: opts.isRequired ? new _graphql.GraphQLNonNull(inputComposer.getType()) : inputComposer.getType(),
      description: opts.onlyIndexed ? 'Filter only by indexed fields' : 'Filter by fields'
    }
  };
};

function filterHelper(resolveParams) {
  // $FlowFixMe
  var filter = resolveParams.args && resolveParams.args.filter;
  if (filter && (typeof filter === 'undefined' ? 'undefined' : _typeof(filter)) === 'object' && (0, _keys2.default)(filter).length > 0) {
    (function () {
      var modelFields = resolveParams.query.schema.paths;
      var clearedFilter = {};
      (0, _keys2.default)(filter).forEach(function (key) {
        if (modelFields[key]) {
          clearedFilter[key] = filter[key];
        }
      });
      if ((0, _keys2.default)(clearedFilter).length > 0) {
        resolveParams.query = resolveParams.query.where((0, _utils.toDottedObject)(clearedFilter)); // eslint-disable-line
      }

      if (filter[OPERATORS_FIELDNAME]) {
        (function () {
          var operatorFields = filter[OPERATORS_FIELDNAME];
          (0, _keys2.default)(operatorFields).forEach(function (fieldName) {
            var fieldOperators = (0, _assign2.default)({}, operatorFields[fieldName]);
            var criteria = {};
            (0, _keys2.default)(fieldOperators).forEach(function (operatorName) {
              criteria['$' + operatorName] = fieldOperators[operatorName];
            });
            if ((0, _keys2.default)(criteria).length > 0) {
              resolveParams.query = resolveParams.query.where(_defineProperty({}, fieldName, criteria));
            }
          });
        })();
      }
    })();
  }

  if ((0, _is.isObject)(resolveParams.rawQuery)) {
    resolveParams.query = resolveParams.query.where( // eslint-disable-line
    // $FlowFixMe
    resolveParams.rawQuery);
  }
}

function getIndexedFieldNames(model) {
  var indexes = (0, _getIndexesFromModel.getIndexesFromModel)(model);

  var fieldNames = [];
  indexes.forEach(function (indexData) {
    var keys = (0, _keys2.default)(indexData);
    var clearedName = keys[0].replace(/[^_a-zA-Z0-9]/i, '__');
    fieldNames.push(clearedName);
  });

  return fieldNames;
}

function addFieldsWithOperator(typeName, inputComposer, model, operatorsOpts) {
  var operatorsComposer = new _graphqlCompose.InputTypeComposer(_typeStorage2.default.getOrSet(typeName, new _graphql.GraphQLInputObjectType({
    name: typeName,
    fields: {}
  })));

  var availableOperators = ['gt', 'gte', 'lt', 'lte', 'ne', 'in[]', 'nin[]'];

  // if `opts.resolvers.[resolverName].filter.operators` is empty and not disabled via `false`
  // then fill it up with indexed fields
  var indexedFields = getIndexedFieldNames(model);
  if (operatorsOpts !== false && (0, _keys2.default)(operatorsOpts).length === 0) {
    indexedFields.forEach(function (fieldName) {
      operatorsOpts[fieldName] = availableOperators; // eslint-disable-line
    });
  }

  var existedFields = inputComposer.getFields();
  (0, _keys2.default)(existedFields).forEach(function (fieldName) {
    if (operatorsOpts[fieldName] && operatorsOpts[fieldName] !== false) {
      (function () {
        var fields = {};
        var operators = void 0;
        if (operatorsOpts[fieldName] && Array.isArray(operatorsOpts[fieldName])) {
          operators = operatorsOpts[fieldName];
        } else {
          operators = availableOperators;
        }
        operators.forEach(function (operatorName) {
          // unwrap from GraphQLNonNull and GraphQLList, if present
          var namedType = (0, _graphql.getNamedType)(existedFields[fieldName].type);
          if (namedType) {
            if (operatorName.slice(-2) === '[]') {
              // wrap with GraphQLList, if operator required this with `[]`
              var newName = operatorName.slice(0, -2);
              fields[newName] = _extends({}, existedFields[fieldName], {
                type: new _graphql.GraphQLList(namedType)
              });
            } else {
              fields[operatorName] = _extends({}, existedFields[fieldName], {
                type: namedType
              });
            }
          }
        });
        if ((0, _keys2.default)(fields).length > 0) {
          var operatorTypeName = '' + (0, _utils.upperFirst)(fieldName) + typeName;
          operatorsComposer.setField(fieldName, {
            type: _typeStorage2.default.getOrSet(operatorTypeName, new _graphql.GraphQLInputObjectType({
              name: operatorTypeName,
              fields: fields
            })),
            description: 'Filter value by operator(s)'
          });
        }
      })();
    }
  });

  if ((0, _keys2.default)(operatorsComposer.getFields()).length > 0) {
    inputComposer.setField(OPERATORS_FIELDNAME, {
      type: operatorsComposer.getType(),
      description: 'List of fields that can be filtered via operators'
    });
  }

  return operatorsComposer;
}