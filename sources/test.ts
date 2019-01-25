/*
 * ComputeBasic
 * Author: Han Guoshuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import ComputeBasic from "./index";

$(document).ready(() => {
    $(`#code`).val(
`av = v("a")
bv = v("b")

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

return result`);

    let $code = $("#code");
    let $result = $("#result");
    let $uiResult = $("#uiResult");
    let cb = ComputeBasic();

    $("#compilerBtn").on("click", () => {
        try {
            let res = cb.compileToString(<string>$code.val());
            $result.text(res);
        } catch (e) {
            alert("Error:\n" + e);
        }
    });
    $("#crunBtn").on("click", () => {
        try {
            let fun = cb.compile(<string>$code.val());
            if (fun !== false) {
                let result = fun();
                $uiResult.html(result);
            }
        } catch (e) {
            alert(e);
        }
    });
});