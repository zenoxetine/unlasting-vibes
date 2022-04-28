var lyricsSynchronizer = {
    audio: null,
    lyrics: null,
    timestamps: null,
    tag: null,
    lastLyricsIndex: -1,
    onEndOfLyrics: false, // will cause a bug if user go to previous timestamps
    clear: function() {
        this.audio = null
        this.lyrics = null
        this.timestamps = null
        this.tag.innerHTML = ""
        this.tag = null
        this.lastLyricsIndex = -1
        this.onEndOfLyrics = false
    },

    update: function () {
        if (!(this.lyrics)) return

        let index = 0
        for (const sec of this.timestamps) {
            // before first lyrics, don't do anything
            if (this.audio.currentTime < this.timestamps[0]) {
                break
            }

            if (!this.onEndOfLyrics && this.audio.currentTime < sec) {
                if (index != this.lastLyricsIndex) {
                    // update shown lyrics
                    this.tag.innerHTML = this.lyrics[index-1]
                    this.lastLyricsIndex = index
                }
                index += 1
                break
            } else if (index == this.timestamps.length-1 && this.audio.currentTime > sec) {
                if (!this.onEndOfLyrics) {
                    // update shown lyrics
                    this.tag.innerHTML = this.lyrics[index]
                    this.lastLyricsIndex = index
                    // give signal to not update anymore
                    this.onEndOfLyrics = true
                }
                break
            }

            index += 1
        }
    },
    
    parseLrc: function(text, callback) {
        let allTextLines = text.split(/\r\n|\n/);

        let lyrics = [];
        let timestamps = [];
        
        for (let i = 0; i < allTextLines.length; i++) {
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
    },

    sync: function({lrc, audio, tag}, callback=(success)=>{}) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.responseText) {
                    let data = this.parseLrc(xhr.responseText)
                    if (data.lyrics.length != data.timestamps.length) { callback(false); return; }
                    
                    // clean undefined value
                    this.lyrics = data.lyrics.filter((el) => { return el !== undefined; });
                    this.timestamps = data.timestamps.filter((el) => { return el !== undefined; });

                    this.audio = audio
                    this.tag = tag

                    console.log("lyrics ready")
                    callback(true)
                } else {
                    console.log("no lyrics")
                    callback(false)
                }
            }
        }

        xhr.open('GET', lrc, true);
        xhr.send(null);
    }
}

export { lyricsSynchronizer }