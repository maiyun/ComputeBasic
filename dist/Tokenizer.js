"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Abstracts = require("./Abstract");
var Status;
(function (Status) {
    Status[Status["READY"] = 0] = "READY";
    Status[Status["READING_IDENTITY"] = 1] = "READING_IDENTITY";
    Status[Status["READING_REGEXP"] = 2] = "READING_REGEXP";
    Status[Status["ESCAPING_REGEXP"] = 3] = "ESCAPING_REGEXP";
    Status[Status["READING_REGEXP_MODIFIER"] = 4] = "READING_REGEXP_MODIFIER";
    Status[Status["READING_STRING"] = 5] = "READING_STRING";
    Status[Status["READING_STRING_FULL"] = 6] = "READING_STRING_FULL";
    Status[Status["ESCAPING_STRING"] = 7] = "ESCAPING_STRING";
    Status[Status["ESCAPING_STRING_FULL"] = 8] = "ESCAPING_STRING_FULL";
    Status[Status["READING_COMMENT"] = 9] = "READING_COMMENT";
    Status[Status["DETECTING_NUMBER"] = 10] = "DETECTING_NUMBER";
    Status[Status["READING_REAL_NUMBER"] = 11] = "READING_REAL_NUMBER";
    Status[Status["READING_HEX_NUMBER"] = 12] = "READING_HEX_NUMBER";
    Status[Status["READING_OCT_NUMBER"] = 13] = "READING_OCT_NUMBER";
    Status[Status["READING_DEC_NUMBER"] = 14] = "READING_DEC_NUMBER";
    Status[Status["READING_BIN_NUMBER"] = 15] = "READING_BIN_NUMBER";
    Status[Status["DETECTING_SYMBOL"] = 16] = "DETECTING_SYMBOL";
})(Status || (Status = {}));
function isDecDigtal(char) {
    var c = char.charCodeAt(0);
    return c >= 48 && c <= 57;
}
function isOctDigtal(char) {
    var c = char.charCodeAt(0);
    return c >= 48 && c <= 55;
}
function isBinDigtal(c) {
    return c === "0" || c === "1";
}
function isHexDigtal(char) {
    var c = char.charCodeAt(0);
    return c >= 48 && c <= 57 ||
        ((c | 0x20) >= 97 && (c | 0x20) <= 122);
}
function isSymbol(char) {
    return !/^[\u4e00-\u9fbf\uac00-\ud7ff\u3040-\u309F\u30A0-\u30FF_a-zA-Z0-9$ \n\t]$/.test(char);
}
function isIdentity(char) {
    return /^[\u4e00-\u9fbf\uac00-\ud7ff\u3040-\u309F\u30A0-\u30FF_a-zA-Z0-9$]$/.test(char);
}
function isNewLine(char) {
    return char === "\n";
}
function isBlank(char) {
    return /\s/.test(char);
}
var Tokenizer = (function () {
    function Tokenizer() {
    }
    Tokenizer.prototype.tokenize = function (code) {
        var status = Status.READY;
        var row = 1;
        var rowPos = 0;
        var tokenPos = 0;
        code = code.replace(/\r\n|\r/g, "\n") + "\n";
        var token = [];
        for (var p = 0; p < code.length; ++p) {
            var char = code[p];
            switch (status) {
                case Status.READY:
                    switch (char) {
                        case "\"":
                            tokenPos = p;
                            status = Status.READING_STRING;
                            break;
                        case "“":
                            tokenPos = p;
                            status = Status.READING_STRING_FULL;
                            break;
                        case "'":
                            tokenPos = p;
                            status = Status.READING_COMMENT;
                            break;
                        case "/":
                            tokenPos = p;
                            switch (token[token.length - 1].token.type) {
                                case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                                case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                                case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                                case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                                case Abstracts.TOKEN_TYPES.BIN_NUMBER:
                                case Abstracts.TOKEN_TYPES.IDENTITY:
                                    if (token[token.length - 1].row === row) {
                                        status = Status.DETECTING_SYMBOL;
                                    }
                                    else {
                                        status = Status.READING_REGEXP;
                                    }
                                    break;
                                default:
                                    if (token[token.length - 1].token.lower === ")" || token[token.length - 1].token.lower === "）") {
                                        status = Status.DETECTING_SYMBOL;
                                    }
                                    else {
                                        status = Status.READING_REGEXP;
                                    }
                                    break;
                            }
                            break;
                        case "0":
                            tokenPos = p;
                            status = Status.DETECTING_NUMBER;
                            break;
                        case "1":
                        case "2":
                        case "3":
                        case "4":
                        case "5":
                        case "6":
                        case "7":
                        case "8":
                        case "9":
                            tokenPos = p;
                            status = Status.READING_DEC_NUMBER;
                            break;
                        case ">":
                        case "<":
                            tokenPos = p;
                            status = Status.DETECTING_SYMBOL;
                            break;
                        default:
                            if (isSymbol(char)) {
                                tokenPos = p;
                                token.push({
                                    token: {
                                        text: char,
                                        lower: char,
                                        type: Abstracts.TOKEN_TYPES.SYMBOL
                                    },
                                    row: row,
                                    col: tokenPos - rowPos + 1
                                });
                            }
                            else if (!isBlank(char)) {
                                tokenPos = p;
                                status = Status.READING_IDENTITY;
                            }
                            break;
                    }
                    break;
                case Status.DETECTING_SYMBOL:
                    if (isBlank(char) || !isSymbol(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text,
                                type: Abstracts.TOKEN_TYPES.SYMBOL
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.ESCAPING_REGEXP:
                    status = Status.READING_REGEXP;
                    break;
                case Status.READING_REGEXP:
                    if (char === "\\") {
                        status = Status.ESCAPING_REGEXP;
                    }
                    else if (char === "/") {
                        status = Status.READING_REGEXP_MODIFIER;
                    }
                    break;
                case Status.READING_REGEXP_MODIFIER:
                    if (!/^[a-zA-Z]$/.test(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.REGEXP
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_COMMENT:
                    if (isNewLine(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.COMMENT
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        status = Status.READY;
                    }
                    break;
                case Status.ESCAPING_STRING:
                    if (char === "\"") {
                        status = Status.READING_STRING;
                    }
                    else {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.STRING
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.ESCAPING_STRING_FULL:
                    if (char === "”") {
                        status = Status.READING_STRING_FULL;
                    }
                    else {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.FULL_STRING
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_STRING:
                    if (char === "\"") {
                        status = Status.ESCAPING_STRING;
                    }
                    break;
                case Status.READING_STRING_FULL:
                    if (char === "”") {
                        status = Status.ESCAPING_STRING_FULL;
                    }
                    break;
                case Status.DETECTING_NUMBER:
                    switch (char) {
                        case ".":
                            status = Status.READING_REAL_NUMBER;
                            break;
                        case "x":
                            status = Status.READING_HEX_NUMBER;
                            break;
                        case "b":
                            status = Status.READING_BIN_NUMBER;
                            break;
                        case "o":
                            status = Status.READING_OCT_NUMBER;
                            break;
                        default:
                            if (isDecDigtal(char)) {
                                status = Status.READING_DEC_NUMBER;
                            }
                            else {
                                var text = code.slice(tokenPos, p);
                                token.push({
                                    token: {
                                        text: text,
                                        lower: text.toLowerCase(),
                                        type: Abstracts.TOKEN_TYPES.DEC_NUMBER
                                    },
                                    row: row,
                                    col: tokenPos - rowPos + 1
                                });
                                --p;
                                status = Status.READY;
                            }
                    }
                    break;
                case Status.READING_HEX_NUMBER:
                    if (!isHexDigtal(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.HEX_NUMBER
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_DEC_NUMBER:
                    if (char === ".") {
                        status = Status.READING_REAL_NUMBER;
                    }
                    else if (!isDecDigtal(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.DEC_NUMBER
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_REAL_NUMBER:
                    if (!isDecDigtal(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.REAL_NUMBER
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_OCT_NUMBER:
                    if (!isOctDigtal(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.OCT_NUMBER
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_BIN_NUMBER:
                    if (!isBinDigtal(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.BIN_NUMBER
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
                case Status.READING_IDENTITY:
                    if (!isIdentity(char)) {
                        var text = code.slice(tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.IDENTITY
                            },
                            row: row,
                            col: tokenPos - rowPos + 1
                        });
                        --p;
                        status = Status.READY;
                    }
                    break;
            }
            if (char === "\n" && char === code[p]) {
                ++row;
                rowPos = p + 1;
            }
        }
        return token;
    };
    return Tokenizer;
}());
function create() {
    return new Tokenizer();
}
exports.create = create;
exports.default = create;
