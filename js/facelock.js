import { db } from "./firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let isNavigating = false;

window.onload = async function () {
  const vote_found = sessionStorage.getItem("vote_found");
  const isvoted = sessionStorage.getItem("isvoted");
  const aadhar_found = sessionStorage.getItem("aadhar_found");
  const voteid = sessionStorage.getItem("voteid");
<<<<<<< HEAD

=======
  const facelock_found = sessionStorage.getItem("facelock_found");
>>>>>>> f4131a0 (bug fix)
  if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true") {
    isNavigating = true;
    window.location.href = "voting.html";
    return;
  }
<<<<<<< HEAD
=======
  if(facelock_found || facelock_found === "true"){
    window.location.href="info.html"
  }
>>>>>>> f4131a0 (bug fix)
};

const video = document.getElementById('video');
const statusText = document.getElementById('status');
let savedDescriptors = [];
let authPhase = 'straight';
let holdTimer = 0;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models')
]).then(fetchFaceFromDatabase);

async function fetchFaceFromDatabase() {
  statusText.innerText = "Loading Security Profile...";
  try {
    const voteid = sessionStorage.getItem("voteid");
    const docSnap = await getDoc(doc(db, "facelock", voteid));

    if (docSnap.exists() && docSnap.data().faceDescriptors) {
      const dbFaces = docSnap.data().faceDescriptors;
<<<<<<< HEAD
      
      savedDescriptors = [
          new Float32Array(dbFaces.straight),
          new Float32Array(dbFaces.left),
          new Float32Array(dbFaces.right)
      ];
      
=======

      savedDescriptors = [
        new Float32Array(dbFaces.straight),
        new Float32Array(dbFaces.left),
        new Float32Array(dbFaces.right)
      ];

>>>>>>> f4131a0 (bug fix)
      startVideo();
    } else {
      statusText.innerText = "No secure profile found!";
      statusText.className = "error";
    }
  } catch (error) {
    statusText.innerText = "Database connection error.";
    statusText.className = "error";
  }
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
    .then(stream => { video.srcObject = stream; })
    .catch(err => {
<<<<<<< HEAD
        statusText.innerText = "Camera access denied.";
        statusText.className = "error";
=======
      statusText.innerText = "Camera access denied.";
      statusText.className = "error";
>>>>>>> f4131a0 (bug fix)
    });
}

function getHeadTurn(landmarks) {
<<<<<<< HEAD
    const nose = landmarks.getNose()[3];
    const leftJaw = landmarks.getJawOutline()[0];
    const rightJaw = landmarks.getJawOutline()[16];
    return (nose.x - leftJaw.x) / (rightJaw.x - nose.x);
}

video.addEventListener('play', async () => {
  if (savedDescriptors.length === 0) return; 
=======
  const nose = landmarks.getNose()[3];
  const leftJaw = landmarks.getJawOutline()[0];
  const rightJaw = landmarks.getJawOutline()[16];
  return (nose.x - leftJaw.x) / (rightJaw.x - nose.x);
}

video.addEventListener('play', async () => {
  if (savedDescriptors.length === 0) return;
>>>>>>> f4131a0 (bug fix)

  const canvas = document.getElementById('canvas');
  const displaySize = { width: video.width || 640, height: video.height || 480 };
  faceapi.matchDimensions(canvas, displaySize);

  const faceMatcher = new faceapi.FaceMatcher([
<<<<<<< HEAD
      new faceapi.LabeledFaceDescriptors("Authorized", savedDescriptors)
  ], 0.55); 
=======
    new faceapi.LabeledFaceDescriptors("Authorized", savedDescriptors)
  ], 0.55);
>>>>>>> f4131a0 (bug fix)

  async function runDetection() {
    if (isNavigating) return;

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      const resizedDetection = faceapi.resizeResults(detection, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetection);

      const match = faceMatcher.findBestMatch(detection.descriptor);

      if (match.label === "unknown") {
        statusText.innerText = "Face not recognized.";
        statusText.className = "error";
        holdTimer = 0;
      } else {
        const turnRatio = getHeadTurn(detection.landmarks);

        if (authPhase === 'straight') {
<<<<<<< HEAD
            statusText.innerText = "Identity Confirmed. Look STRAIGHT.";
            statusText.className = "warning";
            if (turnRatio >= 0.8 && turnRatio <= 1.2) {
                holdTimer++;
                if (holdTimer > 4) {
                    authPhase = 'left';
                    holdTimer = 0;
                }
            } else { holdTimer = 0; }
        }
        else if (authPhase === 'left') {
            statusText.innerText = "Now turn head LEFT to verify liveness.";
            statusText.className = "warning";
            if (turnRatio > 1.6) {
                holdTimer++;
                if (holdTimer > 4) {
                    authPhase = 'right';
                    holdTimer = 0;
                }
            } else { holdTimer = 0; }
        } 
        else if (authPhase === 'right') {
            statusText.innerText = "Good. Now turn head RIGHT.";
            statusText.className = "warning";
            if (turnRatio < 0.5) {
                holdTimer++;
                if (holdTimer > 4) {
                    authPhase = 'unlocked';
                }
            } else { holdTimer = 0; }
        }
        else if (authPhase === 'unlocked') {
            statusText.innerText = "Liveness Verified! Unlocking...";
            statusText.className = "success";
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            
            isNavigating = true;
            setTimeout(() => {
                window.location.href = "info.html";
            }, 800);
            return;
        }
      }
    } else {
        if (authPhase !== 'unlocked') {
            statusText.innerText = "Position your face in the frame";
            statusText.className = "warning";
            holdTimer = 0;
        }
    }
    
=======
          statusText.innerText = "Identity Confirmed. Look STRAIGHT.";
          statusText.className = "warning";
          if (turnRatio >= 0.8 && turnRatio <= 1.2) {
            holdTimer++;
            if (holdTimer > 4) {
              authPhase = 'left';
              holdTimer = 0;
            }
          } else { holdTimer = 0; }
        }
        else if (authPhase === 'left') {
          statusText.innerText = "Now turn head LEFT to verify liveness.";
          statusText.className = "warning";
          if (turnRatio > 1.6) {
            holdTimer++;
            if (holdTimer > 4) {
              authPhase = 'right';
              holdTimer = 0;
            }
          } else { holdTimer = 0; }
        }
        else if (authPhase === 'right') {
          statusText.innerText = "Good. Now turn head RIGHT.";
          statusText.className = "warning";
          if (turnRatio < 0.5) {
            holdTimer++;
            if (holdTimer > 4) {
              authPhase = 'unlocked';
            }
          } else { holdTimer = 0; }
        }
        else if (authPhase === 'unlocked') {
          statusText.innerText = "Liveness Verified! Unlocking...";
          statusText.className = "success";
          canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

          isNavigating = true;
          setTimeout(() => {
            sessionStorage.setItem("facelock_found", "true");
            window.location.href = "info.html";
          }, 800);
          return;
        }
      }
    } else {
      if (authPhase !== 'unlocked') {
        statusText.innerText = "Position your face in the frame";
        statusText.className = "warning";
        holdTimer = 0;
      }
    }

>>>>>>> f4131a0 (bug fix)
    requestAnimationFrame(runDetection);
  }

  runDetection();
});
