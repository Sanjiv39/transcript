let uploadDiv = document.querySelector('.upload.btn')
let recordDiv = document.querySelector('.record.btn')
let navBtn = document.querySelector('.nav-btn')

const audio = {
    audioBlobs: [],
    mediaRecorder: undefined,
    streamBeingCaptured: undefined,
    reset: () => {
        audio.audioBlobs = []
        audio.mediaRecorder = undefined
        audio.streamBeingCaptured = undefined
        recordDiv.innerText = 'Record'
    },
    record: async () => {
        //Feature Detection
        if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
            //Feature is not supported in browser
            //return a custom error
            return Promise.reject(new Error('mediaDevices API or getUserMedia method is not supported in this browser.'));
        }
        else {
            //Feature is supported in browser
            //create an audio stream
            return navigator.mediaDevices.getUserMedia({ audio: true })
                //returns a promise that resolves to the audio stream
                .then(stream => {
                    //save the reference of the stream to be able to stop it when necessary
                    audio.streamBeingCaptured = stream;
                    console.log(stream)
                    recordDiv.classList.add('recording')
                    recordDiv.innerText = 'Stop recording'
                    //create a media recorder instance by passing that stream into the MediaRecorder constructor
                    audio.mediaRecorder = new MediaRecorder(stream); /*the MediaRecorder interface of the MediaStream Recording
                    API provides functionality to easily record media*/

                    //clear previously saved audio Blobs, if any
                    audio.audioBlobs = [];

                    //add a dataavailable event listener in order to store the audio data Blobs when recording
                    audio.mediaRecorder.addEventListener("dataavailable", event => {
                        //store audio Blob object
                        audio.audioBlobs.push(event.data);
                    });

                    //start the recording by calling the start method on the media recorder
                    audio.mediaRecorder.start();
                });

            /* errors are not handled in the API because if its handled and the promise is chained, the .then after the catch will be executed*/
        }
    },
    stop: async () => {
        //return a promise that would return the blob or URL of the recording
        return new Promise(resolve => {
            //save audio type to pass to set the Blob type
            let mimeType = audio.mediaRecorder.mimeType;

            //listen to the stop event in order to create & return a single Blob object
            audio.mediaRecorder.addEventListener("stop", () => {
                //create a single blob object, as we might have gathered a few Blob objects that needs to be joined as one
                let audioBlob = new Blob(audio.audioBlobs, { type: mimeType });

                //resolve promise with the single audio blob representing the recorded audio
                resolve(audioBlob);
                audio.download(audioBlob)
            });

            //stop the recording feature
            audio.mediaRecorder.stop();

            //stop all the tracks on the active stream in order to stop the stream
            audio.stopStream();

            //reset API properties for next recording
            audio.reset();

            // let file = new File(audio.audioBlobs, 'audio.mp4')
            recordDiv.classList.remove('recording')
        });

    },
    stopStream: () => {
        //stopping the capturing request by stopping all the tracks on the active stream
        audio.streamBeingCaptured.getTracks() //get all tracks from the stream
            .forEach(track => track.stop()); //stop each one
    },
    download: (blob) => {
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        // Set link's href to point to the Blob URL
        link.href = blobUrl;
        link.download = 'audio.mp4';
        link.click()
    }
}

navBtn.addEventListener('mouseenter', () => {
    navBtn.classList.add('bg-green')
})
navBtn.addEventListener('mouseleave', () => {
    navBtn.classList.remove('bg-green')
})

uploadDiv.addEventListener('click', () => {
    let input = document.createElement('input')
    input.type = 'file'
    input.multiple = false
    // input.accept = 'audio/*'
    input.click()
    input.onchange = () => {
        let files = [...input.files]
        let file = files[0]
        console.log(file)
    }
})

recordDiv.addEventListener('click', async () => {
    if (recordDiv.classList.contains('recording')) {
        console.log(await audio.stop())
    }
    else {
        console.log(await audio.record())
    }
})