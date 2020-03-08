---
title: 使用 Next.js + Puppeteer + heroku 构建爬虫 Web APP
date: '2020-03-08 22:46'
description: '了解如何利用免费资源来实现微型爬虫 Web 应用并记录遇到的一些坑'
tags: ['Crawler', 'Next.js', 'Puppeteer']
---

### 背景

我之前每天都会去腾讯新闻页面上去关注有关疫情发展的当日的数据状况，久而久之就感觉该页面不够精简，而且路径过长，需要二次点击才能看到主页面。那么就干脆直接去拿他们的数据来自己做个[页面](https://small-ideas.herokuapp.com/)好了，仓库地址：。
目前没有 UI，只是简单排了序。后续根据心情在做样式上的改进吧。

### 前期分析

当我开始想要去获取腾讯的数据时，首先在疫情动态主页面[https://xw.qq.com/act/qgfeiyan](https://xw.qq.com/act/qgfeiyan)上看了一下浏览器请求，找了一小会发现地图、列表所渲染的数据并不是通过异步的 Ajax 请求的。由于地图用的是 echarts 渲染的，这肯定不是服务端渲染的，所以数据一定藏在某个地方。那么可以尝试通过全局搜索该页面上的唯一数值，如果没有找到，就有可能是在某个文件请求返回的。

经过逐个排查，终于找到原来是通过 JSONP 方式请求的数据[https://view.inews.qq.com/g2/getOnsInfo?\_t=0.12532683853215&name=disease_h5&callback=\_\_jpcb1](https://view.inews.qq.com/g2/getOnsInfo?_t=0.12532683853215&name=disease_h5&callback=__jpcb1)，可以看到通过这种方式解决了跨域问题：
![jsonp](jsonp.png)

注意截图中的\_t 参数为类似时间戳的数据，callback 为回调函数。由于我们只是需要他返回的数据，而不关心回调函数的执行，所以我索性去掉了 callback 参数，发现该请求仍能返回数据，并且是 json 格式！正好符合了我们的预期。

### 搭建应用

有了接口，那么开发页面就是信手拈来的事情。在之前曾经了解过 [Next.js](https://nextjs.org/) 这个 React SSR 框架，并且了解到该公司还免费部署个人应用，并提供免费的域名使用。于是就开始了轻松的开发之旅。

Next.js 提供了一个页面渲染前先获取初始化数据的 API：[getInitialProps](https://nextjs.org/docs/api-reference/data-fetching/getInitialProps)，该函数会在 nodejs 环境下运行，把请求的数据通过 props 的方式注入到调用该 API 的组件内。

```javascript
import fetch from 'isomorphic-unfetch';

function Page({ stars }) {
  return <div>Next stars: {stars}</div>;
}

Page.getInitialProps = async ctx => {
  const res = await fetch('https://api.github.com/repos/zeit/next.js');
  const json = await res.json();
  return { stars: json.stargazers_count };
};

export default Page;
```

来自官网的例子，通过几行代码我们就可以拿到需要的数据，然后简简单单的做个表格就可以直观看到疫情发展啦。

![snapshot](snapshot.png)

### 新的挑战

上线几天后，发现国内的数据是每日更新的，但是国外的数据却停留在了某一天。感觉腾讯耍了一点小心机。于是我投身另一平台：丁香园疫情动态页面[https://ncov.dxy.cn/ncovh5/view/pneumonia_peopleapp?from=timeline&isappinstalled=0](https://ncov.dxy.cn/ncovh5/view/pneumonia_peopleapp?from=timeline&isappinstalled=0)。该页面也是类似腾讯展示了国内和国外的疫情发展状况。而我所需要的数据正是国外的数据，那么对丁香园的页面，我们有需要重新去查找他们的数据来源情况。

经过一番查找，发现该页面既没有通过 Ajax 请求，也没有通过 JSONP 的方式，最终确认数据是服务端直接输出到 html 中了。

![dingxiang](dingxiang.png)

那么这种直接写在 html 中的数据该如何获取呢？

我考虑了几种方式：

- 获取 html 的 text 文本然后通过正则匹配
- 通过[cheerio](https://github.com/cheeriojs/cheerio)来根据 script 标签来获取
- 使用无头浏览器直接访问该 html

正则匹配比较原始，而且应该会有性能问题，暂不考虑。cheerio 以类似 jQuery 的方式来获取节点，我有做过尝试但是感觉不够新颖，因此也未继续实践。
正巧之前也关注过无头浏览器相关的概念，即在服务端运行一个没有界面的浏览器，业内最知名的应该是[phantomjs](https://phantomjs.org/)。[Puppeteer](https://pptr.dev/)最近是越来越火，毕竟谷歌家的东西比较有保障，所以采用了 Puppeteer 来跑丁香园的页面。

// TODO: nextjs serverless 编译为函数，不支持 custom server

// 寻求 heroku，并安装 https://buildpack-registry.s3.amazonaws.com/buildpacks/jontewks/puppeteer.tgz

// TODO: cross-env

// sentry

### 将来打算

希望能把后端独立出一个仓库，这样前后端可以分开部署。

[heroku](http://heroku.com/)
