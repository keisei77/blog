---
title: 入门 React DOM 服务端渲染
date: '2020-04-17 23:52'
description: '了解 React DOM 服务端渲染过程，以 renderToString 函数为例了解整个执行逻辑'
tags: ['React DOM', 'Server Render']
---

### 前言

当我们需要 React 服务端渲染时，需要了解 [`ReactDOMServer`](https://reactjs.org/docs/react-dom-server.html#rendertostring) 这个对象。它能够使组件渲染成静态的 html 标记。

ReactDOMServer 提供了四个方法，其中 [`renderToString()`](https://reactjs.org/docs/react-dom-server.html#rendertostring) 和 [`renderToStaticMarkup()`](https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup) 可以在浏览器和 node 环境中运行，[`renderToNodeStream()`](https://reactjs.org/docs/react-dom-server.html#rendertonodestream) 和 [`renderToStaticNodeStream()`](https://reactjs.org/docs/react-dom-server.html#rendertostaticnodestream) 由于使用了 node 中特有的 stream，所以不能在浏览器中运行。

### `renderToString` 执行原理

#### `renderToString` 作用

> 将 React 元素渲染为初始 HTML。React 将返回一个 HTML 字符串。你可以使用此方法在服务端生成 HTML，并在首次请求时将标记下发，以加快页面加载速度，并允许搜索引擎爬取你的页面以达到 SEO 优化的目的。
>
> 如果你在已有服务端渲染标记的节点上调用 [ReactDOM.hydrate()](https://zh-hans.reactjs.org/docs/react-dom.html#hydrate) 方法，React 将会保留该节点且只进行事件处理绑定，从而让你有一个非常高性能的首次加载体验。

#### `hydrate()` 作用

> 简单来讲这个方法是和 render() 的作用是相同的，只不过 `hydrate()` 在 `ReactDOMServer` 渲染的容器中对 HTML 的内容进行补水操作。React 会尝试在已有标记上绑定事件监听器。

`renderToString` 的实现：

```javascript
export function renderToString(element) {
  const renderer = new ReactPartialRenderer(element, false);
  try {
    const markup = renderer.read(Infinity);
    return markup;
  } finally {
    renderer.destroy();
  }
}
```

该函数接收 react 组件参数并在内部实例化一个 `ReactPartialRenderer`，该渲染器调用 read 方法返回 string 类型的标记。

```typescript
class ReactDOMServerRenderer {
  // ...
  constructor(children: mixed, makeStaticMarkup: boolean) {
    const flatChildren = flattenTopLevelChildren(children);

    const topFrame: Frame = {
      type: null,
      // Assume all trees start in the HTML namespace (not totally true, but
      // this is what we did historically)
      domNamespace: Namespaces.html,
      children: flatChildren,
      childIndex: 0,
      context: emptyObject,
      footer: '',
    };
    if (__DEV__) {
      ((topFrame: any): FrameDev).debugElementStack = [];
    }
    this.threadID = allocThreadID();
    this.stack = [topFrame];
    this.exhausted = false;
    this.currentSelectValue = null;
    this.previousWasTextNode = false;
    this.makeStaticMarkup = makeStaticMarkup;
    this.suspenseDepth = 0;

    // Context (new API)
    this.contextIndex = -1;
    this.contextStack = [];
    this.contextValueStack = [];
    if (__DEV__) {
      this.contextProviderStack = [];
    }
  }
}
```

`ReactPartialRenderer` 的构造函数初始化了一些属性，其中 this.stack 初始值为只有顶级 frame 的数组。

`renderer.read()` 是内部的核心逻辑，该方法中 while 循环条件比较输出的 out 字符串长度，并进一步调用 `render()` 方法返回的字符串追加到 out 中。由于在 read 中传入的参数为 `Infinity`，所以只有在 `this.stack.length === 0` 时才会 break 退出。

`render()` 方法内部根据了 child 节点类型是字符串、数字、react 组件分别执行对应的逻辑，如果 child 还有 child 节点，那么会被 push 到 this.stack 中，这样 `read()` 方法中的 while 循环就会继续解析该 child 的内容。

这其中还有非常重要的一个函数是 `processChild(element, Component)` element 即为 child 节点，Component 为 element 上的 type 属性，即为我们传入的类组件或函数组件。

```javascript
function processChild(element, Component) {
  const isClass = shouldConstruct(Component);
  const publicContext = processContext(Component, context, threadID, isClass);

  let queue = [];
  let replace = false;
  const updater = {
    isMounted: function(publicInstance) {
      return false;
    },
    enqueueForceUpdate: function(publicInstance) {
      if (queue === null) {
        warnNoop(publicInstance, 'forceUpdate');
        return null;
      }
    },
    enqueueReplaceState: function(publicInstance, completeState) {
      replace = true;
      queue = [completeState];
    },
    enqueueSetState: function(publicInstance, currentPartialState) {
      if (queue === null) {
        warnNoop(publicInstance, 'setState');
        return null;
      }
      queue.push(currentPartialState);
    },
  };

  let inst;
  if (isClass) {
    inst = new Component(element.props, publicContext, updater);

    if (typeof Component.getDerivedStateFromProps === 'function') {
      const partialState = Component.getDerivedStateFromProps.call(
        null,
        element.props,
        inst.state
      );

      if (partialState != null) {
        inst.state = Object.assign({}, inst.state, partialState);
      }
    }
  } else {
    const componentIdentity = {};
    prepareToUseHooks(componentIdentity);
    inst = Component(element.props, publicContext, updater);
    inst = finishHooks(Component, element.props, inst, publicContext);

    // If the flag is on, everything is assumed to be a function component.
    // Otherwise, we also do the unfortunate dynamic checks.
    if (disableModulePatternComponents || inst == null || inst.render == null) {
      child = inst;
      validateRenderResult(child, Component);
      return;
    }
  }

  inst.props = element.props;
  inst.context = publicContext;
  inst.updater = updater;

  let initialState = inst.state;
  if (initialState === undefined) {
    inst.state = initialState = null;
  }
  if (
    typeof inst.UNSAFE_componentWillMount === 'function' ||
    typeof inst.componentWillMount === 'function'
  ) {
    if (typeof inst.componentWillMount === 'function') {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
      if (typeof Component.getDerivedStateFromProps !== 'function') {
        inst.componentWillMount();
      }
    }
    if (
      typeof inst.UNSAFE_componentWillMount === 'function' &&
      typeof Component.getDerivedStateFromProps !== 'function'
    ) {
      // In order to support react-lifecycles-compat polyfilled components,
      // Unsafe lifecycles should not be invoked for any component with the new gDSFP.
      inst.UNSAFE_componentWillMount();
    }
    if (queue.length) {
      const oldQueue = queue;
      const oldReplace = replace;
      queue = null;
      replace = false;

      if (oldReplace && oldQueue.length === 1) {
        inst.state = oldQueue[0];
      } else {
        let nextState = oldReplace ? oldQueue[0] : inst.state;
        let dontMutate = true;
        for (let i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
          const partial = oldQueue[i];
          const partialState =
            typeof partial === 'function'
              ? partial.call(inst, nextState, element.props, publicContext)
              : partial;
          if (partialState != null) {
            if (dontMutate) {
              dontMutate = false;
              nextState = Object.assign({}, nextState, partialState);
            } else {
              Object.assign(nextState, partialState);
            }
          }
        }
        inst.state = nextState;
      }
    } else {
      queue = null;
    }
  }
  child = inst.render();

  validateRenderResult(child, Component);

  // 这里为了兼容历史的 context
  let childContext;
  if (disableLegacyContext) {
  } else {
    if (typeof inst.getChildContext === 'function') {
      const childContextTypes = Component.childContextTypes;
      if (typeof childContextTypes === 'object') {
        childContext = inst.getChildContext();
        for (const contextKey in childContext) {
          invariant(
            contextKey in childContextTypes,
            '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
            getComponentName(Component) || 'Unknown',
            contextKey
          );
        }
      }
      if (childContext) {
        context = Object.assign({}, context, childContext);
      }
    }
  }
  return { child, context };
}
```

这里我们省略了 Dev 环境下的各种判断逻辑，其余部分首先判断了组件是类组件还是函数组件，然后对应执行 `new Component()` 或 `Component()` 来初始化组件实例，并对实例添加 props,state,updater 属性。在接下来根据组件是否声明了生命周期函数来进行相应的调用。最后调用实例上的 `render()` 方法赋值给 child 并返回。

### 总结

本文主要从 `renderToString` 入口来简单了解了一下 react 是如何根据传入的组件一步步渲染为标准的 html 字符串，可以直接在浏览器中渲染。那么给了我们一些启发，是不是我们可以有一个专门用来将 react 组件实时渲染为 html 的服务，然后将输出返回给调用方，这样我们甚至可以支持在线配置 react 组件并持久化下来支撑将来的业务需要。
