import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {} from 'lodash';

interface TTTT {
    debugMsg?: string;
    from?: string;
    to?: string;
    f?: string;
    t?: string;
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
}

interface RRRRR {
    TypeBOutputText: TTTT[];
    TypeBInputStoryScript: TTTT[];
}

;(async () => {
    console.log('process.argv.length', process.argv.length);
    console.log('process.argv', process.argv);
    const jsonPath = process.argv[2];
    console.log('jsonPath', jsonPath);
    if (!jsonPath) {
        console.error('no jsonPath');
        return;
    }
    const jsonF = await promisify(fs.readFile)(jsonPath, {encoding: 'utf-8'});
    const data: any = JSON.parse(jsonF);
    console.log(jsonF.length);
    console.log(Object.keys(data));
    const typeB: RRRRR = data.typeB;

    const rr: RRRRR = {
        TypeBOutputText: [],
        TypeBInputStoryScript: [],
    };
    typeB.TypeBInputStoryScript?.forEach(T => {
        const f = T.from || T.f;
        const t = T.to || T.t;
        if (f && t) {
            if (/[<>;:!\[\]\{\}=,"]|(?:__)|(?:\$_)|(?:T\.)|(?:V\.)|(?:return)|(?: _\w)|(?:\$\w)/.test(f)) {
                rr.TypeBInputStoryScript.push(T);
                return;
            } else {
                if (T.passageName) {
                    if (f.length > 20) {
                        rr.TypeBInputStoryScript.push(T);
                        return;
                    } else {
                        if (t.length > 10) {
                            rr.TypeBInputStoryScript.push(T);
                            return;
                        }
                    }
                }
                rr.TypeBOutputText.push(T);
                return;
            }
        } else {
            // ignore
        }
    });
    typeB.TypeBOutputText?.forEach(T => {
        const f = T.from || T.f;
        if (f) {
            if (/[<>]|(?:\$_)/.test(f)) {
                rr.TypeBInputStoryScript.push(T);
            } else {
                rr.TypeBOutputText.push(T);
            }
        }
    });


    console.log('TypeBInputStoryScript', rr.TypeBInputStoryScript.length);
    console.log('TypeBOutputText', rr.TypeBOutputText.length);
    const objString = JSON.stringify({typeB: rr}, undefined, ' ');

    await promisify(fs.writeFile)(jsonPath + '.wash.json', objString, {encoding: 'utf-8'});

})().catch((e) => {
    console.error(e);
});




