'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _graphql = require('graphql');

var _language = require('graphql/language');

var GraphQLMongoID = new _graphql.GraphQLScalarType({
  name: 'MongoID',
  description: 'The `ID` scalar type represents a unique MongoDB identifier in collection. ' + 'MongoDB by default use 12-byte ObjectId value ' + '(https://docs.mongodb.com/manual/reference/bson-types/#objectid). ' + 'But MongoDB also may accepts string or integer as correct values for _id field.',
  serialize: String,
  parseValue: String,
  parseLiteral: function parseLiteral(ast) {
    return ast.kind === _language.Kind.STRING || ast.kind === _language.Kind.INT ? ast.value : null;
  }
});

exports.default = GraphQLMongoID;