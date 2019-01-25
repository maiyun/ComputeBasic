"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var index_1 = require("./index");
$(document).ready(function () {
    $("#code").val("av = v(\"a\")\nbv = v(\"b\")\n\nif av > 0 then\n    result = av * bv\nelseif av < 0 then\n    if bv > 0 then\n        result = av / bv     'This is comment\n    else\n        result = av * rand(5, 15)\n    End If\nelse if av = 0 Then\n    ' --- a = 0 ---\n    result = \"This is \"\"string\"\", haha.\"\nend if\n\nIf type(result) <> \"string\" Then\n    result = ceil(result)\nEnd If\n\nreturn result");
    var $code = $("#code");
    var $result = $("#result");
    var $uiResult = $("#uiResult");
    var cb = index_1.default();
    $("#compilerBtn").on("click", function () {
        try {
            var res = cb.compileToString($code.val());
            $result.text(res);
        }
        catch (e) {
            alert("Error:\n" + e);
        }
    });
    $("#crunBtn").on("click", function () {
        try {
            var fun = cb.compile($code.val());
            if (fun !== false) {
                var result = fun();
                $uiResult.html(result);
            }
        }
        catch (e) {
            alert(e);
        }
    });
});
