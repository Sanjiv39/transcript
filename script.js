/* The code is implementing a recording feature for audio using the MediaStream Recording API in
JavaScript. */
let fileName = document.querySelector('.filename')
let fileProgress = document.querySelector('.file-progress')
let uploadDiv = document.querySelector(".upload.btn");
let recordDiv = document.querySelector(".record.btn");
let pauseBtn = document.querySelector('.pause.btn');
let downloadAudio = document.querySelector('.download-audio')
let submitBtn = document.querySelector('.submit-btn')
let copyBtns = document.querySelectorAll('.copy-btn')
let textBoxes = document.querySelectorAll('.transcript-text-wrapper')
let rawStatus = false
let summaryStatus = false
let date = new Date()
let scroller = []

// Utils functions
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

const copy = (text) => {
  navigator.clipboard.writeText(text)
}

// Status changers---------------------------------------------------------------------------------

const changeRecordStatus = (status) => {
  status ? pauseBtn.style.display = 'flex' : pauseBtn.style.display = 'none'
  status ? submitBtn.disabled = true : submitBtn.disabled = false
  status ? uploadDiv.disabled = true : uploadDiv.disabled = false
  status ? downloadAudio.disabled = true : downloadAudio.disabled = false
  recordDiv.classList.toggle("recording");
  let img = status ? 'mic-off' : 'mic'
  let text = status ? 'Stop Recording' : 'Record Audio'
  let micImg = `<img src="./assets/${img}.svg" alt="Record/Stop Icon" />`
  recordDiv.innerHTML = micImg + text
}

const changePauseStatus = (status) => {
  let img = status ? 'play' : 'pause'
  let text = status ? 'Resume Recording' : 'Pause Recording'
  let imgStr = `<img src="./assets/${img}.svg" alt="Play/Pause Icon" />`
  status ? pauseBtn.classList.add('paused') : pauseBtn.classList.remove('paused')
  pauseBtn.innerHTML = imgStr + text
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
      uploadDiv.disabled = false
      submitBtn.disabled = true
    } else {
      recordDiv.disabled = true
      uploadDiv.disabled = true
    }
  }, 500)
}

const scrollToEnd = (id) => {
  let div = document.querySelector(`#${id}`)
  div.scrollTop = div.scrollHeight
}

// The audio class---------------------------------------------------------------------------------

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
            fileName.style.display = 'none'
            changeRecordStatus(true)
            changePauseStatus(false)
            //create a media recorder instance by passing that stream into the MediaRecorder constructor
            audio.mediaRecorder = new MediaRecorder(
              stream
            ); /*the MediaRecorder interface of the MediaStream Recording API provides functionality to easily record media*/

            //clear previously saved audio Blobs, if any
            audio.audioBlobs = [];

            //add a dataavailable event listener in order to store the audio data Blobs when recording
            audio.mediaRecorder.addEventListener("dataavailable", (event) => {
              //store audio Blob object
              console.log('chunk')
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
  pause: async () => {
    return new Promise((resolve) => {
      audio.mediaRecorder.addEventListener("pause", () => {
        // console.log(audio.mediaRecorder.state)
        let blob = audio.audioBlobs
        resolve(audio.mediaRecorder.state);
      });
      changePauseStatus(true)
      //pause the recording feature
      audio.mediaRecorder.pause();
    });
  },
  resume: async () => {
    return new Promise((resolve) => {
      audio.mediaRecorder.addEventListener("resume", () => {
        // console.log(audio.mediaRecorder.state)
        let blob = audio.audioBlobs
        resolve(audio.mediaRecorder.state);
      });
      changePauseStatus(false)
      audio.mediaRecorder.resume()
    });
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

// Typer-------------------------------------------------------------------------------------------

let loremstr = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam et massa ut metus blandit aliquam nec a odio. Nullam fermentum lobortis volutpat. Aliquam cursus lorem eget ex pharetra pellentesque. Suspendisse ac consequat turpis. Nulla facilisi. Vivamus facilisis diam at mauris accumsan aliquam. Aliquam ut velit hendrerit, mollis nunc eu, feugiat risus. Morbi at nisi nunc. In sem quam, commodo et tortor condimentum, fermentum vulputate justo. Mauris malesuada urna tellus, dignissim bibendum metus tristique sit amet. Mauris convallis porttitor leo nec gravida. Nullam vitae lectus ante. Mauris hendrerit dui purus. Morbi sit amet convallis massa, vitae tempor tortor. Nunc sed nulla.'

const typing = (el) => {
  document.querySelector('#raw').innerHTML = ''
  document.querySelector('#summary').innerHTML = ''
  let str = `${el.toUpperCase()} ${loremstr}`
  scroller.push(setInterval(() => {
    // console.log('i am scrolling '+el)
    scrollToEnd(el)
  }, 200))
  const options = {
    strings: [str],
    typeSpeed: 10,
    showCursor: false,
    onBegin: () => {
      recordDiv.disabled = true;
      uploadDiv.disabled = true
      copyBtns.forEach((btn) => {
        btn.disabled = true
      })
    },
    onComplete: () => {
      toggleRecordBtn(el);
      copyBtns.forEach((btn) => {
        btn.disabled = false
      })
      scroller.forEach((scroller) => { clearInterval(scroller) })
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
    let size = getSize(file.size)
    // if (file.type.includes('audio')) {
    submitBtn.disabled = true
    downloadAudio.disabled = true
    recordDiv.disabled = true
    let reader = new FileReader()
    reader.onloadstart = () => {
      fileName.style.display = 'none'
      fileProgress.style.display = 'block'
    }
    reader.onprogress = (e) => {
      let status = (e.loaded / e.total) * 100
      fileProgress.children[0].style.width = `${status}%`
    }
    reader.onloadend = () => {
      console.log(reader.result)
      fileProgress.style.display = 'none'
      fileName.style.display = 'none'
      recordDiv.disabled = false
      if (reader.result) {
        setTimeout(() => {
          fileName.style.display = 'block'
          fileName.innerText = `${file.name} \n(${size})`
          submitBtn.disabled = false
        }, 1000)
      }
    }
    reader.onerror = () => {
      console.log(reader.error)
    }
    reader.readAsArrayBuffer(file)
    // }
  };
});

recordDiv.addEventListener("click", async () => {
  if (recordDiv.classList.contains("recording")) {
    console.log(await audio.stop());
  } else {
    console.log(await audio.record());
  }
});

pauseBtn.addEventListener('click', async () => {
  if (audio.mediaRecorder?.state === 'paused') {
    console.log(await audio.resume());
  } else {
    console.log(await audio.pause());
  }
})

downloadAudio.addEventListener('click', () => {
  audio.download()
})

submitBtn.addEventListener('click', () => {
  submitBtn.disabled = true
  typing('raw')
  typing('summary')
})

copyBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    copy(btn.parentElement.nextElementSibling.children[0].innerText)
  })
})