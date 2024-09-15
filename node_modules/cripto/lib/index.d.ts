/*!
 * cripto
 * Copyright(c) 2020 Luis Delfin Briceño Gordy
 * ISC Licensed
 */
declare function plot(s: string): string;
declare function unplot(s: string): string;
export declare const cripto: {
    toCode: any;
    toText: any;
    toCodeObj: any;
    toObj: any;
    toFun: any;
    pipe: (...ops: any[]) => any;
    unary: (fn: any) => (...args: any[]) => any;
    TTR: (x: string) => string;
    plot: typeof plot;
    unplot: typeof unplot;
};
export {};
//# sourceMappingURL=index.d.ts.map