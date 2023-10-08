function closeWindow() {
  if (firefox) {
    const opened = window.open('about:blank', '_self')
    opened.opener = null
    opened.close()
  } else {
    window.opener = null
    window.open('', '_self')
    window.close()
  }
}
