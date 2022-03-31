var displayLyrics = document.getElementById("lyrics")

// parsing the Lyrics 
function parseLrc(text, callback) {
    let allTextLines = text.split(/\r\n|\n/);

    let lyrics = [];
    let timestamps = [];
    
    for (i = 0; i < allTextLines.length; i++) {
        if (allTextLines[i].search(/^(\[)(\d*)(:)(.*)(\])(.*)/i) >= 0) // any line without the prescribed format wont enter this loop 
        {
            let line = allTextLines[i].match(/^(\[)(\d*)(:)(.*)(\])(.*)/i);
            timestamps[i] = (parseFloat(line[2]) * 60) + parseFloat(line[4]);
            lyrics[i] = line[6]; //will give lyrics
        }
    }

    return {
        lyrics: lyrics,
        timestamps: timestamps
    }
}

function loadLrc(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = () => {
        if (xhr.readyState == XMLHttpRequest.DONE) {
            data = parseLrc(xhr.responseText)
            callback(data.lyrics, data.timestamps)
        }
    }
    xhr.open('GET', url, true);
    xhr.send(null);
}

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

function syncAudioWithLrc(audio, lyrics, timestamps) {
    // not good
    var lastLyricsIndex = -1
    var onEndOfLyrics = false // will cause a bug if user go to previous timestamps
    const synchronizer = setInterval(() => {
        // minuteText.innerHTML = "Minutes = " + Math.floor(music.currentTime / 60) + "";
        // secondsText.innerHTML = "Seconds = " + Math.floor(music.currentTime % 60) + "";

        if (!audio.paused && audio.currentTime > 0 && !audio.ended) {
            let index = 0
            for (sec of timestamps) {
                // before first lyrics, don't do anything
                if (audio.currentTime < timestamps[0]) {
                    break
                }

                if (!onEndOfLyrics && audio.currentTime < sec) {
                    if (index != lastLyricsIndex) {
                        // update shown lyrics
                        displayLyrics.innerHTML = lyrics[index-1]
                        lastLyricsIndex = index
                    }
                    index += 1
                    break
                } else if (index == timestamps.length-1 && audio.currentTime > sec) {
                    if (!onEndOfLyrics) {
                        // update shown lyrics
                        displayLyrics.innerHTML = lyrics[index]
                        lastLyricsIndex = index
                        // give signal to not update anymore
                        onEndOfLyrics = true
                    }
                    break
                }

                index += 1
            }
        }
    }, 200);

    return synchronizer
}

function startsSong(title) {
    console.log(`new song: ${title}`)

    console.log("preparing audio ...")
    let audio = createAudio(`./db/${title}.mp3`)
    
    console.log("loading lyrics ...")
    loadLrc(`./db/${title}.lrc`, (lyrics, timestamps) => {
        let lyricsReady = false
        if (lyrics.length > 0 && lyrics.length == timestamps.length) {
            lyricsReady = true
            console.log("lyrics ready")
        } else {
            console.log("no lyrics!")
        }
        
        console.log("playing audio ...")
        audio.play()

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

        let synchronizer = null
        if (lyricsReady) {
            // clean undefined value
            lyrics = lyrics.filter((el) => { return el !== undefined; });
            timestamps = timestamps.filter((el) => { return el !== undefined; });

            synchronizer = syncAudioWithLrc(audio, lyrics, timestamps)
            console.log("audio & lyrics synchronized")
        }

        audio.onended = function(){
            if (lyricsReady) clearInterval(synchronizer)
            displayLyrics.innerHTML = ""
            window.onkeypress=(e)=>{} // clear pause event
            audio.remove()
            console.log(`song ${title} ended.`)
            blackhole()
        };
    })

    // set wallpaper
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.14),rgba(0, 0, 0, 0.145)),url("db/${title}.jpg")`
    console.log("background placed")
}

var allSongList = []
var songList = []

var lastIndex = 0
function blackhole() {
    if (songList.length > 0) {
        let index = Math.floor(Math.random() * songList.length);
        let currentTitle = songList[index]
        let ogIndex = 0
        for (ogTitle of allSongList) {
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
        songList = xhr.responseText.split(/\r\n|\n/)
        allSongList = songList.slice() // copy
        if (allSongList.length > 0) {
            blackhole()
        } else {
            displayLyrics.innerHTML = "no songs"
        }
    }
}
xhr.open('GET', './list.txt', true);
xhr.send(null);