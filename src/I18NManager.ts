enum TranslateDataLoadType {
    'Remote' = 'Remote',
    'ValueObject' = 'ValueObject',
    'ValueZip' = 'ValueZip',
}

class I18NManager {
    typeA!: TypeA;
    typeB!: TypeB;

    constructor() {
        console.log('I18NManager constructor');

        this.mookLoad();
    }

    private initInerState() {
        // load data to fill TypeB
        this.typeB = new TypeB(this.cacheTypeBOutputText, this.cacheTypeBInputStoryScript);
        // TODO load data to fill TypeA
        this.typeA = new TypeA();
    }

    cacheTypeBOutputText: TypeBOutputText[] = [];
    cacheTypeBInputStoryScript: TypeBInputStoryScript[] = [];

    mookLoad() {
        this.cacheTypeBOutputText.push({
            from: 'Welcome to the alpha of Degrees of Lewdity!',
            to: '欢迎游玩Degrees of Lewdity！',
            dontTrim: false,
            dontPrepareTrim: false,
        });
        this.cacheTypeBOutputText.push({
            from: 'If you want to avoid trouble, dress modestly and stick to safe, well-lit areas. Nights are particularly dangerous. Dressing lewd will attract attention, both good and bad. ',
            to: '倘若你不想被卷入麻烦，那么请牢记要穿着得体，并待在安全、明亮的地方。夜晚是非常危险的，尤其当你身穿色情下流的服饰时，那将引起某些人的注意——而这究竟会给你带来好运还是霉头，谁知道呢？ ',
            dontTrim: false,
            dontPrepareTrim: false,
        });
        this.cacheTypeBOutputText.push({
            from: 'The bus service is the easiest way to get around town. Don\'t forget your uniform! ',
            to: '巴士是这个小镇里最便捷的交通方式，可以通过巴士站快速移动到想要去的地方。',
        });

        this.cacheTypeBOutputText.push({
            from: 'You have school tomorrow. ',
            to: '你明天要上学。 ',
        });

        this.cacheTypeBOutputText.push({
            from: 'CHARACTERISTICS',
            to: '角色属性',
        });
        this.cacheTypeBOutputText.push({
            from: 'SOCIAL',
            to: '社交',
        });
        this.cacheTypeBOutputText.push({
            from: 'TRAITS',
            to: '特征',
        });
        this.cacheTypeBOutputText.push({
            from: 'JOURNAL',
            to: '日志',
        });
        this.cacheTypeBOutputText.push({
            from: 'STATS',
            to: '统计',
        });
        this.cacheTypeBOutputText.push({
            from: 'FEATS',
            to: '成就',
        });
        this.cacheTypeBOutputText.push({
            from: 'OPTIONS',
            to: '选项',
        });
        this.cacheTypeBOutputText.push({
            from: 'SAVES',
            to: '存档',
        });

        this.cacheTypeBOutputText.push({
            from: 'Next',
            to: 'Nextxxxxxxx',
        });


        this.cacheTypeBInputStoryScript.push({
            from: "The new school year starts tomorrow at <<ampm 9 00>>. The bus service is the easiest way to get around town. Don't forget your uniform!",
            to: '新学期将在明日 <<ampm 9 00>> 开始，上学的时候别忘记穿校服！\n' +
                '巴士是这个小镇里最便捷的交通方式，可以通过巴士站快速移动到想要去的地方。 ',
        });
    }

    translateDataRemotePath = 'i18n-cn.json';

