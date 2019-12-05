---
title: webpack 基本原理
date: '2019-12-04 22:33'
description: '本文主要介绍了对webpack的初步认识以及内部的工作原理。'
tags: ['webpack']
---

## 简介

现代化的前端应用离不开打包工具，从早期人们所熟知的 Grunt, Gulp 到现在炙手可热的 webpack, rollup 等，这些工具的崛起使得我们的代码构建更加方便，通过 Loader，插件等机制我们可以应用最新的技术，如新语法，预处理 CSS（Scss, Less），热更新方便了开发体验，摇树（Tree Shaking）减少打包体积等。

今天主要以 webpack 为例来了解打包工具发展至今是如何工作的，又通过哪些方式为我们提供了更多能力。

## 工作原理

webpack 按其官方介绍，是一款静态资源打包器。在 webpack 的世界，所有的资源（JavaScript，图片，CSS，字体文件等）都是模块（module），在执行时，webpack 从[入口](https://webpack.js.org/concepts/entry-points/)开始分析所依赖的模块，然后递归处理依赖模块的依赖，最终生成一个[依赖图](https://webpack.js.org/concepts/dependency-graph/)。
