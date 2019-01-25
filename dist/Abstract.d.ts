export declare enum TOKEN_TYPES {
    UNKNOWN = 0,
    SYMBOL = 1,
    STRING = 2,
    FULL_STRING = 3,
    COMMENT = 4,
    DEC_NUMBER = 5,
    HEX_NUMBER = 6,
    OCT_NUMBER = 7,
    REAL_NUMBER = 8,
    BIN_NUMBER = 9,
    REGEXP = 10,
    IDENTITY = 11
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
    outType?: string;
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
    en: LanguageEntity;
    zhCN: LanguageEntity;
}
export interface Tokenizer {
    tokenize(code: string): TokenRefer[];
}
export interface ComputeBasic {
    expose(funName: string, fun: (...args: any[]) => {}): void;
    setLanguage(lang: string): void;
    compile(code: string, opt?: CompileOption): any;
    compileToString(code: string): string;
}
