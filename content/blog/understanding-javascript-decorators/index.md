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
