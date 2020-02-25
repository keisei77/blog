---
title: 可视化了解 V8 内存管理
date: '2020-02-24 23:03'
description: '对V8的内存管理以可视化的方式来加以了解'
tags: ['V8', 'Garbage Collection']
---

本文我们来看一下用于[ECMAScript](https://tc39.es/ecma262/)和[WebAssembly](https://webassembly.github.io/spec/core/)的[V8 引擎](https://v8.dev/)的内存管理。V8 引擎现在被 NodeJS，Deno 等运行时，Electron，还有 Chrome，Chromium，Brave，Opera 和 Microsoft Edge 等浏览器采用。由于 JavaScript 是一门解释型语言，需要引擎来解释并执行。V8 引擎解释 JavaScript 代码并将代码编译成原生的机器码。V8 引擎是通过 C++编写的，可以嵌套在任意的 C++程序中。

### V8 内存架构

由于 JavaScript 是单线程的，V8 会在每个 JavaScript 上下文中使用一个单独的进程，如果使用了 service worker，它会根据每个 worker 产生一个新的 V8 进程。每个运行中的应用程序总是被 V8 进程分配一些内存，被称为**常驻集（Resident Set）**。然后被进一步分为一下不同的片段：

![memory structure of V8](memory-structure-of-V8.png)

### 堆内存

这是 V8 存储对象或动态数据的地方。这是内存区域最大的块，这也是**垃圾回收（Garbage Collection）**发生的地方。并不是整个堆内存都会被回收，只有新生代和老生代会被垃圾回收管理。堆会进一步分为：

- **新生代（New Space）** 新生代或“**年轻代（Young generation）**”是新对象存储的地方，这些新对象通常都是短暂存活的。这块内存非常小，有两个 semi-space。这块内存被“清道夫（**Scavenger(Minor GC)**）”管理。新生代可以通过 `--min_semi_space_size(初始化)` 和 `--max_semi_space_size(最大)` 标志来控制大小。
- **老生代（Old Space）** 老生代或“**老年代（Old generation）**”是那些在新生代中在两次次要 GC 中存活下来的对象。这块内存是被“**主 GC（Major GC: Mark-Sweep & Mark-Compact）**”管理。老生代可以通过 `--initial_old_space_size(初始化)` 和 `--max_old_space_size(最大)` 标志来控制大小。这块内存又被分为两份：
  - **旧指针空间（Old pointer space）**：包含具有指向其他对象的幸存对象
  - **旧数据空间（Old data space）**：包含保存数据的对象（没有指向其他的对象）。字符串，包装过的数字等保存新生代中在两次次要 GC 中存活下来的对象。
- **大对象空间（Large object space）**：这是超过其他内存限制的更大的对象存活的地方。大对象不会被垃圾回收。
- **代码空间（Code-space）**：这是即时（**Just In Time: JIT**）编译器存储编译过的代码的地方。这是唯一可执行的内存空间（尽管代码可能被分配在“大对象空间”，这些也是可执行的）。
- **细胞空间，属性细胞空间，map 空间（Cell space, property cell space, and map space）**：这些空间分别包含：`Cells`, `PropertyCells`, 和 `Maps`。这些空间中的每个空间都包含相同大小的对象，并且对它们指向的对象有一些限制，从而简化了回收。

这些空间中的每一个都由一组 pages 组成。Page 是使用 mmap 从操作系统分配的连续内存块。除较大的对象空间外，每个页面的大小均为 1MB。

### 栈内存

每个 V8 进程会有对应的栈。这里是静态数据，包含方法/函数帧，基本数据，指向对象的指针存放的地方。栈内存的大小限制可以通过 `--stack_size` 标志控制。

### 参考

<https://deepu.tech/memory-management-in-v8/>
