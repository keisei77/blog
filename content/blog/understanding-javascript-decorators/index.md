---
title: JavaScript 装饰器
date: '2020-01-05 23:21'
description: 'JavaScript 装饰器入门介绍'
tags: ['JavaScript Decorator']
---

## 什么是装饰器

装饰器是“装饰函数（或方法）”的一种简称。它是一个通过修改传入的函数或方法的行为并返回一个新函数的函数。

我们可以在任何支持函数为一等公民的语言中实现装饰器，如 JavaScript。我们可以把函数赋值为变量或将它作为参数传递到下一个函数。有一些语言有定义和使用装饰器的特殊语法糖，其中 Python 的代码如下：

```python
def cashify(fn):
    def wrap():
        print("$$$$")
        fn()
        print("$$$$")
    return wrap

@cashify
def sayHello():
    print("hello!")

sayHello()

# $$$$
# hello!
# $$$$
```

我们来看一下以上代码。`cashify` 是一个装饰器：它接受一个函数参数，返回值也是一个函数。我们使用 Python 的 “pie” 语法来装饰我们的 `sayHello` 函数，与下面在 `sayHello` 后面执行的结果本质上是一样的：

```python
def sayHello():
    print("hello!")

sayHello = cashify(sayHello)
```

最终的结果是我们在我们所装饰的函数打印内容的前后打印了 `$` 符号。

那么在介绍 ECMAScript 的装饰器时为什么使用了 Python 作为例子呢？

- Python 装饰器的概念相比 JS 来说更加直接，更好地作为基础来解释。
- JS 和 TypeScript 都使用了 Python 的 “pie” 语法来装饰类的方法和属性，它们视觉和语义上是相似的。

相对来说 JS 的装饰器有哪些不同呢？

## JS 装饰器和属性描述符

传递给 Python 装饰器的任何函数都作为参数装饰，JS 装饰器由于对象在 JS 中的特殊性需要更多的信息。
对象在 JS 中有属性，并且属性对应各自的值:

```javascript
const oatmeal = {
  viscosity: 20,
  flavor: 'Brown Sugar Cinnamon',
};
```

对于属性值，每个属性有一些其他背后的信息来定义如何工作的不同方面，被称为属性描述符：

```javascript
console.log(Object.getOwnPropertyDescriptor(oatmeal, 'viscosity'));

/**
{
  configurable: true,
  enumerable: true,
  value: 20,
  writable: true
}
*/
```

JS 会对属性的相关信息追踪：

- `configurable` 决定属性的类型是否可以修改，是否可以从对象中删除。
- `enumerable` 控制在枚举对象的属性（如 `Object.keys(oatmeal)` 或 `for 循环`）时是否可见。
- `writable` 控制能否通过 `=` 操作符来赋值
- `value` 是属性的值，这是我们平时最关心的一个属性。它可以是任何 JS 的类型。

属性描述符也有另外两个属性，JS 把它们作为“访问描述符”（更常见的名称为：getters 和 setters）来对待：

- `get` 是一个返回属性值的函数。
- `set` 是一个接收一个值作为参数的函数，并把该值赋值给当前属性。

### 没有多余的装饰

JS 从 ES5 开始有了对属性描述符操作的 API。`Object.getOwnPropertyDescriptor` 和 `Object.defineProperty` 函数。

```javascript
Object.defineProperty(oatmeal, 'viscosity', {
  writable: false,
  value: 20,
});

// 当尝试给 oatmeal.viscosity 赋新值时，它静默失败了
oatmeal.viscosity = 30;
console.log(oatmeal.viscosity);
// => 20
```

我们可以写一个通用的 `decorate` 函数来更新任何对象的任何属性的描述符：

```javascript
function decorate(obj, property, callback) {
  const descriptor = Object.getOwnPropertyDescriptor(obj, property);
  Object.defineProperty(obj, property, callback(descriptor));
}

decorate(oatmeal, 'viscosity', function(desc) {
  desc.configurable = false;
  desc.writable = false;
  desc.value = 20;
  return desc;
});
```

## 装饰器初探

与装饰器提案的第一个主要的不同点是，它只涉及 ECMAScript 类，而不涉及常规对象。我们来新增一些类：

