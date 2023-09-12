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

class MatchBuffer<T extends IMatchBufferWithTag> {
    constructor(
        public mt: T[],
        preprocessFunc: (s: T) => [string, MatchBufferType],
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
        mt.forEach((v) => {
            const r = preprocessFunc(v);
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
        this.inputStoryMatchBuffer = new MatchBuffer<TypeBInputStoryScript>(InputStoryScript, (t) => {
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
    public inputStoryMatchBuffer: MatchBuffer<TypeBInputStoryScript>;

    replaceOutputText(text: string): string {
        if (!text.trim()) {
            // empty string
            return text;
        }
        console.log('replaceOutputText input text', [text], text);
        const nNotTrim = this.outputTextMatchBuffer.bufTable.notTrim.get(text);
        if (nNotTrim) {
            console.log('replaceOutputText notTrim', nNotTrim.to);
            return nNotTrim.to;
        }
        const nTrim = this.outputTextMatchBuffer.bufTable.trim.get(MatchBuffer.trim(text));
        if (nTrim) {
            console.log('replaceOutputText nTrim', nTrim.to);
            return nTrim.to;
        }
        return text;
    }

    replaceInputStoryScript(text: string): string {
        if (!text.trim()) {
            // empty string
            return text;
        }
        console.log('replaceInputStoryScript input text ==>>', [text], text);
        let s = text;
        let NNN: TypeBInputStoryScript | undefined;
        NNN = this.inputStoryMatchBuffer.bufTable.notTrim_NotTrimTag.get(s);
        if (NNN) {
            console.log('replaceInputStoryScript notTrim_NotTrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('replaceInputStoryScript debugMsg ==>>', NNN.debugMsg);
                }
                console.log('replaceInputStoryScript notTrim_NotTrimTag', [NNN.to]);
                return NNN.to;
            }
            console.log('replaceInputStoryScript notTrim_NotTrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        s = MatchBuffer.trimTag(s);
        NNN = this.inputStoryMatchBuffer.bufTable.notTrim_TrimTag.get(s);
        if (NNN) {
            console.log('replaceInputStoryScript notTrim_TrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('replaceInputStoryScript debugMsg ==>>', NNN.debugMsg);
                }
                console.log('replaceInputStoryScript notTrim_TrimTag', [NNN.to]);
                return NNN.to;
            }
            console.log('replaceInputStoryScript notTrim_TrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        s = MatchBuffer.trim(text);
        NNN = this.inputStoryMatchBuffer.bufTable.trim_NotTrimTag.get(s);
        if (NNN) {
            console.log('replaceInputStoryScript trim_NotTrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('replaceInputStoryScript debugMsg ==>>', NNN.debugMsg);
                }
                console.log('replaceInputStoryScript trim_NotTrimTag', [NNN.to]);
                return NNN.to;
            }
            console.log('replaceInputStoryScript trim_NotTrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        s = MatchBuffer.trimTag(s);
        NNN = this.inputStoryMatchBuffer.bufTable.trim_TrimTag.get(s);
        if (NNN) {
            console.log('replaceInputStoryScript trim_TrimTag', [NNN.to]);
            if (!(NNN.notMatchRegex && s.match(NNN.notMatchRegex))) {
                if (NNN.debugMsg) {
                    console.log('replaceInputStoryScript debugMsg ==>>', NNN.debugMsg);
                }
                console.log('replaceInputStoryScript trim_TrimTag', [NNN.to]);
                return NNN.to;
            }
            console.log('replaceInputStoryScript trim_TrimTag filtered', NNN);
            // be filtered, fall through, to match next
        }
        return text;
    }

}
