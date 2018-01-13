// --- 每个 word 的相关信息 ---
interface ComputeBasicWord {
    word: string;
    lower: string;
    type: number;
    row: number;
    col: number;
}

// --- Word Type ---
enum ComputeBasicWordType {
    NORMAL = 0,
    STRING = 1,
    COMMENT = 2,
    LF = 3
}

// --- 编译选项 ---
interface ComputeBasicOption {
    string: boolean;
}

class ComputeBasic {

    // --- 版本 ---
    public static verison: string = "0.0.1";

    // --- 多语言 ---
    public lang: string = "en-us";

    // --- 注入的函数列表 ---
    private _funcs: any = {
        "ceil": (n: number) => {
            return Math.ceil(n);
        }
    };
    // --- 注入函数 ---
    public expose(funcName: string, fun: () => {}) {
        this._funcs[funcName] = fun;
    }

    // --- 对一坨字符串进行简单分词 ---
    private _tokenizer(code: string): ComputeBasicWord[] {
        code = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        let arr: RegExpMatchArray | null = code.match(/([\s\S]{1})/g);
        if (arr !== null) {
            let tok: ComputeBasicWord[] = [];
            let connect: boolean = false;       // 词正在连接
            let connstr: string[] = [];         // 拼接中的词
            let onString: boolean = false;      // 是否在字符串里
            let onComment: boolean = false;     // 是否在注解里
            let row: number = 1;
            let col: number = 1;
            for (let i = 0; i < arr.length; ++i) {
                let it = arr[i];
                if (onComment) {
                    if (it === "\n") {
                        // --- 只有换行才能跳出注解 ---
                        onComment = false;
                        let word = connstr.join("");
                        tok.push({
                            word: word,
                            lower: word.toLowerCase(),
                            type: ComputeBasicWordType.COMMENT,
                            row: row,
                            col: col
                        });
                        ++row;
                        col = 1;
                    } else if (it === "\\") {
                        connstr.push("\\\\");
                    } else {
                        connstr.push(it);
                    }
                } else {
                    // --- 没在注解里就可能在 string 里 ---
                    if (onString) {
                        if (it === "\"") {
                            // --- aaa""aaa ---
                            if (!arr[i - 1] || arr[i - 1] !== "\"") {
                                // --- 看看是结束 string 还是留着过年 ---
                                if (arr[i + 1] && arr[i + 1] === "\"") {
                                    // --- 留着过年 ---
                                    connstr.push("\\" + it);
                                } else {
                                    // --- 结束 ---
                                    onString = false;
                                    let cs: string = connstr.join("");
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
                        } else if (it === "\\") {
                            connstr.push("\\\\");
                        } else {
                            connstr.push(it);
                        }
                    } else {
                        // --- 分词正文 ---
                        if (/^[\u4e00-\u9fbf_a-zA-Z0-9]$/.test(it)) {
                            // --- 普通连接性词 ---
                            if (connect) {
                                connstr.push(it);
                            } else {
                                connect = true;
                                connstr = [it];
                            }
                        } else {
                            // --- 特殊字符单独排列 ---
                            let goOn: boolean = true;
                            if (connect) {
                                // --- 判断是不是数字的小数点 ---
                                if (it === "." && /^[0-9]+$/.test(connstr.join(""))) {
                                    // --- 是数字，继续往上堆 ---
                                    connstr.push(it);
                                    goOn = false; // 不用处理特殊字符那块逻辑
                                } else {
                                    // --- 不是数字，不再连接 ---
                                    connect = false;
                                    let cs: string = connstr.join("");
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
                            // --- 连接部分处理完，要把特殊字符再处理一下 ---
                            if (goOn) {
                                if (it !== " " && it !== "\t") {
                                    if (it === "\"") {
                                        onString = true;
                                        connstr = [];
                                    } else if (it === "'") {
                                        onComment = true;
                                        connstr = [];
                                    } else if (it === "\n") {
                                        tok.push({
                                            word: it,
                                            lower: it.toLowerCase(),
                                            type: ComputeBasicWordType.LF,
                                            row: row,
                                            col: col
                                        });
                                        ++row;
                                        col = 1;
                                    } else {
                                        // --- 其他字符 ---
                                        tok.push({
                                            word: it,
                                            lower: it.toLowerCase(),
                                            type: ComputeBasicWordType.NORMAL,
                                            row: row,
                                            col: col
                                        });
                                        ++col;
                                    }
                                } else {
                                    ++col;
                                }
                            }
                        }
                    }
                }
            }
            // --- 看看是否还有正在分词的，有的话直接提交 ---
            if (connect) {
                let word = connstr.join("");
                tok.push({
                    word: word,
                    lower: word.toLowerCase(),
                    type: ComputeBasicWordType.NORMAL,
                    row: row,
                    col: col
                });
            }
            return tok;
        } else {
            return [];
        }
    }

    // --- 报错 ---
    private _langMsg: any = {
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
    private _error(code: number, cbw: ComputeBasicWord) {
        if (cbw.word) {
            alert(`${this._langMsg[this.lang]["error"]}:\n${this._langMsg[this.lang]["code"]}: ${code}\n${this._langMsg[this.lang]["message"]}: ${this._langMsg[this.lang]["codeMessage"][code]}\n${this._langMsg[this.lang]["word"]}：${cbw.word}\n${this._langMsg[this.lang]["row"]}: ${cbw.row}\n${this._langMsg[this.lang]["col"]}: ${cbw.col}`);
        } else {
            alert(`${this._langMsg[this.lang]["error"]}:\n${this._langMsg[this.lang]["code"]}: ${code}\n${this._langMsg[this.lang]["message"]}: ${this._langMsg[this.lang]["codeMessage"][code]}\n` + cbw);
        }
    }

    // --- 将 CB 代码编译为一个函数对象 ---
    public compiler(code: string, opt?: ComputeBasicOption): boolean | Function | string {
        // --- 先分词 ---
        let tok: ComputeBasicWord[] = this._tokenizer(code);
        // --- 编译好的代码 ---
        let out: string[] = [];
        // --- 编译暂存 ---
        let els: string[] = [];             // DOM列表
        let vars: string[] = [];            // 变量列表
        // --- 编译 flag ---
        let onIf: boolean = false;          // 在 if 表达式里
        let onEnd: boolean = false;         // 发现 end
        let onElse: boolean = false;        // 发现 else
        let onElement: boolean = false;     // 开始 []
        for (let i: number = 0; i < tok.length; ++i) {
            let cbw = tok[i];
            // --- 判断词性 ---
            if (cbw.type === ComputeBasicWordType.STRING) {
                // --- 字符串直接拼接 ---
                out.push(`"${cbw.word}"`);
            } else if (cbw.type === ComputeBasicWordType.LF) {
                // --- 换行，结束语句 ---
                let pre = tok[i - 1];
                if (!pre || (pre.lower !== "then" && pre.lower !== "if" && pre.lower !== "else" && pre.lower !== "elseif" && pre.lower !== "\n")) {
                    out.push(`;`);
                }
            } else if (cbw.type === ComputeBasicWordType.NORMAL) {
                // --- 获取词 ---
                let w = cbw.word;
                // --- 获取小写 ---
                let wl = w.toLowerCase();
                switch (wl) {
                    case "if":
                        if (onEnd) {
                            out.push("}");
                            onEnd = false;
                        } else {
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
                        } else {
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
                            } else {
                                out.push("==");
                            }
                        } else {
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
                        // --- 纯数字 ---
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
                            // --- 在 [] 里 ---
                            if (els.indexOf(w) === -1) {
                                els.push(w);
                            }
                            out.push("el_" + w + ".value");
                        } else {
                            // --- 变量、函数执行 ---
                            // --- 如果不是函数，才是变量 ---
                            if (tok[i + 1] && tok[i + 1].word === "(") {
                                // --- 函数 ---
                                if (this._funcs[wl]) {
                                    out.push(wl);
                                } else {
                                    // --- 函数不存在 ---
                                    this._error(1, cbw);
                                    return false;
                                }
                            } else {
                                // --- 变量 ---
                                if (/^[\u4e00-\u9fbf_a-z0-9]+$/.test(wl)) {
                                    if (/^[0-9]$/.test(wl.slice(0, 1))) {
                                        this._error(0, cbw);
                                        return false;
                                    } else {
                                        if (vars.indexOf("var_" + wl) === -1) {
                                            vars.push("var_" + wl);
                                        }
                                        out.push("var_" + wl);
                                    }
                                } else {
                                    // --- 变量名异常/无法识别 ---
                                    this._error(2, cbw);
                                    return false;
                                }
                            }
                        }
                }
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
        for (let funcName in this._funcs) {
            let func = this._funcs[funcName];
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

}