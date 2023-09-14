interface ITypeBDebug {
    debugMsg?: string;
}

// original OutputText -> (dontTrim/Trim) -> match `from:string` -> replace use to string
interface TypeBOutputText extends IMatchBuffer {
    from: string;
    to: string;
    // dont prepare trim `from: string`, means the `from: string` is already trimed, trim will call `.trim().replace('[\n\r]', ' ')`
    dontPrepareTrim?: boolean;
    // dont trim input string before match, trim will call `.trim().replace('[\n\r]', ' ')`
    // this will split matcher to 2 type
    dontTrim?: boolean;
}

// original StoryScript -> (dontTrim/Trim) -> (dontTrimTag/TrimTag) Trim or not in original string -> match `from:string` -> notMatchRegex filer -> replace use to string
interface TypeBInputStoryScript extends IMatchBufferWithTag {
    from: string;
    to: string;
    // dont prepare trim `from: string`, means the `from: string` is already trimed, trim will call `.trim().replace('[\n\r]', ' ')`
    dontPrepareTrim?: boolean;
    // dont trim input string before match, trim will call `.trim().replace('[\n\r]', ' ')`
    // this will split matcher to 2 type
    dontTrim?: boolean;
    // dont match some string, avoid replace some siminar string
    notMatchRegex?: string;
    // dont trim empty from input string `AAA <<` and `>> BBB` TO `AAA<<` and `>>BBB` for input text match
    // this will happen before replace, it modified `from` string and `original` string
    // this will split matcher to 2 type
    dontTrimTag?: boolean;

    // the passage name, only use in passage match mode
    // example:
    //      a mark:                `:: Start2 [nosave exitCheckBypass]`
    //      its massage name:         `Start2`
    passageName?: string;
    searchPatternRegex?: RegExp;
}

interface IMatchBuffer extends ITypeBDebug {
    from: string;
    dontPrepareTrim?: boolean;
    dontTrim?: boolean;
}

interface IMatchBufferWithTag extends IMatchBuffer {
    dontTrimTag?: boolean;
}

enum MatchBufferType {
    'trim' = 'trim', // same as 'trim_NotTrimTag'
    'notTrim' = 'notTrim',
    'trim_TrimTag' = 'trim_TrimTag',
    'notTrim_TrimTag' = 'notTrim_TrimTag',
    'trim_NotTrimTag' = 'trim_NotTrimTag',
    'notTrim_NotTrimTag' = 'notTrim_NotTrimTag',
    'invalid' = 'invalid',
};

// come from GPT-4
function normalizeSearchPattern(pattern: string): RegExp {
    // 转义正则表达式中的特殊字符
    const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 在非空白字符之间插入对空白字符的匹配
    const normalizedPattern = escapedPattern
        .split('')
        .map(char => /\s/.test(char) ? `\\s*` : char)
        .join('')
        // add whitespace match between << and >>
        .replace(/\s*<<\s*/g, '\\s*<<\\s*')
        .replace(/\s*>>\s*/g, '\\s*>>\\s*')
        // add whitespace match between < and > but not effect << , >> , <= , >=
        .replace(/\s*(?<!<)<(?![<=])\s*/g, '\\s*<\\s*')
        .replace(/\s*(?<!>)>(?![>=])\s*/g, '\\s*>\\s*')
        // ( and )
        .replace(/\s*(\\\()\s*/g, '\\s*\\(\\s*')
        .replace(/\s*(\\\))\s*/g, '\\s*\\)\\s*')
    ;

    // console.log('normalizedPattern:', [normalizedPattern]);

    return new RegExp(normalizedPattern, 'g');
}

