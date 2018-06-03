/* global WaveSurfer:false */

const recorderRecordElm = document.querySelector('[data-recorder-record]')
const recorderPauseElm = document.querySelector('[data-recorder-pause]')
const recorderResumeElm = document.querySelector('[data-recorder-resume]')
const recorderStopElm = document.querySelector('[data-recorder-stop]')
const playerPlayElm = document.querySelector('[data-player-play]')
const playerPauseElm = document.querySelector('[data-player-pause]')
const playerStopElm = document.querySelector('[data-player-stop]')

const downloadElm = window.document.createElement('a')
downloadElm.download = 'recording.webm'
downloadElm.textContent = 'Download'
const player = WaveSurfer.create({
  container: '[data-waveform]'
})

window.__player = player

const disableAndHide = (element) => {
  element.disabled = true
  element.style.display = 'none'
}

const enableAndShow = (element) => {
  element.disabled = false
  element.style.display = 'inline-block'
}

const showDownloadElm = () => { document.body.appendChild(downloadElm) }
const hideDownloadElm = () => { downloadElm && downloadElm.parentNode && downloadElm.remove() }

navigator.mediaDevices.getUserMedia({audio: true})
  .then((stream) => {
    enableAndShow(recorderRecordElm)
    const mimeType = 'audio/webm'
    const recorder = new window.MediaRecorder(stream, {mimeType})
    window.__recorder = recorder
    const chunks = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstart = () => {
      player.empty()
      disableAndHide(recorderRecordElm)
      enableAndShow(recorderPauseElm)
      disableAndHide(recorderResumeElm)
      enableAndShow(recorderStopElm)
      disableAndHide(playerPlayElm)
      disableAndHide(playerPauseElm)
      disableAndHide(playerStopElm)
      hideDownloadElm()
    }
    recorder.onpause = () => {
      disableAndHide(recorderRecordElm)
      disableAndHide(recorderPauseElm)
      enableAndShow(recorderResumeElm)
      enableAndShow(recorderStopElm)
      disableAndHide(playerPlayElm)
      disableAndHide(playerPauseElm)
      disableAndHide(playerStopElm)
      hideDownloadElm()
    }
    recorder.onstop = () => {
      enableAndShow(recorderRecordElm)
      disableAndHide(recorderPauseElm)
      disableAndHide(recorderResumeElm)
      disableAndHide(recorderStopElm)
      enableAndShow(playerPlayElm)
      disableAndHide(playerPauseElm)
      disableAndHide(playerStopElm)
      let url = window.URL.createObjectURL(new window.Blob(chunks, {type: mimeType}))
      player.load(url) // to test player failure, comment this line
      chunks.length = 0
      downloadElm.href = url
      showDownloadElm()
    }
    player.on('play', () => {
      disableAndHide(recorderRecordElm)
      disableAndHide(recorderPauseElm)
      disableAndHide(recorderResumeElm)
      disableAndHide(recorderStopElm)
      disableAndHide(playerPlayElm)
      enableAndShow(playerPauseElm)
      enableAndShow(playerStopElm)
    })
    player.on('pause', () => {
      enableAndShow(recorderRecordElm)
      disableAndHide(recorderPauseElm)
      disableAndHide(recorderResumeElm)
      disableAndHide(recorderStopElm)
      enableAndShow(playerPlayElm)
      disableAndHide(playerPauseElm)
      if (player.getCurrentTime() === player.getDuration()) {
        disableAndHide(playerStopElm)
      } else {
        enableAndShow(playerStopElm)
      }
    })
    // to test recorder failure, comment recorder.start() or whole line
    recorderRecordElm.addEventListener('click', () => { recorder.start() })
    recorderPauseElm.addEventListener('click', () => { recorder.pause() })
    recorderResumeElm.addEventListener('click', () => { recorder.resume() })
    recorderStopElm.addEventListener('click', () => { recorder.stop() })
    playerPlayElm.addEventListener('click', () => { player.play() })
    playerPauseElm.addEventListener('click', () => { player.pause() })
    playerStopElm.addEventListener('click', () => {
      player.stop()
      disableAndHide(playerStopElm)
      showDownloadElm()
    })
  })
