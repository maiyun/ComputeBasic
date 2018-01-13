$(document).ready(() => {
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
        `   result = "This is ""string"", haha."`,
        "end if",
        "",
        "return ceil(result)"
    ].join("\n"));
    let cb = new ComputeBasic();
    let $code = $("#code");
    let $result = $("#result");
    let $uiResult = $("#uiResult");

    let func: any = false;
    $("#compilerBtn").on("click", () => {
        let res = <string>cb.compiler(<string>$code.val(), {
            string: true
        });
        $result.text(res);
    });
    $("#runBtn").on("click", () => {
        if (func !== false) {
            let r = func();
            $uiResult.html(r);
        } else {
            alert("Please click \"Compile and run\" first.");
        }
    });
    $("#crunBtn").on("click", () => {
        func = <string>cb.compiler(<string>$code.val());
        if (func !== false) {
            let r = func();
            $uiResult.html(r);
        }
    });
});