class MatchBuffer<T extends IMatchBufferWithTag> {
    constructor(
        public mt: T[],
        public preprocessFunc: (s: T) => [string, MatchBufferType],
        public lazyInit: boolean = false,
    ) {
        this.bufTable = {
            [MatchBufferType.trim]: new Map<string, T>(),
            [MatchBufferType.notTrim]: new Map<string, T>(),
            [MatchBufferType.trim_TrimTag]: new Map<string, T>(),
            [MatchBufferType.trim_NotTrimTag]: new Map<string, T>(),
            [MatchBufferType.notTrim_TrimTag]: new Map<string, T>(),
            [MatchBufferType.notTrim_NotTrimTag]: new Map<string, T>(),
            [MatchBufferType.invalid]: new Map<string, T>(),
        };
        if (!this.lazyInit) {
            this.init();
        }
    }

    init() {
        this.mt.forEach((v) => {
            const r = this.preprocessFunc(v);
            if (r[1] !== MatchBufferType.invalid) {
                this.bufTable[r[1]].set(r[0], v);
            }
        });
    }

    // both apply to `from:string` (if not dontPrepareTrim) and every input
    static trim(s: string) {
        return s.trim().replace(/[\n\r]/g, ' ');
    }

    static trimTag(s: string) {
        return s.replace(/\s*<</g, '<<').replace(/\s*>>/g, '>>');
    }

    public bufTable: {
        [key in MatchBufferType]: Map<string, T>;
    };
}

class PassageMatcher {
    constructor(
        public mt: TypeBInputStoryScript[],
        preprocessFunc: (s: TypeBInputStoryScript) => [string, MatchBufferType],
    ) {
        this.passagebuffer = new Map<string, MatchBuffer<TypeBInputStoryScript>>();
        this.noPassageBuffer = [];
        mt.forEach((v) => {
            if (!v.searchPatternRegex) {
                v.searchPatternRegex = normalizeSearchPattern(v.from);
            }
            if (v.passageName) {
                if (!this.passagebuffer.has(v.passageName)) {
                    this.passagebuffer.set(v.passageName, new MatchBuffer<TypeBInputStoryScript>([], preprocessFunc, true));
                }
                let n = this.passagebuffer.get(v.passageName)!;
                n.mt.push(v);
            } else {
                this.noPassageBuffer.push(v);
            }
        });
        this.passagebuffer.forEach((v) => {
            v.init();
        })
        this.noPassageBufferMatcher = new MatchBuffer<TypeBInputStoryScript>(this.noPassageBuffer, preprocessFunc);
    }

    passagebuffer: Map<string, MatchBuffer<TypeBInputStoryScript>>;
    noPassageBuffer: TypeBInputStoryScript[];
    noPassageBufferMatcher: MatchBuffer<TypeBInputStoryScript>;

    getByPassage(passageName: string | '' | undefined | null) {
        if (passageName) {
            const pp = this.passagebuffer.get(passageName);
            if (pp) {
                return pp;
            }
            console.log('cannot find passage:', passageName);
        }
        return undefined;
    }

    getMatcherEverywhere() {
        return this.noPassageBufferMatcher;
    }
}

class TypeB {
    constructor(
        public OutputText: TypeBOutputText[],
        public InputStoryScript: TypeBInputStoryScript[],
    ) {
        this.outputTextMatchBuffer = new MatchBuffer<TypeBOutputText>(OutputText, (t) => {
            // console.log('TypeB constructor outputTextMatchBuffer', t);
            if (typeof t.from !== 'string' || typeof t.to !== 'string') {
                console.log('TypeB constructor outputTextMatchBuffer invalid', t);
                // remove invalid
                return ['', MatchBufferType.invalid];
            }
            const tt = t.dontTrim ? MatchBufferType.notTrim : MatchBufferType.trim;
            if (t.dontPrepareTrim) {
                return [t.from, tt];
            }
            // [[offten use]]
            return [MatchBuffer.trim(t.from), tt];
        });
        this.inputStoryMatchBuffer = new PassageMatcher(InputStoryScript, (t) => {
            // console.log('TypeB constructor inputStoryMatchBuffer', t);
            if (typeof t.from !== 'string' || typeof t.to !== 'string') {
                console.log('TypeB constructor inputStoryMatchBuffer invalid', t);
                // remove invalid
                return ['', MatchBufferType.invalid];
            }
            const tt = t.dontTrim ? (
                t.dontTrimTag ? MatchBufferType.notTrim_NotTrimTag : MatchBufferType.notTrim_TrimTag
            ) : (
                t.dontTrimTag ? MatchBufferType.trim_NotTrimTag : MatchBufferType.trim_TrimTag
            );
            if (t.dontPrepareTrim) {
                if (t.dontTrimTag) {
                    return [t.from, tt];
                }
                return [MatchBuffer.trimTag(t.from), tt];
            } else {
                if (t.dontTrimTag) {
                    return [MatchBuffer.trim(t.from), tt];
                }
                // [[offten use]]
                return [MatchBuffer.trimTag(MatchBuffer.trim(t.from)), tt];
            }
        });
        console.log('TypeB constructor', this.outputTextMatchBuffer, this.inputStoryMatchBuffer);

        // monky patch
        console.log('TypeB constructor monky patch document.createTextNode');
        this.oCreateTextNode = document.createTextNode;
        document.createTextNode = (text: string) => {
            return this.oCreateTextNode.call(document, this.replaceOutputText(text));
        };
    }

