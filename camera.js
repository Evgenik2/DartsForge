
let recorder = undefined;
let allChunks = [];
async function startRecord() {
    if(settings.targetDeviceId == "Off" && settings.portraitDeviceId == "Off")
        return;
    await videoContainer.init();
    const stream = videoContainer.canvas.captureStream();
    allChunks = [];
    recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm',
    });
    recorder.ondataavailable = function(e) {
        allChunks.push(e.data);
    };
    recorder.onstop = (e) => {
        const fullBlob = new Blob(allChunks, { 'type' : 'video/webm' });
        let leg = keyboardKeys.eventHistoryItemLegs[keyboardKeys.eventHistoryItemLegs.length - 1];
        downloadBlob(new Date().toISOString() + "_" + leg.player1 + "_vs_" + leg.player2 + ".webm", fullBlob);
        recorder = undefined;
    }
    recorder.start();
    setTimeout(() => {
        finishRecord();
    }, 60*60*1000);
}
async function finishRecord() {
    await recorder.stop();
}
var videoContainer = {
    initialized: false,
    canvas: undefined,
    previewCanvas: undefined,
    previewCanvas2: undefined,
    ctx: undefined,
    previewCtx: undefined,
    previewCtx2: undefined,
    ready: false,
    portraitVideo: undefined,
    targetVideo: undefined,
    portraitScale: 1,
    targetScale: 1,
    portraitVideoLoaded: false,
    targetVideoLoaded: false,
    init: async function() {
        if(this.initialized)
            return;
//        let videoContainer = document.getElementById("videoContainer");
        this.previewCanvas = document.getElementById("videoCanvas");
        this.previewCanvas2 = document.getElementById("videoCanvas2");
        this.canvas = document.createElement("canvas");
//        document.getElementById("setupCamera").appendChild(this.canvas);
        this.canvas.width = 1920;
        this.canvas.height = 1080;
        this.previewCanvas.width = 1920;
        this.previewCanvas.height = 1080;
        this.previewCanvas2.width = 1920;
        this.previewCanvas2.height = 1080;
        this.ctx = this.canvas.getContext("2d");
        this.previewCtx = this.previewCanvas.getContext("2d");
        this.previewCtx2 = this.previewCanvas2.getContext("2d");
        if(settings.portraitDeviceId && settings.portraitDeviceId != "Off") {
            this.portraitVideo = document.createElement("video"); // create a video element
            this.portraitVideo.srcObject = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: settings.portraitDeviceId }
                }
            });
            this.portraitVideo.play();
            this.portraitVideoLoaded = true;
        } else {
            this.portraitVideoLoaded = false;
            if(this.portraitVideo) {
                this.portraitVideo.srcObject.getTracks().forEach(function(track) {
                    track.stop();
                });
                delete this.portraitVideo;
            }
        }
        if(settings.targetDeviceId && settings.targetDeviceId != "Off") {
            this.targetVideo = document.createElement("video"); // create a video element
            this.targetVideo.srcObject = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: {exact: settings.targetDeviceId }
                }
            });
            this.targetVideo.play();
            this.targetVideoLoaded = true;
        } else {
            this.targetVideoLoaded = false;
            if(this.targetVideo) {
                this.targetVideo.srcObject.getTracks().forEach(function(track) {
                    track.stop();
                });
                delete this.targetVideo;
            }
        }
        videoContainer.ready = true;
        requestAnimationFrame(update);
    }
};
function update() {
    videoContainer.ctx.clearRect(0, 0, videoContainer.canvas.width, videoContainer.canvas.height); 
    if(videoContainer.ready) { 
//        if(videoContainer.portraitVideoLoaded) {
//            videoContainer.portraitVideo.muted = true;
//            videoContainer.ctx.save();
//            videoContainer.ctx.rect(0, 0, videoContainer.canvas.width / 2, videoContainer.canvas.height);
//            videoContainer.ctx.clip();
//            videoContainer.ctx.drawImage(videoContainer.portraitVideo, settings.portraitLeft, settings.portraitTop, videoContainer.portraitVideo.videoWidth * settings.portraitScale, videoContainer.portraitVideo.videoHeight * settings.portraitScale);
//            videoContainer.ctx.restore();
//        }
//        if(videoContainer.targetVideoLoaded) {
//            videoContainer.targetVideo.muted = true;
//            videoContainer.ctx.save();
//            videoContainer.ctx.rect(videoContainer.canvas.width / 2, 0, videoContainer.canvas.width / 2, videoContainer.canvas.height);
//            videoContainer.ctx.clip();
//            videoContainer.ctx.drawImage(videoContainer.targetVideo, videoContainer.canvas.width / 2 + settings.targetLeft, settings.targetTop, videoContainer.targetVideo.videoWidth * settings.targetScale, videoContainer.targetVideo.videoHeight * settings.targetScale);
//            videoContainer.ctx.restore();
//        }
        if(videoContainer.portraitVideoLoaded) {
            videoContainer.portraitVideo.muted = true;
            let vw = videoContainer.portraitVideo.videoWidth;
            let vh = videoContainer.portraitVideo.videoHeight;
            let cw = videoContainer.targetVideoLoaded ? videoContainer.canvas.width / 2 : videoContainer.canvas.width;
            let ch = videoContainer.canvas.height;
            let s = cw / ch;
            let dl = (vw - vh * s) / 2;
            videoContainer.ctx.drawImage(videoContainer.portraitVideo,
                dl - settings.portraitLeft, -settings.portraitTop, vh * s / settings.portraitScale, vh / settings.portraitScale, 0, 0, cw, ch);
        }
        if(videoContainer.targetVideoLoaded) 
        {
            videoContainer.targetVideo.muted = true;
            let vw = videoContainer.targetVideo.videoWidth;
            let vh = videoContainer.targetVideo.videoHeight;
            let cw = videoContainer.portraitVideoLoaded ? videoContainer.canvas.width / 2 : videoContainer.canvas.width;
            let ch = videoContainer.canvas.height;
            let s = cw / ch;
            let dl = (vw - vh * s) / 2;
            videoContainer.ctx.drawImage(videoContainer.targetVideo,
                dl - settings.targetLeft, -settings.targetTop, vh * s / settings.targetScale, vh * settings.targetScale, videoContainer.portraitVideoLoaded ? cw : 0, 0, cw, ch);
        }
    }
    drawScore(30, 800, 900, 200);
    videoContainer.previewCtx.clearRect(0, 0, videoContainer.previewCanvas.width, videoContainer.previewCanvas.height); 
    videoContainer.previewCtx.drawImage(videoContainer.canvas, 0, 0, videoContainer.previewCanvas.width, videoContainer.previewCanvas.height);
    videoContainer.previewCtx2.clearRect(0, 0, videoContainer.previewCanvas2.width, videoContainer.previewCanvas2.height); 
    videoContainer.previewCtx2.drawImage(videoContainer.canvas, 0, 0, videoContainer.previewCanvas2.width, videoContainer.previewCanvas2.height);
    requestAnimationFrame(update);
}
function ctxrect(ctx, bg, fg, x, y, w, h, c, r, cs, rs, text, align) {
    let cc = 100;
    let rc = 100;
    let cw = w / cc;
    let rh = h / rc;
    let xx = x + cw * c;
    let yy = y + rh * r;
    let ww = cs * cw;
    let hh = rs * rh;
    ctx.fillStyle = bg;
    ctx.fillRect(xx, yy, ww, hh);
    ctx.fillStyle = fg;
    ctx.font = 'bold ' + (hh * 0.75) + 'px sans-serif';
    ctx.textBaseline = "middle"; 
    ctx.textAlign = align ? align : "left"; 
    ctx.fillText(text, ctx.textAlign == "center" ? xx + ww / 2 : xx + cw, yy + hh / 2);
}
function drawScore(x, y, w, h) {
    //3 3 1 1 1 1
    let leg = keyboardKeys.eventHistoryItemLegs[keyboardKeys.eventHistoryItemLegs.length - 1];
    let item = keyboardKeys.eventHistoryItemList[0];
    let ctx = videoContainer.ctx;
    if(item.setLength == 1) {
        ctxrect(ctx, "#444444", "white", x, y, w, h, 20, 0, 50, 20, "Best of " + item.legLength + " legs");
        ctxrect(ctx, "white", "black", x, y, w, h, 20, 20, 50, 30, leg.player1 ? leg.player1 : "Player 1");
        ctxrect(ctx, "white", "black", x, y, w, h, 20, 50, 50, 30, leg.player2 ? leg.player2 : "Player 2");
        ctxrect(ctx, "#444444", "white", x, y, w, h, 70, 0, 10, 20, "Legs", "center");
        ctxrect(ctx, "#444444", "white", x, y, w, h, 80, 0, 15, 20, "", "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 70, 20, 10, 30, item.wonLegs1, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 70, 50, 10, 30, item.wonLegs2, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 80, 20, 15, 30, leg.left1, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 80, 50, 15, 30, leg.left2, "center");
    } else {
        ctxrect(ctx, "#444444", "white", x, y, w, h, 15, 0, 45, 20, "Best of " + item.setLength + " sets of " + item.legLength + " legs");
        ctxrect(ctx, "white", "black", x, y, w, h, 15, 20, 45, 30, leg.player1 ? leg.player1 : "Player 1");
        ctxrect(ctx, "white", "black", x, y, w, h, 15, 50, 45, 30, leg.player2 ? leg.player2 : "Player 2");
        ctxrect(ctx, "#444444", "white", x, y, w, h, 60, 0, 10, 20, "Sets", "center");
        ctxrect(ctx, "#444444", "white", x, y, w, h, 70, 0, 10, 20, "Legs", "center");
        ctxrect(ctx, "#444444", "white", x, y, w, h, 80, 0, 15, 20, "", "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 60, 20, 10, 30, item.wonSets1, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 60, 50, 10, 30, item.wonSets2, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 70, 20, 10, 30, item.wonLegs1, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 70, 50, 10, 30, item.wonLegs2, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 80, 20, 15, 30, leg.left1, "center");
        ctxrect(ctx, "green", "white", x, y, w, h, 80, 50, 15, 30, leg.left2, "center");
    }
    let e1 = settings.getEnding(leg.left1, undefined);
    let e2 = settings.getEnding(leg.left2, undefined);
    if(e1)
        ctxrect(ctx, "red", "white", x, y, w, h, 0, 26, 20, 18, e1, "center");
    if(e2)
        ctxrect(ctx, "red", "white", x, y, w, h, 0, 56, 20, 18, e2, "center");

    ctxrect(ctx, "transparent", "red", x, y, w, h, 96, leg.next == 1 ? 21 : 51, 5, 25, "<");
    
//    ctx.strokeStyle = "white";
//    ctx.lineWidth = 5;
//    ctx.strokeRect(x+5, y+5, w-5, h-5);
//    ctx.font = 'bold 30px sans-serif';
//    ctx.strokeText("Stroke text", 20, 100);
}
async function initDevices(audioSelect, video1Select, video2Select) {
    let deviceInfos = await navigator.mediaDevices.enumerateDevices();
    let audios = deviceInfos.filter(e=>e.kind === 'audioinput');
    let videos = deviceInfos.filter(e=>e.kind === 'videoinput');
    fillOpt(audioSelect, audios, i => audios[i].label || 'microphone ' + (i + 1), i => audios[i].deviceId, "Off");
    if(settings.audioDeviceId)
        audioSelect.selectedIndex = audios.findIndex(i => i.deviceId == settings.audioDeviceId);
    fillOpt(video1Select, videos, i => videos[i].label || 'camera ' + (i + 1), i => videos[i].deviceId, "Off");
    if(settings.portraitDeviceId)
        video1Select.selectedIndex = videos.findIndex(i => i.deviceId == settings.portraitDeviceId);
    fillOpt(video2Select, videos, i => videos[i].label || 'camera ' + (i + 1), i => videos[i].deviceId, "Off");
    if(settings.targetDeviceId)
        video2Select.selectedIndex = videos.findIndex(i => i.deviceId == settings.targetDeviceId);
    //videoContainer.init();
}


async function getStream(deviceId, webcam) {
    if (webcam.srcObject) {
        webcam.srcObject.getTracks().forEach(function(track) {
            track.stop();
        });
        webcam.srcObject = undefined;
    }
    if(deviceId != "Off") {
        let stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: {exact: deviceId}
                        }
                    });
        window.stream = stream; // make stream available to console
        webcam.srcObject = stream;
        webcam.onloadedmetadata = function(e) {
            webcam.play();
        };
    }
}