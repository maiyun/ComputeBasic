/*
 * ComputeBasic
 * Author: Han Guoshuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import * as Abstracts from "./Abstract";

enum Status {
    /** 就绪 */
    READY,
    // --- 读取正常状态值 ---
    READING_IDENTITY,
    /** 读取正则 */
    READING_REGEXP,
    /** 正则转义符号 */
    ESCAPING_REGEXP,
    /** 正则结束符号 */
    READING_REGEXP_MODIFIER,
    /** 读取字符串 */
    READING_STRING,
    /** 读取全角字符串 */
    READING_STRING_FULL,
    /** 字符串转义 */
    ESCAPING_STRING,
    /** 全角字符串转义 */
    ESCAPING_STRING_FULL,
    /** 读取注释 */
    READING_COMMENT,
    /** 判定数字 */
    DETECTING_NUMBER,
    /** 数字 real */
    READING_REAL_NUMBER,
    /** 数字 hex */
    READING_HEX_NUMBER,
    /** 数字 oct */
    READING_OCT_NUMBER,
    /** 数字 dec */
    READING_DEC_NUMBER,
    /** 数字 bin */
    READING_BIN_NUMBER,
    /** 疑似符号 */
    DETECTING_SYMBOL
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

/**
 * --- 判断除数字汉字韩文日文英文数字$空格换行缩进以外的内容，也就是是符号 ---
 * @param char char
 */
function isSymbol(char: string): boolean {
    return !/^[\u4e00-\u9fbf\uac00-\ud7ff\u3040-\u309F\u30A0-\u30FF_a-zA-Z0-9$ \n\t]$/.test(char);
}

/**
 * --- 判断是不是汉字韩文日文英文数字$描述性 ---
 * @param char char
 */
function isIdentity(char: string): boolean {
    return /^[\u4e00-\u9fbf\uac00-\ud7ff\u3040-\u309F\u30A0-\u30FF_a-zA-Z0-9$]$/.test(char);
}

/**
 * --- 是否是换行符 ---
 * @param char char
 */
function isNewLine(char: string): boolean {
    return char === "\n";
}

// --- 检测是否为空、制表符 ---
function isBlank(char: string): boolean {
    return /\s/.test(char);
}

class Tokenizer {

    /**
     * --- 对代码进行分离 ---
     * @param code 要 token 的代码
     */
    public tokenize(code: string): Abstracts.TokenRefer[] {
        // --- 定义基本信息 ---
        /** 当前状态 */
        let status: Status = Status.READY;
        /** 当前行数 */
        let row: number = 1;
        /** 当前行开始的位置 */
        let rowPos: number = 0;
        /** 当前 token 开始的位置 */
        let tokenPos: number = 0;

        // --- 初始化 code ---
        code = code.replace(/\r\n|\r/g, "\n") + "\n";
        let token: Abstracts.TokenRefer[] = [];

        for (let p = 0; p < code.length; ++p) {

            const char = code[p];

            switch (status) {
            case Status.READY:
                // --- READY 状态，一切皆有可能 ---
                switch (char) {
                case "\"":
                    // --- 字符串 ---
                    tokenPos = p;
                    status = Status.READING_STRING;
                    break;
                case "“":
                    // --- 全角字符串 ---
                    tokenPos = p;
                    status = Status.READING_STRING_FULL;
                    break;
                case "'":
                    // --- 注释 ---
                    tokenPos = p;
                    status = Status.READING_COMMENT;
                    break;
                case "/":
                    // --- 正则表达式 或 除号 ---
                    tokenPos = p;
                    // --- 如果前面一个是 NUMBER IDENTITY 则不是正则 ---
                    switch (token[token.length - 1].token.type) {
                    case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                    case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                    case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                    case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                    case Abstracts.TOKEN_TYPES.BIN_NUMBER:
                    case Abstracts.TOKEN_TYPES.IDENTITY:
                        if (token[token.length - 1].row === row) {
                            status = Status.DETECTING_SYMBOL;
                        } else {
                            status = Status.READING_REGEXP;
                        }
                        break;
                    default:
                        if (token[token.length - 1].token.lower === ")" || token[token.length - 1].token.lower === "）") {
                            status = Status.DETECTING_SYMBOL;
                        } else {
                            status = Status.READING_REGEXP;
                        }
                        break;
                    }
                    break;
                case "0":
                    // goto check 0., 0x, 0b, 0o or others possibilities.
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
                    // --- 判断是否是符号 ---
                    if (isSymbol(char)) {
                        // --- 是符号，如 . ; ? ---
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
                    } else if (!isBlank(char)) {
                        // --- 不是符号，也不是空白 ---
                        tokenPos = p;
                        status = Status.READING_IDENTITY;
                    }
                    break;
                }
                break;
            case Status.DETECTING_SYMBOL:
                if (isBlank(char) || !isSymbol(char)) {
                    // --- 如果不是符号，也特么不是空，那么就代表上一个就是最终符号，直接返回并退回一格 ---
                    let text = code.slice(tokenPos, p);
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
                } else if (char === "/") {
                    status = Status.READING_REGEXP_MODIFIER;
                }
                break;
            case Status.READING_REGEXP_MODIFIER:
                // --- 检测是否有正则后修饰符 /a/ig ---
                if (!/^[a-zA-Z]$/.test(char)) {
                    // --- 正则结束，上传 ---
                    let text = code.slice(tokenPos, p);
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
                    let text = code.slice(tokenPos, p);
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
                    // --- 真正转义 ---
                    status = Status.READING_STRING;
                } else {
                    // --- 结束了 ---
                    let text = code.slice(tokenPos, p);
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
                    // --- 真正转义 ---
                    status = Status.READING_STRING_FULL;
                } else {
                    // --- 结束了 ---
                    let text = code.slice(tokenPos, p);
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
            case Status.DETECTING_NUMBER: // only check for the second char.
                switch (char) {
                case ".": // such as 1.234, real number.
                    status = Status.READING_REAL_NUMBER;
                    break;
                case "x": // such as 0xFFF, hexadecimal integer.
                    status = Status.READING_HEX_NUMBER;
                    break;
                case "b": // such as 0b111, binary integer.
                    status = Status.READING_BIN_NUMBER;
                    break;
                case "o": // such as 0o777, octal integer.
                    status = Status.READING_OCT_NUMBER;
                    break;
                default:
                    if (isDecDigtal(char)) {
                        status = Status.READING_DEC_NUMBER;
                    } else {
                        let text = code.slice(tokenPos, p);
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
                    let text = code.slice(tokenPos, p);
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
                } else if (!isDecDigtal(char)) {
                    let text = code.slice(tokenPos, p);
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
                    let text = code.slice(tokenPos, p);
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
                    let text = code.slice(tokenPos, p);
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
                    let text = code.slice(tokenPos, p);
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
                    // --- 直到找到不是字串了 ---
                    let text = code.slice(tokenPos, p);
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
            // --- p 可能会被重置，重置后本次 char 就不一定是 \n 了 ---
            if (char === "\n" && char === code[p]) {
                ++row;
                rowPos = p + 1;
            }
        }
        return token;

    }

}

export function create(): Abstracts.Tokenizer {
    return new Tokenizer();
}

export default create;