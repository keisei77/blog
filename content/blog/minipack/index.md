---
title: 迷你打包工具
date: '2019-12-25 22:24'
description: '精简版打包工具，领略内部实现之巧'
tags: ['minipack', 'webpack']
---

模板打包器把小的代码片段编译成可在浏览器中运行的更大更复杂的文件。这些代码片段都是 JavaScript 文件，所有代码间的依赖都由模块系统来表示（[https://webpack.js.org/concepts/modules](https://webpack.js.org/concepts/modules)）。

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

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8');

  const ast = babylon.parse(content, {
    sourceType: 'module',
  });

  const dependencies = [];

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value);
    },
  });

  const id = ID++;

  const { code } = transformFromAst(ast, null, {
    presets: ['env'],
  });

  return {
    id,
    filename,
    dependencies,
    code,
  };
}

function createGraph(entry) {
  const mainAsset = createAsset(entry);

  const queue = [mainAsset];

  for (const asset of queue) {
    asset.mapping = {};

    const dirname = path.dirname(asset.filename);

    asset.dependencies.forEach(relativePath => {
      const absolutePath = path.join(dirname, relativePath);

      const child = createAsset(absolutePath);

      asset.mapping[relativePath] = child.id;

      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = '';

  graph.forEach(mod => {
    modules += `${mod.id}: [
      function (require, module, exports) {
        ${mod.code}
      },
      ${JSON.stringify(mod.mapping)},
    ],`;
  });

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
