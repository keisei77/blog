---
title: 【译】Koa 对比 Express
date: '2020-02-20 20:31'
description: 'Koa 与 Express 有哪些异同之处'
tags: ['Koa', 'Express']
---

从理念上来说，Koa 意图“修复并取代 node”，而 Express 做的是“增强 node”。Koa 使用 promise 和 async 函数来摆脱回调地狱并简化异常处理逻辑。它暴露了自身的 `ctx.request` 和 `ctx.response` 对象而取代了 node 的 `req` 和 `res` 对象。

Express 从另一方面，通过增加额外的属性和方法增强了 node 的 `req` 和 `res` 对象，并引入了许多框架上的功能，例如路由和模板，而 Koa 没有这么做。

Koa 可以被看作是 node.js 的 `http` 模块的抽象，Express 是 node.js 的应用框架。

| 功能       | Koa | Express | Connect |
| ---------- | --- | ------- | ------- |
| 中间件内核 | ✓   | ✓       | ✓       |
| 路由       |     | ✓       |         |
| 模板       |     | ✓       |         |
| 发送文件   |     | ✓       |         |
| JSONP      |     | ✓       |         |

因此，如果你更倾向于 node.js，喜欢传统的 node.js-style 编码方式，那么可以采用 Connect/Express 或类似的框架。如果想摆脱回调，使用 Koa。

作为不同理念的结果是传统 node.js 中间件，即形如 `(req, res, next)` 的函数，与 Koa 是不兼容的。如果要迁移应用，需要从根本上重写。

### Koa 会取代 Express 吗？

Koa 更像 Connect，但是好多 Express 的优点都移植到了 Koa 的中间件层来帮助构建更强大的基础。这使得不仅是终端应用代码还是整个技术栈在编写中间件时更加友好，更少出错的可能。

通常，当诸如签名的 cookie 之类的功能通常是特定于应用程序而非特定于中间件时，许多中间件会重新实现类似的功能，甚至更糟糕地错误实现它们。

### Koa 会取代 Connect 吗？

并不是，现在生成器允许我们用少量的回调编写代码，只是对类似的功能有着不同的看法。Connect 具有同样的功能，有些人可能仍然喜欢它，这取决于个人爱好。

### 为什么 Koa 不是 Express 4.0？

Koa 与人们所熟知的 Express 大相径庭，设计从根本上有很大的不同，所以从 Express 3.0 到 Express 4.0 的迁移成本意味着要重写整个应用，所以我们认为创建一个新的库是更加合适的。

### Koa 与 Connect/Express 有哪些不同？

#### 基于 Promise 的控制流

- 没有回调地狱
- 通过 try/catch 对错误有更好的处理
- 无需域名

#### Koa 是精简的

- 不像 Connect 和 Express，Koa 本身没有包含任何中间件
- 不像 Express，Koa 不提供路由
- 不像 Express，许多方便的工具没有提供。例如，发送文件。
- Koa 更加模块化

#### Koa 较少依赖中间件

例如，不使用“body 解析”中间件，而是使用一个 body 解析函数

#### Koa 抽象了 node 的 request/response

- 更少黑科技
- 更好的用户体验
- 正确的处理流

#### Koa 路由（第三方库支持）

由于 Express 自带路由，但是 Koa 没有任何内建路由，社区现在有许多如 koa-router 和 koa-route 的库可以使用。同样的，就像 Express 中有 helmet 保障安全性，对于 Koa，我们有可用的 koa-helmet，更多可用的[第三方库](https://github.com/koajs/koa/wiki)可查看。

### 参考

<https://github.com/koajs/koa/blob/master/docs/koa-vs-express.md>
