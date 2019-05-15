//var videoElement = document.querySelector('video');
//var audioSelect = document.querySelector('select#audioSource');
//var videoSelect = document.querySelector('select#videoSource');
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
    

    function handleError(error) {
        console.log('Error: ', error);
    }
}
async function getStream(videoSelect, webcam) {
            if (webcam.srcObject) {
                webcam.srcObject.getTracks().forEach(function(track) {
                    track.stop();
                });
                webcam.srcObject = undefined;
            }
            if(videoSelect.value != "Off") {
                var constraints = {
        //            audio: {
        //                deviceId: {exact: audioSelect.value}
        //            },
                    video: {
                        deviceId: {exact: videoSelect.value}
                    }
                };
                let stream = await navigator.mediaDevices.getUserMedia(constraints);
                window.stream = stream; // make stream available to console
                webcam.srcObject = stream;
                webcam.onloadedmetadata = function(e) {
                    webcam.play();
                };
            }
}