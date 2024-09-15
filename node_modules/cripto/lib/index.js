"use strict";
/*!
 * cripto
 * Copyright(c) 2020 Luis Delfin Briceño Gordy
 * ISC Licensed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cripto = void 0;
// LZW-compress a string
function plot(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i = 1; i < data.length; i++) {
        currChar = data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase = currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i = 0; i < out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}
// Decompress an LZW-encoded string
function unplot(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i = 1; i < data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
            phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}
var TTR = function (x) {
    var s = [];
    for (var i = 0; i < x.length; i++) {
        var j = x.charCodeAt(i);
        s[i] = (j >= 33) && (j <= 126) ? String.fromCharCode(33 + ((j + 14) % 94)) : String.fromCharCode(j);
    }
    return s.join('');
};
var toHex = function (str) {
    var m = str.match(/.{1,1}/g);
    if (m)
        return m.reduce(function (acc, char) { return acc + char.charCodeAt(0).toString(16); }, "");
    throw new Error('Error: No se puede convertir Formato Inválido');
};
var Hex2a = function (str) {
    var m = ("" + str).match(/.{1,2}/g);
    if (m)
        return m.reduce(function (acc, char) { return acc + String.fromCharCode(parseInt(char, 16)); }, "");
    throw new Error('Error: No se puede convertir Formato Inválido');
};
var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", 
// Regular expression to check formal correctness of base64 encoded strings
b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
var toB64 = function (string) {
    string = String(string);
    var bitmap, a, b, c, result = "", i = 0, rest = string.length % 3; // To determine the final padding
    for (; i < string.length;) {
        if ((a = string.charCodeAt(i++)) > 255
            || (b = string.charCodeAt(i++)) > 255
            || (c = string.charCodeAt(i++)) > 255)
            throw new TypeError("Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.");
        bitmap = (a << 16) | (b << 8) | c;
        result += b64.charAt(bitmap >> 18 & 63) + b64.charAt(bitmap >> 12 & 63)
            + b64.charAt(bitmap >> 6 & 63) + b64.charAt(bitmap & 63);
    }
    // If there's need of padding, replace the last 'A's with equal signs
    return rest ? result.slice(0, rest - 3) + "===".substring(rest) : result;
};
var B642a = function (string) {
    // atob can work with strings with whitespaces, even inside the encoded part,
    // but only \t, \n, \f, \r and ' ', which can be stripped.
    string = String(string).replace(/[\t\n\f\r ]+/g, "");
    if (!b64re.test(string))
        throw new TypeError("Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.");
    // Adding the padding if missing, for semplicity
    string += "==".slice(2 - (string.length & 3));
    var bitmap, result = "", r1, r2, i = 0;
    for (; i < string.length;) {
        bitmap = b64.indexOf(string.charAt(i++)) << 18 | b64.indexOf(string.charAt(i++)) << 12
            | (r1 = b64.indexOf(string.charAt(i++))) << 6 | (r2 = b64.indexOf(string.charAt(i++)));
        result += r1 === 64 ? String.fromCharCode(bitmap >> 16 & 255)
            : r2 === 64 ? String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255)
                : String.fromCharCode(bitmap >> 16 & 255, bitmap >> 8 & 255, bitmap & 255);
    }
    return result;
};
var toEval = function (arg) { return eval("" + arg); };
var unary = function (fn) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return fn(args[0]);
}; };
var _pipe = function (a, b) { return function (arg) { return a(b(arg)); }; };
var pipe = function () {
    var ops = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        ops[_i] = arguments[_i];
    }
    return ops.reduce(_pipe);
};
exports.cripto = {
    toCode: pipe(toHex, TTR, toB64, TTR),
    toText: pipe(TTR, B642a, TTR, Hex2a),
    toCodeObj: pipe(toHex, TTR, toB64, TTR, unary(JSON.stringify)),
    toObj: pipe(unary(JSON.parse), TTR, B642a, TTR, Hex2a),
    toFun: pipe(toEval, TTR, B642a, TTR, Hex2a),
    pipe: pipe,
    unary: unary,
    TTR: TTR,
    plot: plot,
    unplot: unplot
};
//# sourceMappingURL=index.js.map