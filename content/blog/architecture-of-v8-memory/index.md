---
title: 了解 V8 内存管理
date: '2020-02-24 23:03'
description: '对V8的内存管理加以了解'
tags: ['V8', 'Garbage Collection']
---

本文我们来看一下用于[ECMAScript](https://tc39.es/ecma262/)和[WebAssembly](https://webassembly.github.io/spec/core/)的[V8 引擎](https://v8.dev/)的内存管理。V8 引擎现在被 NodeJS，Deno 等运行时，Electron，还有 Chrome，Chromium，Brave，Opera 和 Microsoft Edge 等浏览器采用。由于 JavaScript 是一门解释型语言，需要引擎来解释并执行。V8 引擎解释 JavaScript 代码并将代码编译成原生的机器码。V8 引擎是通过 C++编写的，可以嵌套在任意的 C++程序中。

### V8 内存架构

由于 JavaScript 是单线程的，V8 会在每个 JavaScript 上下文中使用一个单独的进程，如果使用了 service worker，它会根据每个 worker 产生一个新的 V8 进程。每个运行中的应用程序总是被 V8 进程分配一些内存，被称为**常驻集（Resident Set）**。然后被进一步分为一下不同的片段：

![memory structure of V8](memory-structure-of-V8.png)

#### 堆内存

这是 V8 存储对象或动态数据的地方。这是内存区域最大的块，这也是**垃圾回收（Garbage Collection）**发生的地方。并不是整个堆内存都会被回收，只有新生代和老生代会被垃圾回收管理。堆会进一步分为：

- **新生代（New Space）** 新生代或“**年轻代（Young generation）**”是新对象存储的地方，这些新对象通常都是短暂存活的。这块内存非常小，有两个 semi-space。这块内存被“清道夫（**Scavenger(Minor GC)**）”管理。新生代可以通过 `--min_semi_space_size(初始化)` 和 `--max_semi_space_size(最大)` 标志来控制大小。
- **老生代（Old Space）** 老生代或“**老年代（Old generation）**”是那些在新生代中在两次次要 GC 中存活下来的对象。这块内存是被“**主 GC（Major GC: Mark-Sweep & Mark-Compact）**”管理。老生代可以通过 `--initial_old_space_size(初始化)` 和 `--max_old_space_size(最大)` 标志来控制大小。这块内存又被分为两份：
  - **旧指针空间（Old pointer space）**：包含具有指向其他对象的幸存对象
  - **旧数据空间（Old data space）**：包含保存数据的对象（没有指向其他的对象）。字符串，包装过的数字等保存新生代中在两次次要 GC 中存活下来的对象。
- **大对象空间（Large object space）**：这是超过其他内存限制的更大的对象存活的地方。大对象不会被垃圾回收。
- **代码空间（Code-space）**：这是即时（**Just In Time: JIT**）编译器存储编译过的代码的地方。这是唯一可执行的内存空间（尽管代码可能被分配在“大对象空间”，这些也是可执行的）。
- **细胞空间，属性细胞空间，map 空间（Cell space, property cell space, and map space）**：这些空间分别包含：`Cells`, `PropertyCells`, 和 `Maps`。这些空间中的每个空间都包含相同大小的对象，并且对它们指向的对象有一些限制，从而简化了回收。

这些空间中的每一个都由一组 pages 组成。Page 是使用 mmap 从操作系统分配的连续内存块。除较大的对象空间外，每个页面的大小均为 1MB。

#### 栈内存

每个 V8 进程会有对应的栈。这里是静态数据，包含方法/函数帧，基本数据，指向对象的指针存放的地方。栈内存的大小限制可以通过 `--stack_size` 标志控制。

### V8 内存使用（栈 vs 堆）

现在我们已经清楚内存是如何管理的，我们来看一下当应用运行时内存是如何使用的。

我们来看下面这段代码，注意代码并未优化，主要来关注栈和堆的内存使用。

```javascript
class Employee {
  constructor(name, salary, sales) {
    this.name = name;
    this.salary = salary;
    this.sales = sales;
  }
}

const BONUS_PERCENTAGE = 10;

function getBonusPercentage(salary) {
  const percentage = (salary * BONUS_PERCENTAGE) / 100;
  return percentage;
}

function findEmployeeBonus(salary, noOfSales) {
  const bonusPercentage = getBonusPercentage(salary);
  const bonus = bonusPercentage * noOfSales;
  return bonus;
}

let john = new Employee('John', 5000, 5);
john.bonus = findEmployeeBonus(john.salary, john.sales);
console.log(john.bonus);
```

相关 slide 可以<a href="https://speakerdeck.com/deepu105/v8-memory-usage-stack-and-heap" target="_blank">点击新窗口打开</a>

可以看到：

- 全局作用域是存在于栈的“全局帧”中
- 每个函数调用都作为帧块被加入栈内存
- 所有的局部变量包括参数和返回值都在栈的函数帧块中
- 所有的原始数据如 `int` 和 `string` 都被直接存入栈中。这也适用全局作用域
- 所有的对象类型如 `Employee` 和 `Function` 都在堆中被创建，从栈中使用栈指针引用它们。在 JavaScript 中函数本质上是对象，这也适用全局作用域
- 从当前函数调用的函数被加入栈顶
- 当函数返回时，它的帧在栈中被移除
- 一旦主流程完成，堆中的内存没有栈中任何的指针指向会成为孤儿对象
- 除非做了复制，其他对象内的所有对象引用都使用引用指针

栈就像看到的一样是操作系统而不是 V8 本身管理并结束的，因此我们不需要太关注栈。相反，堆内存不是操作系统自动管理的，由于它有最大的内存空间并存储动态数据，可能随着时间增长呈指数增长以至程序执行用光内存。这就是垃圾回收需要的原因。

对于垃圾回收区分堆中的指针和数据是非常重要的，V8 使用“**标记指针（Tagged pointer）**”的方式来回收，它在每个字母后面预留了一比特来标记是指针还是数据。这个方式需要有限的编译器支持，但实现起来很简单，而且效率很高。

### V8 内存管理：垃圾回收

现在我们知道 V8 是如何分配内存的，我们来看一下它又是如何自动管理对应用程序性能非常重要的堆内存的。当一个应用程序尝试分配超过堆剩余内存（取决于 V8 设置的标志大小）时，会造成**内存溢出的异常**。对堆不正确的管理也会造成内存泄露。

V8 通过垃圾回收管理堆内存。简单来说，它释放孤儿对象的内存，即没有在栈中有直接或间接（在另一个对象中的引用）引用的对象会被回收来为新对象的创建提供空间。

> **Orinoco** 是 V8 垃圾回收项目的代号，通过并行，增量，并发的技术进行垃圾回收，来释放主线程。

在 V8 中垃圾回收器是回收未使用的内存来供 V8 进程重新利用。

V8 垃圾回收器是传代的（堆中的对象根据年代进行分组并在不同的阶段被清除）。V8 中有两个阶段，采用了三种不同的算法来进行垃圾回收：

### 参考

<https://deepu.tech/memory-management-in-v8/>
