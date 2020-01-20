---
title: React Fiber 架构
date: '2019-11-22 23:08'
description: '本文主要介绍 React 新的架构设计-- Fiber , 将能使 React 可对渲染过程进行资源调度，最大化提高用户体验'
tags: ['React', 'Fiber', 'Architecture', 'diff']
---

## 介绍

---

React Fiber 是当前开发中的最新版 React 的核心算法的实现。它的主要目标是提高动画、布局、手势等操作的响应速度。最大的功能就是增强渲染：有能力将渲染工作分割成多块，并将它们分散到多个帧中去渲染。

其他关键功能包括有能力暂停、渲染，有新的更新时可以重复使用；有能力对不同的更新增加优先级；新的并发模式。

### 前置条件

在继续本文之前建议首先了解如下内容：

- [React Components, Elements, and Instances](https://facebook.github.io/react/blog/2015/12/18/react-components-elements-and-instances.html) 掌握 React 中的一些基本术语
- [Reconciliation](https://facebook.github.io/react/docs/reconciliation.html) 对 React 协调算法的概括性描述
- [React Basic Theoretical Concepts](https://github.com/reactjs/react-basic) React 基本的理论性的概念描述。
- [React Design Principles](https://facebook.github.io/react/contributing/design-principles.html) React 的设计准则很好的解释了 React Fiber 的出现。

## 回顾

---

在我们继续深入以前先来回顾一些新的概念。

### 什么是协调（Reconciliation）

**_reconciliation_**

&nbsp;&nbsp;&nbsp;&nbsp;这是 React 用来对两棵树 diff 来决定要更新哪部分的算法。

**_update_**

&nbsp;&nbsp;&nbsp;&nbsp;React 应用中渲染数据的一次变化，通常是由 `setState` 触发的。最终结果是触发一次重新渲染。

React API 的中心思想是如何更新，因为这会造成整个 APP 的重新渲染。这允许开发者可以声明式的推理，而不需要关心怎样有效地将 APP 从任何特定状态转换为另一种状态（A 到 B，B 到 C，C 到 A，以此类推）。

实际上每次数据变化都要重新渲染整个应用只适用于最琐碎的一些应用。在现实世界中，就性能而言开销是非常巨大的。React 的优化做到了即便重新渲染整个应用依然能保证很高的性能。优化过程的大部分工作被称作 **reconciliation**。

Reconciliation 是已经被人熟知的虚拟 DOM 背后的算法。从一个高度概括的角度来说：当你渲染一个 React 应用时，树上描述这个应用的所有节点被生成并保存在内存中，这棵树被刷新至渲染环境，如果是浏览器应用，则会转化成 DOM 节点的集合。当应用更新时（通常通过 `setState` ），一颗新树产生了，通过与之前的树进行比较计算出已渲染的应用哪部分需要更新。

更加详细的描述可以在[文档](https://facebook.github.io/react/docs/reconciliation.html)中找到。关键点如下：

- 不同组件类型被认为是生成了不同的树。React 不会去 diff，而是直接将这部分旧节点替换掉。
- 列表是通过 keys 来做 diff 的。Keys 应该是稳定的，可预见的，唯一的。

### 协调与渲染

DOM 只是 React 能渲染的一种渲染环境。其他主要的原生系统 IOS 和 Android 也可以通过 React Native 来进行渲染。

React 能支持多环境渲染的原因是，它被设计为协调和渲染过程分离。协调器计算树的哪部分被改变了，渲染器再根据得到的信息去真正渲染应用。

分离意味着 React DOM 和 React Native 有各自的渲染器但是可以共享 React 核心提供的协调器。

Fiber 重新实现了协调器，它原则上不关心渲染， 但渲染器仍然需要做出改变来支持并利用新的架构。

### 调度

**_scheduling_**

&nbsp;&nbsp;&nbsp;&nbsp;决定何时执行工作的过程

**_work_**

&nbsp;&nbsp;&nbsp;&nbsp;任何计算都应该被执行。`Work` 通常是一次更新的结果（通过 `setState` ）。

React 的[设计原则 ](https://facebook.github.io/react/contributing/design-principles.html#scheduling)中很好的描述了这部分主题：

> 当前 React 的实现中，在一个时钟周期内 React 会遍历这棵更新过的树并且调用渲染函数渲染。在将来它会延迟某部分更新来保证不会掉帧。
>
> 这在 React 设计中是一个常见的思想。一些流行的库的采用了 push 的方式，当有数据更新时，计算函数会执行。React 坚持 pull 的方式，计算函数除非必须否则可以延迟执行。
>
> React 不是一个通用的数据处理库。它是负责构建用户界面的。它处在应用中一块独立的位置来获取哪些计算是需要立即执行的，哪些是不必要的。
>
> 如果一些内容用户是看不到的，React 可以延迟执行这部分任何的逻辑。如果数据更新的频率高于帧率，可以合并这些改变并批量更新。我们能对用户交互的部分工作（如按钮按下触发的动画）增加高优先级，对一些不重要的后台工作（如呈现刚从网络加载的新内容）延后执行来避免掉帧的现象。

关键点在于：

- 在用户界面，每次数据更新没有必要立即渲染。实际上，这样会浪费性能造成丢帧降低用户的体验。
- 不同的更新类型有不同的优先级--动画的更新需要比数据中心更新更快。
- 基于 push 的方式需要开发者来决定如何调度工作。基于 pull 的方式允许库（React）更加智能的帮我们做出决定。

React 目前还没有充分利用调度的优势，子树上数据的一次更新还是会立即渲染。彻底修改 React 核心算法以利用调用是 Fiber 背后的驱动思想。

## 什么是 Fiber

---

我们现在来讨论 React Fiber 架构的核心。Fibers 是一个非常底层的抽象描述。

我们已经建立了 Fiber 为 React 提供调度能力的主要目标，需要实现以下的能力：

- 暂停工作并在一段时间后恢复
- 对不同类型的工作提供优先级
- 再利用先前已经完成的工作
- 如果不需要则可以停止工作

为了实现以上目标，我们首先需要找到一种方式将工作切分成多个单位。一个 fiber 就代表了一个工作单元。

为了更近一步，我们回到之前的概念 [React 组件就是 data 的函数映射](https://github.com/reactjs/react-basic#transformation)，通常可以表示为：

```javascript
v = f(d);
```

渲染一个 React 应用本质上就是调用一个函数，这个函数体中包含了调用其他的函数，以此类推。这种类比在思考 fiber 时非常有用。

计算机追踪一个程序的执行通常的方式是采用[调用栈](https://en.wikipedia.org/wiki/Call_stack)。当一个函数被执行，一个新的栈帧被加入该栈。这个栈帧代表函数执行的位置。

当处理 UI 时，一个问题是如果一次执行太多的函数会导致动画的丢帧，看起来断断续续。而且，如果有新的变动取代旧的，那么之前的工作实际上不是必须的。这就是 UI 组件和函数之间比较不同的地方，UI 组件有着比函数更多需要特殊关注的地方。

最近新的浏览器（和 React Native）实现了帮助解决这个问题的 APIs：`requestIdleCallback` 安排一个在程序空闲期被调用的低优先级函数，`requestAnimationFrame` 安排一个在下个动画帧中被调用的高优先级函数。问题在于，为了使用这些 APIs，我们需要将渲染工作切分成多个单元。如果只依靠调用栈，它会一直运行知道栈为空。

有没有办法来定制调用栈的行为来优化渲染 UIs？有没有办法能够中断调用并且手动操作栈帧呢？

这就是 React Fiber 的目的，Fiber 为 React 组件重新实现了栈。可以认为一个 fiber 就是一个**虚拟的栈帧**。

重新实现栈的好处是能在[内存中保存栈帧](https://www.facebook.com/groups/2003630259862046/permalink/2054053404819731/)，并且可以随时以任何方式去执行。这是实现调度至关重要的。

除了调度之外，手动处理栈帧还可以实现并发和错误边界等功能。

### Fiber 的结构

具体来说，一个 fiber 是一个包含组件信息，它的输入、输出的 JavaScript 对象。

一个 fiber 对应一个栈帧，也对应一个组件的实例。

这里有一些 fiber 比较重要的字段（非完整的列表）：

#### `type` 和 `key`

fiber 的 type 和 key 对 React 元素起着同样的作用（实际上，fiber 从一个元素创建时，这两个属性直接被复制过来）。

fiber 的 type 描述了它对应的组件。对于合成组件，type 是一个函数或者类组件本身。对于原生元素（`div`, `span` 等），type 是一个字符串。

从概念上来说，type 是在执行时被栈帧追踪的函数（如在 `v = f(d)` 中）。

与 type 一起的 key，被用来在协调过程中决定 fiber 是否可以再利用。

#### `child` 和 `sibling`

这两个字段指向其他的 fibers，描述一个 fiber 的递归树结构。

child 字段对应组件 `render` 方法的返回值。

```javascript
function Parent() {
  return <Child />;
}
```

`Parent` 的子 fiber 对应着 `Child`。

sibling 字段对应 `render` 返回多个孩子节点（Fiber 的新特性！）的情况：

```javascript
function Parent() {
  return [<Child1 />, <Child2 />];
}
```

child fibers 组成了一个单链表，head 指针指向第一个孩子节点。所以在上例中， `Parent` 的孩子节点是 `Child1`，`Child1` 的兄弟节点是 `Child2`。

回到我们的函数类比，可以认为一个孩子 fiber 是一个尾调用函数。

#### `return`

return fiber 是当前 fiber 处理完成后需要返回的 fiber。从概念上来说它对应栈帧返回的地址。也可以理解为父 fiber。

如果一个 fiber 有多个子 fiber，每个子 fiber 返回的 fiber 都是它的父 fiber。在前一个例子中，`Child1` 和 `Child2` 的 return fiber 是 `Parent`。

#### `pendingProps` 和 `memoizedProps`

从概念上来说，props 是一个函数的参数。一个 fiber 的 `pendingProps` 是开始执行时被赋值，`memoizedProps` 是结束时被赋值。

当即将到来的 `pendingProps` 和当前 `memoizedProps` 一致时，表明了 fiber 的前一次输出可以被重新使用，省去了不必要的工作。

#### `pendingWorkPriority`

一个数字标识 fiber 工作的优先级。[ReactPriorityLevel](https://github.com/facebook/react/blob/master/packages/react-reconciler/src/SchedulerWithReactIntegration.js)模块中列出来不同的优先级和所对应的含义。

除了一个特殊的例外 `NoWork = 0`，越大的数字代表了越低的优先级。例如，可以通过如下函数来验证一个 fiber 的优先级是否比给到的优先级相等或更高：

```javascript
function matchesPriority(fiber, priority) {
  return (
    fiber.pendingWorkPriority !== 0 && fiber.pendingWorkPriority <= priority
  );
}
```

_这个函数只是用来说明，并不是真正的 React Fiber 代码的一部分。_

调度器使用优先级字段寻找下一个工作的单元，算法部分会在 future 部分讨论。

#### `alternate`

_**flush**_

&nbsp;&nbsp;&nbsp;&nbsp;刷新一个 fiber 就是渲染它的输出至屏幕。

_**work-in-progress**_

&nbsp;&nbsp;&nbsp;&nbsp;一个 fiber 还未完成，即相对应的一个栈帧还没有被返回。

在任何时候，一个组件实例至多有两个 fibers 与之对应：当前 fiber，刷新过的 fiber 和工作中的 fiber。

当前 fiber 的交替是工作中的 fiber，反之亦然。

一个 fiber 的交替是通过调用 `cloneFiber` 惰性创建的。并非总是会创建新的对象，`cloneFiber` 会尝试再利用存在的 fiber 的交替，减少内存占用。

#### `output`

_**host component**_

&nbsp;&nbsp;&nbsp;&nbsp;一个 React 应用的叶子节点。它们是渲染环境特有的（即在浏览器中，它们是 `div`，`span` 等）。在 JSX 中，它们使用小写标签名表示。

从概念上来说，fiber 的输出就是一个函数的返回值。

每个 fiber 最终都会有输出，但是输出只由宿主组件在叶子节点创建。输出随后在树上被传递。

输出最终都会传送至渲染器，所以能够刷新这些变化至渲染环境。定义如何创建和更新输出内容是渲染器的责任。

## 未来

以上就是目前的全部内容，但这篇文章还远远不够。未来还将讨论一次更新在生命周期中采用的算法。话题包括：

- 调度器是如何找到下一个工作单元去执行的
- 优先级是如何追踪的，又如何在 fiber 树中传播的
- 调度器是怎样知道何时停止和恢复工作的
- 刷新（flush）是如何工作的和如何标记为完成的
- 副作用是如何工作的（例如生命周期函数）
- 协程是什么，如何用来实现 context 和 layout 的

## 参考

<https://github.com/acdlite/react-fiber-architecture/>
