/**
 * Copyright 2013 I Doc View
 * @author Godwin <I Doc View>
 */
let ratio = 0.75
let pages
const slideUrls = []
const slideThumbUrls = []
let curSlide = 1
let totalSize = 1	// PPT当前获取到的总页数
let slideCount = 1	// PPT文件总页数

$(document).ready(function () {
  const data = resultData
  const code = data.code
  if (1 === code) {
    uuid = data.uuid
    pages = data.data
    totalSize = pages.length
    slideCount = data.totalSize

    // title
    $('.container-fluid:first .btn:first').after('<a class="brand lnk-file-title" style="text-decoration: none;">' + data.name + '</a>')
    document.title = data.name

    // set ratio
    ratio = pages[0].ratio

    // reset all content
    resetContent()

    afterLoad()
  } else {
    $('.container-fluid .row-fluid').html('<section><div class="alert alert-error">' + data.desc + '</div></section>')
  }
  clearProgress()

  // 是否显示全屏按钮
  $('.fullscreen-link').toggle(screenfull.enabled)
  // 全屏事件
  $('.fullscreen-link').click(function () {
    if (screenfull.enabled) {
      screenfull.toggle($('.slide-img-container')[0])
    }
  })
  $(document).bind('fullscreenchange', function () {
    if (screenfull.isFullscreen) {
      $('.slide-img-container').css('background-color', 'black')
      $('.slide-img-container').contextMenu(true)
    } else {
      $('.slide-img-container').css('background-color', '')
      $('.slide-img-container').contextMenu(false)
    }
  })

  $('.select-page-selector').change(function () {
    const selectNum = $('.select-page-selector option:selected').text()
    gotoSlide(selectNum)
  })
  $('.slide-img-container .ppt-turn-left-mask').click(function () {
    preSlide()
  })
  $('.slide-img-container .ppt-turn-right-mask').click(function () {
    nextSlide()
  })

  // Right click (NOT supported in SOUGOU browser)
  /*
  $.contextMenu({
      selector: '.slide-img-container',
      items: {
          "next": {
              name: "下一张",
              callback: function(key, options) {
                  nextSlide();
              }
          },
          "previous": {
              name: "上一张",
              callback: function(key, options) {
                  preSlide();
              }
          },
          "sep1": "---------",
          "exit": {
              name: "结束放映",
              callback: function(key, options) {
                  $('.slide-img-container').fullScreen(false);
              }
          },
      }
  });
  */
  $('.slide-img-container').contextMenu(false)

  // Swipe method is NOT supported in IE6, so it should be the last one.
  try {
    $('.slide-img-container').swipeleft(function () {
      nextSlide()
    })
    $('.slide-img-container').swiperight(function () {
      preSlide()
    })
  } catch (err) {

  }
  initWebSocket()
})

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
    if (data === 'LEFT' || data === 'TOP') {
      preSlide()
    } else if (data === 'RIGHT' || data === 'BOTTOM') {
      nextSlide()
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

let remainContentInterval

function checkRemainContent() {
  clearInterval(remainContentInterval)
  if (slideCount === totalSize) {
    return
  }

}

function resetContent() {
  remainContentInterval = setInterval(checkRemainContent, 8000)

  // clear all content
  $('.row-fluid .span2').empty()
  $('.select-page-selector').empty()
  $('.select-page-selector-sync').empty()
  $('.slide-img-container img').remove()

  // 限制预览页数开始
  const viewCheck = authMap.view
  if (!!viewCheck && (viewCheck > 1) && (pages.length > viewCheck)) {
    $('.navbar').after('<div class="alert alert-info" style="text-align: center; color: red;">试读结束，支付后阅读全文！</div>')
    totalSize = viewCheck
    clearInterval(remainContentInterval)
  }
  // 限制预览页数结束

  // pages
  for (i = 0; i < totalSize; i++) {
    const page = pages[i]
    slideUrls[i] = page.url
    slideThumbUrls[i] = page.thumbUrl
    $('.row-fluid .span2').append('<div class="thumbnail" page="' + (i + 1) + '"><img src="' + page.thumbUrl + '"></div><div class="thumb-page-number-container">' + (i + 1) + '/' + slideCount + '</div>')
    $('.select-page-selector').append('<option>' + (i + 1) + '</option>')
    $('.select-page-selector-sync').append('<option>' + (i + 1) + '</option>')
  }

  // 未转换完成提示信息
  if (totalSize < slideCount) {
    $('.row-fluid .span2').prepend('<div style="color: red;">转换中(' + Math.floor((totalSize / slideCount) * 100) + '%)，请稍候……</div>')
  }

  $('.slide-img-container').append('<img src="' + slideUrls[curSlide - 1] + '" class="img-polaroid" style="height: 100%;">')
  const thumbnailWidth = $('.thumbnail:first').width()
  const thumbnailHeight = thumbnailWidth * ratio
  $('.thumbnail').height(thumbnailHeight)
  $('.thumbnail>img').width(thumbnailWidth).height(thumbnailHeight)

  const slideImgContainerWidth = $('.slide-img-container:first').width()
  const slideImgContainerHeight = slideImgContainerWidth * ratio
  $('.slide-img-container').height(slideImgContainerHeight)

  resetImgSize()

  const percent = Math.ceil((curSlide / slideUrls.length) * 100)
  $('.thumbnail[page="' + curSlide + '"]').addClass('ppt-thumb-border')

  // $('.thumbnail[page="' + curSlide + '"]').animate({scrollTop:($(window).height()/2)}, 'slow');

  $('.select-page-selector').val(curSlide)
  $('.bottom-paging-progress .bar').width('' + percent + '%')

  $('.thumbnail').click(function () {
    const page_num = $(this).attr('page')
    gotoSlide(page_num)
  })
}

$(window).resize(function () {
  resetImgSize()
})

function resetImgSize() {
  let leftW = $('.row-fluid .span2').width() + 40
  const windowW = $(window).width()
  if (windowW < 768) {
    leftW = -40
    $('.hidden-phone').css('display', 'none')
    $('.span9').removeClass('offset2')
  } else {
    $('.hidden-phone').css('display', 'block')
    $('.span9').addClass('offset2')
  }
  let ww = $(window).width() - 120 - leftW
  let wh = $(window).height() - 90
  if (screenfull.isFullscreen) {
    ww = ww + 90 + leftW
    wh = wh + 80
  }
  if (wh / ww < ratio) {
    $('.slide-img-container').height(wh)
    $('.slide-img-container').width(wh / ratio)
  } else {
    $('.slide-img-container').width(ww)
    $('.slide-img-container').height(ww * ratio)
  }
}

$(document).keydown(function (event) {
  if (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 33) {	// 37 left, 38 up, 33 pageUp
    preSlide()
  } else if (event.keyCode === 39 || event.keyCode === 40 || event.keyCode === 32 || event.keyCode === 34) {	// 39 right, 40 down, 32 space, 34 pageDown
    nextSlide()
  } else if (event.keyCode === 13) {
    screenfull.toggle($('.slide-img-container')[0])
  }
})

function getCurSlide() {
  return curSlide
}

function preSlide() {
  const preSlide = eval(Number(getCurSlide()) - 1)
  gotoSlide(preSlide)
}

function nextSlide() {
  const nextSlide = eval(Number(getCurSlide()) + 1)
  gotoSlide(nextSlide)
}

function gotoSlide(slide) {
  const slideSum = slideUrls.length
  if (slide <= 0) {
    slide = 1
  } else if (slideSum < slide) {
    slide = slideSum
  }
  curSlide = slide
  /*
  $(".slide-img-container img").fadeOut(function() {
      $(this).attr("src", slideUrls[slide - 1]).fadeIn();
  });
  */
  $('.slide-img-container img').attr('src', slideUrls[slide - 1])
  const percent = Math.ceil((curSlide / slideUrls.length) * 100)
  $('.thumbnail').removeClass('ppt-thumb-border')
  $('.thumbnail[page="' + slide + '"]').addClass('ppt-thumb-border')
  const thumbTop = slide * ($('.thumbnail[page="' + 1 + '"]').height() + 10 + $('.thumb-page-number-container').height()) - ($(document).height() / 2)
  $('.span2 ').animate({ scrollTop: (thumbTop) }, 'slow')
  $('.select-page-selector').val(slide)
  $('.select-page-selector-sync').val(slide)
  $('.bottom-paging-progress .bar').width('' + percent + '%')


}
