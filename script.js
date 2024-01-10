/* The code is implementing a recording feature for audio using the MediaStream Recording API in
JavaScript. */
let fileName = document.querySelector('.filename')
let uploadDiv = document.querySelector(".upload.btn");
let recordDiv = document.querySelector(".record.btn");
let downloadAudio = document.querySelector('.download-audio')
let submitBtn = document.querySelector('.submit-btn')
let copyBtns = document.querySelectorAll('.copy-btn')
let rawStatus = false
let summaryStatus = false
let date = new Date()

const getDateStr = () => {
  let day = date.getDate()
  day = day <= 9 ? `0${day}` : `${day}`
  let mon = date.getMonth() + 1
  mon = mon <= 9 ? `0${mon}` : `${mon}`
  let yr = date.getFullYear()
  let str = `${day}-${mon}-${yr}`
  return str
}
console.log(getDateStr())

const getSize = (bytes) => {
  if (bytes >= 1073741824) { bytes = (bytes / 1073741824).toFixed(2) + " GB"; }
  else if (bytes >= 1048576) { bytes = (bytes / 1048576).toFixed(2) + " MB"; }
  else if (bytes >= 1024) { bytes = (bytes / 1024).toFixed(2) + " KB"; }
  else if (bytes > 1) { bytes = bytes + " bytes"; }
  else if (bytes == 1) { bytes = bytes + " byte"; }
  else { bytes = "0 bytes"; }
  return bytes;
}

const changeRecordStatus = (status) => {
  status ? submitBtn.disabled = true : submitBtn.disabled = false
  recordDiv.classList.toggle("recording");
  let img = status ? 'mic-off' : 'mic'
  let text = status ? 'Stop Recording' : 'Record Audio'
  let micImg = `<img src="./assets/${img}.svg" alt="Record Icon" />`
  recordDiv.innerHTML = micImg + text
}

const toggleRecordBtn = (type) => {
  switch (type) {
    case 'raw':
      rawStatus = true
      break;
    case 'summary':
      summaryStatus = true
      break;
    default:
      break;
  }
  setTimeout(() => {
    let status = rawStatus && summaryStatus
    if (status) {
      recordDiv.disabled = false
    } else {
      recordDiv.disabled = true
    }
  }, 500)
}

const audio = {
  audioBlob: undefined,
  audioBlobs: [],
  mediaRecorder: undefined,
  streamBeingCaptured: undefined,
  reset: () => {
    audio.audioBlobs = [];
    audio.mediaRecorder = undefined;
    audio.streamBeingCaptured = undefined;
    recordDiv.innerText = "Record";
  },
  record: async () => {
    //Feature Detection
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      //Feature is not supported in browser
      //return a custom error
      return Promise.reject(
        new Error(
          "mediaDevices API or getUserMedia method is not supported in this browser."
        )
      );
    } else {
      //Feature is supported in browser
      //create an audio stream
      return (
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          //returns a promise that resolves to the audio stream
          .then((stream) => {
            //save the reference of the stream to be able to stop it when necessary
            audio.streamBeingCaptured = stream;
            console.log(stream);
            changeRecordStatus(true)
            fileName.style.display = 'none'
            //create a media recorder instance by passing that stream into the MediaRecorder constructor
            audio.mediaRecorder = new MediaRecorder(
              stream
            ); /*the MediaRecorder interface of the MediaStream Recording
                    API provides functionality to easily record media*/

            //clear previously saved audio Blobs, if any
            audio.audioBlobs = [];

            //add a dataavailable event listener in order to store the audio data Blobs when recording
            audio.mediaRecorder.addEventListener("dataavailable", (event) => {
              //store audio Blob object
              audio.audioBlobs.push(event.data);
            });

            //start the recording by calling the start method on the media recorder
            audio.mediaRecorder.start();
          })
      );

      /* errors are not handled in the API because if its handled and the promise is chained, the .then after the catch will be executed*/
    }
  },
  stop: async () => {
    //return a promise that would return the blob or URL of the recording
    return new Promise((resolve) => {
      //save audio type to pass to set the Blob type
      let mimeType = audio.mediaRecorder.mimeType;

      //listen to the stop event in order to create & return a single Blob object
      audio.mediaRecorder.addEventListener("stop", () => {
        //create a single blob object, as we might have gathered a few Blob objects that needs to be joined as one
        let audioBlob = new Blob(audio.audioBlobs, { type: mimeType });
        audio.audioBlob = audioBlob
        downloadAudio.disabled = false
        //resolve promise with the single audio blob representing the recorded audio
        resolve(audioBlob);
        changeRecordStatus(false)
      });

      //stop the recording feature
      audio.mediaRecorder.stop();

      //stop all the tracks on the active stream in order to stop the stream
      audio.stopStream();

      //reset API properties for next recording
      audio.reset();
    });
  },
  stopStream: () => {
    //stopping the capturing request by stopping all the tracks on the active stream
    audio.streamBeingCaptured
      .getTracks() //get all tracks from the stream
      .forEach((track) => track.stop()); //stop each one
  },
  download: () => {
    if (audio.audioBlob) {
      let date = getDateStr()
      const blobUrl = URL.createObjectURL(audio.audioBlob);
      const link = document.createElement("a");
      // Set link's href to point to the Blob URL
      link.href = blobUrl;
      link.download = `audio ${date}.mp4`;
      link.click();
    }
  },
};

// Typer---------------------------------------------------------------------------------------
let loremstr = 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Error recusandae, dolore quidem iste, esse iusto aliquid repellat pariatur officiis suscipit sequi. Exercitationem ullam quas earum debitis aliquam quam repellendus. Qui? Lorem ipsum, dolor sit amet consectetur adipisicing elit. Error recusandae, dolore quidem iste, esse iusto aliquid repellat pariatur officiis suscipit sequi. Exercitationem ullam quas earum debitis aliquam quam repellendus. Qui? Lorem ipsum, dolor sit amet consectetur adipisicing elit. Error recusandae, dolore quidem iste, esse iusto aliquid repellat pariatur officiis suscipit sequi. Exercitationem ullam quas earum debitis aliquam quam repellendus. Qui?'

const typing = (el) => {
  // document.querySelector('#raw').innerHTML = ''
  // document.querySelector('#summary').innerHTML = ''
  const options = {
    strings: [loremstr],
    typeSpeed: 50,
    showCursor: false,
    onBegin: () => { recordDiv.disabled = true },
    onComplete: () => {
      toggleRecordBtn(el); copyBtns.forEach((btn) => {
        btn.disabled = false
      })
    }
  }
  switch (el) {
    case 'raw':
      var typed = new Typed('#raw', options);
      break;
    case 'summary':
      var typed = new Typed('#summary', options);
      break;

    default:
      break;
  }
}


uploadDiv.addEventListener("click", () => {
  let input = document.createElement("input");
  input.type = "file";
  input.multiple = false;
  input.accept = 'audio/*'
  input.click();
  input.onchange = () => {
    let files = [...input.files];
    let file = files[0];
    console.log(file);
    fileName.style.display = 'block'
    let size = getSize(file.size)
    fileName.innerText = `${file.name} (${size})`
  };
});

recordDiv.addEventListener("click", async () => {
  if (recordDiv.classList.contains("recording")) {
    console.log(await audio.stop());
  } else {
    console.log(await audio.record());
  }
});

downloadAudio.addEventListener('click', () => {
  audio.download()
})

submitBtn.addEventListener('click', () => {
  typing('raw')
  typing('summary')
})