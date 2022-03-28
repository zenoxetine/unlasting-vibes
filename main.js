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
            timestamps[i] = (parseInt(line[2]) * 60) + parseInt(line[4]); // will give seconds 
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
    const synchronizer = setInterval(() => {
        // minuteText.innerHTML = "Minutes = " + Math.floor(music.currentTime / 60) + "";
        // secondsText.innerHTML = "Seconds = " + Math.floor(music.currentTime % 60) + "";

        if (!audio.paused && audio.currentTime > 0 && !audio.ended) {
            let index = 0
            for (sec of timestamps) {
                if (audio.currentTime < sec) {
                    if (lyrics[index-1]) {
                        displayLyrics.innerHTML = lyrics[index-1]
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
    let audio = createAudio(`./db/${title}.ogg`)
    
    console.log("loading lyrics ...")
    loadLrc(`./db/${title}.lrc`, (lyrics, timestamps) => {
        if (timestamps.length > 0) console.log("lyrics ready")
        
        console.log("playing audio ...")
        audio.play()

        synchronizer = syncAudioWithLrc(audio, lyrics, timestamps)
        console.log("audio & lyrics synchronized")
        
        audio.onended = function(){
            clearInterval(synchronizer)
            displayLyrics.innerHTML = ""
            audio.remove()
            console.log(`song ${title} ended.`)
            blackhole()
        };
    })

    // set wallpaper
    document.body.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.1),rgba(0, 0, 0, 0.1)),url(db/${title}.jpg)`
    console.log("background placed")
}

var allSongList = []
var songList = []

var lastIndex = 0
function blackhole() {
    if (songList.length > 0) {
        let index = Math.floor(Math.random() * songList.length);
        lastIndex = index
        let title = songList[index]
        startsSong(title)
        songList.splice(index, 1)
    } else if (songList.length == 0 && allSongList.length > 0){
        songList = allSongList
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
        allSongList = songList.slice()
        if (allSongList.length > 0) {
            blackhole()
        } else {
            displayLyrics.innerHTML = "no songs"
        }
    }
}
xhr.open('GET', './list.txt', true);
xhr.send(null);