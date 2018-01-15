/*
 * ComputeBasic 0.0.1
 * Author: HanGuoShuai
 * Github: https://github.com/MaiyunNET/ComputeBasic
 */

import * as ComputeBasic from "./index";

$(document).ready(() => {
    $("#code").val([
        "if [a] > 0 then",
        "    result = [a] * [b]",
        "ElSeIf [a] < 0 then",
        "    if [b] > 0 then",
        "        result = [a] / [b]     'This is comment",
        "    else",
        "        result = [a] * 31.32",
        "    End If",
        "else if a = 0 Then",
        "    ' --- a = 0 ---",
        `    result = "This is ""string"", haha."`,
        "end if",
        "",
        "return ceil(result)"
    ].join("\n"));

    let $code = $("#code");
    let $result = $("#result");
    let $uiResult = $("#uiResult");
    let cb = ComputeBasic.create();

    let fun: any = false;
    $("#compilerBtn").on("click", () => {
        let res = <string>cb.compiler(<string>$code.val(), {
            string: true
        });
        $result.text(res);
    });
    $("#runBtn").on("click", () => {
        if (fun !== false) {
            let r = fun();
            $uiResult.html(r);
        } else {
            alert("Please click \"Compile and run\" first.");
        }
    });
    $("#crunBtn").on("click", () => {
        fun = <string>cb.compiler(<string>$code.val());
        if (fun !== false) {
            let r = fun();
            $uiResult.html(r);
        }
    });
});