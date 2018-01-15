/*
 * ComputeBasic 0.0.1
 * Author: HanGuoShuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Abstracts = require("./Abstract");
var Tokenizer_1 = require("./Tokenizer");
var Language_1 = require("./Language");
var Status;
(function (Status) {
    Status[Status["READY"] = 0] = "READY";
    Status[Status["ASSIGN_SYMBOL"] = 1] = "ASSIGN_SYMBOL";
    Status[Status["ASSIGN_IDENTITY"] = 2] = "ASSIGN_IDENTITY";
    Status[Status["IF"] = 3] = "IF";
})(Status || (Status = {}));
var ComputeBasic = (function () {
    function ComputeBasic() {
        this._funList = {
            "abs": function (n) { return Math.abs(n); },
            "ceil": function (n) { return Math.ceil(n); },
            "floor": function (n) { return Math.floor(n); },
            "round": function (n) { return Math.round(n); },
            "int": function (s) { return parseInt(s); },
            "float": function (s) { return parseFloat(s); },
            "string": function (n) { return n.toString(); }
        };
        this._tokenizer = Tokenizer_1.default();
        this._lang = Language_1.default.enUs;
    }
    ComputeBasic.prototype.expose = function (funName, fun) {
        this._funList[funName] = fun;
    };
    ComputeBasic.prototype.setLanguage = function (lang) {
        switch (lang) {
            case "zh-cn":
                this._lang = Language_1.default.zhCn;
                break;
            default:
                this._lang = Language_1.default.enUs;
                break;
        }
    };
    ComputeBasic.prototype.compiler = function (code, opt) {
        var trs = this._tokenizer.tokenize(code);
        var out = [];
        var els = [];
        var vars = [];
        var funs = [];
        var status = Status.READY;
        for (var i = 0; i < trs.length; ++i) {
            var tr = trs[i];
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
            }
            else if (status === Status.ASSIGN_SYMBOL) {
                if (tr.token.type === Abstracts.TOKEN_TYPES.SYMBOL) {
                    status = Status.ASSIGN_IDENTITY;
                }
                else {
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
                            }
                            else {
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
                            }
                            else {
                                out.push("if(");
                                status = Status.IF;
                            }
                            break;
                        case "then":
                            if (status === Status.IF) {
                                out.push("){");
                                status = Status.READY;
                            }
                            else {
                                this._error(4, tr);
                                return false;
                            }
                            break;
                        case "else":
                            if (trs[i + 1] && trs[i + 1].token.lower === "if") {
                                out.push("}else ");
                            }
                            else {
                                out.push("}else{");
                            }
                            break;
                        case "elseif":
                            out.push("}else if(");
                            status = Status.IF;
                            break;
                        case "end":
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
                            if (trs[i + 1] && trs[i + 1].token.text === "(") {
                                if (this._funList[tr.token.lower]) {
                                    out.push(tr.token.lower);
                                    if (funs.indexOf(tr.token.lower) === -1) {
                                        funs.push(tr.token.lower);
                                    }
                                }
                                else {
                                    this._error(1, tr);
                                    return false;
                                }
                            }
                            else {
                                if (/^[\u4e00-\u9fbf_a-z0-9]+$/.test(tr.token.lower)) {
                                    if (vars.indexOf("var_" + tr.token.lower) === -1) {
                                        vars.push("var_" + tr.token.lower);
                                    }
                                    if ((trs[i - 1] && trs[i - 1].token.text === "+") || (trs[i + 1] && trs[i + 1].token.text === "+")) {
                                        out.push("parseFloat(var_" + tr.token.lower + ")");
                                    }
                                    else {
                                        out.push("var_" + tr.token.lower);
                                    }
                                }
                                else {
                                    this._error(2, tr);
                                    return false;
                                }
                            }
                            break;
                    }
                    break;
                case Abstracts.TOKEN_TYPES.ELEMENT:
                    var name_1 = tr.token.text.slice(1, -1);
                    if (els.indexOf(name_1) === -1) {
                        els.push(name_1);
                    }
                    if ((trs[i - 1] && trs[i - 1].token.text === "+") || (trs[i + 1] && trs[i + 1].token.text === "+")) {
                        out.push("parseFloat(el_" + name_1 + ".value)");
                    }
                    else {
                        out.push("el_" + name_1 + ".value");
                    }
                    break;
            }
        }
        if (vars.length > 0) {
            out.splice(0, 0, "var " + vars.join(",") + ";");
        }
        if (els.length > 0) {
            for (var _i = 0, els_1 = els; _i < els_1.length; _i++) {
                var it = els_1[_i];
                out.splice(0, 0, "var el_" + it + "=document.querySelector(\"[name='" + it + "']\");");
            }
        }
        for (var _a = 0, funs_1 = funs; _a < funs_1.length; _a++) {
            var funcName = funs_1[_a];
            var func = this._funList[funcName];
            out.splice(0, 0, "var " + funcName + "=" + func.toString() + ";");
        }
        if (opt && opt.string === true) {
            return out.join("");
        }
        else {
            try {
                return new Function(out.join(""));
            }
            catch (e) {
                this._error(3, e);
                return false;
            }
        }
    };
    ComputeBasic.prototype._error = function (code, tr) {
        if (tr.token) {
            alert(this._lang.error + ":\n" + this._lang.code + ": " + code + "\n" + this._lang.message + ": " + this._lang.codeMessage[code] + "\n" + this._lang.word + "\uFF1A" + tr.token.text + "\n" + this._lang.row + ": " + tr.row + "\n" + this._lang.col + ": " + tr.col);
        }
        else {
            alert(this._lang.error + ":\n" + this._lang.code + ": " + code + "\n" + this._lang.message + ": " + this._lang.codeMessage[code] + "\n" + tr);
        }
    };
    return ComputeBasic;
}());
function create() {
    return new ComputeBasic();
}
exports.create = create;
exports.default = create;
