const record = document.querySelector(".record");
const stop = document.querySelector(".stop");
const soundClips = document.querySelector(".sound-clips");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");
const recList = document.querySelector(".rec-list");

// disable stop button while not recording

console.log("whatever.");
if (typeof stop != null) {
  stop.disabled = true;
  stop.style.display = "none";
}
canvas.style.display = "none";
soundClips.style.display = "none";

let controlState = "paused";

// visualiser setup - create web audio api context and canvas

let audioCtx;
const canvasCtx = canvas.getContext("2d");

//main block for doing the audio recording

if (navigator.mediaDevices.getUserMedia) {
  console.log("getUserMedia supported.");

  const constraints = { audio: true };
  let chunks = [];

  let onSuccess = function (stream) {
    const mediaRecorder = new MediaRecorder(stream);

    visualize(stream);

    record.onclick = function () {
      mediaRecorder.start();
      canvas.style.display = "inline-block";
      console.log(mediaRecorder.state);
      console.log("recorder started");
      record.style.background = "red";
      stop.style.display = "inline-block";
      stop.disabled = false;
      record.disabled = true;
    };

    stop.onclick = function () {
      mediaRecorder.stop();
      console.log(mediaRecorder.state);
      console.log("recorder stopped");
      record.style.background = "";
      record.style.color = "";
      stop.style.display = "none";
      canvas.style.display = "none";
      // mediaRecorder.requestData();

      stop.disabled = true;
      record.disabled = false;
    };

    recList.onclick = function () {
      soundClips.style.display =
        soundClips.style.display == "none"
          ? (soundClips.style.display = "block")
          : (soundClips.style.display = "none");
    };

    mediaRecorder.onstop = function (e) {
      console.log("data available after MediaRecorder.stop() called.");

      const clipName = prompt(
        "Enter a name for your sound clip?",
        "My unnamed clip"
      );

      const clipContainer = document.createElement("article");
      const clipLabel = document.createElement("p");
      const controlButton = document.createElement("button");
      const audio = document.createElement("audio");
      const deleteButton = document.createElement("button");

      clipLabel.classList.add("label");
      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      const newId = Math.floor(Math.random() * 101);
      controlButton.id = newId.toString();
      audio.id = "audio-" + controlButton.id;
      deleteButton.innerHTML = '<span class="dashicons dashicons-no"></span>';
      deleteButton.className = "delete";

      if (clipName === null) {
        clipLabel.textContent = "My unnamed clip";
      } else {
        clipLabel.textContent = clipName;
      }

      controlButton.innerHTML =
        '<span class="dashicons dashicons-controls-play"></span>';

      clipContainer.appendChild(controlButton);
      clipContainer.appendChild(audio);
      clipContainer.appendChild(deleteButton);
      clipContainer.appendChild(clipLabel);
      soundClips.appendChild(clipContainer);

      audio.controls = false;
      const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;
      console.log("recorder stopped");

      deleteButton.onclick = function (e) {
        let evtTgt = e.target;
        evtTgt.parentNode.parentNode.removeChild(evtTgt.parentNode);
      };

      clipLabel.onclick = function () {
        const existingName = clipLabel.textContent;
        const newClipName = prompt("Enter a new name for your sound clip?");
        if (newClipName === null) {
          clipLabel.textContent = existingName;
        } else {
          clipLabel.textContent = newClipName;
        }
      };

      controlButton.addEventListener("click", function (event) {
        const selectedAudio = document.getElementById(
          "audio-" + event.currentTarget.id
        );
        if (selectedAudio.paused && selectedAudio.currentTime >= 0) {
          selectedAudio.play();
          controlButton.innerHTML =
            '<span class="dashicons dashicons-controls-pause"></span>';
        } else {
          selectedAudio.pause();
          controlButton.innerHTML =
            '<span class="dashicons dashicons-controls-play"></span>';
        }
      });

      audio.addEventListener("ended", function (event) {
        const eventId = event.currentTarget.id;
        const buttonId = eventId.split("-").pop();
        console.log(buttonId);
        const button = document.getElementById(buttonId.toString());
        button.innerHTML =
          '<span class="dashicons dashicons-controls-play"></span>';
      });

      /*controlButton.onclick = function (e) {
        console.log(e.target.id);
        const selectedAudio = document.getElementById("audio-" + e.target.id);
        selectedAudio.play();
        /*if (controlState == "playing") {
          selectedAudio.pause();
          controlButton.textContent = "▶";
          controlState = "paused";
        } else {
          selectedAudio.play();
          controlButton.textContent = "❚❚";
          controlState = "playing";
        }
      };*/
    };

    mediaRecorder.ondataavailable = function (e) {
      chunks.push(e.data);
    };
  };

  let onError = function (err) {
    console.log("The following error occured: " + err);
  };

  navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
} else {
  console.log("getUserMedia not supported on your browser!");
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);

  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);
  //analyser.connect(audioCtx.destination);

  draw();

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";

    canvasCtx.beginPath();

    let sliceWidth = (WIDTH * 1.0) / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = (v * HEIGHT) / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }
}

window.onresize = function () {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();
