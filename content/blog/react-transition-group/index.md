---
title: React 过渡
date: '2020-06-01 23:21'
description: '通过研究 react-transition-group 库来了解react中如何实现丝滑的过渡效果'
tags: ['React', 'transition']
---

### 前言

笔者最近在做移动端的项目，项目经理某天给我发了一个链接[panel-stack](https://blueprintjs.com/docs/#core/components/panel-stack)，我试用了一下感觉蛮不错的，每层（stack）切换时非常丝滑。在我们的项目中，针对路由做了一层包装，当用户点击链接时，我们会在dom上append该链接指向页面的节点，而原页面的节点不会被销毁。这样做的好处是，可以记住原页面的滚动位置、交互状态，但不好的地方是用户刷新页面时只会记录最近一个链接，这样之前的元素就丢失了。

简单的路由实现：
```javascript
TODO: 
```