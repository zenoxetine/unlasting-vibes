import { lyricsSynchronizer } from "./added-features/lyrics-synchronizer.mjs";
import { audioTimer, progressViewer } from "./added-features/audio-timer.mjs";

var displayLyrics = document.getElementById("lyrics")
var displayTimestamp = document.getElementById("audio-time")
var displayProgress = document.getElementById("audio-progress")

function createAudio(source) {
    let audio = document.createElement('audio');
    audio.style.display = "none";
    audio.autoplay = false;
    audio.src = source // set mp3
    audio.addEventListener('error', (err) => {
        console.log(err)
    });
    document.body.appendChild(audio);

    // audio.load()

    return audio
}

function startsSong(title) {
    console.log(`new song: ${title}`)
    
    console.log("preparing audio ...")
    let audio = createAudio(`./db/${title}.mp3`)
    
    window.onkeypress = function(event) {
        if (event.which == 32) {
            if (!audio.paused) {
                audio.pause()
                console.log("audio paused.")
            } else if (audio.paused) {
                audio.play()
                console.log("audio continued.")
            }
        }
    }

    console.log("loading lyrics ...")
    lyricsSynchronizer.sync({
        lrc: `./db/${title}.lrc`,
        audio: audio,
        tag: displayLyrics,
    })

    audioTimer.create(audio, displayTimestamp)
    progressViewer.create(audio, displayProgress)
    
    audio.addEventListener('timeupdate', () => {
        lyricsSynchronizer.update()
        audioTimer.update()
        progressViewer.update()
    })
    
    audio.addEventListener('ended', () => {
        lyricsSynchronizer.clear()
        audioTimer.clear()
        window.onkeypress=(e)=>{} // clear pause event
        audio.remove()
        console.log(`song ${title} ended.`)
        blackhole()
    })
    
    // set wallpaper
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.14),rgba(0, 0, 0, 0.145)),url("db/${title}.jpg")`
    console.log("background placed")

    console.log("playing audio ...")
    audio.play()
}

var allSongList = []
var songList = []

var lastIndex = 0
function blackhole() {
    if (songList.length > 0) {
        let index = Math.floor(Math.random() * songList.length);
        let currentTitle = songList[index]
        let ogIndex = 0
        for (const ogTitle of allSongList) {
            if (ogTitle == currentTitle) {
                lastIndex = ogIndex
                break
            }
            ogIndex += 1
        }
        startsSong(currentTitle)
        songList.splice(index, 1)
    } else if (songList.length == 0 && allSongList.length > 0){
        songList = allSongList.slice() // copy
        if (allSongList.length > 1) {
            songList.splice(lastIndex, 1)
        }
        blackhole()
    }
}

let xhr = new XMLHttpRequest();
xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.responseText) {
            songList = xhr.responseText.split(/\r\n|\n/)
            allSongList = songList.slice() // copy
            blackhole()
        } else {
            displayLyrics.innerHTML = "no songs"
            document.body.style = "background-color: black;"
        }
    }
}
xhr.open('GET', './list.txt', true);
xhr.send(null);