    // use typescript `target:es6` to translate `async-await` code
    /*async*/   // cannot use `async-await`, because parent project's babel cannot process it correctly
    loadTranslateData(loadOrder: TranslateDataLoadType[]): Promise<boolean> {
        // let R = false;
        // for (let loadType of loadOrder) {
        //     switch (loadType) {
        //         case TranslateDataLoadType.Remote:
        //             R = await this.loadTranslateDataFromRemote() || R;
        //             break;
        //         case TranslateDataLoadType.ValueObject:
        //             R = await this.loadTranslateDataFromValueObject() || R;
        //             break;
        //         case TranslateDataLoadType.ValueZip:
        //             R = await this.loadTranslateDataFromValueZip() || R;
        //             break;
        //     }
        // }
        // return R;
        return loadOrder.reduce((P, loadType) => {
                return P.then((R) => {
                    switch (loadType) {
                        case TranslateDataLoadType.Remote:
                            return this.loadTranslateDataFromRemote() || R;
                        case TranslateDataLoadType.ValueObject:
                            return this.loadTranslateDataFromValueObject() || R;
                        case TranslateDataLoadType.ValueZip:
                            return this.loadTranslateDataFromValueZip() || R;
                    }
                });
            },
            Promise.resolve(false),
        ).catch(E => {
            console.error(E);
            return false;
        }).then((R) => {
            this.isInited_resolve(R);
            return R;
        });
    }

    private loadTranslateDataFromRemote(): Promise<boolean> {
        return fetch(this.translateDataRemotePath, {})
            .then(T => T.json())
            .then(T => {
                console.log('loadTranslateData() T', T);
                if (this.checkAndProcessData(T)) {
                    console.log('loadTranslateData() this', this);
                    return true;
                }
                return false;
            }).catch(E => {
                console.error(E);
                return false;
            }).then(R => {
                this.initInerState();
                return R;
            });
    }

    private checkAndProcessData(T: any) {
        if (T && T.typeB && T.typeB.TypeBOutputText && T.typeB.TypeBInputStoryScript) {
            this.cacheTypeBOutputText = T.typeB.TypeBOutputText.map((T: any) => {
                return Object.assign(T, {
                    from: T.f,
                    to: T.t,
                });
            });
            this.cacheTypeBInputStoryScript = T.typeB.TypeBInputStoryScript.map((T: any) => {
                return Object.assign(T, {
                    from: T.f,
                    to: T.t,
                });
            });

            // DEBUG test only
            this.cacheTypeBInputStoryScript = this.cacheTypeBInputStoryScript.concat(this.cacheTypeBOutputText);
            this.cacheTypeBOutputText = this.cacheTypeBInputStoryScript;

            return true;
        }
        return false;
    }

    translateDataValueObjectPath = 'i18nCnObj';

    private loadTranslateDataFromValueObject(): Promise<boolean> {
        if ((window as any)[this.translateDataValueObjectPath]) {
            const T = (window as any)[this.translateDataValueObjectPath];
            console.log('loadTranslateDataFromValueObject() T', T);
            if (this.checkAndProcessData(T)) {
                console.log('loadTranslateDataFromValueObject() this', this);
                return Promise.resolve(true);
            }
        }
        return Promise.resolve(false);
    }

    translateDataValueZipPath = 'i18nCnZip';

    private loadTranslateDataFromValueZip(): Promise<boolean> {
        if ((window as any)[this.translateDataValueZipPath]) {
            console.log('loadTranslateDataFromValueZip() DataValueZip', [(window as any)[this.translateDataValueZipPath]]);
            return JSZip.loadAsync((window as any)[this.translateDataValueZipPath], {base64: true}).then(zip => {
                const i18nCnObjZip = zip.file('i18nCnObj');
                if (i18nCnObjZip) {
                    return i18nCnObjZip.async('string').then(i18nCnObjString => {
                        console.log('loadTranslateDataFromValueZip() i18nCnObjString', [i18nCnObjString]);
                        const T = JSON.parse(i18nCnObjString);
                        console.log('loadTranslateDataFromValueZip() T', T);
                        if (this.checkAndProcessData(T)) {
                            console.log('loadTranslateDataFromValueObject() this', this);
                            return true;
                        }
                        return false;
                    });
                }
                return false;
            }).catch(E => {
                console.error(E);
                return false;
            });
        }
        return Promise.resolve(false);
    }

    isInited = new Promise<boolean>((resolve, reject) => {
        this.isInited_resolve = resolve;
        this.isInited_reject = reject;
    });

    private isInited_resolve!: (v: boolean) => any;
    private isInited_reject!: (r: any) => any;

}

const i18nManager = new I18NManager();
