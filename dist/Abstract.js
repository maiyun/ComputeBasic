"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TOKEN_TYPES;
(function (TOKEN_TYPES) {
    TOKEN_TYPES[TOKEN_TYPES["UNKNOWN"] = 0] = "UNKNOWN";
    TOKEN_TYPES[TOKEN_TYPES["SYMBOL"] = 1] = "SYMBOL";
    TOKEN_TYPES[TOKEN_TYPES["STRING"] = 2] = "STRING";
    TOKEN_TYPES[TOKEN_TYPES["COMMENT"] = 3] = "COMMENT";
    TOKEN_TYPES[TOKEN_TYPES["DEC_NUMBER"] = 4] = "DEC_NUMBER";
    TOKEN_TYPES[TOKEN_TYPES["HEX_NUMBER"] = 5] = "HEX_NUMBER";
    TOKEN_TYPES[TOKEN_TYPES["OCT_NUMBER"] = 6] = "OCT_NUMBER";
    TOKEN_TYPES[TOKEN_TYPES["REAL_NUMBER"] = 7] = "REAL_NUMBER";
    TOKEN_TYPES[TOKEN_TYPES["BIN_NUMBER"] = 8] = "BIN_NUMBER";
    TOKEN_TYPES[TOKEN_TYPES["REGEXP"] = 9] = "REGEXP";
    TOKEN_TYPES[TOKEN_TYPES["IDENTITY"] = 10] = "IDENTITY";
    TOKEN_TYPES[TOKEN_TYPES["ELEMENT"] = 11] = "ELEMENT";
})(TOKEN_TYPES = exports.TOKEN_TYPES || (exports.TOKEN_TYPES = {}));
