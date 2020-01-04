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

## WebSocket 服务端

简单来说一个 WebSocket 服务器是监听任何 TCP 服务器端口的应用程序。实现一个自定义的服务器听起来让人畏却，但实际上实现一个简单的 WebSocket 是非常容易的。

可以使用任何支持[Berkeley sockets](https://en.wikipedia.org/wiki/Berkeley_sockets)的服务端语言来编写一个 WebSocket 服务器，例如 C(++)，Python，PHP，或者[服务端 JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Server-Side_JavaScript)。

WebSocket 服务器通常是独立的专门的服务器（为了负载均衡或其他实际的原因），所以需要使用[反向代理](https://en.wikipedia.org/wiki/Reverse_proxy)来检测 WebSocket 握手，预处理，并将客户端发送至真正的 WebSocket 服务器。这意味着不需要在服务器程序中处理 cookie 和鉴权等操作。

### WebSocket 握手

首先，服务器必须使用一个标准的 TCP 套接字来监听即将到来的 socket 连接。在 WebSocket 中握手就是 `Web` 。它是从 HTTP 到 WebSockets 的桥梁。在握手过程中，连接协商过程中，如果条款是有问题的，任何一方都可以在连接成功之前退出。服务器必须小心理解任何客户端的请求，否则就会出现安全问题。

#### 客户端握手请求

客户端握手过程通过连接服务器并且发送一个 WebSocket 连接请求。`client` 会发送一个标准的带有头部的 HTTP 请求（HTTP 版本必须 1.1 或更高，方法必须是 `GET` 请求）。

    GET /chat HTTP/1.1
    Host: example.com:8000
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
    Sec-WebSocket-Version: 13

客户端可以征求扩展或子协议。一些其他常见的头信息[User-Agent](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/User-Agent)，[Referer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referer)，[Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cookie) 或权限校验等也需要发送。它们并非与 WebSocket 直接关联，并且可以安全地忽略。通常来说反向代理会首先处理这些头信息。

如果 header 中有任一信息有误，服务器会发出 `400` 的状态码并立即关闭 socket。

#### 服务器握手响应

当服务器收到握手请求，会返回一个特殊的响应来指明协议会从 HTTP 变更为 WebSocket。头信息大致如下：

    HTTP/1.1 101 Switching Protocols
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=

此外，服务器可以决定扩展/子协议的请求。`Sec-WebSocket-Accept` 是根据从客户端的 `Sec-WebSocket-Key` 来生成的。具体规则为将 `Sec-WebSocket-Key` 和[魔法字符串](https://en.wikipedia.org/wiki/Magic_string) `258EAFA5-E914-47DA-95CA-C5AB0DC85B11` 拼接至一起，然后执行 [SHA-1 hash](https://en.wikipedia.org/wiki/SHA-1)，最后返回该哈希 [base64](https://en.wikipedia.org/wiki/Base64)的编码格式。

一旦服务端发送这些头信息，说明握手已经成功，可以交换数据。

    在发送握手的响应之前服务器可以发送其他头信息，或要求鉴权，或者通过其他状态码重定向到其他服务器。

#### 保持客户端连接

这并不直接与 WebSocket 协议关联，但值得提出：服务器需要保持客户端 socket 的连接，这样就不需要在完成握手后再次握手。

### 交换数据帧

服务端和客户端任一者可以选择在任何时候发送消息。

#### 格式化

每个数据帧都需要遵循如下格式：

    Frame format:
    ​​
          0                   1                   2                   3
          0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
        +-+-+-+-+-------+-+-------------+-------------------------------+
        |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
        |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
        |N|V|V|V|       |S|             |   (if payload len==126/127)   |
        | |1|2|3|       |K|             |                               |
        +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
        |     Extended payload length continued, if payload len == 127  |
        + - - - - - - - - - - - - - - - +-------------------------------+
        |                               |Masking-key, if MASK set to 1  |
        +-------------------------------+-------------------------------+
        | Masking-key (continued)       |          Payload Data         |
        +-------------------------------- - - - - - - - - - - - - - - - +
        :                     Payload Data continued ...                :
        + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
        |                     Payload Data continued ...                |
        +---------------------------------------------------------------+

MASK 位表明了信息是否是编码的。信息从客户端发出时必须是加密的，服务端期望收到的值为 1，而服务端发送的数据不会加密，也不会设置 MASK 位。

opcode 字段定义了如何解析数据载荷：0x0 表示继续，0x1 表示 UTF-8 格式的文本，0x2 表示二进制等。

FIN 位表明是否是该数据流的最后一条信息。如果为 0，服务器会保持收听信息的其他部分，如果为 1 则认为信息已送达。

#### 解码载荷长度

为了读取载荷数据需要知道何时停止读取，所以知道载荷长度非常重要：

1. 读取 9-15 位并解析为无符号整数。如果小于等于 125，那么该值就是数据长度。如果等于 126，执行第二步。如果等于 127，执行第三步。
2. 读取接下来的 16 位并解析为无符号整数，完成。
3. 读取接下来 64 位解析为无符号整数（最高位必须位 0），完成。

#### 读取并解密数据

如果设置了 MASK 位，需要读后面 4 组 8 位，这是编码的 key。一旦载荷长度和编码 key 解析完成，可以继续从 socket 中读取该长度的字节数。为了解码，循环遍历加密数据的八位字节（文本数据的字节），然后将八位字节与 MASK 的第（i 模 4）个八位字节进行 XOR 运算。伪代码如下：

```javascript
let DECODED = '';
for (let i = 0; i < ENCODED.length; i++) {
  DECODED[i] = ENCODED[i] ^ MASK[i % 4];
}
```

#### 消息片段

FIN 和 opcode 字段在一起将发送的一条信息拆分为多个单独的帧。被称为`message fragmentation`。碎片化（Fragmentation）只在 opcode 的 `0x0` 至 `0x2` 有效。

- 0x0：代表一个连续帧，意味着需要把该帧的数据载荷和上一帧的载荷连接在一起
- 0x1：代表载荷为文本格式
- 0x2：代表载荷为二进制格式

下面是一个简单的例子来说明服务端是如何响应客户端信息的：

    Client: FIN=1, opcode=0x1, msg="hello"
    Server: (process complete message immediately) Hi.
    Client: FIN=0, opcode=0x1, msg="and a"
    Server: (listening, new message containing text started)
    Client: FIN=0, opcode=0x0, msg="happy new"
    Server: (listening, payload concatenated to previous message)
    Client: FIN=1, opcode=0x0, msg="year!"
    Server: (process complete message) Happy new year to you too!

第一帧包含了全部的消息，所以服务端可以处理并响应。第二帧客户端发送了文本载荷但整个信息并没有完全送达，其他剩余部分通过连接帧来发送，通过标记`FIN=1`指明了最后一帧。

### Pings and Pongs: WebSocket 心跳检测

在握手完成后，客户端或服务端都可以选择发送一个 ping 至对方，当 ping 收到时，接收方必须尽快发送一个 pong 给对方。可以通过这个机制来确认对方是否仍在连接。

一个 ping 或 pong 只是一个普通的控制帧，Pings 的 opcode 为 `0x9` ，pongs 的 opcode 为 `0xA`。当收到一个 ping，发送 pong 时携带 ping 发送的一致的数据载荷（最大载荷长度为 125）。

### 关闭连接

客户端或服务端关闭连接可以发送一个带有包含一个特殊控制序列数据的控制帧来开启关闭握手。接收到此帧后，另一方会发送一个结束帧作为响应。先前的一方会关闭连接。关闭连接后收到的任何其他数据都会被丢掉。

## 参考

https://developer.mozilla.org/en-US/docs/Web/API/Websockets_API
