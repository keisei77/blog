---
title: JavaScript 可视化之事件循环
date: '2020-01-25 20:45'
description: '事件循环以图形化的方式展示，方便理解'
tags: ['Event Loop']
---

事件循环大概是每个 JavaScript 初学者都会感到困惑的概念。本文将通过可视化的方式来尽量对该概念作详细的解释。

我们来首先了解一下什么是事件循环，以及我们为什么要关心它？

JavaScript 是**单线程**的：任何时候都只能执行一个任务。这通常没有太大的问题，但当要执行一个 30 秒的任务时，我们只能等待任务执行完毕才能继续别的任务（JavaScript 在浏览器中默认运行在主线程，所以整个 UI 就卡住了）。已经 2020 年了，没人愿意访问慢的，失去响应的网站。

幸运的是，浏览器给了我们 JavaScript 引擎没有提供的功能：Web API。包含 DOM API，`setTimeout`，HTTP 请求等等。这可以帮助我们实现异步，非阻塞的需求。

当我们执行函数时，它被放入了调用栈中。调用栈是 JS 引擎的一部分，不是浏览器特有的。它本质是一个栈，一种先入后出的数据结构。当函数返回一个值时，它会从栈顶中弹出。

![call stack](call-stack.gif)

`respond` 函数返回了 `setTimeout` 函数。`setTimeout` 是 Web API 提供的：它允许我们延迟执行任务而不阻塞主线程。传入 `setTimeout` 函数的回调函数 `() => { return 'Hey!' }` 被加入 Web API。与此同时，`setTimeout` 函数和 `respond` 函数从栈顶弹出，它们都返回了各自的值。

![setTimeout](setTimeout.gif)

在 Web API 中，一个计时器尽可能运行第二个参数传入的值的时长，1000ms。回调函数不会立即添加到调用栈中，它们被添加到队列中。

![queue](queue.gif)

这是比较困惑的地方：这不是说回调函数不会在 1000ms 后添加到调用栈中！它们在 1000ms 后添加到 _queue_ 中。但这是一个队列，该函数必须等待轮到它。

现在这是我们必须要等待的部分，事件循环做的唯一的任务：**连接调用栈和队列**。如果调用栈是空的，即之前所有函数都返回了值，已经从栈中弹出，那么队列中的第一个值出队列被加入调用栈。

![dequeue](dequeue.gif)

回调函数被加入调用栈，然后执行，返回值，最后中栈中弹出。

![new item added to call stack](new-item.gif)

通过之前的了解，来推断一下下面的结果：

```javascript
const foo = () => console.log('First');
const bar = () => setTimeout(() => console.log('Second'), 500);
const baz = () => console.log('Third');

bar();
foo();
baz();
```

让我们来快速看一下执行上述代码，浏览器发生了什么：

![demo](demo.gif)

1. 我们调用 `bar`，`bar` 返回了 `setTimeout` 函数。
2. 我们传入 `setTimeout` 的回调函数添加到了 Web API，`setTimeout` 函数和 `bar` 函数从栈中弹出。
3. 计时器开始运行，于此同时 `foo` 被调用并输出 `First`。`foo` 返回（undefined），`baz` 被调用，回调函数被加入队列中。
4. `baz` 输出 `Third`。事件循环看到 `baz` 返回后的调用栈为空，回调函数被加入到调用栈中。
5. 回调函数输出 `Second`。

### 参考

<https://dev.to/lydiahallie/javascript-visualized-event-loop-3dif>
