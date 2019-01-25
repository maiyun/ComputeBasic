/*
 * ComputeBasic
 * Author: Han Guoshuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import * as Abstracts from "./Abstract";
import TokenizerCreate from "./Tokenizer";
import Language from "./Language";

enum Status {
    /** 就绪状态 */
    READY,
    /** 发现 if */
    IF,
    /** 等待运算符 */
    WAIT_OPER,
    /** 进入函数体 */
    IN_FUNC
}

class ComputeBasic {

    /** 默认语言 */
    private _lang: Abstracts.LanguageEntity;
    /** 分离器 */
    private _tokenizer: Abstracts.Tokenizer;
    /** 内置函数 */
    private _funList: any = {
        "abs": (n: number): number => {return Math.abs(n); },
        "ceil": (n: number): number => {return Math.ceil(n); },
        "floor": (n: number): number => {return Math.floor(n); },
        "round": (n: number): number => {return Math.round(n); },
        "int": (s: string): number => {return parseInt(s); },
        "float": (s: string): number => {return parseFloat(s); },
        "string": (n: number): string => {return n.toString(); },
        "rand": (x: number, n: number): number => {return n + Math.round(Math.random() * (x - n)); },
        "type": (x: any): string => {return typeof(x); } ,
        "v": (d: string): string => {return (<HTMLInputElement>document.getElementsByName(d)[0]).value; },
        "$": (d: string): HTMLElement => {return document.getElementsByName(d)[0]; }
    };

    public constructor() {
        this._tokenizer = TokenizerCreate();
        this._lang = Language.en;
    }

    // --- 从外部内置函数 ---
    public expose(funName: string, fun: (...args: any[]) => any): void {
        this._funList[funName] = fun;
    }

    /**
     * --- 设置编译器语言 ---
     * @param lang 语言字符串，如 zh-CN
     */
    public setLanguage(lang: string): void {
        switch (lang) {
        case "zh-CN":
            this._lang = Language.zhCN;
            break;
        default:
            this._lang = Language.en;
            break;
        }
    }

