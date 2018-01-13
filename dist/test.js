"use strict";
$(document).ready(function () {
    $("#code").val([
        "if [a] > 0 then",
        "    result = [a] * [b]",
        "ElSeIf [a] < 0 then",
        "   if [b] > 0 then",
        "       result = [a] / [b]  'This is comment",
        "   else",
        "       result = [a] * 31.32",
        "   End If",
        "else if a = 0 Then",
        "   ' --- a = 0 ---",
        "   result = \"This is \"\"string\"\", haha.\"",
        "end if",
        "",
        "return ceil(result)"
    ].join("\n"));
    var cb = new ComputeBasic();
    var $code = $("#code");
    var $result = $("#result");
    var $uiResult = $("#uiResult");
    var func = false;
    $("#compilerBtn").on("click", function () {
        var res = cb.compiler($code.val(), {
            string: true
        });
        $result.text(res);
    });
    $("#runBtn").on("click", function () {
        if (func !== false) {
            var r = func();
            $uiResult.html(r);
        }
        else {
            alert("Please click \"Compile and run\" first.");
        }
    });
    $("#crunBtn").on("click", function () {
        func = cb.compiler($code.val());
        if (func !== false) {
            var r = func();
            $uiResult.html(r);
        }
    });
});
