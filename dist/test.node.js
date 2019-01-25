"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
var cb = index_1.default();
var code = "\nav = -7\nbv = -18\n\nif av > 0 then\n    result = av * bv\nelseif av < 0 then\n    if bv > 0 then\n        result = av / bv     'This is comment\n    else\n        result = av * rand(5, 15)\n    End If\nelse if av = 0 Then\n    ' --- a = 0 ---\n    result = \"This is \"\"string\"\", haha.\"\nend if\n\nIf type(result) <> \"string\" Then\n    result = ceil(result)\nEnd If\n\nreturn result";
console.log("---------- CB Code ----------" + code);
var res = cb.compileToString(code);
console.log("---------- Compiler result ----------\n" + res);
var fun = new Function(res);
console.log("---------- Run result ----------");
try {
    var r = fun();
    console.log(r);
}
catch (e) {
    console.log(e);
}
