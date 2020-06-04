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

### 搬运

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
     <CSSTransition
        key={id}
        timeout={500}
        classNames="item"
      >
        {this.renderPanels()}
      </CSSTransition>
    </TransitionGroup>
  );
}
```

由 render()方法可以看到，其底层实际还是依赖了三方库：[react-transition-group](https://github.com/reactjs/react-transition-group)。

虽然 `react-transition-group` 提供了过渡的能力，即提供了 dom 元素进入退出的多个周期节点。为了丝滑的体验，需要对每个时间节点设定样式，这样不免会写出很多的重复或相似的 css 代码。而 panel-stack 封装了[scss 的过渡函数](https://github.com/palantir/blueprint/blob/7bb4548b1241d1ac4f5a97a07b57f23b8d8afed2/packages/core/src/common/_react-transition.scss)，非常的强大：

```scss
@mixin react-transition(
  $name,
  $properties,
  $duration: $pt-transition-duration,
  $easing: $pt-transition-ease,
  $delay: 0,
  $before: '',
  $after: ''
) {
  @include each-prop($properties, 2);
  @include react-transition-phase(
    $name,
    'enter',
    $properties,
    $duration,
    $easing,
    $delay,
    $before,
    $after
  );
  @include react-transition-phase(
    $name,
    'exit',
    $properties,
    $duration,
    $easing,
    $delay,
    $before,
    $after
  );
}
```

大概就是根据节点进入/退出，通过函数调用来生成最终 css 代码。由于我们项目使用了 less 预处理样式，所以经过几番查阅文档将 scss 转成了 less 的实现：

```less
.each-prop(@properties, @idx) {
  each(@properties, {
    @{key}: extract(@value, @idx);
  })
}

.extract-prop(@properties) {
  each(@properties, {
    transition-property+: @key;
  })
}

.react-transition-phase(@name, @phase, @properties, @duration, @easing) {
  @start-index: if(@phase = 'enter', 1, 2);
  @end-index: if(@phase = 'enter', 2, 1);
  @class: ~".@{name}-@{phase}";
  @class-active: ~".@{name}-@{phase}-active";

  @{class} {
    .each-prop(@properties, @start-index);
  }

  @{class-active} {
    .each-prop(@properties, @end-index);
    .extract-prop(@properties);
    transition-duration: @duration;
    transition-timing-function: @easing;
  }
}
```

这样在使用时，可以减少许多冗余的代码：

```less
.layer-list {
  height: 100%;
  overflow: hidden;
  position: relative;

  // 这里为节点新增时
  &.layer-list-push {
    .react-transition-phase(
      'layer-item',
      'enter',
      {transform: translateX(100%) translate(0%) ; opacity: 0 1;},
      0.4s,
      ease
    );
    .react-transition-phase(
      'layer-item',
      'exit',
      {transform: translateX(-50%) translate(0%) ; opacity: 0 1;},
      0.4s,
      ease
    );
  }

  // 这里为节点删除时
  &.layer-list-pop {
    .react-transition-phase(
      'layer-item',
      'enter',
      {transform: translateX(-50%) translate(0%) ; opacity: 0 1;},
      0.4s,
      ease
    );
    .react-transition-phase(
      'layer-item',
      'exit',
      {transform: translateX(100%) translate(0) ; opacity: 0 1;},
      0.4s,
      ease
    );
  }
}
```

### 探究

现在我们就来追根溯源，来看一下 `react-transition-group` 的内部实现：

[Transition.js](https://github.com/reactjs/react-transition-group/blob/master/src/Transition.js)中说明， `Transition` 组件默认不会修改内部组件的行为，它只会记录组件的“进入”和“退出”的状态。

`Transition` 存在四种过渡状态：

- `'entering'`
- `'entered'`
- `'exiting'`
- `'exited'`

`Transition` 通过 `in` 这个 prop 来决定组件的方向，即当 `in` 为 `true` 时，组件状态会开始变为 `'enter'`，然后会在间隔时间内变为 `'entering'` 状态，完成后会变为 `'entered'` 状态。当 `in` 为 `false` 时，组件会进行类似的行为，只不过从 `'exiting'` 过渡到 `'exited'`。

在我们的需求中，我们需要用到 `<TransitionGroup>` 和 `<CSSTransition>` 组件，`<TransitionGroup>` 是用来维护一组子组件的进出状态的集合，它本身不会定义过渡效果。

`<TransitionGroup>` 中使用了[childMapping.js](https://github.com/reactjs/react-transition-group/blob/master/src/utils/ChildMapping.js) 中的 `getChildMapping, getInitialChildMapping, getNextChildMapping` 来决定各个子组件的进出状态。

这里根据每个子组件的顺序，依次赋予 props 各个状态。这里用到了 `React.cloneElement()`，复制原组件并传入新的 props。

在 `<CSSTransition>` 中，定义了

```jsx
onEnter = (maybeNode, maybeAppearing) => {
  const [node, appearing] = this.resolveArguments(maybeNode, maybeAppearing);
  this.removeClasses(node, 'exit');
  this.addClass(node, appearing ? 'appear' : 'enter', 'base');

  if (this.props.onEnter) {
    this.props.onEnter(maybeNode, maybeAppearing);
  }
};

