---
title: React 过渡
date: '2020-06-01 23:21'
description: '通过研究 react-transition-group 库来了解react中如何实现丝滑的过渡效果'
tags: ['React', 'transition']
---

### 前言

笔者最近在做移动端的项目，项目经理某天给我发了一个链接[panel-stack](https://blueprintjs.com/docs/#core/components/panel-stack)，我试用了一下感觉蛮不错的，每层（stack）切换时非常丝滑。在我们的项目中，针对路由做了一层包装，当用户点击链接时，我们会在 dom 上 append 该链接指向页面的节点，而原页面的节点不会被销毁。这样做的好处是，可以记住原页面的滚动位置、交互状态，但不好的地方是用户刷新页面时只会记录最近一个链接，这样之前页面的元素就丢失了。

简单的路由实现：

```javascript
const layers = [];

const routerHandler = function(event) {
  layers.push({
    state: event.state,
    path: location.path,
    query: location.query,
  });
};

window.addEventListener('popstate', routeHandler);

const RouterWrapper = React.memo(() => {
  return layers.map((layer, index) => (
    <LayerWrapper layer={layer} key={index} />
  ));
});
```

根据上面的路由和 layer 的关系，我们就可以构造出 panel stack 依赖的 `stack: { component: React.ComponentType, title: string }[]`数据结构了。
再结合 header，那么大体上我们就满足了需求。

### 探究

了解 panel stack 的用法，那么其实现是怎样的呢？

我们来看一下 [PanelStack](https://github.com/palantir/blueprint/blob/7bb4548b1241d1ac4f5a97a07b57f23b8d8afed2/packages/core/src/components/panel-stack/panelStack.tsx#L79) 的代码：

```typescript
public render() {
  const classes = classNames(
    Classes.PANEL_STACK,
    `${Classes.PANEL_STACK}-${this.state.direction}`,
    this.props.className,
  );
  return (
    <TransitionGroup className={classes} component="div">
      {this.renderPanels()}
    </TransitionGroup>
  );
}
```

由 render()方法可以看到，其底层实际还是依赖了三方库：[react-transition-group](https://github.com/reactjs/react-transition-group)。
