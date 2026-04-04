
// 1. Import Firebase
import { db } from "./firebase.js"; // Assuming you have a separate firebase.js file for initialization
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

window.onload = function () {
  const vote_found = sessionStorage.getItem("vote_found");
  const isvoted = sessionStorage.getItem("isvoted");
  const aadhar_found = sessionStorage.getItem("aadhar_found");
  if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true") {
    alert("Unauthorized access");
    window.location.href = "voting.html";
  }
};
// NEW CODE
navigator.mediaDevices.getUserMedia({ 
    video: { 
        facingMode: "user" // "user" means the front selfie camera
    } 
});
const video = document.getElementById('video');
const statusText = document.getElementById('status');
let blinkDetected = false;
let unlocked = false;
let savedDescriptor = null;

// Load Models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.ageGenderNet.loadFromUri('./models') 
]).then(startVideo);

async function fetchFaceFromDatabase() {
  statusText.innerText = "Connecting to Database...";
  try {
    const voteid = sessionStorage.getItem("voteid");
    const docRef = doc(db, "facelock",voteid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const faceDataArray = docSnap.data().faceDescriptor;
      savedDescriptor = new Float32Array(faceDataArray);
      startVideo();
    } else {
      statusText.innerText = "No face registered in database!";
      statusText.className = "error";
    }
  } catch (error) {
    console.error("Error getting document:", error);
    statusText.innerText = "Error connecting to database.";
    statusText.className = "error";
  }
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => { video.srcObject = stream; })
    .catch(err => console.error(err));
}

function getDistance(point1, point2) {
  return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
}

function getEAR(eye) {
  const vertical1 = getDistance(eye[1], eye[5]);
  const vertical2 = getDistance(eye[2], eye[4]);
  const horizontal = getDistance(eye[0], eye[3]);
  return (vertical1 + vertical2) / (2.0 * horizontal);
}

video.addEventListener('play', async () => {
  const canvas = document.getElementById('canvas');
  const displaySize = { width: video.width || 640, height: video.height || 480 };
  faceapi.matchDimensions(canvas, displaySize);

  const faceMatcher = new faceapi.FaceMatcher(savedDescriptor, 0.55);

  statusText.innerText = "Please look and blink to unlock";

  const interval = setInterval(async () => {
    if (unlocked) return;

    const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor()
      .withAgeAndGender();

    if (detection) {
      const resizedDetection = faceapi.resizeResults(detection, displaySize);
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetection);

      const leftEye = detection.landmarks.getLeftEye();
      const rightEye = detection.landmarks.getRightEye();
      const avgEAR = (getEAR(leftEye) + getEAR(rightEye)) / 2;

      if (avgEAR < 0.25) { blinkDetected = true; }

      const match = faceMatcher.findBestMatch(detection.descriptor);

      if (match.label === "unknown") {
        statusText.innerText = "Face not recognized.";
        statusText.className = "error";
      } else if (!blinkDetected) {
        statusText.innerText = `Identity Confirmed. Please BLINK.`;
        statusText.className = "warning";
      } else {
        unlocked = true;
        clearInterval(interval);
        statusText.innerText = `Unlocked! (Est. Age: ${Math.round(detection.age)})`;
        statusText.className = "success";
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        window.location.href = "info.html";
      }
    }
  }, 150);
});
