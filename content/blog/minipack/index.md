---
title: 迷你打包工具
date: '2019-12-25 22:24'
description: '精简版打包工具，领略内部实现之巧'
tags: ['minipack', 'webpack']
---

模板打包器把小的代码片段转译成可在浏览器中运行的更大更复杂的文件。这些代码片段都是 JavaScript 文件，所有代码间的依赖都由模块系统来表示（[https://webpack.js.org/concepts/modules](https://webpack.js.org/concepts/modules)）。

模板打包器需要一个入口文件。我们不需要在 HTML 中插入多个 script 标签并执行，而是将该文件为我们应用的主入口文件来启动。

打包器会从入口文件开始，寻找它依赖哪些文件，接着寻找依赖文件的依赖文件。就这样一直递归下去直到找出所有模块。这个过程所构成的依赖关系被称作依赖图。

本文将来创建一个依赖图并通过它来将所有的模块都打包到一个文件中。

注意：本文只是一个简单的来理解打包工具的例子，解决循环依赖，缓存模块导出，每个模块只解析一次等特性本文将跳过来保证简单化。

```javascript
const fs = require('fs');
const path = require('path');
const babylon = require('babylon');
const traverse = require('babel-traverse').default;
const { transformFromAst } = require('babel-core');

let ID = 0;

// 我们创建一个接收文件路径参数的函数，读取文件内容，取出该文件的依赖。
function createAsset(filename) {
  // 读取文件内容
  const content = fs.readFileSync(filename, 'utf-8');

  // 现在我们尝试去找出该文件依赖了哪些文件。我们可以通过查看内容中的 import 字符串。这个方式比较笨拙，所以我们使用 JavaScript 解析器。

  // JavaScript 解析器是读取并解析 JavaScript 代码的工具。它们会生成一个称为 AST （abstract syntax tree） 的更抽象的模型。

  // 可访问 AST Explorer (https://astexplorer.net) 来了解 AST 的结构。

  // AST 包含了我们代码的大量信息。我们可以通过查看它来了解我们的代码来做什么。
  const ast = babylon.parse(content, {
    sourceType: 'module',
  });

  // 这个数组用来保存当前模块依赖的所有模块的相对路径。
  const dependencies = [];

  // 我们遍历 AST 来找出依赖了哪些模块。为了得到结果，我们检查 AST 中每个 import 声明。
  traverse(ast, {
    // EcmaScript 模块因为静态的设计所以解析起来非常简单。同时这意味着我们不能条件式 import 另一个模块。每次我们看到一个 import 声明我们都可以将它的值作为一个依赖。
    ImportDeclaration: ({ node }) => {
      // 我们把 import 的值保存至上面的依赖数组。
      dependencies.push(node.source.value);
    },
  });

  // 我们同时通过自增1来确定当前模块的唯一标识。
  const id = ID++;

  // 为了保证EcmaScript 的模块和其他新特性能在所有浏览器中运行，我们使用 Babel (https://babeljs.io) 来转译。

  // `presets` 选项是告诉 Babel 如何转译的规则的集合。
  const { code } = transformFromAst(ast, null, {
    presets: ['env'],
  });

  // 返回该模块所有的信息。
  return {
    id,
    filename,
    dependencies,
    code,
  };
}

// 我们开始读取入口文件的依赖。接下来提取该文件依赖的所有依赖，以此递归。
function createGraph(entry) {
  // 开始解析入口文件。
  const mainAsset = createAsset(entry);

  // 我们使用一个队列来解析每个资源的依赖。
  const queue = [mainAsset];

  // 我们使用 `for ... of` 迭代这个队列。初始时队列中只有一个资源，但是我们随后的迭代会增加新的资源到这个队列中。当队列为空时退出迭代。
  for (const asset of queue) {
    // 每个资源都有自己依赖的模块的相对路径列表。我们去迭代它们，通过 `createAsset()` 函数解析它们，将该模块的依赖保存至下面的对象中。
    asset.mapping = {};

    // 这是该模块的目录地址
    const dirname = path.dirname(asset.filename);

    // 我们遍历依赖关系的相对路径
    asset.dependencies.forEach(relativePath => {
      // `createAsset()` 函数需要绝对的文件路径。而 dependencies 中为相对路径。我们可以通过 join 方法来获得绝对路径。
      const absolutePath = path.join(dirname, relativePath);

      // 解析资源，读取内容，提取它的依赖
      const child = createAsset(absolutePath);

      // 本质上 `asset` 依赖于 `child`，我们通过在 `mapping` 对象上增加相对路径的值为 child 的 id 的属性来维护这份关系。
      asset.mapping[relativePath] = child.id;

      // 最后，我们将 child 资源加入队列来使它的依赖也能被迭代和解析。
      queue.push(child);
    });
  }

  // 此时队列包含了应用下所有的模块：这是我们表示依赖图的形式。
  return queue;
}

// 接下来我们定义一个函数，通过接收我们的依赖图并返回一个可以在浏览器中运行的文件。

// 我们的 bundle 会持有一个立即执行函数：(function() {})()
function bundle(graph) {
  let modules = '';

  // 我们会对依赖图进行构造，生成 `key: value,` 格式的字符串，最后通过 {} 包裹起来。
  graph.forEach(mod => {
    // 图中的每个模块都有一个入口在该对象中。我们使用模块的 id 作为键，使用一个数组作为值。

    // 数组中的第一个值是以一个函数包裹的模块的代码。原因是模块必须是有作用域的：在一个模块中定义的变量不应该影响到全局变量。

    // 我们的模块在转译之后使用 CommonJS 的模块系统：需要 `require`, `module` 和 `exports` 对象。目前在浏览器中还不能使用，所以我们会实现它们并将它们注入我们的包装函数中。

    // 对于数组第二个值，我们将模块和模块的依赖对应的 mapping 对象转为字符串。这个对象形式如： { './relative/path': 1 }

    // 这是因为我们的模块转译后的代码需要调用参数为相对路径的 `require()` 函数。当该函数被调用时，我们能够知道图中哪个模块对应于此模块的相对路径。

    modules += `${mod.id}: [
      function (require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });

  // 最后，我们来实现立即执行函数的函数体

  // 我们首先来实现 `require()` 函数：它接收模块 id 并在我们之前构建好的 `modules` 对象中寻找。我们结构这个有两个元素的数组，来获取我们的包装函数和 mapping 对象。

  // 我们的模块代码需要调用 `require()` 函数，它接收文件相对路径作为参数而不是模块的 id。我们的 require 函数需要模块 id。此外，两个不同的模块可能会 `require()` 同一个相对路径。

  // 为了解决这个问题，当一个模块 required 时我们创建一个新的专有的 `require` 函数来调用。它是模块指定的函数，并且知道通过从模块的 mapping 对象的相对路径中找到对应的 id。

  // 最后，通过 CommonJS, 当一个模块被加载，它可以通过改变 `exports` 对象来暴露值。`exports` 对象在被模块的代码改变后，通过 `require()` 函数返回。
  const result = `
  (function (modules) {
    function require(id) {
      const [fn, mapping] = modules[id];

      function localRequire(name) {
        return require(mapping[name]);
      }

      const module = { exports: {} };

      fn(localRequire, module, module.exports);

      return module.exports;
    }

    require(0);
  })({${modules}})
  `;

  return result;
}

const graph = createGraph('./example/entry.js');
const result = bundle(graph);

console.log(result);
```
