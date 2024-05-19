const btn = document.getElementById('btn')
const filePathElement = document.getElementById('filePath')

btn.addEventListener('click', async () => {
  const filePath = await window.electronAPI.openFile()
  filePathElement.innerText = filePath
})


const NOTIFICATION_TITLE = 'Title'
const NOTIFICATION_BODY = 'Notification from the Renderer process. Click to log to console.'
const CLICK_MESSAGE = 'Notification clicked!'
new window.Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY })
  .onclick = () => { document.getElementById('output').innerText = CLICK_MESSAGE }