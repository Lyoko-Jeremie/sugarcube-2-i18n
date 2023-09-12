

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
7. 使用任意一个web服务器访问 Degrees of Lewdity VERSION.html 
8. i18n-cn.json 文件会被 Degrees of Lewdity VERSION.html 文件在游戏启动前通过fetch远程加载
9. play


---

i18n-cn.json 文件的格式样本请见当前项目根目录下的 i18n-cn.json 文件





