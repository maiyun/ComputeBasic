"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var cb = index_1.default();
var code = [
    "a = 8",
    "b = 9",
    "if a > 0 then",
    "    result = a * b",
    "ElSeIf a < 0 then",
    "    if b > 0 then",
    "        result = a / b     'This is comment",
    "    else",
    "        result = a * 31.32",
    "    End If",
    "else if a = 0 Then",
    "    ' --- a = 0 ---",
    "    result = \"This is \"\"string\"\", haha.\"",
    "end if",
    "",
    "return ceil(result)"
].join("\n");
console.log("---------- CB Code ----------\n" + code);
var res = cb.compiler(code, {
    string: true
});
console.log("---------- Compiler result ----------\n" + res);
var fun = new Function(res);
console.log("---------- Run result ----------");
try {
    var r = fun();
    console.log(r);
}
catch (e) {
    console.log("Error: " + e);
}
