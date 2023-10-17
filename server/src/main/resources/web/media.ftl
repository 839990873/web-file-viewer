<!DOCTYPE html>
<html lang="zh-cn">
<head>
    <meta charset="utf-8" />
    <title>多媒体文件预览</title>
    <#include "*/commonHeader.ftl">
    <link rel="stylesheet" href="plyr/plyr.css" />
    <script type="text/javascript" src="plyr/plyr.js"></script>
    <script src="js/common.js"></script>
    <style>
        body {
            background-color: #404040;
        }

        .m {
            width: 1024px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
<div class="m">
    <video id="player">
        <source src="${mediaUrl}" />
    </video>
</div>
<script>
  const player = new Plyr('#player', {
    autoplay: true,
    volume: 0
  })
  window.onload = function () {
    initWaterMark()
    initWebSocket()
  }

  function initWebSocket() {
    let websocket = null

    //判断当前浏览器是否支持WebSocket（固定写法）
    if ('WebSocket' in window) {
      websocket = new WebSocket(`ws://localhost:8200/file-view/websocket?meetingId=${meetingId}`)
    } else {
      alert('浏览器不支持websocket')
    }

    //连接发生错误的回调方法
    websocket.onerror = function () {
      console.log('发生错误')
    }

    //连接成功建立的回调方法
    websocket.onopen = function (event) {
      console.log('建立连接' + event)
    }

    //接收到消息的回调方法
    websocket.onmessage = function (event) {
      const data = event.data
      console.log(data)
      if (data === 'LEFT') {
        player.rewind()
      } else if (data === 'RIGHT') {
        player.forward()
      } else if (data === 'BOTTOM') {
        player.decreaseVolume(0.1)
      } else if (data === 'TOP') {
        player.increaseVolume(0.1)
      } else if (data === 'CONFIRM') {
        player.togglePlay()
      } else if (data === 'EXIT') {
        closeWindow()
      }
    }

    //连接关闭的回调方法
    websocket.onclose = function () {
      console.log('关闭连接')
    }

    //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
    window.onbeforeunload = function () {
      alert('已关闭连接')
      websocket.close()
    }
  }
</script>
</body>
</html>
