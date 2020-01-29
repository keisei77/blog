---
title: JavaScript 可视化之变量提升
date: '2020-01-28 10:27'
description: '变量提升以图形化的方式展示，方便理解'
tags: ['JavaScript Visualized', 'Hoisting']
---

什么是变量提升？

> 从概念的字面意义上说，“变量提升”意味着变量和函数的声明会在物理层面移动到代码的最前面，但这么说并不准确。实际上变量和函数声明在代码里的位置是不会动的，而是在编译阶段被放入内存中。([MDN](https://developer.mozilla.org/zh-CN/docs/Glossary/Hoisting))

提升的对象是定义的变量或函数（Declarations），而不是赋值初始化（Initializations）。

当 JS 引擎拿到我们的代码，首先会为我们代码里的数据分配内存。没有代码在此过程运行，只是简单的为执行做准备。函数声明和变量声明的存储方式不同。因为函数也是对象，所以存储的函数是指向函数实际内容的地址引用。

![function](function.gif)

ES6 引入了两个定义变量的新关键字：`let` 和 `const`。变量通过 `let` 或 `const` 声明的被存储为 _未初始化_ 。

![variable](variable.gif)

变量通过 `var` 关键字声明的在存储时有默认值 `undefined`。

![var keyword](var.gif)

现在创建阶段完成，可以真正执行代码了。我们来看一下在文件顶部在函数或任何变量声明之前执行 3 个 console.log 表达式会发生什么。

由于函数是指向实际函数体的引用，我们可以在创建它们那一行之前运行。

![invoke functions](invoke.gif)

当我们遇到变量通过 `var` 关键字声明的代码时，它们简单的返回存储的默认值：`undefined`。然而这通常不是我们所期望的。

![var hoisting](var-hoisting.gif)

为了防止意外引用了 `undefined` 变量，可以使用 `const` 关键字，当我们访问 _未初始化_ 的值时会抛出 `ReferenceError` ，这被称为**暂时性死区**：不能在变量初始化之前使用。

![temporal dead zone](tzd.gif)

当引擎执行到我们真正声明变量的那行代码时，在内存中的值会被实际的值覆盖。

![overwritten](overwritten.gif)

快速回顾：

- 函数和变量在执行代码前先作为执行上下文存储在内存中
- 函数存储了函数体的引用，变量通过 `var` 声明的默认值为 `undefined`，`let` 和 `const` 声明的默认值为 _未初始化_ 。

### 参考

<https://dev.to/lydiahallie/javascript-visualized-hoisting-478h>
