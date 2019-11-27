---
title: The WebSocket API
date: '2019-11-26 23:21'
description: '本文主要介绍web应用中Socket编程的相关技术，包括如何实现简单的Socket客户端和服务器'
tags: ['WebSocket']
---

## 引言

WebSocket API 是一种较为高级的通信方式，它在客户端和服务端开启一条全双工的通道，可以从客户端发送消息至服务端并且可以接受事件驱动的响应而不需要主动去请求回复。简而言之，收发消息的两端一旦开启通道可相互自由通信。

## WebSocket 客户端

为了使用 WebSocket 协议通信，需要创建 `WebSocket` 对象，会自动尝试创建到服务端的连接。

WebSocket 构造函数接受两个参数：

```javascript
websocket = new WebSocket(url, protocols);
```

`url`

&nbsp;&nbsp;&nbsp;&nbsp;指定要连接的服务器的 URL 地址，应该以 `wss://` 协议开头，不安全的地址以 `ws://` 开头。

`protocols` (可选)

&nbsp;&nbsp;&nbsp;&nbsp;一个协议字符串或是多个协议字符串的数组。这些字符串用来指定子协议，可以让一个服务器实现多个 WebSocket 子协议（例如，可以通过不同的 `protocol` 来使服务器处理不同类型的交互）。如果没有指定该参数，默认为空字符串。

如果地址不可访问，构造函数会抛出 `SecurityError`，通常会出现在连接不安全的地址（几乎所有的客户端都要求提供安全的 WebSocket 连接，除非在相同的设备上或在同一个网络下）。

### 建立连接

```javascript
const exampleSocket = new WebSocket(
  'wss://www.example.com/socketserver',
  'protocolOne'
);

// 可以选择多个协议
const exmapleSocket2 = new WebSocket('wss://www.example.com/socketserver2', [
  'protocolOne',
  'protocolTwo',
]);
```

exampleSocket 此时的 readyState 是 `CONNECTING`，一旦握手成功可以传输数据时 `readyState` 的状态变为 `OPEN` 。 `exampleSocket.protocol` 属性可以得出服务端选择的协议是哪一个。

建立 WebSocket 连接需要依赖[HTTP 升级机制](https://developer.mozilla.org/en-US/docs/Web/HTTP/Protocol_upgrade_mechanism)，当我们通过 `ws://www.example.com` 或 `wss://www.example.com` 访问服务端时，实际上发生了隐式的请求升级。

### 发送数据至服务端

一旦建立连接，便可以通过 `send()` 方法向服务端发送 `string`， [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob)，[`ArrayBuffer`](https://developer.mozilla.org/en-US/docs/Web/API/ArrayBuffer) 格式的数据。

```javascript
exampleSocket.send('一段发送至服务器的消息...');
```

由于建立连接是异步并且可能会失败的，所以建立连接后立即调用 `send()` 方法是不能保证成功的。可以通过定义 `onopen` 监听函数来保证连接至少在开启后再去发送数据。

```javascript
exampleSocket.onopen = function(event) {
  exampleSocket.send('一段发送至服务器的消息...');
};
```

#### 使用 JSON 传输对象

当需要向服务端传输复杂的数据时可以用[JSON](https://developer.mozilla.org/en/JSON)包装为字符串：

```javascript
function sendText() {
  // 构造服务端处理数据所需的对象结构
  const msg = {
    type: 'message',
    text: document.getElementById('text').value,
    id: clientID,
    date: Date.now(),
  };

  // 发送JSON字符串
  exampleSocket.send(JSON.stringify(msg));
}
```

### 从服务端接收消息

WebSocket 是事件驱动的 API，当接收到消息，一个 `message` 事件会发送至 `WebSocket` 对象。可通过监听 `message` 事件或者定义 `onmessage` 事件句柄。

```javascript
exampleSocket.onmessage = function(event) {
  console.log(event.data);
};
```

#### 接收并解析数据

以聊天工具来说，客户端需要接收的数据包类型有：

- 登录握手
- 消息文本
- 用户列表更新

以下为解析即将到来的数据：

```javascript
exampleSocket.onmessage = function(event) {
  const f = document.getElementById('chatbox').contentDocument;
  let text = '';
  const msg = JSON.parse(event.data);
  const time = new Date(msg.date);
  const timeStr = time.toLocaleTimeString();

  switch (msg.type) {
    case 'id':
      clientID = msg.id;
      setUsername();
      break;
    case 'username':
      text =
        '<b>User <em>' +
        msg.name +
        '</em> signed in at ' +
        timeStr +
        '</b><br>';
      break;
    case 'message':
      text = '(' + timeStr + ') <b>' + msg.name + '</b>: ' + msg.text + '<br>';
      break;
    case 'rejectusername':
      text =
        '<b>Your username has been set to <em>' +
        msg.name +
        '</em> because the name you chose is in use.</b><br>';
      break;
    case 'userlist':
      const ul = '';
      for (i = 0; i < msg.users.length; i++) {
        ul += msg.users[i] + '<br>';
      }
      document.getElementById('userlistbox').innerHTML = ul;
      break;
  }

  if (text.length) {
    f.write(text);
    document.getElementById('chatbox').contentWindow.scrollByPages(1);
  }
};
```

这里我们通过 `JSON.parse()` 来将字符串数据解析为对象格式，并执行对应逻辑。

#### 文本格式

通过 WebSocket 接收的文本为 UTF-8 格式。

### 关闭连接

当完成通信断开连接时通过调用 `close()` 方法来实现：

```javascript
exampleSocket.close();
```

在关闭连接时最好检查 [`bufferedAmount`](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/bufferedAmount) 在网路中是否还有未传输的数据。如果值不为 0，说明还有数据待处理，所以需要处理完成再关闭。

### 安全事项

WebSocket 不应该在混合环境中使用。即不能在 HTTPS 中建立不安全的 WebSocket，反之亦然。
现在大多数浏览器厂商只允许安全的 WebSocket 连接，不再支持在不安全的环境下使用。
