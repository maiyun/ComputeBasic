/*
 * ComputeBasic 0.0.1
 * Author: HanGuoShuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import * as Abstracts from "./Abstract";
import TokenizerCreate from "./Tokenizer";
import Language from "./Language";

enum Status {
    READY,
    ASSIGN_SYMBOL,
    ASSIGN_IDENTITY,
    IF
}

class ComputeBasic {

    private _lang: Abstracts.LanguageEntity;
    private _tokenizer: Abstracts.Tokenizer;
    private _funList: any = {
        "abs": (n: number) => {return Math.abs(n); },
        "ceil": (n: number) => {return Math.ceil(n); },
        "floor": (n: number) => {return Math.floor(n); },
        "round": (n: number) => {return Math.round(n); },
        "int": (s: string) => {return parseInt(s); },
        "float": (s: string) => {return parseFloat(s); },
        "string": (n: number) => {return n.toString(); }
    };

    public constructor() {
        this._tokenizer = TokenizerCreate();
        this._lang = Language.enUs;
    }

    public expose(funName: string, fun: (...args: any[]) => {}): void {
        this._funList[funName] = fun;
    }

    public setLanguage(lang: string): void {
        switch (lang) {
        case "zh-cn":
            this._lang = Language.zhCn;
            break;
        default:
            this._lang = Language.enUs;
            break;
        }
    }

    public compiler(code: string, opt?: Abstracts.CompileOption): boolean | Function | string {
        let trs: Abstracts.TokenRefer[] = this._tokenizer.tokenize(code);
        let out: string[] = [];             // --- 编译好的代码 ---
        let els: string[] = [];             // DOM 列表
        let vars: string[] = [];            // 变量列表
        let funs: string[] = [];            // 使用到的函数列表
        let status: Status = Status.READY;

        for (let i: number = 0; i < trs.length; ++i) {
            let tr = trs[i];

            if (status === Status.ASSIGN_IDENTITY) {
                switch (tr.token.type) {
                case Abstracts.TOKEN_TYPES.IDENTITY:
                case Abstracts.TOKEN_TYPES.STRING:
                case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                case Abstracts.TOKEN_TYPES.BIN_NUMBER:
                case Abstracts.TOKEN_TYPES.REGEXP:
                case Abstracts.TOKEN_TYPES.IDENTITY:
                case Abstracts.TOKEN_TYPES.ELEMENT:
                    status = Status.ASSIGN_SYMBOL;
                    break;
                default:
                    out.push(";");
                    status = Status.READY;
                    break;
                }
            } else if (status === Status.ASSIGN_SYMBOL) {
                if (tr.token.type === Abstracts.TOKEN_TYPES.SYMBOL) {
                    status = Status.ASSIGN_IDENTITY;
                } else {
                    out.push(";");
                    status = Status.READY;
                }
            }
            switch (tr.token.type) {
            case Abstracts.TOKEN_TYPES.SYMBOL:
                switch (tr.token.text) {
                case "=":
                    if (status === Status.IF) {
                        out.push("==");
                    } else {
                        // --- 赋值 ---
                        out.push("=");
                        status = Status.ASSIGN_IDENTITY;
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
                    out.push(tr.token.text);
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
                out.push(tr.token.text.replace(/""/g, "\\\""));
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
                    if (trs[i - 1] && trs[i - 1].token.lower === "end") {
                        out.push("}");
                    } else {
                        out.push("if(");
                        status = Status.IF;
                    }
                    break;
                case "then":
                    if (status === Status.IF) {
                        out.push("){");
                        status = Status.READY;
                    } else {
                        this._error(4, tr);
                        return false;
                    }
                    break;
                case "else":
                    if (trs[i + 1] && trs[i + 1].token.lower === "if") {
                        out.push("}else ");
                    } else {
                        out.push("}else{");
                    }
                    break;
                case "elseif":
                    out.push("}else if(");
                    status = Status.IF;
                    break;
                case "end":
                    // --- 无需额外处理 ---
                    break;
                case "endif":
                    out.push("}");
                    break;
                case "and":
                    out.push("&&");
                    break;
                case "or":
                    out.push("||");
                    break;
                case "return":
                    out.push("return ");
                    break;
                default:
                    // --- 函数、变量 ---
                    // --- 如果不是函数，才是变量 ---
                    if (trs[i + 1] && trs[i + 1].token.text === "(") {
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
                        if (/^[\u4e00-\u9fbf_a-z0-9]+$/.test(tr.token.lower)) {
                            if (vars.indexOf("var_" + tr.token.lower) === -1) {
                                vars.push("var_" + tr.token.lower);
                            }
                            if ((trs[i - 1] && trs[i - 1].token.text === "+") || (trs[i + 1] && trs[i + 1].token.text === "+")) {
                                out.push("parseFloat(var_" + tr.token.lower + ")");
                            } else {
                                out.push("var_" + tr.token.lower);
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
            case Abstracts.TOKEN_TYPES.ELEMENT:
                let name = tr.token.text.slice(1, -1);
                if (els.indexOf(name) === -1) {
                    els.push(name);
                }
                if ((trs[i - 1] && trs[i - 1].token.text === "+") || (trs[i + 1] && trs[i + 1].token.text === "+")) {
                    out.push("parseFloat(el_" + name + ".value)");
                } else {
                    out.push("el_" + name + ".value");
                }
                break;
            }
        }

        // --- 进行变量注入 ---
        if (vars.length > 0) {
            out.splice(0, 0, "var " + vars.join(",") + ";");
        }
        // --- 进行DOM注入 ---
        if (els.length > 0) {
            for (let it of els) {
                out.splice(0, 0, `var el_${it}=document.querySelector("[name='${it}']");`);
            }
        }
        // --- 进行函数注入 ---
        for (let funcName of funs) {
            let func = this._funList[funcName];
            out.splice(0, 0, `var ${funcName}=${func.toString()};`);
        }
        // --- 导出 ---
        if (opt && opt.string === true) {
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

    private _error(code: number, tr: Abstracts.TokenRefer) {
        if (tr.token) {
            alert(`${this._lang.error}:\n${this._lang.code}: ${code}\n${this._lang.message}: ${this._lang.codeMessage[code]}\n${this._lang.word}：${tr.token.text}\n${this._lang.row}: ${tr.row}\n${this._lang.col}: ${tr.col}`);
        } else {
            alert(`${this._lang.error}:\n${this._lang.code}: ${code}\n${this._lang.message}: ${this._lang.codeMessage[code]}\n` + tr);
        }
    }

}

export function create(): Abstracts.ComputeBasic {
    return new ComputeBasic();
}

export default create;