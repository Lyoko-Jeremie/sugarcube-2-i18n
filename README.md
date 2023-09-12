

1. clone 父项目 https://github.com/Lyoko-Jeremie/sugarcube-2_Vrelnir ， 并安装当前项目的submodule，

2. 进入当前项目所在submodule，在当前项目运行如下命令，编译生成i18n框架的js到当前项目的 dist 目录：

```shell
yarn install
yarn run ts:w
```

3. 回到父项目，运行如下命令，生成sugarcube-2的引擎 format.js 文件到父项目的 build/twine2/sugarcube-2/format.js 处：

```shell
npm install
node build.js -d -u -b 2
```

4. 复制生成的 format.js 文件到 degrees-of-lewdity 项目的 devTools/tweego/storyFormats/sugarcube-2 目录并覆盖原始 format.js 文件

5. 编译 degrees-of-lewdity 项目获得 Degrees of Lewdity VERSION.html 文件

6. 在 Degrees of Lewdity VERSION.html 文件同路径（文件夹）下放置 i18n-cn.json 文件（翻译数据）
7. 回到当前项目执行如下指令，生成 insertJson.js 注入工具

```shell
yarn run ts:tool:w
```

8. 回到当前项目执行如下指令，使用 insertJson.js 将 i18n-cn.json 文件压缩成zip并插入到 Degrees of Lewdity VERSION.html 文件中

```shell
node .\dist-tool\insertJson.js "<Degrees of Lewdity VERSION.html 文件路径>" "<i18n-cn.json文件路径>"
```
例如：
```shell
node .\dist-tool\insertJson.js "H:\Code\degrees-of-lewdity\Degrees of Lewdity VERSION.html" "H:\Code\degrees-of-lewdity\i18n-cn.json"
```
执行该指令后会在 Degrees of Lewdity VERSION.html 文件同路径（文件夹）下生成如下三个文件
```
// i18n-cn.json压缩后的zip文件，可用来检查压缩是否有误，可直接删除
Degrees of Lewdity VERSION.html.zipBase64.zip
// Base64编码后的zip文件，可用来检查编码是否有误，可直接删除
Degrees of Lewdity VERSION.html.zipBase64
// 嵌入了i18n-cn.json的Base64编码后的zip文件后的html文件，直接以原始项目的html同样的方式打开即可使用
Degrees of Lewdity VERSION.html.new.html
```
9. 打开`Degrees of Lewdity VERSION.html.new.html`文件， play

---

注：

当前的加载实现是，先尝试加载内嵌的i18n-cn.json数据，再尝试通过fetch加载远程的i18n-cn.json数据，故存在两种打开方式：

1. 直接打开（使用file://协议打开）`Degrees of Lewdity VERSION.html.new.html`文件，会读取嵌入在文件内的i18n-cn.json数据，（因为file://协议无法使用fetch加载远程内容），加载结束
2. 使用任意一个web服务器访问 `Degrees of Lewdity VERSION.html.new.html` 文件，会先读取嵌入在文件内的i18n-cn.json数据，再通过fetch加载远程服务器上同目录下i18n-cn.json数据，并替换已经加载的内嵌i18n-cn.json数据，加载结束


---

i18n-cn.json 文件的格式样本请见当前项目根目录下的 i18n-cn.json 文件

---



