'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _defineProperty2 = require('babel-runtime/core-js/object/define-property');

var _defineProperty3 = _interopRequireDefault(_defineProperty2);

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.getIndexesFromModel = getIndexesFromModel;
exports.getUniqueIndexes = getUniqueIndexes;
exports.extendByReversedIndexes = extendByReversedIndexes;

function _defineProperty(obj, key, value) { if (key in obj) { (0, _defineProperty3.default)(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function isSpecificIndex(idx) {
  var hasSpecialIndex = false;
  (0, _keys2.default)(idx).forEach(function (k) {
    if (typeof idx[k] !== 'number' && typeof idx[k] !== 'boolean') {
      hasSpecialIndex = true;
    }
  });
  return hasSpecialIndex;
}

/**
* Get mongoose model, and return array of fields with indexes.
*  MongooseModel  ->  [ { _id: 1 }, { name: 1, surname: -1 } ]
**/
function getIndexesFromModel(mongooseModel) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var extractCompound = opts.extractCompound === undefined ? true : Boolean(opts.extractCompound);
  var skipSpecificIndexes = opts.skipSpecificIndexes === undefined ? true : Boolean(opts.skipSpecificIndexes);

  var indexedFields = [];

  // add _id field if existed
  if (mongooseModel.schema.paths._id) {
    indexedFields.push({ _id: 1 });
  }

  // scan all fields on index presence [MONGOOSE FIELDS LEVEL INDEX]
  (0, _keys2.default)(mongooseModel.schema.paths).forEach(function (name) {
    if (mongooseModel.schema.paths[name]._index) {
      indexedFields.push(_defineProperty({}, name, 1)); // ASC by default
    }
  });

  // scan compound and special indexes [MONGOOSE SCHEMA LEVEL INDEXES]
  if (Array.isArray(mongooseModel.schema._indexes)) {
    mongooseModel.schema._indexes.forEach(function (idxData) {
      var partialIndexes = {};
      var idxFields = idxData[0];

      if (!skipSpecificIndexes || !isSpecificIndex(idxFields)) {
        if (!extractCompound) {
          indexedFields.push(idxFields);
        } else {
          // extract partial indexes from compound index
          // { name: 1, age: 1, salary: 1} -> [{name:1}, {name:1, age:1}, {name:1, age:1, salary:1}]
          (0, _keys2.default)(idxFields).forEach(function (fieldName) {
            partialIndexes[fieldName] = idxFields[fieldName];
            indexedFields.push((0, _assign2.default)({}, partialIndexes));
          });
        }
      }
    });
  }

  return indexedFields;
}

function getUniqueIndexes(mongooseModel) {
  var indexedFields = [];

  // add _id field if existed
  if (mongooseModel.schema.paths._id) {
    indexedFields.push({ _id: 1 });
  }

  // scan all fields on index presence [MONGOOSE FIELDS LEVEL INDEX]
  (0, _keys2.default)(mongooseModel.schema.paths).forEach(function (name) {
    if (mongooseModel.schema.paths[name]._index && mongooseModel.schema.paths[name]._index.unique) {
      indexedFields.push(_defineProperty({}, name, 1)); // ASC by default
    }
  });

  // scan compound and special indexes [MONGOOSE SCHEMA LEVEL INDEXES]
  if (Array.isArray(mongooseModel.schema._indexes)) {
    mongooseModel.schema._indexes.forEach(function (idxData) {
      var idxFields = idxData[0];
      var idxCfg = idxData[1];
      if (idxCfg.unique && !isSpecificIndex(idxFields)) {
        indexedFields.push(idxFields);
      }
    });
  }

  return indexedFields;
}

function extendByReversedIndexes(indexes) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var reversedFirst = opts.reversedFirst === undefined ? false : Boolean(opts.reversedFirst);

  var result = [];

  indexes.forEach(function (indexObj) {
    var hasSpecificIndex = false;
    // https://docs.mongodb.org/manual/tutorial/sort-results-with-indexes/#sort-on-multiple-fields
    var reversedIndexObj = (0, _assign2.default)({}, indexObj);
    (0, _keys2.default)(reversedIndexObj).forEach(function (f) {
      if (reversedIndexObj[f] === 1) reversedIndexObj[f] = -1;else if (reversedIndexObj[f] === -1) reversedIndexObj[f] = 1;else hasSpecificIndex = true;
    });

    if (reversedFirst) {
      if (!hasSpecificIndex) {
        result.push(reversedIndexObj);
      }
      result.push(indexObj);
    } else {
      result.push(indexObj);
      if (!hasSpecificIndex) {
        result.push(reversedIndexObj);
      }
    }
  });

  return result;
}