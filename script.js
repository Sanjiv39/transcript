/* The code is implementing a recording feature for audio using the MediaStream Recording API in
JavaScript. */
let fileName = document.querySelector(".filename");
let fileProgress = document.querySelector(".file-progress");
let uploadDiv = document.querySelector(".upload.btn");
let recordDiv = document.querySelector(".record.btn");
let pauseBtn = document.querySelector(".pause.btn");
let downloadAudio = document.querySelector(".download-audio");
let submitBtn = document.querySelector(".submit-btn");
let generateSoapBtn = document.querySelector(".generate-soap");
let copyBtns = document.querySelectorAll(".copy-btn");
let textBoxes = document.querySelectorAll(".transcript-text-wrapper");
let rawStatus = false;
let summaryStatus = false;
let date = new Date();
let scroller = [];
let rawTranscript = "";
let transcriptErr = false;
let transcriptUploaded = false;
let soapErr = false;
let soapStatus = false;
let soapUrl = "";

// Utils functions
const getDateStr = () => {
  let day = date.getDate();
  day = day <= 9 ? `0${day}` : `${day}`;
  let mon = date.getMonth() + 1;
  mon = mon <= 9 ? `0${mon}` : `${mon}`;
  let yr = date.getFullYear();
  let str = `${day}-${mon}-${yr}`;
  return str;
};
console.log(getDateStr());

const getSize = (bytes) => {
  if (bytes >= 1073741824) {
    bytes = (bytes / 1073741824).toFixed(2) + " GB";
  } else if (bytes >= 1048576) {
    bytes = (bytes / 1048576).toFixed(2) + " MB";
  } else if (bytes >= 1024) {
    bytes = (bytes / 1024).toFixed(2) + " KB";
  } else if (bytes > 1) {
    bytes = bytes + " bytes";
  } else if (bytes == 1) {
    bytes = bytes + " byte";
  } else {
    bytes = "0 bytes";
  }
  return bytes;
};

const copy = (text) => {
  navigator.clipboard.writeText(text);
};

// API
const post = (file) => {
  let formData = new FormData();
  formData.append("audio_file", file);
  fetch("http://44.222.228.231:5000/get_transcription", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      rawTranscript = data.transcription;
      transcriptUploaded = true;
      typing("raw", data.transcription);
      submitBtn.disabled = true;
      copyBtns[1].disabled = true;
      document.querySelector("#raw").innerHTML = "";
      document.querySelector("#summary").innerHTML = "";
    })
    .catch((error) => {
      console.error("Error:", error);
      transcriptErr = true;
    })
    .finally(() => {
      uploadDiv.disabled = false;
      recordDiv.disabled = false;
    });
};
const generateSummary = (text) => {
  // console.log(text)
  fetch("http://44.222.228.231:5000/get_summary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_text: text }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      typing("summary", data.summary);
      generateSoapBtn.disabled = false;
    })
    .catch((error) => {
      console.error("Error:", error);
      submitBtn.disabled = false;
    })
    .finally(() => {
      recordDiv.disabled = false;
      uploadDiv.disabled = false;
    });
};
const generateSOAP = (text) => {
  // console.log(text)
  fetch("http://44.222.228.231:5000/get_soap_notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input_text: text }),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Success:", data);
      soapUrl = data.pdf_file_path;
      soapErr = false;
      soapStatus = true;
    })
    .catch((error) => {
      console.error("Error:", error);
      soapErr = true;
      generateSoapBtn.disabled = false;
    })
    .finally(() => {
      recordDiv.disabled = false;
      uploadDiv.disabled = false;
    });
};

// Status changers---------------------------------------------------------------------------------

const changeRecordStatus = (status) => {
  status
    ? (pauseBtn.style.display = "flex")
    : (pauseBtn.style.display = "none");
  status ? (submitBtn.disabled = true) : "";
  status ? (uploadDiv.disabled = true) : (uploadDiv.disabled = false);
  status ? (downloadAudio.disabled = true) : (downloadAudio.disabled = false);
  recordDiv.classList.toggle("recording");
  let img = status ? "mic-off" : "mic";
  let text = status ? "Stop Recording" : "Record Audio";
  let micImg = `<img src="./assets/${img}.svg" alt="Record/Stop Icon" />`;
  recordDiv.innerHTML = micImg + text;
};