    public oCreateTextNode: typeof document.createTextNode;

    public outputTextMatchBuffer: MatchBuffer<TypeBOutputText>;
    public inputStoryMatchBuffer: PassageMatcher;

    replaceOutputText(text: string): string {
        if (!text.trim()) {
            // empty string
            return text;
        }
        // console.log('replaceOutputText input text ==>>', [text], text);
        const nNotTrim = this.outputTextMatchBuffer.bufTable.notTrim.get(text);
        if (nNotTrim) {
            // console.log('replaceOutputText notTrim ==>>', [text], ' replace to ==>>', nNotTrim.to, ' by ', nNotTrim, ' on key ', [text]);
            return nNotTrim.to;
        }
        const nTrim = this.outputTextMatchBuffer.bufTable.trim.get(MatchBuffer.trim(text));
        if (nTrim) {
            // console.log('replaceOutputText nTrim ==>>', [text], ' replace to ==>>', nTrim.to, ' by ', nTrim, ' on key ', [MatchBuffer.trim(text)]);
            return nTrim.to;
        }
        // console.log('replaceOutputText cannot find replace for input text ==>>', [text]);
        return text;
    }

    tryMatchInputStoryMatchBuffer(text: string, MB: MatchBuffer<TypeBInputStoryScript>) {
        let s = text;
        let NNN: TypeBInputStoryScript | undefined;
        NNN = MB.bufTable.notTrim_NotTrimTag.get(s);
        if (NNN) {
            // console.log('tryMatchInputStoryMatchBuffer notTrim_NotTrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('tryMatchInputStoryMatchBuffer debugMsg ==>>', NNN.debugMsg);
                }
                // console.log('tryMatchInputStoryMatchBuffer notTrim_NotTrimTag ==>>', [text], ' replace to ==>>', [NNN.to], ' by ', NNN, ' on key ', [s]);
                return NNN.to;
            }
            console.log('tryMatchInputStoryMatchBuffer notTrim_NotTrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        s = MatchBuffer.trimTag(s);
        NNN = MB.bufTable.notTrim_TrimTag.get(s);
        if (NNN) {
            // console.log('tryMatchInputStoryMatchBuffer notTrim_TrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('tryMatchInputStoryMatchBuffer debugMsg ==>>', NNN.debugMsg);
                }
                // console.log('tryMatchInputStoryMatchBuffer notTrim_TrimTag ==>>', [text], ' replace to ==>>', [NNN.to], ' by ', NNN, ' on key ', [s]);
                return NNN.to;
            }
            console.log('tryMatchInputStoryMatchBuffer notTrim_TrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        s = MatchBuffer.trim(text);
        NNN = MB.bufTable.trim_NotTrimTag.get(s);
        if (NNN) {
            // console.log('tryMatchInputStoryMatchBuffer trim_NotTrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('tryMatchInputStoryMatchBuffer debugMsg ==>>', NNN.debugMsg);
                }
                // console.log('tryMatchInputStoryMatchBuffer trim_NotTrimTag ==>>', [text], ' replace to ==>>', [NNN.to], ' by ', NNN, ' on key ', [s]);
                return NNN.to;
            }
            console.log('tryMatchInputStoryMatchBuffer trim_NotTrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        s = MatchBuffer.trimTag(s);
        NNN = MB.bufTable.trim_TrimTag.get(s);
        if (NNN) {
            // console.log('tryMatchInputStoryMatchBuffer trim_TrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('tryMatchInputStoryMatchBuffer debugMsg ==>>', NNN.debugMsg);
                }
                // console.log('tryMatchInputStoryMatchBuffer trim_TrimTag ==>>', [text], ' replace to ==>>', [NNN.to], ' by ', NNN, ' on key ', [s]);
                return NNN.to;
            }
            console.log('tryMatchInputStoryMatchBuffer trim_TrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        // console.log('replaceInputStoryScript cannot find replace for input text ==>>', [text]);
        return undefined;
    }

