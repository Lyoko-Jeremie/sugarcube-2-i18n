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

    translateDataPath = 'i18n-cn.json';

    loadTranslateData(): Promise<boolean> {
        return fetch('i18n-cn.json', {})
            .then(T => T.json())
            .then(T => {
                console.log('loadTranslateData() T', T);
                if (T && T.typeB && T.typeB.TypeBOutputText && T.typeB.TypeBInputStoryScript) {
                    this.cacheTypeBOutputText = T.typeB.TypeBOutputText.map(T => {
                        return Object.assign(T, {
                            from: T.f,
                            to: T.t,
                        });
                    });
                    this.cacheTypeBInputStoryScript = T.typeB.TypeBInputStoryScript.map(T => {
                        return Object.assign(T, {
                            from: T.f,
                            to: T.t,
                        });
                    });
                    console.log('loadTranslateData() this', this);
                    return true;
                }
                return false;
            })
            .catch(E => {
                console.error(E);
                return false;
            }).then(R => {
                this.initInerState();
                this.isInited_resolve(R);
                return R;
            });
    }

    isInited = new Promise<boolean>((resolve, reject) => {
        this.isInited_resolve = resolve;
        this.isInited_reject = reject;
    });

    private isInited_resolve!: (v: boolean) => any;
    private isInited_reject!: (r: any) => any;

}

const i18nManager = new I18NManager();
