---
title: 前端插件机制的探索
date: '2020-05-12 23:09'
description: '前端工具如今基本都提供了插件机制，尤其以webpack著称，那么这种机制是如何实现的呢？'
tags: ['plugin mechanism']
---

### 概述

插件架构宏观上来讲就是一种框架能够在确定的点上执行外部的代码，而不需要提前知道这部分代码的细节。

它既可以很简单，也可以很复杂。我们可以编写 webpack 插件，也可以开发 vs code 的插件，其基本架构是相似的。

开发插件需要遵循一些约定，就像网络传输需要协议。它们必须能够被主进程以某种方式获取并使用。通常最初的开发者会发布一些接口或开发套件，允许其他的开发者对原系统开发插件，提供新的能力。

插件架构是开放封闭原则（OCP）的一种开发原则的体现，表明系统对拓展开放，对修改封闭。插件架构解决了不需要修改核心系统代码而可以对系统增加一些额外的功能特性，只需要一些额外的代码。插件可以单独开发，单独测试。

### 案例学习 Rollup

最近公司的部分项目开始采用 rollup 工具打包，笔者也在个人项目中开始上手使用。简单来说，配置项要比 webpack 相对来说简单一些，但是要注意 rollup 主要是为打包模块而生，并且代码需要使用 ES6 及以上的标准编写。

常见的 rollup 配置：

```javascript
export default [
  {
    input,
    output: { file: 'build/greymon.js', format: 'umd', name, globals },
    external: Object.keys(globals),
    plugins: [
      nodeResolve(),
      babel(getBabelOptions()),
      commonjs(commonjsOptions),
      replace({ 'process.env.NODE_ENV': JSON.stringify('development') }),
      sizeSnapshot(),
    ],
  },

  {
    input,
    output: { file: 'build/greymon.min.js', format: 'umd', name, globals },
    external: Object.keys(globals),
    plugins: [
      nodeResolve(),
      babel(getBabelOptions()),
      commonjs(commonjsOptions),
      replace({ 'process.env.NODE_ENV': JSON.stringify('production') }),
      sizeSnapshot(),
      uglify(),
    ],
  },

  {
    input,
    output: { file: pkg.module, format: 'esm' },
    external,
    plugins: [babel(getBabelOptions()), sizeSnapshot()],
  },
];
```

可以看到 rollup 可以输出多种模块依赖方式，而只需指定 `input, output, external, plugins` 等。

那么我们就来看一下 rollup 的 `plugins` 是怎么实现的。

