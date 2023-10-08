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
