---
title: webpack 内联 runtimeChunk 至index.html
date: '2020-10-13 22:26'
description: '将 webpack 运行时代码抽到单独的文件，并内嵌至 index.html 中'
tags: ['webpack']
---

### 背景

最近在公司做移动端项目优化的工作，目前主要的重心放在了打包体积优化上。目前项目中采用了 webpack 4，实际上已经为我们提供了诸多方便的配置能力进行打包优化。

### 抽离 webpack 运行时代码

将 optimization.runtimeChunk 设置为 true 或 'multiple'，会为每个只含有 runtime 的入口添加一个额外 chunk。此配置的别名如下：

#### webpack.config.js

```javascript
module.exports = {
  //...
  optimization: {
    runtimeChunk: {
      name: entrypoint => `runtime~${entrypoint.name}`,
    },
  },
};
```

值 "single" 会创建一个在所有生成 chunk 之间共享的运行时文件。此设置是如下设置的别名：

#### webpack.config.js

```javascript
module.exports = {
  //...
  optimization: {
    runtimeChunk: {
      name: 'runtime',
    },
  },
};
```

通过将 optimization.runtimeChunk 设置为 object，对象中可以设置只有 name 属性，其中属性值可以是名称或者返回名称的函数， 用于为 runtime chunks 命名。

默认值是 false：每个入口 chunk 中直接嵌入 runtime。

### 内联

将运行时代码剥离的优势是，不需要在每个 chunk 中都打包运行时代码。结合 `HtmlWebpackPlugin` 的 chunks 属性可以将 runtimeChunk 以 script 标签的形式引入，不过会多发一次请求，更推荐的做法是将 runtimeChunk 打包至 index.html 中。

`create-react-app` 中的子包 [`react-dev-utils`](https://github.com/facebook/create-react-app/tree/master/packages/react-dev-utils) 中提供了一些 webpack 插件，其中 [`InlineChunkHtmlPlugin`](https://github.com/facebook/create-react-app/blob/master/packages/react-dev-utils/InlineChunkHtmlPlugin.js) 就可以满足上述的需求：

#### webpack.config.js

```javascript
var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');

// webpack config
var publicUrl = '/my-custom-url';

module.exports = {
  output: {
    // ...
    publicPath: publicUrl + '/',
  },
  // ...
  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin({
      inject: true,
      template: path.resolve('public/index.html'),
    }),
    // Inlines chunks with `runtime` in the name
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime/]),
    // ...
  ],
  // ...
};
```

> 注意: HtmlWebpackPlugin 和 InlineChunkHtmlPlugin 需要串联使用，并且需要 HtmlWebpackPlugin >= 4.x 版本。