首先我们需要了解 rollup 是怎么运行的，入口文件为 [`src/rollup/rollup.ts`](https://github.com/rollup/rollup/blob/462bff7b1a0c384ecc3e278b1ea877e637c70f41/src/rollup/rollup.ts#L136)

在 `rollup()` 中执行了 `rollupInternal()` 函数，在该函数中运行了实际的构建细节。

```typescript
export async function rollupInternal(
  rawInputOptions: GenericConfigObject,
  watcher: RollupWatcher | null
): Promise<RollupBuild> {
  const inputOptions = getInputOptions(rawInputOptions);
  initialiseTimers(inputOptions);

  const graph = new Graph(inputOptions, watcher);

  // remove the cache option from the memory after graph creation (cache is not used anymore)
  const useCache = rawInputOptions.cache !== false;
  delete inputOptions.cache;
  delete rawInputOptions.cache;

  timeStart('BUILD', 1);

  let chunks: Chunk[];
  try {
    await graph.pluginDriver.hookParallel('buildStart', [inputOptions]);
    chunks = await graph.build(
      inputOptions.input as string | string[] | Record<string, string>,
      inputOptions.manualChunks,
      inputOptions.inlineDynamicImports!
    );
  } catch (err) {
    const watchFiles = Object.keys(graph.watchFiles);
    if (watchFiles.length > 0) {
      err.watchFiles = watchFiles;
    }
    await graph.pluginDriver.hookParallel('buildEnd', [err]);
    throw err;
  }

  await graph.pluginDriver.hookParallel('buildEnd', []);

  timeEnd('BUILD', 1);

  // ...
}
```

在这我们截取了部分逻辑，首先 rollup 会根据配置信息（入口、输出类型、插件等字段）构建 `Graph` 对象，在 `Graph` 构造函数内部初始化了 rollup 构建所需要的各种信息：

```typescript
class Graph {
  // ...

  constructor(options: InputOptions, watcher: RollupWatcher | null) {
    // ...

    if (options.cache !== false) {
      this.pluginCache =
        (options.cache && options.cache.plugins) || Object.create(null);

      // increment access counter
      for (const name in this.pluginCache) {
        const cache = this.pluginCache[name];
        for (const key of Object.keys(cache)) cache[key][0]++;
      }
    }

    // ...

    this.pluginDriver = new PluginDriver(
      this,
      options.plugins!,
      this.pluginCache
    );
  }
}
```

可以看到这里根据配置项来决定插件是否采用缓存机制，而真实的插件注入是在 `PluginDriver` 类中实现的，

下面我们来看一下 `PluginDriver` 的实现：

```typescript
class PluginDriver {
  public emitFile: EmitFile;
  public finaliseAssets: () => void;
  public getFileName: (fileReferenceId: string) => string;
  public setOutputBundle: (
    outputBundle: OutputBundleWithPlaceholders,
    assetFileNames: string
  ) => void;

  private fileEmitter: FileEmitter;
  private graph: Graph;
  private pluginCache: Record<string, SerializablePluginCache> | undefined;
  private pluginContexts: PluginContext[];
  private plugins: Plugin[];

  constructor(
    graph: Graph,
    userPlugins: Plugin[],
    pluginCache: Record<string, SerializablePluginCache> | undefined,
    basePluginDriver?: PluginDriver
  ) {
    warnDeprecatedHooks(userPlugins, graph);
    this.graph = graph;
    this.pluginCache = pluginCache;
    this.fileEmitter = new FileEmitter(
      graph,
      basePluginDriver && basePluginDriver.fileEmitter
    );
    this.emitFile = this.fileEmitter.emitFile;
    this.getFileName = this.fileEmitter.getFileName;
    this.finaliseAssets = this.fileEmitter.assertAssetsFinalized;
    this.setOutputBundle = this.fileEmitter.setOutputBundle;
    this.plugins = userPlugins.concat(
      basePluginDriver ? basePluginDriver.plugins : []
    );
    this.pluginContexts = this.plugins.map(
      getPluginContexts(pluginCache, graph, this.fileEmitter)
    );
    if (basePluginDriver) {
      for (const plugin of userPlugins) {
        for (const hook of inputHooks) {
          if (hook in plugin) {
            graph.warn(errInputHookInOutputPlugin(plugin.name, hook));
          }
        }
      }
    }
  }
}
```

注意这里构造函数中传入了 `Graph` 实例，这样方便后续对 `Graph` 实例属性的存取。

```typescript
private runHook<H extends AsyncPluginHooks>(
  hookName: H,
  args: Parameters<PluginHooks[H]>,
  pluginIndex: number,
  permitValues: boolean,
  hookContext?: ReplaceContext | null
): EnsurePromise<ReturnType<PluginHooks[H]>> {
  const plugin = this.plugins[pluginIndex];
  const hook = plugin[hookName];
  if (!hook) return undefined as any;

  let context = this.pluginContexts[pluginIndex];
  if (hookContext) {
    context = hookContext(context, plugin);
  }

  return Promise.resolve()
    .then(() => {
      // permit values allows values to be returned instead of a functional hook
      if (typeof hook !== 'function') {
        if (permitValues) return hook;
        return throwInvalidHookError(hookName, plugin.name);
      }
      return (hook as Function).apply(context, args);
    })
    .catch(err => throwPluginError(err, plugin.name, { hook: hookName }));
}

private runHookSync<H extends SyncPluginHooks>(
  hookName: H,
  args: Parameters<PluginHooks[H]>,
  pluginIndex: number,
  hookContext?: ReplaceContext
): ReturnType<PluginHooks[H]> {
  const plugin = this.plugins[pluginIndex];
  const hook = plugin[hookName];
  if (!hook) return undefined as any;

  let context = this.pluginContexts[pluginIndex];
  if (hookContext) {
    context = hookContext(context, plugin);
  }

  try {
    // permit values allows values to be returned instead of a functional hook
    if (typeof hook !== 'function') {
      return throwInvalidHookError(hookName, plugin.name);
    }
    return (hook as Function).apply(context, args);
  } catch (err) {
    return throwPluginError(err, plugin.name, { hook: hookName });
  }
}
```

这里我们选取了 `PluginDriver` 类的两个私有方法，`runHookSync()` 根据 `node.js` 通用的命名约定，sync 结尾的表明为同步执行，而 `runHook()` 根据返回类型为 `Promise` 也可以看出是异步执行的。

由于 `runHookSync()` 和 `runHook()` 是仅供 `PluginDriver` 内部使用的，也是执行插件逻辑的地方，而调用该私有方法的入口则是分散在 rollup 构建的各种生命周期/广播的事件中：

```typescript
// 并行执行
await graph.pluginDriver.hookParallel('buildStart', [inputOptions]);

// 顺序执行
await outputPluginDriver.hookSeq('generateBundle', [
  outputOptions,
  outputBundle,
  isWrite,
]);

// 同步执行并把前一次的结果作为参数传入下一个插件
const hashAugmentation = outputPluginDriver.hookReduceValueSync(
  'augmentChunkHash',
  '',
  [this.getPrerenderedChunk()],
  (hashAugmentation, pluginHash) => {
    if (pluginHash) {
      hashAugmentation += pluginHash;
    }
    return hashAugmentation;
  }
);
```

### 总结

插件机制可以保证在系统提供的能力范围内参与系统内部定制化的改造，这为第三方开发提供了更便利的条件，而且这种机制的存在可以激发更多的想法，促进整个生态的发展。
