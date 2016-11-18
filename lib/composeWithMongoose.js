'use strict';

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = _assign2.default || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
/* eslint-disable no-use-before-define, no-param-reassign */

exports.composeWithMongoose = composeWithMongoose;
exports.prepareFields = prepareFields;
exports.prepareInputFields = prepareInputFields;
exports.createInputType = createInputType;
exports.createResolvers = createResolvers;
exports.prepareConnectionResolver = prepareConnectionResolver;

var _graphqlCompose = require('graphql-compose');

var _graphqlComposeConnection = require('graphql-compose-connection');

var _graphqlComposeConnection2 = _interopRequireDefault(_graphqlComposeConnection);

var _fieldsConverter = require('./fieldsConverter');

var _resolvers = require('./resolvers');

var resolvers = _interopRequireWildcard(_resolvers);

var _getIndexesFromModel = require('./utils/getIndexesFromModel');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function composeWithMongoose(model) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var name = opts && opts.name || model.modelName;

  var typeComposer = (0, _fieldsConverter.convertModelToGraphQL)(model, name);

  if (opts.description) {
    typeComposer.setDescription(opts.description);
  }

  if (opts.fields) {
    prepareFields(typeComposer, opts.fields);
  }

  // $FlowFixMe
  typeComposer.setRecordIdFn(function (source) {
    return source ? '' + source._id : '';
  });

  createInputType(typeComposer, opts.inputType);

  if (!{}.hasOwnProperty.call(opts, 'resolvers') || opts.resolvers !== false) {
    createResolvers(model, typeComposer, opts.resolvers || {});
  }

  return typeComposer;
}

function prepareFields(typeComposer, opts) {
  if (Array.isArray(opts.only)) {
    (function () {
      var onlyFieldNames = opts.only;
      var removeFields = (0, _keys2.default)(typeComposer.getFields()).filter(function (fName) {
        return !onlyFieldNames.includes(fName);
      });
      typeComposer.removeField(removeFields);
    })();
  }
  if (opts.remove) {
    typeComposer.removeField(opts.remove);
  }
}

function prepareInputFields(inputTypeComposer, inputFieldsOpts) {
  if (Array.isArray(inputFieldsOpts.only)) {
    (function () {
      var onlyFieldNames = inputFieldsOpts.only;
      var removeFields = (0, _keys2.default)(inputTypeComposer.getFields()).filter(function (fName) {
        return !onlyFieldNames.includes(fName);
      });
      inputTypeComposer.removeField(removeFields);
    })();
  }
  if (inputFieldsOpts.remove) {
    inputTypeComposer.removeField(inputFieldsOpts.remove);
  }
  if (inputFieldsOpts.required) {
    inputTypeComposer.makeRequired(inputFieldsOpts.required);
  }
}

function createInputType(typeComposer) {
  var inputTypeOpts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var inputTypeComposer = typeComposer.getInputTypeComposer();

  if (inputTypeOpts.name) {
    inputTypeComposer.setTypeName(inputTypeOpts.name);
  }

  if (inputTypeOpts.description) {
    inputTypeComposer.setDescription(inputTypeOpts.description);
  }

  if (inputTypeOpts.fields) {
    prepareInputFields(inputTypeComposer, inputTypeOpts.fields);
  }
}

function createResolvers(model, typeComposer, opts) {
  var names = resolvers.getAvailableNames();
  names.forEach(function (resolverName) {
    if (!{}.hasOwnProperty.call(opts, resolverName) || opts[resolverName] !== false) {
      var createResolverFn = resolvers[resolverName];
      if (createResolverFn) {
        var resolver = createResolverFn(model, typeComposer, opts[resolverName] || {});
        typeComposer.setResolver(resolverName, resolver);
      }
    }
  });

  if (!{}.hasOwnProperty.call(opts, 'connection') || opts.connection !== false) {
    prepareConnectionResolver(model, typeComposer, opts.connection ? opts.connection : {});
  }
}

function prepareConnectionResolver(model, typeComposer, opts) {
  var uniqueIndexes = (0, _getIndexesFromModel.extendByReversedIndexes)((0, _getIndexesFromModel.getUniqueIndexes)(model), { reversedFirst: true });
  var sortConfigs = {};
  uniqueIndexes.forEach(function (indexData) {
    var keys = (0, _keys2.default)(indexData);
    var name = keys.join('__').toUpperCase().replace(/[^_a-zA-Z0-9]/i, '__');
    if (indexData[keys[0]] === 1) {
      name = name + '_ASC';
    } else if (indexData[keys[0]] === -1) {
      name = name + '_DESC';
    }
    sortConfigs[name] = {
      value: indexData,
      cursorFields: keys,
      beforeCursorQuery: function beforeCursorQuery(rawQuery, cursorData) {
        keys.forEach(function (k) {
          if (!rawQuery[k]) rawQuery[k] = {};
          if (indexData[k] === 1) {
            rawQuery[k].$lt = cursorData[k];
          } else {
            rawQuery[k].$gt = cursorData[k];
          }
        });
      },
      afterCursorQuery: function afterCursorQuery(rawQuery, cursorData) {
        keys.forEach(function (k) {
          if (!rawQuery[k]) rawQuery[k] = {};
          if (indexData[k] === 1) {
            rawQuery[k].$gt = cursorData[k];
          } else {
            rawQuery[k].$lt = cursorData[k];
          }
        });
      }
    };
  });

  (0, _graphqlComposeConnection2.default)(typeComposer, {
    findResolverName: 'findMany',
    countResolverName: 'count',
    sort: _extends({}, sortConfigs, opts)
  });
}