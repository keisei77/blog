---
title: 【译】Facebook.com 新网站的技术栈
date: '2020-06-19 23:42'
description: '本文主要介绍 Facebook.com 新网站的技术栈的细节'
tags: ['Tech Stack']
---

## 前言

Facebook.com 在 2004 年发布时还是简单的服务端渲染的 PHP 网站。随着时间的发展，陆续增加了许多新的技术来提供更好的体验：每个新的功能都使得网站变慢而且变得更难维护。后来就难以增加新的功能了。像黑暗模式、保存信息流的位置，没有直接的技术方案来实现。

当开始思考如何为现代浏览器构建新的 web 应用，同时带来用户期待的新功能时，之前的技术栈不能够带来类 APP 的体验和性能。Facebook 的团队开始采用 [React](https://reactjs.org/) 和 [Relay](https://relay.dev/) 来重新设计架构。

## 开始

虽然之前通过服务端渲染来呈现给用户更快的响应时间，但是可能不会带来更具交互的体验。Facebook 团队着手开始采用客户端渲染并且致力于保证更快的启动时间。

开始构建客户端应用时，需要找出合适的方式方法：

1. **越小越好，越早越好。** 应该只发布需要的资源，应该在需要之前就准备就绪。
2. **工程经验服务于用户体验。** 开发的最终目的是为了用户使用网站。通过思考 UX 的挑战，可以采纳这些经验来指导工程师做正确的事情。

基于以上原则来对网站的：CSS, JavaScript,data 和 导航进行改进。

## 重新思考 CSS 解锁新能力

通过改变如何编写和构建样式，减少了首页 80%的 CSS 代码。在新网站上，CSS 呈现的并不是代码所写的那样。通过在组件内编写类 CSS 的 JavaScript 代码，并采用构建工具将这些样式分割为独立的、优化过的文件。最终，新的网站部署了更少的 CSS，还支持了黑暗模式，动态显示字体大小，并且提高了图片的渲染性能。同时开发体验也得到了提高。

### 生成原子 CSS 减少了首页 80%的 CSS

旧的首页网站上加载了压缩过的超过 400KB 的 CSS 代码（未压缩有 2MB），但首页初始渲染时真正用到的只有 10%。

在编译时生成原子 CSS 来解决此问题。原子 CSS 只需要增加特殊的样式声明，而不需要实现新功能时都增加重复的样式代码。通过组合生成过的原子 CSS，可以使网站加载单个更少的可共享的样式文件。作为结果，新的首页 CSS 下载文件大小比之前少了 20%。

### 搭配样式减少未使用的 CSS 并使其更易维护

CSS 持续增长的另一个原因是随着时间的推移，很难去检测哪些 CSS 是仍然在使用的。原子 CSS 帮助迁移性能受影响的部分，但是一些唯一的样式仍然占了非必需的字节。通过与组件的搭配，可以放心将未使用的样式删除，而在编译时再分离。

另一个面临的问题是：CSS 优先级依赖顺序，在自动化打包时很难去管理。在一个文件中改动了样式很可能不可预见的破环了另一处地方的样式。该团队采用了 React Native 样式 API 的类似方式：保证样式在一个稳定的顺序，并且不支持 CSS 后代选择器。

### 改变字体大小来获取更好的可访问性

离线构建步骤也促使了可访问性的更新。在许多现代网站，用户通过使用浏览器的放大功能来缩放字体，这可能意外触发了平板或手机的重新布局，或增加了一些他们并不想要的元素的大小，如图片。

通过使用 rem,可以根据用户设备的尺寸来获取特定的字体大小。并能够提供控制自定义字体大小的功能而不需要更改样式文件。通常设计稿都是以 CSS 像素为单位，如果手动转换为 rem 可能会出错，并且还会增加额外的负担，所以需要构建工具来进行自动转换。

### 构建时的处理

源码实例：

```jsx
const styles = stylex.create({
  emphasis: {
    fontWeight: 'bold',
  },
  text: {
    fontSize: '16px',
    fontWeight: 'normal',
  },
});

function MyComponent(props) {
  return <span className={styles('text', props.isEmphasized && 'emphasis')} />;
}
```

构建生成的 CSS：

```css
.c0 {
  font-weight: bold;
}
.c1 {
  font-weight: normal;
}
.c2 {
  font-size: 0.9rem;
}
```

构建生成的 JavaScript：

```javascript
function MyComponent(props) {
  return <span className={(props.isEmphasized ? 'c0 ' : 'c1 ') + 'c2 '} />;
}
```

### CSS 变量支持主题（黑暗模式）

在旧的网站，应用主题的方式是在 body 元素上增加一个 class 名称，然后使用该名称去覆写现有的样式规则来获得更高的优先级。这种方式存在一些问题，并且不适合当前的 CSS-in-JavaScript 的方式，所以采用了[CSS 变量](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)的方式来实现主题。

CSS 变量在一个 class 内部定义，当该 class 应用到 DOM 元素时，它的值会在当前节点及子节点上应用这些样式规则。这可以使得将主题组合到一个单个的样式文件中，切换不同的主题不需要重新加载页面，不同的页面也可以有不同的主题而且不需要下载额外的 CSS。

```css
.light-theme {
  --card-bg: #eee;
}
.dark-theme {
  --card-bg: #111;
}
.card {
  background-color: var(--card-bg);
}
```

### SVGs 在 JavaScript 中提供快速的渲染性能

为了防止图标在内容加载完后可能会闪烁一下，现在将 SVGs 内联到 HTML 节点上而不是将 SVG 文件传到<img>标签中。因为现在 SVGs 在 JavaScript 中非常高效，可以被使用到的组件一次性加载出。与 JavaScript 同时加载的好处要大于 SVG 绘制性能的损耗。通过内联的方式，不会存在图标闪烁的问题。

```jsx
function MyIcon(props) {
  return (
    <svg
      {...props}
      className={styles({
        /*...*/
      })}
    >
      <path d="M17.5 ... 25.479Z" />
    </svg>
  );
}
```

此外这些图标可以丝滑改变颜色不需要额外的下载资源。可以通过 props 来对图标进行样式的更新，通过结合 CSS 变量可以对特定的图标进行主题化的显示，尤其是那些单色的图标。

![light mode](1.-Home-Setting-Light-Mode.webp)

![dark mode](2.-Home-Setting-Dark-Mode.webp)

### JavaScript 代码分割提高性能

单页面应用中 JavaScript 代码大小是最需要衡量的指标之一，它对于页面加载的性能起着非常大的作用。

### 当需要时再发布所需的增量代码

当用户等待页面加载时，首先立即反馈给用户一个当前渲染页面的骨架屏。骨架屏只需要非常少的资源，但是如果将代码都打包到一个单文件中，那就没有办法提前渲染了。需要根据该页面显示的内容顺序将代码分割到多个文件中。但是，如果真的简单这么做（即通过渲染时[动态加载](https://github.com/tc39/proposal-dynamic-import)代码），这可能会损失而不是提高性能。Facebook 团队对于 JavaScript 加载定义了优先级：通过声明式的、静态分析的 API 将 JavaScript 代码的加载分为 3 个等级。

一级是最基本的开屏画面的布局，包括初次加载中状态的 UI 骨架屏：

![skeleton](3.-Tier-1.webp)

一级使用标准的 `import` 语法：

```javascript
import ModuleA from 'ModuleA';
```

二级包含页面渲染所需的所有 JavaScript。经过二级加载，当前页面上应该没有任何代码加载导致的视觉变化。

![full content](4.-Tier-2.webp)

```javascript
importForDisplay ModuleBDeferred from 'ModuleB';
```

一旦遇到 `importForDisplay` ，它和它的依赖被移到等级 2。当它加载完会返回一个 promise 包装的结果提供模块的访问。

三级包含任何不需要影响当前渲染结果的代码，如日志代码、实时更新数据的订阅。

```javascript
importForAfterDisplay ModuleCDeferred from 'ModuleC';

// ...

function onClick(e) {
  ModuleCDeferred.onReady(ModuleC => {
    ModuleC.log('Click happened! ', e);
  });
}
```

同样当遇到 `importForAfterDisplay` 时，它和它的依赖被移到等级 3。当它加载完会返回一个 promise 包装的结果提供模块的访问。

一个 500KB 的 JavaScript 页面可能会有 50KB 在一级，150KB 在二级，300KB 在三级。通过这种方式的代码分割，可以提高首屏渲染的时间。

### 只在需要时加载实验性的依赖

有时会需要渲染相同 UI 的两个版本，如在 A/B 测试中。最简单的方式是为所有用户提供两种版本的代码下载，但这意味着会下载一些从不会执行的代码。一个稍微好一点的方式是在渲染时动态加载，但这可能会变慢。

根据越小越好，越早越好的原则，Facebook 团队开发了声明式的 API 来警示开发者尽早做出决定并且将这些代码编码到依赖图中。一旦页面加载时，服务器去检测实验性的功能并只响应对应版本的代码。

```javascript
const Composer = importCond('NewComposerExperiment', {
  true: 'NewComposer',
  false: 'OldComposer',
});
```

这对如 A/B 测试、国际化或者不同设备对不同的用户加载页面时是非常有效的。

### 只在需要时加载数据所需的依赖

某些不是静态文件的代码应该如何加载呢？例如，为所有不同的类型去请求所有的渲染代码然后在结合信息流卡片组件渲染可能会使页面的 JavaScript 代码爆炸。

这些依赖取决于运行时后端返回的数据。通过[Relay](https://github.com/facebook/relay)的功能来根据返回的数据决定哪些渲染代码是必要的。如果某条数据有特殊的附件，如图片，那么就需要 PhotoComponent 来渲染该图片。

```graphql
... on Post {
  ... on PhotoPost {
    @module('PhotoComponent.js')
    photo_data
  }
  ... on VideoPost {
    @module('VideoComponent.js')
    video_data
  }
}
```

## 尽可能早地请求数据

Facebook.com 现在采用 Relay 结合 GraphQL 来请求所有的数据。

### 在初始化服务器请求时预加载数据来提高响应时间

许多 web 应用需要等到所有 JavaScript 下载完成并执行之后再去向服务端请求数据。结合 Relay，可以静态分析出页面需要的数据。这就是说一旦服务端接收到请求，就可以立即开始准备所需的数据并通过所需的代码并行下载数据。将数据以流式传输客户端可以避免额外的往返延时并且尽早渲染出最终内容。

### 流式数据减少往返时延尽快呈现

当加载完页面时，有些内容可能最初是被隐藏的或者渲染到视窗外的。例如，许多屏幕下能显示 1-2 条信息流，但是并不知道能适配多少条。此外，当页面滚动时可能会有一系列的请求来获取数据。另外如果在一条 query 语句中获取越多的数据，响应就会更慢，这会导致更长的查询时间和更久的视觉呈现时间。

为解决此问题，采用了 GraphQL 的内部扩展，`@stream`，客户端连接信息流来获取初始加载和后续滚动分页的数据。这样可以在一个查询语句中挨个发送每条数据。

```graphql
fragment HomepageData on User {
  newsFeed(first: 10) {
    edges @stream
  }
  ...AdditionalData
}
```

### 延迟非必需的数据请求

不同的查询可能会比其他用时更久。例如，查看个人信息，相对来说查询用户昵称和头像比较快，而获取个人的时间线内容会更久。

在单个查询条件中获取不同部分的数据，使用 `@defer` 关键字，这可以使不同部分数据一旦准备好就流式返回。这可以拿到初始数据尽快渲染出 UI，然后后续的数据先已 loading 的形式展示。结合 [React Suspense](https://reactjs.org/docs/concurrent-mode-suspense.html)，可以更顺畅地从 loading 状态自顶向下展示页面内容。

```graphql
fragment ProfileData on User {
  name
  profile_picture { ... }
  ...AdditionalData @defer
}
```

## 定义路由以快速跳转

快速跳转对单页应用来说是重要的功能之一。当跳转到一个新的路由，需要向服务端获取各种代码、数据来渲染页面。为了减少每次加载新页面的往返时延，客户端需要提前知道每个路由所加载的资源。

### 尽早请求资源

对客户端渲染的应用来说等待 React 渲染完成是非常常见的。通常可以使用 [React.lazy](https://reactjs.org/docs/code-splitting.html#reactlazy) 来实现懒加载。这会使页面跳转变慢，相反在点击发送资源请求之前就开始预加载：

![preload](Comet-01.webp)

提前开始请求，当 hover 或 focus 时预加载（preload），鼠标按下去时发起请求（fetch）。

为了提供更流畅的跳转体验，使用[React Suspense transitions](https://reactjs.org/docs/concurrent-mode-patterns.html#transitions) 来继续加载前一页面直到显示下页面的 loading 状态或渲染完成的新页面。

### 并行加载代码和请求数据

如果懒加载某路由的代码然后在发起数据请求，那么会出现链式加载。

![linked load](Comet-02.webp)

为了解决此问题，Facebook 提出了 EntryPoints，它们是包装代码分割点并将输入转换为查询的文件。这些文件非常小，并且在任何代码拆分点处都可以提前下载。

![parallel load](Comet-03-1.webp)

GraphQL 查询仍与视图位于同一位置，但是 EntryPoint 封装了何时需要该查询以及如何将输入转换为正确的变量。 web 应用使用这些 EntryPoints 来自动决定何时获取资源。

## 原文

<https://engineering.fb.com/web/facebook-redesign/>