const changePauseStatus = (status) => {
  let img = status ? "play" : "pause";
  let text = status ? "Resume Recording" : "Pause Recording";
  let imgStr = `<img src="./assets/${img}.svg" alt="Play/Pause Icon" />`;
  status
    ? pauseBtn.classList.add("paused")
    : pauseBtn.classList.remove("paused");
  pauseBtn.innerHTML = imgStr + text;
};

const toggleRecordBtn = (type) => {
  switch (type) {
    case "raw":
      rawStatus = true;
      submitBtn.disabled = false;
      break;
    case "summary":
      summaryStatus = true;
      submitBtn.disabled = true;
      break;
    default:
      break;
  }
  recordDiv.disabled = false;
  uploadDiv.disabled = false;
};

const scrollToEnd = (id) => {
  let div = document.querySelector(`#${id}`);
  div.scrollTop = div.scrollHeight;
};

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
    // recordDiv.innerText = "Record";
  },
  record: async () => {
    // Feature Detection
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      // Feature is not supported in the browser
      // Return a custom error
      return Promise.reject(
        new Error(
          "MediaDevices API or getUserMedia method is not supported in this browser."
        )
      );
    }

    // Feature is supported in the browser
    // Create an audio stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Save the reference of the stream to be able to stop it when necessary
    audio.streamBeingCaptured = stream;
    console.log(stream);
    generateSoapBtn.disabled = true;
    generateSoapBtn.classList.remove("download-soap");
    generateSoapBtn.innerHTML = "Generate SOAP Document";
    fileName.style.display = "none";
    changeRecordStatus(true);
    changePauseStatus(false);

    // Create a media recorder instance by passing that stream into the MediaRecorder constructor
    audio.mediaRecorder = new MediaRecorder(stream);

    // Clear previously saved audio Blobs, if any
    audio.audioBlobs = [];

    // Add a dataavailable event listener in order to store the audio data Blobs when recording
    audio.mediaRecorder.addEventListener("dataavailable", (event) => {
      // Store audio Blob object
      console.log("chunk");
      audio.audioBlobs.push(event.data);
    });

    // Start the recording by calling the start method on the media recorder
    audio.mediaRecorder.start();

    // Return the audio stream
    return stream;
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
        audio.audioBlob = audioBlob;
        downloadAudio.disabled = false;
        // post(audioBlob)
        //resolve promise with the single audio blob representing the recorded audio
        resolve(audioBlob);
        changeRecordStatus(false);
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
        let blob = audio.audioBlobs;
        resolve(audio.mediaRecorder.state);
      });
      changePauseStatus(true);
      //pause the recording feature
      audio.mediaRecorder.pause();
    });
  },
  resume: async () => {
    return new Promise((resolve) => {
      audio.mediaRecorder.addEventListener("resume", () => {
        // console.log(audio.mediaRecorder.state)
        let blob = audio.audioBlobs;
        resolve(audio.mediaRecorder.state);
      });
      changePauseStatus(false);
      audio.mediaRecorder.resume();
    });
  },
  download: () => {
    if (audio.audioBlob) {
      let date = getDateStr();
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

let loremstr =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam et massa ut metus blandit aliquam nec a odio. Nullam fermentum lobortis volutpat. Aliquam cursus lorem eget ex pharetra pellentesque. Suspendisse ac consequat turpis. Nulla facilisi. Vivamus facilisis diam at mauris accumsan aliquam. Aliquam ut velit hendrerit, mollis nunc eu, feugiat risus. Morbi at nisi nunc. In sem quam, commodo et tortor condimentum, fermentum vulputate justo. Mauris malesuada urna tellus, dignissim bibendum metus tristique sit amet. Mauris convallis porttitor leo nec gravida. Nullam vitae lectus ante. Mauris hendrerit dui purus. Morbi sit amet convallis massa, vitae tempor tortor. Nunc sed nulla.";

const typing = (el, str = "") => {
  let btn =
    el === "raw" ? copyBtns[0] : el === "summary" ? copyBtns[1] : undefined;
  scroller.push(
    setInterval(() => {
      // console.log('i am scrolling '+el)
      scrollToEnd(el);
    }, 200)
  );
  const options = {
    strings: [str],
    typeSpeed: 10,
    showCursor: false,
    onBegin: () => {
      recordDiv.disabled = true;
      uploadDiv.disabled = true;
      btn.disabled = true;
    },
    onComplete: () => {
      toggleRecordBtn(el);
      btn.disabled = false;
      scroller.forEach((scroller) => {
        clearInterval(scroller);
      });
    },
  };
  switch (el) {
    case "raw":
      var typed = new Typed("#raw", options);
      break;
    case "summary":
      var typed = new Typed("#summary", options);
      break;

    default:
      break;
  }
};

uploadDiv.addEventListener("click", () => {
  let input = document.createElement("input");
  input.type = "file";
  input.multiple = false;
  input.accept = "audio/*";
  input.click();
  input.onchange = () => {
    let files = [...input.files];
    let file = files[0];
    console.log(file);
    let size = getSize(file.size);
    if (file.type.includes("audio")) {
      transcriptErr = false;
      transcriptUploaded = false;
      recordDiv.disabled = true;
      downloadAudio.disabled = true;
      generateSoapBtn.disabled = true;
      generateSoapBtn.classList.remove("download-soap");
      generateSoapBtn.innerHTML = "Generate SOAP Document";
      fileName.style.display = "block";
      fileName.innerText = `${file.name} \n(${size})`;
      post(file);
      fileProgress.style.display = "block";
      let percent = 5;
      let loader = setInterval(() => {
        if (percent < 95) {
          fileProgress.children[0].style.width = `${percent}%`;
        }
        if (transcriptErr) {
          fileProgress.style.display = "none";
          transcriptErr = false;
          clearInterval(loader);
        }
        if (transcriptUploaded) {
          fileProgress.children[0].style.width = `99%`;
          setTimeout(() => {
            fileProgress.children[0].style.width = `0%`;
            transcriptUploaded = false;
            clearInterval(loader);
            fileProgress.style.display = "none";
          }, 100);
        }
        percent++;
      }, 500);
    }
  };
});

recordDiv.addEventListener("click", async () => {
  if (recordDiv.classList.contains("recording")) {
    await audio.stop();
    console.log(audio.audioBlob);
    post(audio.audioBlob);
  } else {
    console.log(await audio.record());
  }
});

pauseBtn.addEventListener("click", async () => {
  if (audio.mediaRecorder?.state === "paused") {
    console.log(await audio.resume());
  } else {
    console.log(await audio.pause());
  }
});

downloadAudio.addEventListener("click", () => {
  audio.download();
});

submitBtn.addEventListener("click", () => {
  submitBtn.disabled = true;
  recordDiv.disabled = true;
  uploadDiv.disabled = true;
  generateSummary(rawTranscript);
});

copyBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    copy(btn.parentElement.nextElementSibling.children[0].innerText);
  });
});

generateSoapBtn.addEventListener("click", () => {
  if (!generateSoapBtn.classList.contains("download-soap")) {
    generateSOAP(rawTranscript);
    soapErr = false;
    soapStatus = false;
    soapUrl = "";
    let i = 0;
    generateSoapBtn.disabled = true;
    let loader = setInterval(() => {
      if (soapStatus === true) {
        generateSoapBtn.innerHTML = `<img src='./assets/download.svg' alt='Download'/> Download SOAP Document`;
        generateSoapBtn.disabled = false;
        generateSoapBtn.classList.add("download-soap");
        clearInterval(loader);
      } else if (i > 45 && soapErr === false) {
        generateSoapBtn.innerHTML = "Please Wait....";
      } else if (soapErr === true) {
        generateSoapBtn.innerHTML = "Generate SOAP Document";
        generateSoapBtn.disabled = false;
        clearInterval(loader);
      } else {
        generateSoapBtn.innerHTML = `${45 - i}`;
      }
      i++;
    }, 1000);
  } else {
    window.location.href = soapUrl;
    generateSoapBtn.classList.remove("download-soap");
    generateSoapBtn.innerHTML = "Generate SOAP Document";
  }
});
