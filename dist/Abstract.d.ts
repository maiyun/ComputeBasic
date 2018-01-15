export declare enum TOKEN_TYPES {
    UNKNOWN = 0,
    SYMBOL = 1,
    STRING = 2,
    COMMENT = 3,
    DEC_NUMBER = 4,
    HEX_NUMBER = 5,
    OCT_NUMBER = 6,
    REAL_NUMBER = 7,
    BIN_NUMBER = 8,
    REGEXP = 9,
    IDENTITY = 10,
    ELEMENT = 11,
}
export interface TokenEntity {
    readonly "text": string;
    readonly "lower": string;
    readonly "type": TOKEN_TYPES;
}
export interface TokenRefer {
    readonly "token": TokenEntity;
    readonly "row": number;
    readonly "col": number;
}
export interface CompileOption {
    string: boolean;
}
export interface LanguageEntity {
    error: string;
    code: string;
    message: string;
    row: string;
    col: string;
    word: string;
    codeMessage: any;
}
export interface LanguageRefer {
    enUs: LanguageEntity;
    zhCn: LanguageEntity;
}
export interface Tokenizer {
    tokenize(code: string): TokenRefer[];
}
export interface ComputeBasic {
    expose(funName: string, fun: (...args: any[]) => {}): void;
    setLanguage(lang: string): void;
    compiler(code: string, opt?: CompileOption): boolean | Function | string;
}
