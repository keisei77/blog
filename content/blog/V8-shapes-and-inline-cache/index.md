---
title: JavaScript 引擎基础：Shapes 和 Inline Caches
date: "2019-11-18 22:51"
description: "了解 JavaScript 引擎基本的工作原理，可以帮助我们写出更加高性能的代码。"
tags: ["javascript engines", "V8", "shapes", "inline caches", "fundamentals"]
---

## JavaScript 引擎管道

当加载到我们所写的 JavaScript 代码，JavaScript 引擎开始解析源代码，并把它转换成抽象语法树（AST）。基于 AST，解释器开始工作并转换成二进制代码。此时引擎开始真正执行我们的 JavaScript 代码。

![js engine pipeline](js-engine-pipeline.svg)

为了让代码运行得更快，字节码可以与分析数据一起发送到优化编译器，基于分析到的数据做出一些假设，然后编译出高度优化的机器码。

如果在某个节点的假设出错，优化编译器会造成负优化，并回退到解释器。

### 解释器/编译器 在 JavaScript 引擎中的管道

我们来放大管道流中真正执行 JavaScript 代码的部分，即代码被解释和优化，并解决主要引擎中存在的差异的地方。简单来讲，这里管道流包含解释器和优化编译器。解释器快速将源码生成未优化的二进制码，优化编译器花更多一点的时间生成高度优化的机器码。

![interpreter optimizing compiler](interpreter-optimizing-compiler.svg)

这种通用的管道流 V8 在 Chrome 和 Node.js 中是如何工作的：

![interpreter optimizing compiler v8](interpreter-optimizing-compiler-v8.svg)

解释器在 V8 中被称作点火器，它的作用是生成和执行二进制码。当开始执行二进制码时，它会收集分析的数据，用来加速未来的执行速度。当一个函数经常被执行，就会变成一个热函数，这部分二进制码和分析的数据会被传递给涡轮风扇--我们的优化编译器，基于分析的数据来生成高度优化的机器码。

## JavaScript 对象模型

让我们来看一下 JavaScript 引擎共性的方面是如何实现的。例如，JavaScript 对象模型是如何实现的，有哪些方式来加快属性的访问。

ECMAScript 规范定义了所有对象都是字典，[属性的键值](https://tc39.es/ecma262/#sec-property-attributes)都是字符串类型。

![object model](object-model.svg)

除了 `[[Value]]` 以外，规范还定义了如下属性：

- `[[Writable]]` 决定了属性可以重新赋值，
- `[[Enumerable]]` 决定了属性可以通过 `for-in` 迭代，
- `[[Configurable]]` 决定了属性可以被删除。

双方括号看起来新颖，这是规范用来表示属性的并且不直接暴露给 JavaScript。可以通过 `Object.getOwnPropertyDescriptor` API 来获取对象的属性描述符。

```javascript
const object = { foo: 42 };
Object.getOwnPropertyDescriptor(object, "foo");
// -> { value: 42, writable: true, enumerable: true, configurable: true }
```

数组又是如何定义的呢？可以把数组理解为一种特殊的对象。其中一个不同点是数组对索引有特殊的处理逻辑。数组索引在 ECMAScript 规范中是特殊术语。数组在 JavaScript 中允许最多 2³²−1 个元素。数组索引是在 0 至 2³²−2 的任意有效的整数。

另一个不同点是数组有一个魔法的`length`属性。

```javascript
const array = ["a", "b"];
array.length; // -> 2
array[2] = "c";
array.length; // -> 3
```

在这个例子中数组创建时 `length` 为 `2`，当我们给索引 `2` 赋值时，`length` 属性自动更新了。

JavaScript 定义数组和定义对象相似，所有键值包括索引值都是明确的字符串类型。数组的第一个元素存在键 `0` 的下面。

![array 1](array-1.svg)

`length` 只是另一个不可迭代不可删除的属性而已。

一旦一个元素加入数组，JavaScript 会自动更新 `length` 属性的 `[[Value]]` 值。

一般来说，数组的行为与对象非常相似。
