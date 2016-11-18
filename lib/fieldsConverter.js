'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComplexTypes = undefined;
exports.dotPathsToEmbedded = dotPathsToEmbedded;
exports.getFieldsFromModel = getFieldsFromModel;
exports.convertModelToGraphQL = convertModelToGraphQL;
exports.convertSchemaToGraphQL = convertSchemaToGraphQL;
exports.convertFieldToGraphQL = convertFieldToGraphQL;
exports.deriveComplexType = deriveComplexType;
exports.scalarToGraphQL = scalarToGraphQL;
exports.arrayToGraphQL = arrayToGraphQL;
exports.embeddedToGraphQL = embeddedToGraphQL;
exports.enumToGraphQL = enumToGraphQL;
exports.documentArrayToGraphQL = documentArrayToGraphQL;
exports.referenceToGraphQL = referenceToGraphQL;
exports.mixedToGraphQL = mixedToGraphQL;

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _objectPath = require('object-path');

var _objectPath2 = _interopRequireDefault(_objectPath);

var _graphqlCompose = require('graphql-compose');

var _graphql = require('graphql');

var _mongoid = require('./types/mongoid');

var _mongoid2 = _interopRequireDefault(_mongoid);

var _typeStorage = require('./typeStorage');

var _typeStorage2 = _interopRequireDefault(_typeStorage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-use-before-define */

var ComplexTypes = exports.ComplexTypes = {
  ARRAY: 'ARRAY',
  EMBEDDED: 'EMBEDDED',
  DOCUMENT_ARRAY: 'DOCUMENT_ARRAY',
  ENUM: 'ENUM',
  REFERENCE: 'REFERENCE',
  SCALAR: 'SCALAR',
  MIXED: 'MIXED'
};

function _getFieldName(field) {
  return field.path;
}

function _getFieldType(field) {
  return field.instance;
}

function _getFieldDescription(field) {
  if (field.options && field.options.description) {
    return field.options.description;
  }

  return undefined;
}

function _getFieldEnums(field) {
  if (field.enumValues && field.enumValues.length > 0) {
    return field.enumValues;
  }

  return undefined;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function dotPathsToEmbedded(fields) {
  // convert only one dot-level on this step to EmbeddedModel
  // further when converting EmbeddedModel to GQL, it internally
  var result = {};

  (0, _keys2.default)(fields).forEach(function (fieldName) {
    var dotIdx = fieldName.indexOf('.');
    if (dotIdx === -1) {
      result[fieldName] = fields[fieldName];
    } else {
      // create pseudo sub-model
      var name = fieldName.substr(0, dotIdx);
      if (!result[name]) {
        var embeddedField = {
          instance: 'Embedded',
          path: name,
          schema: {
            paths: {}
          }
        };
        result[name] = embeddedField;
      }
      var subName = fieldName.substr(dotIdx + 1);
      result[name].schema.paths[subName] = (0, _assign2.default)({}, fields[fieldName], { path: subName });
    }
  });

  return result;
}

function getFieldsFromModel(model) {
  if (!model || !model.schema || !model.schema.paths) {
    throw new Error('You provide incorrect mongoose model to `getFieldsFromModel()`. ' + 'Correct model should contain `schema.paths` properties.');
  }

  var fields = {};
  var paths = dotPathsToEmbedded(model.schema.paths);

  (0, _keys2.default)(paths).filter(function (path) {
    return !path.startsWith('__');
  }) // skip hidden fields
  .forEach(function (path) {
    fields[path] = paths[path];
  });

  return fields;
}

function convertModelToGraphQL(model, typeName) {
  if (!typeName) {
    throw new Error('You provide empty name for type. ' + '`name` argument should be non-empty string.');
  }

  var typeComposer = new _graphqlCompose.TypeComposer(_typeStorage2.default.getOrSet(typeName, new _graphql.GraphQLObjectType({
    name: typeName,
    interfaces: [],
    description: undefined,
    fields: {}
  })));

  var mongooseFields = getFieldsFromModel(model, typeName);
  var graphqlFields = {};

  (0, _keys2.default)(mongooseFields).forEach(function (fieldName) {
    var mongooseField = mongooseFields[fieldName];
    graphqlFields[fieldName] = {
      type: convertFieldToGraphQL(mongooseField, typeName),
      description: _getFieldDescription(mongooseField)
    };
  });

  typeComposer.addFields(graphqlFields);
  return typeComposer;
}

function convertSchemaToGraphQL(schema, typeName) {
  if (!typeName) {
    throw new Error('You provide empty name for type. ' + '`name` argument should be non-empty string.');
  }

  if (schema._gqcTypeComposer) {
    return schema._gqcTypeComposer;
  }

  var tc = convertModelToGraphQL({ schema: schema }, typeName);
  // also generate InputType
  tc.getInputTypeComposer();

  schema._gqcTypeComposer = tc; // eslint-disable-line
  return tc;
}

function convertFieldToGraphQL(field) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var complexType = deriveComplexType(field);
  switch (complexType) {
    case ComplexTypes.SCALAR:
      return scalarToGraphQL(field);
    case ComplexTypes.ARRAY:
      return arrayToGraphQL(field, prefix);
    case ComplexTypes.EMBEDDED:
      return embeddedToGraphQL(field, prefix);
    case ComplexTypes.ENUM:
      return enumToGraphQL(field, prefix);
    case ComplexTypes.REFERENCE:
      return referenceToGraphQL(field, prefix);
    case ComplexTypes.DOCUMENT_ARRAY:
      return documentArrayToGraphQL(field, prefix);
    case ComplexTypes.MIXED:
      return mixedToGraphQL(field);
    default:
      return scalarToGraphQL(field);
  }
}

function deriveComplexType(field) {
  if (!field || !field.path || !field.instance) {
    throw new Error('You provide incorrect mongoose field to `deriveComplexType()`. ' + 'Correct field should contain `path` and `instance` properties.');
  }

  var fieldType = _getFieldType(field);

  if (field instanceof _mongoose2.default.Schema.Types.DocumentArray) {
    return ComplexTypes.DOCUMENT_ARRAY;
  } else if (field instanceof _mongoose2.default.Schema.Types.Embedded || fieldType === 'Embedded') {
    return ComplexTypes.EMBEDDED;
  } else if (field instanceof _mongoose2.default.Schema.Types.Array || _objectPath2.default.has(field, 'caster.instance')) {
    return ComplexTypes.ARRAY;
  } else if (field instanceof _mongoose2.default.Schema.Types.Mixed) {
    return ComplexTypes.MIXED;
  } else if (fieldType === 'ObjectID') {
    return ComplexTypes.REFERENCE;
  }

  var enums = _getFieldEnums(field);
  if (enums) {
    return ComplexTypes.ENUM;
  }

  return ComplexTypes.SCALAR;
}

function removePseudoIdField(typeComposer) {
  // remove pseudo object id mongoose field
  var gqFields = typeComposer.getFields();
  var pseudoFieldNames = ['_id'];
  pseudoFieldNames.forEach(function (name) {
    if (gqFields[name] && gqFields[name].type === _mongoid2.default) {
      typeComposer.removeField(name);
    }
  });
}

function scalarToGraphQL(field) {
  var typeName = _getFieldType(field);

  switch (typeName) {
    case 'String':
      return _graphql.GraphQLString;
    case 'Number':
      return _graphql.GraphQLFloat;
    case 'Date':
      return _graphqlCompose.GraphQLDate;
    case 'Buffer':
      return _graphqlCompose.GraphQLBuffer;
    case 'Boolean':
      return _graphql.GraphQLBoolean;
    case 'ObjectID':
      return _mongoid2.default;
    default:
      return _graphqlCompose.GraphQLGeneric;
  }
}

function arrayToGraphQL(field) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  if (!field || !field.caster) {
    throw new Error('You provide incorrect mongoose field to `arrayToGraphQL()`. ' + 'Correct field should contain `caster` property.');
  }

  var unwrappedField = (0, _assign2.default)({}, field.caster);
  _objectPath2.default.set(unwrappedField, 'options.ref', _objectPath2.default.get(field, 'options.ref', undefined));

  var outputType = convertFieldToGraphQL(unwrappedField, prefix);
  return new _graphql.GraphQLList(outputType);
}

