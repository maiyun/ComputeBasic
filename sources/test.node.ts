/*
 * ComputeBasic
 * Author: Han Guoshuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import ComputeBasicCreate from "./index";

let cb = ComputeBasicCreate();

let code: string = [
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
    `    result = "This is ""string"", haha."`,
    "end if",
    "",
    "return ceil(result)"
].join("\n");

console.log("---------- CB Code ----------\n" + code);

let res = cb.compileToString(code);

console.log("---------- Compiler result ----------\n" + res);

let fun = new Function(res);

console.log("---------- Run result ----------");

try {
    let r = fun();
    console.log(r);
} catch (e) {
    console.log("Error: " + e);
}