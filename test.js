const puppeteer = require('puppeteer')
const StaticServer = require('static-server')
const validator = require('validator')
const path = require('path')
const {URL} = require('url')
const url = new URL('http://127.0.0.1/index.html')
const port = process.env.PORT
if (port === undefined) {
  throw new Error(`Environment variable 'PORT' is undefined`)
}
if (!validator.isPort(port)) {
  throw new Error(`Environment variable 'PORT' is not valid`)
}
url.port = port
const server = new StaticServer({
  rootPath: __dirname,
  port
})
const browserP = puppeteer.launch({
  headless: false,
  userDataDir: path.resolve(__dirname, './chromium-user-data-dir')
})
const timeoutPromise = async (promise, erMsg) => {
  let timeoutId
  const returnPromise = await Promise.race([
    promise,
    new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => reject(new Error(erMsg)), 6000)
    })
  ])
  clearTimeout(timeoutId)
  return returnPromise
}

;(async () => {
  await new Promise(resolve => server.start(resolve))
  const browser = await browserP
  const page = await browser.newPage()
  await page.goto(url.toString())
  await page.waitForSelector('[data-recorder-record]', { visible: true })
  const recorderStartedP = page.evaluate(() =>
    new Promise(resolve => window.__recorder.addEventListener('start', resolve)))
  await page.click('[data-recorder-record]')
  await timeoutPromise(recorderStartedP, `Recorder didn't start`)
  await new Promise(resolve => setTimeout(resolve, 100))
  const playerIsReadyP = page.evaluate(() =>
    new Promise(resolve => { window.__player.on('ready', resolve) }))
  await page.click('[data-recorder-stop]')
  await timeoutPromise(playerIsReadyP, `Player didn't get ready`)
  const duration = await page.evaluate(() => window.__player.getDuration())
  if (duration <= 0) { throw new Error('Recording has no duration') }
})()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    const browser = await browserP
    browser.close()
    server.stop()
  })
