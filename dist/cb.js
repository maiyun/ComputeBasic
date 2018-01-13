"use strict";
var ComputeBasicWordType;
(function (ComputeBasicWordType) {
    ComputeBasicWordType[ComputeBasicWordType["NORMAL"] = 0] = "NORMAL";
    ComputeBasicWordType[ComputeBasicWordType["STRING"] = 1] = "STRING";
    ComputeBasicWordType[ComputeBasicWordType["COMMENT"] = 2] = "COMMENT";
    ComputeBasicWordType[ComputeBasicWordType["LF"] = 3] = "LF";
})(ComputeBasicWordType || (ComputeBasicWordType = {}));
var ComputeBasic = (function () {
    function ComputeBasic() {
        this.lang = "en-us";
        this._funcs = {
            "ceil": function (n) {
                return Math.ceil(n);
            }
        };
        this._langMsg = {
            "en-us": {
                "error": "CB Error",
                "code": "Code",
                "message": "Message",
                "row": "Line",
                "col": "Column",
                "word": "Word",
                "codeMessage": {
                    0: "Functions and variables can not begin with a number",
                    1: "Function does not exist",
                    2: "Unrecognized statement",
                    3: "Runtime error"
                }
            },
            "zh-cn": {
                "error": "CB 执行错误",
                "code": "错误码",
                "message": "错误信息",
                "row": "行",
                "col": "列",
                "word": "词",
                "codeMessage": {
                    0: "函数和变量不能以数字开头",
                    1: "函数不存在",
                    2: "无法识别的语句",
                    3: "运行时错误"
                }
            }
        };
    }
    ComputeBasic.prototype.expose = function (funcName, fun) {
        this._funcs[funcName] = fun;
    };
    ComputeBasic.prototype._tokenizer = function (code) {
        code = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        var arr = code.match(/([\s\S]{1})/g);
        if (arr !== null) {
            var tok = [];
            var connect = false;
            var connstr = [];
            var onString = false;
            var onComment = false;
            var row = 1;
            var col = 1;
            for (var i = 0; i < arr.length; ++i) {
                var it = arr[i];
                if (onComment) {
                    if (it === "\n") {
                        onComment = false;
                        var word = connstr.join("");
                        tok.push({
                            word: word,
                            lower: word.toLowerCase(),
                            type: ComputeBasicWordType.COMMENT,
                            row: row,
                            col: col
                        });
                        ++row;
                        col = 1;
                    }
                    else if (it === "\\") {
                        connstr.push("\\\\");
                    }
                    else {
                        connstr.push(it);
                    }
                }
                else {
                    if (onString) {
                        if (it === "\"") {
                            if (!arr[i - 1] || arr[i - 1] !== "\"") {
                                if (arr[i + 1] && arr[i + 1] === "\"") {
                                    connstr.push("\\" + it);
                                }
                                else {
                                    onString = false;
                                    var cs = connstr.join("");
                                    tok.push({
                                        word: cs,
                                        lower: cs.toLowerCase(),
                                        type: ComputeBasicWordType.STRING,
                                        row: row,
                                        col: col
                                    });
                                    col += cs.length;
                                }
                            }
                        }
                        else if (it === "\\") {
                            connstr.push("\\\\");
                        }
                        else {
                            connstr.push(it);
                        }
                    }
                    else {
                        if (/^[\u4e00-\u9fbf_a-zA-Z0-9]$/.test(it)) {
                            if (connect) {
                                connstr.push(it);
                            }
                            else {
                                connect = true;
                                connstr = [it];
                            }
                        }
                        else {
                            var goOn = true;
                            if (connect) {
                                if (it === "." && /^[0-9]+$/.test(connstr.join(""))) {
                                    connstr.push(it);
                                    goOn = false;
                                }
                                else {
                                    connect = false;
                                    var cs = connstr.join("");
                                    tok.push({
                                        word: cs,
                                        lower: cs.toLowerCase(),
                                        type: ComputeBasicWordType.NORMAL,
                                        row: row,
                                        col: col
                                    });
                                    col += cs.length;
                                }
                            }
                            if (goOn) {
                                if (it !== " " && it !== "\t") {
                                    if (it === "\"") {
                                        onString = true;
                                        connstr = [];
                                    }
                                    else if (it === "'") {
                                        onComment = true;
                                        connstr = [];
                                    }
                                    else if (it === "\n") {
                                        tok.push({
                                            word: it,
                                            lower: it.toLowerCase(),
                                            type: ComputeBasicWordType.LF,
                                            row: row,
                                            col: col
                                        });
                                        ++row;
                                        col = 1;
                                    }
                                    else {
                                        tok.push({
                                            word: it,
                                            lower: it.toLowerCase(),
                                            type: ComputeBasicWordType.NORMAL,
                                            row: row,
                                            col: col
                                        });
                                        ++col;
                                    }
                                }
                                else {
                                    ++col;
                                }
                            }
                        }
                    }
                }
            }
            if (connect) {
                var word = connstr.join("");
                tok.push({
                    word: word,
                    lower: word.toLowerCase(),
                    type: ComputeBasicWordType.NORMAL,
                    row: row,
                    col: col
                });
            }
            return tok;
        }
        else {
            return [];
        }
    };
    ComputeBasic.prototype._error = function (code, cbw) {
        if (cbw.word) {
            alert(this._langMsg[this.lang]["error"] + ":\n" + this._langMsg[this.lang]["code"] + ": " + code + "\n" + this._langMsg[this.lang]["message"] + ": " + this._langMsg[this.lang]["codeMessage"][code] + "\n" + this._langMsg[this.lang]["word"] + "\uFF1A" + cbw.word + "\n" + this._langMsg[this.lang]["row"] + ": " + cbw.row + "\n" + this._langMsg[this.lang]["col"] + ": " + cbw.col);
        }
        else {
            alert(this._langMsg[this.lang]["error"] + ":\n" + this._langMsg[this.lang]["code"] + ": " + code + "\n" + this._langMsg[this.lang]["message"] + ": " + this._langMsg[this.lang]["codeMessage"][code] + "\n" + cbw);
        }
    };
    ComputeBasic.prototype.compiler = function (code, opt) {
        var tok = this._tokenizer(code);
        var out = [];
        var els = [];
        var vars = [];
        var onIf = false;
        var onEnd = false;
        var onElse = false;
        var onElement = false;
        for (var i = 0; i < tok.length; ++i) {
            var cbw = tok[i];
            if (cbw.type === ComputeBasicWordType.STRING) {
                out.push("\"" + cbw.word + "\"");
            }
            else if (cbw.type === ComputeBasicWordType.LF) {
                var pre = tok[i - 1];
                if (!pre || (pre.lower !== "then" && pre.lower !== "if" && pre.lower !== "else" && pre.lower !== "elseif" && pre.lower !== "\n")) {
                    out.push(";");
                }
            }
            else if (cbw.type === ComputeBasicWordType.NORMAL) {
                var w = cbw.word;
                var wl = w.toLowerCase();
                switch (wl) {
                    case "if":
                        if (onEnd) {
                            out.push("}");
                            onEnd = false;
                        }
                        else {
                            out.push("if(");
                            onIf = true;
                            if (onElse) {
                                onElse = false;
                            }
                        }
                        break;
                    case "then":
                        out.push("){");
                        onIf = false;
                        break;
                    case "else":
                        if (tok[i + 1] && tok[i + 1].lower === "if") {
                            out.push("}else ");
                            onElse = true;
                        }
                        else {
                            out.push("}else{");
                        }
                        break;
                    case "elseif":
                        out.push("}else if(");
                        onIf = true;
                        break;
                    case "end":
                        onEnd = true;
                        break;
                    case "=":
                        if (onIf) {
                            if (tok[i - 1] && (tok[i - 1].word === ">" || tok[i - 1].word === "<")) {
                                out.push("=");
                            }
                            else {
                                out.push("==");
                            }
                        }
                        else {
                            out.push("=");
                        }
                        break;
                    case ">":
                    case "<":
                    case "(":
                    case ")":
                    case "+":
                    case "-":
                    case "*":
                    case "/":
                        out.push(wl);
                        break;
                    case "&":
                        out.push("+");
                        break;
                    case "return":
                        out.push(wl + " ");
                        break;
                    case "and":
                        out.push("&&");
                        break;
                    case "or":
                        out.push("||");
                        break;
                    case /[0-9]+?/.test(wl) && wl:
                        out.push(w);
                        break;
                    case "[":
                        onElement = true;
                        break;
                    case "]":
                        if (onElement) {
                            onElement = false;
                        }
                        break;
                    default:
                        if (onElement) {
                            if (els.indexOf(w) === -1) {
                                els.push(w);
                            }
                            out.push("el_" + w + ".value");
                        }
                        else {
                            if (tok[i + 1] && tok[i + 1].word === "(") {
                                if (this._funcs[wl]) {
                                    out.push(wl);
                                }
                                else {
                                    this._error(1, cbw);
                                    return false;
                                }
                            }
                            else {
                                if (/^[\u4e00-\u9fbf_a-z0-9]+$/.test(wl)) {
                                    if (/^[0-9]$/.test(wl.slice(0, 1))) {
                                        this._error(0, cbw);
                                        return false;
                                    }
                                    else {
                                        if (vars.indexOf("var_" + wl) === -1) {
                                            vars.push("var_" + wl);
                                        }
                                        out.push("var_" + wl);
                                    }
                                }
                                else {
                                    this._error(2, cbw);
                                    return false;
                                }
                            }
                        }
                }
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
        for (var funcName in this._funcs) {
            var func = this._funcs[funcName];
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
    ComputeBasic.verison = "0.0.1";
    return ComputeBasic;
}());