```javascript
class Porridge {
  constructor(viscosity = 10) {
    this.viscosity = viscosity;
  }

  stir() {
    if (this.viscosity > 15) {
      console.log('This is pretty thick stuff.');
    } else {
      console.log('Spoon goes round and round.');
    }
  }
}

class Oatmeal extends Porridge {
  viscosity = 20;

  constructor(flavor) {
    super();
    this.flavor = flavor;
  }
}

const oatmeal = new Oatmeal('Brown Sugar Cinnamon');

/*
Oatmeal {
  flavor: 'Brown Sugar Cinnamon',
  viscosity: 20
}/
```

### 如何写一个装饰器

JS 装饰器函数有 3 个参数：

1. `target` 是实例对象的类。
2. `key` 是属性名字符串，是我们要装饰的对象。
3. `descriptor` 属性的描述对象

装饰器函数内部的实现取决于我们想要装饰器来做什么。为了装饰对象的方法或属性，我们需要返回一个新的属性描述符。下面是我们对属性做只读设置：

```javascript
function readOnly(target, key, descriptor) {
  return {
    ...descriptor,
    writable: false,
  };
}

class Oatmeal extends Porridge {
  @readOnly viscosity = 20;

  constructor(flavor) {
    super();
    this.flavor = flavor;
  }
}
```

### 处理 API 异常

我们向服务器请求数据是可能会出现异常，当与网络通信时假设都遵循以下约定：

1. 在页面上显示属性 `networkStatus` 为 loading 的样式
2. 发送 API 请求
3. 处理结果
   - 如果成功，根据响应更新状态
   - 如果失败，`apiError` 属性值为接收到的异常内容
4. 将 `networkStatus` 状态设置为 idle

常规写法：

```javascript
class WidgetStore {
  async getWidget(id) {
    this.setNetworkStatus('loading');

    try {
      const { widget } = await api.getWidget(id);
      // 更新本地状态：
      this.addWidget(widget);
    } catch (err) {
      this.setApiError(err);
    } finally {
      this.setNetworkStatus('idle');
    }
  }
}
```

以上代码很容易会写出很多模板代码。当我们尝试使用装饰器来处理：

```javascript
function apiRequest(target, key, descriptor) {
  const apiAction = async function(...args) {
    const original = descriptor.value || descriptor.initializer.call(this);

    this.setNetworkStatus('loading');

    try {
      const result = await original(...args);
      return result;
    } catch (e) {
      this.setApiError(e);
    } finally {
      this.setNetworkStatus('idle');
    }
  };

  return {
    ...descriptor,
    value: apiAction,
    initializer: undefined,
  };
}
```

我们将刚才的装饰器函数应用到之前的类中：

```javascript
class WidgetStore {
  @apiRequest
  async getWidget(id) {
    const { widget } = await api.getWidget(id);
    this.addWidget(widget);
    return widget;
  }
}
```

我们对异常处理的代码现在移到了装饰器函数中，我们只需要关心实现不同需求。

## 装饰类

除了属性和方法外，我们也可以装饰整个类。我们只需要传入 `target` 参数到装饰器函数即可。来看下面的例子：

```javascript
function customElement(name) {
  return function (target) {
    customElements.define(name, target);
  }
}

@customElement('intro-message');
class IntroMessage extends HTMLElement {
  constructor() {
    super();

    const shadow = this.attachShadow({mode: 'open'});
    this.wrapper = this.createElement('div', 'intro-message');
    this.header = this.createElement('h1', 'intro-message__title');
    this.content = this.createElement('div', 'intro-message__text');
    this.header.textContent = this.getAttribute('header');
    this.content.innerHTML = this.innerHTML;

    shadow.appendChild(this.wrapper);
    this.wrapper.appendChild(this.header);
    this.wrapper.appendChild(this.content);
  }

  createElement(tag, className) {
    const elem = document.createElement(tag);
    elem.classList.add(className);
    return elem;
  }
}
```

在 HTML 中加载以上代码，我们可以这样使用：

```html
<intro-message header="welcome to Decorators">
  <p>Something something content...</p>
</intro-message>
```

![custom tag](custom-tag.png)

## 参考

https://www.simplethread.com/understanding-js-decorators/
