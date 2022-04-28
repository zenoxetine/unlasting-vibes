var audioTimer = {
    audio: null,
    tag: null,
    
    create: function (audio, tag) {
        this.audio = audio
        this.tag = tag
    },

    clear: function() {
        this.audio = null
        this.tag.innerHTML = ""
        this.tag = null
    },
    
    pad: function(val) {
        var valString = val + "";
        if (valString.length < 2) {
            return "0" + valString;
        } else {
            return valString;
        }
    },

    update: function() {
        if (this.audio) {
            var secondsLabel = "00"
            var minutesLabel = "00"

            let totalSeconds = parseInt(this.audio.currentTime)

            secondsLabel = this.pad(totalSeconds % 60)
            minutesLabel = this.pad(parseInt(totalSeconds / 60))

            if (this.tag) {
                this.tag.innerHTML = `${minutesLabel}:${secondsLabel}`
            }
        }
    }
}

var progressViewer = {
    audio: null,

    /** @type {HTMLCanvasElement} */
    canvasElement: null,
    
    create: function (audio, canvasElement) {
        this.audio = audio
        this.canvasElement = canvasElement
        this.canvasElement.height = 2
    },

    clear: function () {
        this.audio = null
        this.canvasElement.getContext('2d').clearRect(0, 0, this.canvasElement.width, this.canvasElement.height)
        this.canvasElement = null
    },

    update: function() {
        if (this.audio) {
            let canvasWidth = this.canvasElement.width
            let canvasHeight = this.canvasElement.height
            let ctx = this.canvasElement.getContext("2d")

            ctx.clearRect(0, 0, 1, 1)

            ctx.fillStyle = "rgb(228, 228, 228)"
            ctx.fillRect(0, 0, this.canvasElement.width, 1)
            ctx.fillStyle = "rgb(51, 204, 51)"
            let percentProgress = (this.audio.currentTime/this.audio.duration)
            ctx.fillRect(0, 0, percentProgress*this.canvasElement.width, 1)
        }
    }
}

export { audioTimer, progressViewer }