    replaceInputStoryScript(text: string, passageTitle?: string, passageTitleBackup?: string, lastPossiblePassageTitle?: string): string {
        if (!text.trim()) {
            // empty string
            return text;
        }
        // console.log(
        //     'replaceInputStoryScript input text [passageTitle:',
        //     passageTitle || undefined,
        //     '] [passageTitleBackup:',
        //     passageTitleBackup || undefined,
        //     '] [lastPossiblePassageTitle:',
        //     lastPossiblePassageTitle || undefined,
        //     '] ==>>',
        //     [text],
        //     // text
        // );

        const passageName = passageTitle || passageTitleBackup || lastPossiblePassageTitle;

        let MB = this.inputStoryMatchBuffer.getByPassage(passageName);
        if (!MB) {
            // its not a passage, try match with everywhere
            MB = this.inputStoryMatchBuffer.getMatcherEverywhere();
            const rt = this.tryMatchInputStoryMatchBuffer(text, MB);
            if (rt) {
                // find
                return rt;
            }
            // // debug test
            // const NF = MB.mt.find((v) => v.searchPatternRegex?.test(text));
            // if (NF) {
            //     // find
            //     return text.replace(NF.searchPatternRegex!, NF.to);
            // }
            // not find
            return text;
        } else {
            // // its a passage, try match with passage, in full string match mode
            // const rt = this.tryMatchInputStoryMatchBuffer(text, MB);
            // if (rt) {
            //     // find
            //     return rt;
            // }
            // return text;

            try {

                // its a passage try match every
                let newS = text;
                for (const v of MB.mt) {
                    newS = newS.replace(v.from, v.to);
                }
                return newS;
                // const NS = MB.mt.reduce((acc, v) => {
                //     return acc.replace(v.from, v.to);
                // }, text);

                // // not find
                // // console.log('try match with regex mode in this passage group [ ', passageName, ' ] ');
                // // try match with regex mode in this passage group , again
                // const NS = MB.mt.reduce((acc, v) => {
                //     if (v.searchPatternRegex?.test(text)) {
                //         // find
                //         return acc.replace(v.searchPatternRegex, v.to);
                //     }
                //     return acc;
                // }, text);
                // return NS;

                // let newS = text;
                // for (const v of MB.mt) {
                //     if (v.searchPatternRegex) {
                //         let re = new RegExp(v.searchPatternRegex, 'g');
                //         let match;
                //         while (match = re.exec(newS)) {
                //             newS = newS.replace(match[0], v.to);
                //         }
                //     }
                // }
                // return newS;

                // for (const v of MB.mt) {
                //     if (v.searchPatternRegex?.test(text)) {
                //         // find
                //         newS = newS.replace(v.searchPatternRegex, v.to);
                //     }
                // }
                // return newS;

            } catch (e) {
                // we ignore the "InternalError: allocation size overflow" error on there
                console.error('replaceInputStoryScript() seems like a "InternalError: allocation size overflow" error happaned? :', e);
            }
        }
        return text;
    }

}
