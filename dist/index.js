"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Abstracts = require("./Abstract");
var Tokenizer_1 = require("./Tokenizer");
var Language_1 = require("./Language");
var Status;
(function (Status) {
    Status[Status["READY"] = 0] = "READY";
    Status[Status["IF"] = 1] = "IF";
    Status[Status["WAIT_OPER"] = 2] = "WAIT_OPER";
    Status[Status["IN_FUNC"] = 3] = "IN_FUNC";
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
            "string": function (n) { return n.toString(); },
            "rand": function (x, n) { return n + Math.round(Math.random() * (x - n)); },
            "type": function (x) { return typeof (x); },
            "v": function (d) { return document.getElementsByName(d)[0].value; },
            "$": function (d) { return document.getElementsByName(d)[0]; }
        };
        this._tokenizer = Tokenizer_1.default();
        this._lang = Language_1.default.en;
    }
    ComputeBasic.prototype.expose = function (funName, fun) {
        this._funList[funName] = fun;
    };
    ComputeBasic.prototype.setLanguage = function (lang) {
        switch (lang) {
            case "zh-CN":
                this._lang = Language_1.default.zhCN;
                break;
            default:
                this._lang = Language_1.default.en;
                break;
        }
    };
    ComputeBasic.prototype.compile = function (code, opt) {
        if (opt === void 0) { opt = {}; }
        opt.outType = opt.outType || "function";
        var trs = this._tokenizer.tokenize(code);
        var out = [];
        var vars = {};
        var varsCount = -1;
        var funs = [];
        var status = Status.READY;
        var inFuncCount = 0;
        for (var i = 0; i < trs.length; ++i) {
            var tr = trs[i];
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
                        status = Status.WAIT_OPER;
                        break;
                }
            }
            else if (status === Status.WAIT_OPER) {
                switch (tr.token.type) {
                    case Abstracts.TOKEN_TYPES.STRING:
                    case Abstracts.TOKEN_TYPES.FULL_STRING:
                    case Abstracts.TOKEN_TYPES.DEC_NUMBER:
                    case Abstracts.TOKEN_TYPES.HEX_NUMBER:
                    case Abstracts.TOKEN_TYPES.OCT_NUMBER:
                    case Abstracts.TOKEN_TYPES.REAL_NUMBER:
                    case Abstracts.TOKEN_TYPES.REGEXP:
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
                        }
                        else {
                            status = Status.READY;
                        }
                }
            }
            else if (status === Status.IN_FUNC) {
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
            switch (tr.token.type) {
                case Abstracts.TOKEN_TYPES.SYMBOL:
                    switch (tr.token.text) {
                        case "=":
                            if (status === Status.IF) {
                                out.push("==");
                            }
                            else {
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
                    out.push(tr.token.text.replace(/""/g, "\\\""));
                    break;
                case Abstracts.TOKEN_TYPES.FULL_STRING:
                    out.push("\"" + tr.token.text.replace(/"/g, "\\\"").replace(/””/g, "\\\"").slice(1, -1) + "\"");
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
                            }
                            else {
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
                            }
                            else {
                                this._error(4, tr);
                                return false;
                            }
                            break;
                        case "else":
                        case "其他情况":
                        case "其他情況":
                            if (trs[i + 1] && trs[i + 1].token.lower === "if") {
                                out.push("}else ");
                            }
                            else {
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
                            if (trs[i + 1] && ((trs[i + 1].token.text === "(") || (trs[i + 1].token.text === "（"))) {
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
                                if (/^[\u4e00-\u9fbf\uac00-\ud7ff\u3040-\u309F\u30A0-\u30FF_a-z0-9$]+$/.test(tr.token.lower)) {
                                    if (vars[tr.token.lower] === undefined) {
                                        vars[tr.token.lower] = "v" + ++varsCount;
                                    }
                                    if ((trs[i - 1] && trs[i - 1].token.text === "+") || (trs[i + 1] && trs[i + 1].token.text === "+")) {
                                        out.push("parseFloat(" + vars[tr.token.lower] + ")");
                                    }
                                    else if ((trs[i - 1] && trs[i - 1].token.text === "&") || (trs[i + 1] && trs[i + 1].token.text === "&")) {
                                        out.push(vars[tr.token.lower] + ".toString()");
                                    }
                                    else {
                                        out.push(vars[tr.token.lower]);
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
            }
        }
        for (var k in vars) {
            out.splice(0, 0, "var " + vars[k] + ";");
        }
        for (var _i = 0, funs_1 = funs; _i < funs_1.length; _i++) {
            var funcName = funs_1[_i];
            var func = this._funList[funcName];
            out.splice(0, 0, "var " + funcName + "=" + func.toString() + ";");
        }
        if (opt.outType === "string") {
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
    ComputeBasic.prototype.compileToString = function (code) {
        return this.compile(code, {
            outType: "string"
        }) || "";
    };
    ComputeBasic.prototype._error = function (code, tr) {
        if (tr.token) {
            throw new Error(this._lang.error + ":\n" + this._lang.code + ": " + code + "\n" + this._lang.message + ": " + this._lang.codeMessage[code] + "\n" + this._lang.word + "\uFF1A" + tr.token.text + "\n" + this._lang.row + ": " + tr.row + "\n" + this._lang.col + ": " + tr.col);
        }
        else {
            throw new Error(this._lang.error + ":\n" + this._lang.code + ": " + code + "\n" + this._lang.message + ": " + this._lang.codeMessage[code] + "\n" + tr);
        }
    };
    return ComputeBasic;
}());
function create() {
    return new ComputeBasic();
}
exports.default = create;