function embeddedToGraphQL(field) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var fieldName = _getFieldName(field);
  var fieldType = _getFieldType(field);

  if (fieldType !== 'Embedded') {
    throw new Error('You provide incorrect field to `embeddedToGraphQL()`. ' + 'This field should has `Embedded` type. ');
  }

  var typeName = '' + prefix + capitalize(fieldName);
  var typeComposer = convertSchemaToGraphQL(field.schema, typeName);
  removePseudoIdField(typeComposer);

  return typeComposer.getType();
}

function enumToGraphQL(field) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var valueList = _getFieldEnums(field);
  if (!valueList) {
    throw new Error('You provide incorrect mongoose field to `enumToGraphQL()`. ' + 'Correct field should contain `enumValues` property');
  }

  var graphQLEnumValues = valueList.reduce(function (result, val) {
    result[val] = { value: val }; // eslint-disable-line no-param-reassign
    return result;
  }, {});

  var typeName = 'Enum' + prefix + capitalize(_getFieldName(field));
  return _typeStorage2.default.getOrSet(typeName, new _graphql.GraphQLEnumType({
    name: typeName,
    description: _getFieldDescription(field),
    values: graphQLEnumValues
  }));
}

function documentArrayToGraphQL(field) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  if (!(field instanceof _mongoose2.default.Schema.Types.DocumentArray)) {
    throw new Error('You provide incorrect mongoose field to `documentArrayToGraphQL()`. ' + 'Correct field should be instance of `mongoose.Schema.Types.DocumentArray`');
  }

  var typeName = '' + prefix + capitalize(_getFieldName(field));

  var typeComposer = convertModelToGraphQL(field, typeName);
  removePseudoIdField(typeComposer);

  return new _graphql.GraphQLList(typeComposer.getType());
}

function referenceToGraphQL(field) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

  var fieldType = _getFieldType(field);
  if (fieldType !== 'ObjectID') {
    throw new Error('You provide incorrect mongoose field to `referenceToGraphQL()`. ' + 'Correct field should has mongoose-type `ObjectID`');
  }

  // const refModelName = objectPath.get(field, 'options.ref');
  // if (refModelName) {
  //   return GQLReference;
  //   // throw new Error('Mongoose REFERENCE to graphQL TYPE not implemented yet. '
  //   //                + `Field ${_getFieldName(field)}`);
  //   // Storage.UnresolvedRefs.setSubKey(parentTypeName, fieldName, { refModelName });
  //   // return GraphQLReference;
  // }

  // this is mongo id field
  return scalarToGraphQL(field, prefix);
}

function mixedToGraphQL(field) {
  if (!(field instanceof _mongoose2.default.Schema.Types.Mixed)) {
    throw new Error('You provide incorrect mongoose field to `mixedToGraphQL()`. ' + 'Correct field should be instance of `mongoose.Schema.Types.Mixed`');
  }

  return _graphqlCompose.GraphQLJSON;
}