    /**
     * --- 编译代码 ---
     * @param code 要编译的代码
     * @param opt 编译选项
     */
    public compile(code: string, opt: Abstracts.CompileOption = {}): any {
        opt.outType = opt.outType || "function";

        let trs: Abstracts.TokenRefer[] = this._tokenizer.tokenize(code);   // --- 序列化好的 token list ---
        let out: string[] = [];             // --- 编译好的代码 ---
        let vars: any = {};                 // --- 变量列表 ---
        let varsCount: number = -1;         // --- 变量个数 ---
        let funs: string[] = [];            // --- 使用到的函数列表 ---
        let status: Status = Status.READY;  // --- 当前状态 ---
        let inFuncCount: number = 0;        // --- 括号次数 ---

        for (let i: number = 0; i < trs.length; ++i) {
            let tr = trs[i];

            // --- 本 if 主要主要判断是否要补 ; ---

            if (status === Status.READY) {
                switch (tr.token.type) {
                case Abstracts.TOKEN_TYPES.STRING:
                case Abstracts.TOKEN_TYPES.FULL_STRING:
                case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                case Abstracts.TOKEN_TYPES.BIN_NUMBER:
                case Abstracts.TOKEN_TYPES.REGEXP:
                case Abstracts.TOKEN_TYPES.IDENTITY:
                    // --- 是文本的话，就等待运算符 ---
                    status = Status.WAIT_OPER;
                    break;
                }
            } else if (status === Status.WAIT_OPER) {
                switch (tr.token.type) {
                case Abstracts.TOKEN_TYPES.STRING:
                case Abstracts.TOKEN_TYPES.FULL_STRING:
                case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                case Abstracts.TOKEN_TYPES.REGEXP:
                    // --- 等待运算符的时候出来一堆有的没的，直接报错 ---
                    this._error(5, tr);
                    return false;
                case Abstracts.TOKEN_TYPES.IDENTITY:
                    out.push(";");
                    status = Status.WAIT_OPER;
                    break;
                case Abstracts.TOKEN_TYPES.SYMBOL:
                    if (tr.token.lower === "(" || tr.token.lower === "（") {
                        status = Status.IN_FUNC;
                        ++inFuncCount;
                        break;
                    } else {
                        status = Status.READY;
                    }
                }
            } else if (status === Status.IN_FUNC) {
                switch (tr.token.type) {
                case Abstracts.TOKEN_TYPES.SYMBOL:
                    if (tr.token.lower === ")" || tr.token.lower === "）") {
                        --inFuncCount;
                        if (inFuncCount === 0) {
                            status = Status.WAIT_OPER;
                        }
                    }
                    break;
                }
            }

            // --- 正常处理 ---

            switch (tr.token.type) {
            case Abstracts.TOKEN_TYPES.SYMBOL:
                switch (tr.token.text) {
                case "=":
                    if (status === Status.IF) {
                        out.push("==");
                    } else {
                        // --- 赋值 ---
                        out.push("=");
                    }
                    break;
                case ">":
                case "<":
                case ">=":
                case "<=":
                case "(":
                case ")":
                case "+":
                case "-":
                case "*":
                case "/":
                case "[":
                case "]":
                case ",":
                    out.push(tr.token.text);
                    break;
                case "<>":
                    out.push("!=");
                    break;
                case "（":
                    out.push("(");
                    break;
                case "）":
                    out.push(")");
                    break;
                case "“":
                case "”":
                    out.push("\"");
                    break;
                case "&":
                    out.push("+");
                    break;
                default:
                    this._error(5, tr);
                    return false;
                }
                break;
            case Abstracts.TOKEN_TYPES.STRING:
                out.push(tr.token.text.replace(/""/g, `\\"`));
                break;
            case Abstracts.TOKEN_TYPES.FULL_STRING:
                out.push(`"` + tr.token.text.replace(/"/g, `\\"`).replace(/””/g, `\\"`).slice(1, -1) + `"`);
                break;
            case Abstracts.TOKEN_TYPES.DEC_NUMBER:
            case Abstracts.TOKEN_TYPES.HEX_NUMBER:
            case Abstracts.TOKEN_TYPES.OCT_NUMBER:
            case Abstracts.TOKEN_TYPES.REAL_NUMBER:
            case Abstracts.TOKEN_TYPES.BIN_NUMBER:
            case Abstracts.TOKEN_TYPES.REGEXP:
                out.push(tr.token.text);
                break;
            case Abstracts.TOKEN_TYPES.IDENTITY:
                switch (tr.token.lower) {
                case "if":
                case "如果":
                    if (trs[i - 1] && trs[i - 1].token.lower === "end") {
                        out.push("}");
                        status = Status.READY;
                    } else {
                        out.push("if(");
                        status = Status.IF;
                    }
                    break;
                case "then":
                case "那么":
                case "那麼":
                    if (status === Status.IF) {
                        out.push("){");
                        status = Status.READY;
                    } else {
                        this._error(4, tr);
                        return false;
                    }
                    break;
                case "else":
                case "其他情况":
                case "其他情況":
                    if (trs[i + 1] && trs[i + 1].token.lower === "if") {
                        out.push("}else ");
                    } else {
                        out.push("}else{");
                    }
                    status = Status.READY;
                    break;
                case "elseif":
                case "或者":
                    out.push("}else if(");
                    status = Status.IF;
                    break;
                case "end":
                    // --- 无需额外处理 ---
                    status = Status.READY;
                    break;
                case "endif":
                case "结束如果":
                case "結束如果":
                    out.push("}");
                    status = Status.READY;
                    break;
                case "and":
                case "和":
                    out.push("&&");
                    break;
                case "or":
                case "或":
                    out.push("||");
                    break;
                case "return":
                case "返回":
                    out.push("return ");
                    status = Status.READY;
                    break;
                default:
                    // --- 函数、变量 ---
                    // --- 如果不是函数，才是变量 ---
                    if (trs[i + 1] && ((trs[i + 1].token.text === "(") || (trs[i + 1].token.text === "（"))) {
                        // --- 函数 ---
                        if (this._funList[tr.token.lower]) {
                            out.push(tr.token.lower);
                            if (funs.indexOf(tr.token.lower) === -1) {
                                funs.push(tr.token.lower);
                            }
                        } else {
                            // --- 函数不存在 ---
                            this._error(1, tr);
                            return false;
                        }
                    } else {
                        // --- 变量 ---
                        if (/^[\u4e00-\u9fbf\uac00-\ud7ff\u3040-\u309F\u30A0-\u30FF_a-z0-9$]+$/.test(tr.token.lower)) {
                            if (vars[tr.token.lower] === undefined) {
                                vars[tr.token.lower] = "v" + ++varsCount;
                            }
                            if ((trs[i - 1] && trs[i - 1].token.text === "+") || (trs[i + 1] && trs[i + 1].token.text === "+")) {
                                out.push("parseFloat(" + vars[tr.token.lower] + ")");
                            } else if ((trs[i - 1] && trs[i - 1].token.text === "&") || (trs[i + 1] && trs[i + 1].token.text === "&")) {
                                out.push(vars[tr.token.lower] + ".toString()");
                            } else {
                                out.push(vars[tr.token.lower]);
                            }
                        } else {
                            // --- 变量名异常/无法识别 ---
                            this._error(2, tr);
                            return false;
                        }
                    }
                    break;
                }
                break;
            }
        }

        // --- 进行变量注入 ---
        for (let k in vars) {
            out.splice(0, 0, "var " + vars[k] + ";");
        }
        // --- 进行函数注入 ---
        for (let funcName of funs) {
            let func = this._funList[funcName];
            out.splice(0, 0, `var ${funcName}=${func.toString()};`);
        }
        // --- 导出 ---
        if (opt.outType === "string") {
            return out.join("");
        } else {
            try {
                return new Function(out.join(""));
            } catch (e) {
                this._error(3, e);
                return false;
            }
        }
    }

    /**
     * --- Compile to string
     * @param code cb code
     */
    public compileToString(code: string): string {
        return this.compile(code, {
            outType: "string"
        }) || "";
    }

    /**
     * --- show error alert ---
     * @param code error code
     * @param tr tr object
     */
    private _error(code: number, tr: Abstracts.TokenRefer) {
        if (tr.token) {
            throw new Error(`${this._lang.error}:\n${this._lang.code}: ${code}\n${this._lang.message}: ${this._lang.codeMessage[code]}\n${this._lang.word}：${tr.token.text}\n${this._lang.row}: ${tr.row}\n${this._lang.col}: ${tr.col}`);
        } else {
            throw new Error(`${this._lang.error}:\n${this._lang.code}: ${code}\n${this._lang.message}: ${this._lang.codeMessage[code]}\n` + tr);
        }
    }

}

function create(): Abstracts.ComputeBasic {
    return new ComputeBasic();
}

export default create;