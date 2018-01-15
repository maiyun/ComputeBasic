"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Abstracts = require("./Abstract");
var Status;
(function (Status) {
    Status[Status["READY"] = 0] = "READY";
    Status[Status["READING_IDENTITY"] = 1] = "READING_IDENTITY";
    Status[Status["ESCAPING_REGEXP"] = 2] = "ESCAPING_REGEXP";
    Status[Status["READING_REGEXP"] = 3] = "READING_REGEXP";
    Status[Status["READING_REGEXP_MODIFIER"] = 4] = "READING_REGEXP_MODIFIER";
    Status[Status["READING_STRING"] = 5] = "READING_STRING";
    Status[Status["ESCAPING_STRING"] = 6] = "ESCAPING_STRING";
    Status[Status["READING_COMMENT"] = 7] = "READING_COMMENT";
    Status[Status["DETECTING_NUMBER"] = 8] = "DETECTING_NUMBER";
    Status[Status["READING_REAL_NUMBER"] = 9] = "READING_REAL_NUMBER";
    Status[Status["READING_HEX_NUMBER"] = 10] = "READING_HEX_NUMBER";
    Status[Status["READING_OCT_NUMBER"] = 11] = "READING_OCT_NUMBER";
    Status[Status["READING_DEC_NUMBER"] = 12] = "READING_DEC_NUMBER";
    Status[Status["READING_BIN_NUMBER"] = 13] = "READING_BIN_NUMBER";
    Status[Status["DETECTING_SYMBOL"] = 14] = "DETECTING_SYMBOL";
    Status[Status["READING_ELEMENT"] = 15] = "READING_ELEMENT";
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
    return !/^[\u4e00-\u9fbf_a-zA-Z0-9 \n\t]$/.test(char);
}
function isIdentity(char) {
    return /^[\u4e00-\u9fbf_a-zA-Z0-9]$/.test(char);
}
function isNewLine(char) {
    return char === "\n";
}
function isBlank(char) {
    switch (char) {
        case " ":
        case "\t":
        case "\n":
            return true;
    }
    return false;
}
var Tokenizer = (function () {
    function Tokenizer() {
    }
    Tokenizer.prototype.tokenize = function (code) {
        this._status = Status.READY;
        this._row = 1;
        this._rowPos = 0;
        this._tokenPos = 0;
        code = code.replace(/\r\n|\r/g, "\n") + "\n";
        var token = [];
        for (var p = 0; p < code.length; ++p) {
            var char = code[p];
            switch (this._status) {
                case Status.READY:
                    switch (char) {
                        case "\"":
                            this._tokenPos = p;
                            this._status = Status.READING_STRING;
                            break;
                        case "'":
                            this._tokenPos = p;
                            this._status = Status.READING_COMMENT;
                            break;
                        case "/":
                            this._tokenPos = p;
                            switch (token[token.length - 1].token.type) {
                                case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                                case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                                case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                                case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                                case Abstracts.TOKEN_TYPES.BIN_NUMBER:
                                case Abstracts.TOKEN_TYPES.IDENTITY:
                                case Abstracts.TOKEN_TYPES.ELEMENT:
                                    if (token[token.length - 1].row === this._row) {
                                        this._status = Status.DETECTING_SYMBOL;
                                    }
                                    else {
                                        this._status = Status.READING_REGEXP;
                                    }
                                    break;
                                default:
                                    this._status = Status.READING_REGEXP;
                                    break;
                            }
                            break;
                        case "0":
                            this._tokenPos = p;
                            this._status = Status.DETECTING_NUMBER;
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
                            this._tokenPos = p;
                            this._status = Status.READING_DEC_NUMBER;
                            break;
                        case "[":
                            this._tokenPos = p;
                            this._status = Status.READING_ELEMENT;
                            break;
                        case ">":
                        case "<":
                            this._tokenPos = p;
                            this._status = Status.DETECTING_SYMBOL;
                            break;
                        default:
                            if (isSymbol(char)) {
                                this._tokenPos = p;
                                token.push({
                                    token: {
                                        text: char,
                                        lower: char,
                                        type: Abstracts.TOKEN_TYPES.SYMBOL
                                    },
                                    row: this._row,
                                    col: this._tokenPos - this._rowPos + 1
                                });
                                break;
                            }
                            else if (!isBlank(char)) {
                                this._tokenPos = p;
                                this._status = Status.READING_IDENTITY;
                                break;
                            }
                            break;
                    }
                    break;
                case Status.READING_ELEMENT:
                    if (char === "]") {
                        var text = code.slice(this._tokenPos, p + 1);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.ELEMENT
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        this._status = Status.READY;
                    }
                    break;
                case Status.DETECTING_SYMBOL:
                    if (isBlank(char) || !isSymbol(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text,
                                type: Abstracts.TOKEN_TYPES.SYMBOL
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.ESCAPING_REGEXP:
                    this._status = Status.READING_REGEXP;
                    break;
                case Status.READING_REGEXP:
                    if (char === "\\") {
                        this._status = Status.ESCAPING_REGEXP;
                        break;
                    }
                    else if (char === "/") {
                        this._status = Status.READING_REGEXP_MODIFIER;
                    }
                    break;
                case Status.READING_REGEXP_MODIFIER:
                    if (!/^[a-zA-Z]$/.test(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.REGEXP
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_COMMENT:
                    if (isNewLine(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.COMMENT
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        this._status = Status.READY;
                    }
                    break;
                case Status.ESCAPING_STRING:
                    if (char === "\"") {
                        this._status = Status.READING_STRING;
                    }
                    else {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.STRING
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_STRING:
                    if (char === "\"") {
                        this._status = Status.ESCAPING_STRING;
                        break;
                    }
                    break;
                case Status.DETECTING_NUMBER:
                    switch (char) {
                        case ".":
                            this._status = Status.READING_REAL_NUMBER;
                            break;
                        case "x":
                            this._status = Status.READING_HEX_NUMBER;
                            break;
                        case "b":
                            this._status = Status.READING_BIN_NUMBER;
                            break;
                        case "o":
                            this._status = Status.READING_OCT_NUMBER;
                            break;
                        default:
                            if (isDecDigtal(char)) {
                                this._status = Status.READING_DEC_NUMBER;
                                break;
                            }
                            else {
                                var text = code.slice(this._tokenPos, p);
                                token.push({
                                    token: {
                                        text: text,
                                        lower: text.toLowerCase(),
                                        type: Abstracts.TOKEN_TYPES.DEC_NUMBER
                                    },
                                    row: this._row,
                                    col: this._tokenPos - this._rowPos + 1
                                });
                                --p;
                                this._status = Status.READY;
                            }
                    }
                    break;
                case Status.READING_HEX_NUMBER:
                    if (!isHexDigtal(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.HEX_NUMBER
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_DEC_NUMBER:
                    if (char === ".") {
                        this._status = Status.READING_REAL_NUMBER;
                    }
                    else if (!isDecDigtal(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.DEC_NUMBER
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_REAL_NUMBER:
                    if (!isDecDigtal(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.REAL_NUMBER
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_OCT_NUMBER:
                    if (!isOctDigtal(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.OCT_NUMBER
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_BIN_NUMBER:
                    if (!isBinDigtal(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.BIN_NUMBER
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
                case Status.READING_IDENTITY:
                    if (!isIdentity(char)) {
                        var text = code.slice(this._tokenPos, p);
                        token.push({
                            token: {
                                text: text,
                                lower: text.toLowerCase(),
                                type: Abstracts.TOKEN_TYPES.IDENTITY
                            },
                            row: this._row,
                            col: this._tokenPos - this._rowPos + 1
                        });
                        --p;
                        this._status = Status.READY;
                    }
                    break;
            }
            if (char === "\n" && char === code[p]) {
                ++this._row;
                this._rowPos = p + 1;
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
