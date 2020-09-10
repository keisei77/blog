---
title: webpack 监听外部文件变更
date: '2020-09-10 23:20'
description: '本文将介绍当需要根据外部文件变更触发编译时，如何通过编写插件来解决该问题。'
tags: ['Browser process', 'navigation']
---

### 背景

最近几个月的工作都以移动端为主，主要的工作内容是将 PC 端已有的核心业务移植到 Mobile 端。那么就遇到了相同的业务逻辑是再实现一套还是直接复用原有的逻辑呢？作为业务方，我们肯定是希望能复用的复用，减少额外的工作量，另外后期的维护也会比较轻松。即便将来出现了产品逻辑或交互上的差异，到时候再拆分也是可以的。所以我们的结论是 PC 端与 Mobile 端为两个平行目录，但是在执行打包命令时会先将 PC 端文件目录同步到 Mobile 下的 `plugin` 目录，用到了哪段逻辑，就引用 `plugin/\*` 下的文件。

### 痛点

在本地开发过程中，当修改了 PC 目录下某个文件，如果需要触发 webpack 打包，需要手动将变更的该文件 copy 到上述 `plugin` 目录下。PS: 这里的 webpack 打包是在 Mobile 的目录下执行的。

### 初步方案

有同事编写了一个轻量的 node 脚本，如当改完 common 目录下某个文件时，手动执行 `npm run sync:plugin common`，那么 common 目录下的所有文件会复制到 `plugin` 目录下。

```javascript
// copy-to-mobile.js

const path = require('path');
const childprocess = require('child_process');
const module = process.argv[2];
const cmd = `cp ${module} mobile/plugin/${module}`;
childprocess.execSync(cmd);
```

这在开发初期尚可接受，后来业务越来越多，需要改动的包也越多，来回 sync 各个包费时费力。有没有办法可以自动化呢？

### 能自动化的指令就不要人工参与

带着上述的疑问，前去搜索引擎搜索了一番，没有找到合适的解决方案。有些 webpack 插件做到了监听外部文件，但是缺少回调函数的执行，我们这里的需求是文件变动后要复制到需要打包的目录下。

所以只能手动实现一个 webpack 插件。过程倒还算轻松，主要是需要了解插件的原理，了解 webpack 编译的生命周期，在对应的阶段注入 hook 就好了。先来看代码：

```javascript
const path = require('path');
const childprocess = require('child_process');
// 以当前目录找到PC端的src路径
const baseDir = path.resolve(__dirname, `../../../../app`);
const pluginDirs = childprocess.execSync(`ls ${baseDir}`);
// 找出所有PC目录下的各个模块
const plugins = pluginDirs
  .toString()
  .split('\n')
  .map(x => x.trim())
  .filter(Boolean)
  .map(pluginName => path.resolve(baseDir, `${pluginName}/src`));
module.exports = class AutoCopyPlugin {
  apply(compiler) {
    // 在编译后异步执行的 hook
    compiler.hooks.afterCompile.tapAsync(
      'add-extra-watch-dirs',
      (compilation, callback) => {
        // 找出当前编译的上下文依赖并加入 PC 下的 plugin 目录
        const contextDependencies = [...compilation.contextDependencies].concat(
          plugins
        );
        contextDependencies.forEach(context => {
          // 注意 compilation.contextDependencies 实际是 Set 实例，所以这里用 add 进行添加
          compilation.contextDependencies.add(context);
        });
        callback();
      }
    );
    // 监听模式下，在下次编译前执行的异步 hook
    compiler.hooks.watchRun.tapAsync(
      'add-extra-watch-dirs',
      (compiler, callback) => {
        try {
          // 这是最关键的地方，mtimes 能够给出哪个文件产生了变动以及变更时的时间戳
          const fileWatcher = compiler.watchFileSystem.watcher.mtimes;
          const changedFiles = [];
          Object.keys(fileWatcher).forEach(sourceFile => {
            // 判断文件是否是属于 PC 目录下的，是则加入待复制列表
            if (sourceFile.startsWith(baseDir)) {
              changedFiles.push(sourceFile);
              // 根据原文件变更路径，构造 Mobile 端对应目录
              const distFile = sourceFile
                .split('/app/')
                .join('/envloader/mobile/plugins/app/');
              // 执行复制命令
              const cmd = `cp ${sourceFile} ${distFile}`;
              childprocess.execSync(cmd);
            }
          });

          // 当有文件变更时，控制台输出对应变更的文件
          if (changedFiles.length) {
            console.log('同步成功: ' + changedFiles.join('\n'));
          }
        } catch (e) {
          console.error(e);
        }
        callback();
      }
    );
  }
};
```

在 webpack.config.js 中引入 `new AutoCopyPlugin()`，然后在 watch 模式下执行，就能愉快的写代码了。这里还有一个好处是，相比手动同步，我们只需要同步变更的文件而不是整个目录，这对提高编译速度也有一定帮助。

### 总结

经过一番折腾，总算是能够做出一个可用的版本了。虽然代码目前缺少抽象，不能够很好的移植，但是最大的收获还是在于探索的过程。遇到问题时，尽量考虑能不能通过工具来解决，还有就是不了解的地方要多翻文档。在编写 webpack 插件时还有个痛点是，写的代码在 node 环境下执行，调试起来不是特别方便。所以预定下一期文章是如何愉快地调试 node 代码。
