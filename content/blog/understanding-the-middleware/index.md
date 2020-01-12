---
title: 了解中间件
date: '2020-01-12 22:07'
description: '了解中间件的概念'
tags: ['middleware']
---

最近在看 Redux 文档，了解了 redux 的工作原理，发现 action 只能同步被 dispatch，那有没有办法执行异步调用呢？答案是通过中间件来实现。
