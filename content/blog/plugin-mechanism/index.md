---
title: 前端插件机制的探索
date: '2020-05-12 23:09'
description: '前端工具如今基本都提供了插件机制，尤其以webpack著称，那么这种机制是如何实现的呢？'
tags: ['plugin mechanism']
---

### 概述

插件架构宏观上来讲就是一种框架能够在确定的点上执行外部的代码，而不需要提前知道这部分代码的细节。

它既可以很简单，也可以很复杂。我们可以编写 webpack 插件，也可以开发 vs code 的插件，其基本架构是相似的。

开发插件需要遵循一些约定，就像网络传输需要协议。它们必须能够被主进程以某种方式获取并使用。通常最初的开发者会发布一些接口或开发套件，允许其他的开发者对原系统开发插件，提供新的能力。

插件架构是开放封闭原则（OCP）的一种开发原则的体现，表明系统对拓展开放，对修改封闭。插件架构解决了不需要修改核心系统代码而可以对系统增加一些额外的功能特性，只需要一些额外的代码。插件可以单独开发，单独测试。

### 案例学习 Rollup

最近公司的部分项目开始采用 rollup 工具打包，笔者也在个人项目中开始上手使用。简单来说，配置项要比 webpack 相对来说简单一些，但是要注意 rollup 主要是为打包模块而生，并且代码需要使用 ES6 及以上的标准编写。

常见的 rollup 配置：

```javascript
export default [
  {
    input,
    output: { file: 'build/greymon.js', format: 'umd', name, globals },
    external: Object.keys(globals),
    plugins: [
      nodeResolve(),
      babel(getBabelOptions()),
      commonjs(commonjsOptions),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      sizeSnapshot(),
    ],
  },

  {
    input,
    output: { file: 'build/greymon.min.js', format: 'umd', name, globals },
    external: Object.keys(globals),
    plugins: [
      nodeResolve(),
      babel(getBabelOptions()),
      commonjs(commonjsOptions),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      sizeSnapshot(),
      uglify(),
    ],
  },

  {
    input,
    output: { file: pkg.module, format: 'esm' },
    external,
    plugins: [babel(getBabelOptions()), sizeSnapshot()],
  },
];
```

可以看到 rollup 可以输出多种模块依赖方式，而只需指定 `input, output, external, plugins` 等。

那么我们就来看一下 rollup 的 `plugins` 是怎么实现的。