<Transition
  {...props}
  onEnter={this.onEnter}
  onEntered={this.onEntered}
  onEntering={this.onEntering}
  onExit={this.onExit}
  onExiting={this.onExiting}
  onExited={this.onExited}
/>;
```

这里以 `onEnter` 为例，当处于 `'enter'` 状态时，在组件上增加 `{prefix}-enter` 的 class。

在 `<Transition>` 中，当 props 有变化时，会执行 `componentDidUpdate()` 周期函数：

```javascript
componentDidUpdate(prevProps) {
  let nextStatus = null
  if (prevProps !== this.props) {
    const { status } = this.state

    if (this.props.in) {
      if (status !== ENTERING && status !== ENTERED) {
        nextStatus = ENTERING
      }
    } else {
      if (status === ENTERING || status === ENTERED) {
        nextStatus = EXITING
      }
    }
  }
  this.updateStatus(false, nextStatus)
}
```

该函数来确定当前组件应该进入的下一个状态是什么，并执行 `updateStatus()` 方法，该方法根据 `nextStatus` 来执行具体的逻辑：

```javascript
updateStatus(mounting = false, nextStatus) {
  if (nextStatus !== null) {
    this.cancelNextCallback()

    if (nextStatus === ENTERING) {
      this.performEnter(mounting)
    } else {
      this.performExit()
    }
  } else if (this.props.unmountOnExit && this.state.status === EXITED) {
    this.setState({ status: UNMOUNTED })
  }
}

performEnter(mounting) {
  const { enter } = this.props
  const appearing = this.context ? this.context.isMounting : mounting
  const [maybeNode, maybeAppearing] = this.props.nodeRef
    ? [appearing]
    : [ReactDOM.findDOMNode(this), appearing]

  const timeouts = this.getTimeouts()
  const enterTimeout = appearing ? timeouts.appear : timeouts.enter

  if ((!mounting && !enter) || config.disabled) {
    this.safeSetState({ status: ENTERED }, () => {
      this.props.onEntered(maybeNode)
    })
    return
  }

  this.props.onEnter(maybeNode, maybeAppearing)

  this.safeSetState({ status: ENTERING }, () => {
    this.props.onEntering(maybeNode, maybeAppearing)

    this.onTransitionEnd(enterTimeout, () => {
      this.safeSetState({ status: ENTERED }, () => {
        this.props.onEntered(maybeNode, maybeAppearing)
      })
    })
  })
}
```

以 `performEnter()` 方法为例，根据状态执行我们在`<CSSTransition>`中传入的 `props.onEntered()`，或执行 `props.onEnter()` 并进一步执行 `props.onEntering()`。
由此，我们可以完整得出 transition 的全部过程。

### 总结

从一个小需求出发，我们可以从类似的解决方案中收获非常多的知识和技巧。有时候完成一项工作只是基本要求，更重要的是它的原理和底层实现。这样在以后遇到更复杂的需求时，也能不乱阵脚，根据以往的经验来轻松应对。
