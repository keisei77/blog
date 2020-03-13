---
title: 高性能前端架构
date: '2020-03-12 21:02'
description: '本文将从几个方面来介绍如何构建高性能架构'
tags: ['Architecture', 'Performance']
---

本文来介绍一些能够使 Web 应用加载更快，用户体验更好的技术。

从整个前端架构来看，如何能够第一时间加载最需要的资源，最大化利用已经缓存过的资源？

在此我们不会阐述过多如何优化渲染时间以及后端应如何分发资源。

### 概览

我们将应用的加载分为三个不同的阶段：

1. 初始化渲染 - 在用户看到任何画面之前需要加载多长时间？
2. 应用加载 - 在用户能够使用之前需要加载多长时间？
3. 下一页 - 在跳转到下一页时需要加载多长时间？

![performant frontend architecture](performant-front-end-architecture.png)

### 初始渲染

在浏览器初始渲染之前用户看不到任何东西。渲染页面至少需要加载 HTML 文档，而且大多数还需要加载额外的资源，如 CSS 和 JavaScript 文件。一旦这些资源可用，浏览器开始在屏幕上渲染画面。

网站的请求瀑布流大概如下：

![gov uk initial render](gov-uk-initial-render.png)

这个 HTML 文档加载了大量额外的文件，一旦加载完成页面开始渲染。注意到 CSS 文件是并行加载的，所以每个新的请求不会增加非常明显的延迟。

（gov.uk 现在启用了[HTTP/2](https://twitter.com/TheRealNooshu/status/1225403389158227971)，所以当前域名下的资源可以重新利用现有的连接。）

#### 减少阻塞渲染的请求

样式文件和（默认）脚本元素会阻塞渲染任何在它们下面的内容。

可以有几种方式来解决：

- 在 body 最底部放置 script 标签
- 通过 `async` 来异步加载脚本
- 如果需要同步加载可以通过 inline 方式拆入 JS 或 CSS 片段

#### 避免阻塞渲染的顺序请求链

网站加载慢与阻塞渲染的请求数量关系不是特别大，更重要的是每个资源的文件大小，并且浏览器何时去加载该资源。

如果浏览器发现它在另一个请求完成后才需要加载某文件，这就形成了一个同步请求链。可能会有几种原因：

- CSS 中使用了 @import
- 在 CSS 文件中引用了 Web 字体
- JavaScript 注入了链接或 script 标签

可以看下面的例子：

![circle ci request chain](circle-ci-request-chain.png)

该网站 CSS 文件中使用了 @import 来加载 google 字体，就意味着浏览器需要从一个文件请求另一个文件：

1. HTML 文档
2. 应用 CSS
3. 谷歌字体 CSS
4. 谷歌字体 Woff 文件（瀑布流中没显示）

要解决这个问题，首先从 @import 引入的谷歌字体 CSS 文件迁到 HTML 文档的 link 标签中。这从请求链中减少了一个链接。

为了更快，可以直接将谷歌字体 CSS 文件内容插入 HTML 中，或应用的 CSS 文件中。

有时无法消除请求链。在这种情况下，考虑使用预加载或预链接标签。例如，上面的网站可以在实际的 CSS 请求发生前先连接 fonts.googleapis.com。

#### 重复利用服务器连接来加速请求

建立一个新的服务器连接通常需要在浏览器和服务器之间往返 3 次：

1. DNS 检索
2. 建立 TCP 连接
3. 建立 SSL 连接

一旦连接完成，在发送请求和下载响应时至少还需要一次或多次往返。

下面瀑布流显示了创建了 4 个不同的连接：
hostgator.com, optimizely.com, googletagmanager.com, and googelapis.com

然而，随后在同一服务器的请求可以重新利用已经建立的连接。所以加载 base.css 或 index1.css 是很快的，因为它们也存在于 hostgator.com 上。

![hostgator render blocking](hostgator-render-blocking.png)

#### 减少文件大小并使用 CDN

除了文件大小，还有另外两个可控的因素会影响请求时间：资源的大小和服务器的路径。

尽量发送小的数据给到用户，并保证它是压缩过的（通过 brotli 或 gzip）。

内容分发网络是在各地提供了大量的服务器，其中某个服务器的位置可能是位于用户最近的地点。用户可以连接到距离他们更近的 CDN 服务器而不是网站的中心服务器。意味着服务器往返的时间会更少。对于一些静态的资源如 CSS，JavaScript 和图片是很方便的，因为它们容易部署。

#### 通过 service worker 跳过网络请求

Service worker 允许在通过 network 发送之前劫持请求。意味着可以在初次请求过后存档资源文件。

![service worker](service-worker.png)

当然，仅当不需要网络发送响应时，此方法才会有效。用户需要缓存过响应内容，在第二次加载应用时才会有更好的体验。

下面的 service worker 缓存了渲染页面所需的 HTML 和 CSS。当应用再次加载时，它会尝试去提供缓存过的资源，并在不可用时会回退至网络请求。

```javascript
self.addEventListener('install', async e => {
  caches.open('v1').then(function(cache) {
    return cache.addAll(['/app', '/app.css']);
  });
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
```

查看更多关于[通过 service worker 预加载和缓存资源](https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker)。
