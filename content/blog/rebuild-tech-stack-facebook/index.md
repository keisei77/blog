---
title: Facebook.com 新网站的技术栈
date: '2020-06-19 23:42'
description: '本文主要介绍 Facebook.com 新网站的技术栈的细节'
tags: ['Tech Stack']
---

### 前言

Facebook.com 在 2004 年发布时还是简单的服务端渲染的 PHP 网站。随着时间的发展，陆续增加了许多新的技术来提供更好的体验：每个新的功能都使得网站变慢而且变得更难维护。后来就难以增加新的功能了。像黑暗模式、保存信息流的位置，没有直接的技术方案来实现。

当开始思考如何为现代浏览器构建新的 web 应用，同时带来用户期待的新功能时，之前的技术栈不能够带来类 APP 的体验和性能。Facebook 的团队开始采用 [React](https://reactjs.org/) 和 [Relay](https://relay.dev/) 来重新设计架构。

### 原文

<https://engineering.fb.com/web/facebook-redesign/>
