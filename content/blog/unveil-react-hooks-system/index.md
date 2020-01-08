---
title: 浅析 React Hooks
date: '2020-01-08 23:26'
description: '本文对目前大热的 React Hooks 源码进行简单剖析。'
tags: ['React Hooks']
---

React Hooks 在 React 16.7 版本发布后，在社区掀起了一股新的浪潮，真的是谁用谁都说真香。刚使用 Hooks 时难免会对该机制的原理感到神奇，在遇到问题时，由于它背后复杂的调用栈我们很难进行调试，所以有必要更深层次了解 React Hooks 系统，这样我们遇到问题可以快速定位甚至提前避免。今天我们就来看一下 React 是如何实现的？

![react hooks representation](react-hooks-representation.png)

<center>React hooks 粗略概要</center>

首先让我们来了解一下确保 hooks 在 React 作用域内被调用的机制，因为如果没有在正确的上下文执行 hooks 是没有意义的：

### The dispatcher

dispatcher 是一个包含 hooks 函数的共享的对象。它在 ReactDOM 渲染的时期动态地被分配或被清除，并保证用户在 React 组件外不能访问 hooks（[源码实现](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/ReactFiberHooks.js#L62)）。

dispatcher 在每个和每次 hook 调用时通过 `resolveDispatcher()` 函数来处理（[源码实现](https://github.com/facebook/react/blob/19f6fe170ce920d7183a5620f4e218334c8bac62/packages/react/src/ReactHooks.js#L21)）。

```javascript
let currentDispatcher;

const dispatcherWithHooks = {
  /* ... */
};

function resolveDispatcher() {
  if (currentDispatcher) return currentDispatcher;
  throw Error("Hooks can't be called");
}

function useXXX(...args) {
  const dispatcher = resolveDispatcher();
  return dispatcher.useXXX(...args);
}

function renderRoot() {
  currentDispatcher = dispatcherWithHooks;
  performWork();
  currentDispatcher = null;
}
```

<center>Dispatcher 简单实现</center>
