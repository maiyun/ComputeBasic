/*
 * ComputeBasic
 * Author: Han Guoshuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import CB from "./index";

let cb = CB();

let code: string = `
av = -7
bv = -18

if av > 0 then
    result = av * bv
elseif av < 0 then
    if bv > 0 then
        result = av / bv     'This is comment
    else
        result = av * rand(5, 15)
    End If
else if av = 0 Then
    ' --- a = 0 ---
    result = "This is ""string"", haha."
end if

If type(result) <> "string" Then
    result = ceil(result)
End If

return result`;

console.log("---------- CB Code ----------" + code);

let res = cb.compileToString(code);

console.log("---------- Compiler result ----------\n" + res);

let fun = new Function(res);

console.log("---------- Run result ----------");

try {
    let r = fun();
    console.log(r);
} catch (e) {
    console.log(e);
}