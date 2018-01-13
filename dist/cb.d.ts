interface ComputeBasicWord {
    word: string;
    lower: string;
    type: number;
    row: number;
    col: number;
}
declare enum ComputeBasicWordType {
    NORMAL = 0,
    STRING = 1,
    COMMENT = 2,
    LF = 3,
}
interface ComputeBasicOption {
    string: boolean;
}
declare class ComputeBasic {
    static verison: string;
    lang: string;
    private _funcs;
    expose(funcName: string, fun: () => {}): void;
    private _tokenizer(code);
    private _langMsg;
    private _error(code, cbw);
    compiler(code: string, opt?: ComputeBasicOption): boolean | Function | string;
}
