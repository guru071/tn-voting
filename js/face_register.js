// face_register.js
import { db } from "./firebase.js";
import { doc, getDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const CLOUD_NAME = 'ddg6utnk9';
const UPLOAD_PRESET = 'tn voting';

let isNavigating = false;
const video = document.getElementById('video');
const statusText = document.getElementById('status');
let blinkDetected = false;
let unlocked = false;
let savedDescriptor = null;

window.onload = async function () {
  const info_entered = sessionStorage.getItem("info_entered");
  

  if (info_entered !== "true") {
    alert("Unauthorized access");
    isNavigating = true;
    window.location.href = "form.html";
    return;
  }

};

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

async function captureAndUploadFace(videoElement, voteId) {
    return new Promise((resolve, reject) => {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = videoElement.videoWidth;
        tempCanvas.height = videoElement.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, tempCanvas.width, tempCanvas.height);

        tempCanvas.toBlob(async (blob) => {
            if (!blob) return reject("Failed to capture webcam frame.");

            const customName = `${voteId}_live_capture`;
            const formData = new FormData();
            formData.append('file', blob, 'capture.jpg'); 
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('public_id', customName);
            formData.append('folder', 'voter_live_faces');

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                
                if (data.secure_url) {
                    resolve(data.secure_url);
                } else {
                    reject(data.error.message || "Cloudinary upload failed.");
                }
            } catch (error) {
                reject(error);
            }
        }, 'image/jpeg', 0.9);
    });
}

async function registerFinalDocument(voteId, imageUrl) {
    const docRef = doc(db, "voting", voteId);
    const finalDocumentData = {
        name: sessionStorage.getItem("name"),
        aadhar: sessionStorage.getItem("aadhar"),
        birth: sessionStorage.getItem("birth"),
        phonenumber: sessionStorage.getItem("phonenumber"),
        gmail: sessionStorage.getItem("gmail"),
        gender: sessionStorage.getItem("gender"),
        address: sessionStorage.getItem("address"),
        faceImageUrl: imageUrl,
        registeredAt: new Date()
    };
    await setDoc(docRef, finalDocumentData);
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
        statusText.innerText = `Unlocked! Processing Registration...`;
        statusText.className = "success";
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        
        try {
            const voteid = sessionStorage.getItem("voteid");
            
            const liveImageUrl = await captureAndUploadFace(video, voteid);
            await registerFinalDocument(voteid, liveImageUrl);
            
            isNavigating = true;
            window.location.href = "info.html";
            
        } catch (error) {
            console.error(error);
            statusText.innerText = "Process failed. Please try again.";
            statusText.className = "error";
            unlocked = false; 
        }
        return;
      }
    }
    
    requestAnimationFrame(runDetection);
  }

  runDetection();
});