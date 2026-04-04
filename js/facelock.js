import { db } from "./firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

let isNavigating = false;

window.onload = async function () {
  const vote_found = sessionStorage.getItem("vote_found");
  const isvoted = sessionStorage.getItem("isvoted");
  const aadhar_found = sessionStorage.getItem("aadhar_found");
  const voteid = sessionStorage.getItem("voteid");

  if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true") {
    alert("Unauthorized access");
    isNavigating = true;
    window.location.href = "voting.html";
    return;
  }

  if (voteid) {
    const docRef = doc(db, "voting", voteid);
    
    window.addEventListener("offline", async () => {
      await updateDoc(docRef, { access: false });
    });

    window.addEventListener("online", async () => {
      const currentSnap = await getDoc(docRef);
      if (currentSnap.exists() && currentSnap.data().access !== true) {
        await updateDoc(docRef, { access: true });
      }
    });

    window.addEventListener("beforeunload", () => {
      if (!isNavigating) {
        navigator.sendBeacon("/log", "user_leaving"); 
        updateDoc(docRef, { access: false });
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && !isNavigating) {
        navigator.sendBeacon('/api/exit-endpoint', "hidden");
        updateDoc(docRef, { access: false });
      }
    });
  }
};

const video = document.getElementById('video');
const statusText = document.getElementById('status');
let blinkDetected = false;
let unlocked = false;
let savedDescriptor = null;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
  faceapi.nets.ageGenderNet.loadFromUri('./models')
]).then(fetchFaceFromDatabase);

async function fetchFaceFromDatabase() {
  statusText.innerText = "Connecting to Database...";
  try {
    const voteid = sessionStorage.getItem("voteid");
    const docRef = doc(db, "facelock", voteid);
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
    console.error(error);
    statusText.innerText = "Error connecting to database.";
    statusText.className = "error";
  }
}

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
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
  if (!savedDescriptor) return; 

  const canvas = document.getElementById('canvas');
  const displaySize = { width: video.width || 640, height: video.height || 480 };
  faceapi.matchDimensions(canvas, displaySize);

  const labeledFace = new faceapi.LabeledFaceDescriptors(
    "Authorized User",
    [savedDescriptor]
  );

  const faceMatcher = new faceapi.FaceMatcher(labeledFace, 0.55);
  statusText.innerText = "Please look and blink to unlock";

  async function runDetection() {
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

      if (avgEAR < 0.30) { blinkDetected = true; }

      const match = faceMatcher.findBestMatch(detection.descriptor);

      if (match.label === "unknown") {
        statusText.innerText = "Face not recognized.";
        statusText.className = "error";
      } else if (!blinkDetected) {
        statusText.innerText = `Identity Confirmed. Please BLINK.`;
        statusText.className = "warning";
      } else {
        unlocked = true;
        statusText.innerText = `Unlocked! (Est. Age: ${Math.round(detection.age)})`;
        statusText.className = "success";
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        
        isNavigating = true;
        window.location.href = "info.html";
        return;
      }
    }
    
    requestAnimationFrame(runDetection);
  }

  runDetection();
});