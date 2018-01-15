/*
 * ComputeBasic 0.0.1
 * Author: HanGuoShuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import * as Abstracts from "./Abstract";

enum Status {
    READY,
    READING_IDENTITY,
    ESCAPING_REGEXP,
    READING_REGEXP,
    READING_REGEXP_MODIFIER,
    READING_STRING,
    ESCAPING_STRING,
    READING_COMMENT,
    DETECTING_NUMBER,
    READING_REAL_NUMBER,
    READING_HEX_NUMBER,
    READING_OCT_NUMBER,
    READING_DEC_NUMBER,
    READING_BIN_NUMBER,
    DETECTING_SYMBOL,
    READING_ELEMENT
}

function isDecDigtal(char: string): boolean {
    const c = char.charCodeAt(0);
    return c >= 48 && c <= 57;
}

function isOctDigtal(char: string): boolean {
    const c = char.charCodeAt(0);
    return c >= 48 && c <= 55;
}

function isBinDigtal(c: string): boolean {
    return c === "0" || c === "1";
}

function isHexDigtal(char: string): boolean {
    const c = char.charCodeAt(0);
    return c >= 48 && c <= 57 ||
            ((c | 0x20) >= 97 && (c | 0x20) <= 122);
}

function isSymbol(char: string): boolean {
    return !/^[\u4e00-\u9fbf_a-zA-Z0-9 \n\t]$/.test(char);
}

function isIdentity(char: string): boolean {
    return /^[\u4e00-\u9fbf_a-zA-Z0-9]$/.test(char);
}

function isNewLine(char: string): boolean {
    return char === "\n";
}

// --- 检测是否为空、制表符 ---
function isBlank(char: string): boolean {
    switch (char) {
    case " ":
    case "\t":
    case "\n":
        return true;
    }
    return false;
}

class Tokenizer {

    // --- 定义基本信息 ---
    private _status: Status;
    private _row: number;
    private _rowPos: number;
    private _tokenPos: number;

    public tokenize(code: string): Abstracts.TokenRefer[] {
        this._status = Status.READY;
        this._row = 1;
        this._rowPos = 0;
        this._tokenPos = 0;

        // --- 初始化 code ---
        code = code.replace(/\r\n|\r/g, "\n") + "\n";
        let token: Abstracts.TokenRefer[] = [];

        for (let p = 0; p < code.length; ++p) {

            const char = code[p];

            switch (this._status) {
            case Status.READY:
                switch (char) {
                case "\"":
                    // --- 字符串 ---
                    this._tokenPos = p;
                    this._status = Status.READING_STRING;
                    break;
                case "'":
                    // --- 注释 ---
                    this._tokenPos = p;
                    this._status = Status.READING_COMMENT;
                    break;
                case "/":
                    // --- 正则表达式 或 除号 ---
                    this._tokenPos = p;
                    // --- 如果前面一个是 NUMBER IDENTITY ELEMENT 则不是正则 ---
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
                        } else {
                            this._status = Status.READING_REGEXP;
                        }
                        break;
                    default:
                        this._status = Status.READING_REGEXP;
                        break;
                    }
                    break;
                case "0":
                    // goto check 0., 0x, 0b, 0o or others possibilities.
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
                    } else if (!isBlank(char)) {
                        this._tokenPos = p;
                        this._status = Status.READING_IDENTITY;
                        break;
                    }
                    break;
                }
                break;
            case Status.READING_ELEMENT:
                if (char === "]") {
                    let text = code.slice(this._tokenPos, p + 1);
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
                    let text = code.slice(this._tokenPos, p);
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
                } else if (char === "/") {
                    this._status = Status.READING_REGEXP_MODIFIER;
                }
                break;
            case Status.READING_REGEXP_MODIFIER:
                if (!/^[a-zA-Z]$/.test(char)) {
                    let text = code.slice(this._tokenPos, p);
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
                    let text = code.slice(this._tokenPos, p);
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
                    // --- 真正转义 ---
                    this._status = Status.READING_STRING;
                } else {
                    // --- 结束了 ---
                    let text = code.slice(this._tokenPos, p);
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
            case Status.DETECTING_NUMBER: // only check for the second char.
                switch (char) {
                case ".": // such as 1.234, real number.
                    this._status = Status.READING_REAL_NUMBER;
                    break;
                case "x": // such as 0xFFF, hexadecimal integer.
                    this._status = Status.READING_HEX_NUMBER;
                    break;
                case "b": // such as 0b111, binary integer.
                    this._status = Status.READING_BIN_NUMBER;
                    break;
                case "o": // such as 0o777, octal integer.
                    this._status = Status.READING_OCT_NUMBER;
                    break;
                default:
                    if (isDecDigtal(char)) {
                        this._status = Status.READING_DEC_NUMBER;
                        break;
                    } else {
                        let text = code.slice(this._tokenPos, p);
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
                    let text = code.slice(this._tokenPos, p);
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
                } else if (!isDecDigtal(char)) {
                    let text = code.slice(this._tokenPos, p);
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
                    let text = code.slice(this._tokenPos, p);
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
                    let text = code.slice(this._tokenPos, p);
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
                    let text = code.slice(this._tokenPos, p);
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
                    let text = code.slice(this._tokenPos, p);
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

    }

}

export function create(): Abstracts.Tokenizer {
    return new Tokenizer();
}

export default create;