function closeWindow() {
  const userAgent = navigator.userAgent
  if (userAgent.indexOf('Firefox') > -1) {
    const opened = window.open('about:blank', '_self')
    opened.opener = null
    opened.close()
  } else {
    window.opener = null
    window.open('', '_self')
    window.close()
  }
}

function fireKeyEvent(el, evtType, keyCode) {
  var doc = el.ownerDocument,
    win = doc.defaultView || doc.parentWindow,
    evtObj
  if (doc.createEvent) {
    if (win.KeyEvent) {
      evtObj = doc.createEvent('KeyEvents')
      evtObj.initKeyEvent(evtType, true, true, win, false, false, false, false, keyCode, 0)
    } else {
      evtObj = doc.createEvent('UIEvents')
      Object.defineProperty(evtObj, 'keyCode', {
        get: function () {
          return this.keyCodeVal
        }
      })
      Object.defineProperty(evtObj, 'which', {
        get: function () {
          return this.keyCodeVal
        }
      })
      evtObj.initUIEvent(evtType, true, true, win, 1)
      evtObj.keyCodeVal = keyCode
      if (evtObj.keyCode !== keyCode) {
        console.log('keyCode ' + evtObj.keyCode + ' 和 (' + evtObj.which + ') 不匹配')
      }
    }
    el.dispatchEvent(evtObj)
  } else if (doc.createEventObject) {
    evtObj = doc.createEventObject()
    evtObj.keyCode = keyCode
    el.fireEvent('on' + evtType, evtObj)
  }
}
