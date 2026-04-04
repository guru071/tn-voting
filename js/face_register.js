

import { db } from "./firebase.js"; 
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

navigator.mediaDevices.getUserMedia({ 
    video: { 
        facingMode: "user" 
    } 
});console.log(db); 
const video = document.getElementById('video');
const statusText = document.getElementById('status');
const registerBtn = document.getElementById('registerBtn');
let latestDescriptor = null; 


Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('../models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('../models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('../models'),
    faceapi.nets.ageGenderNet.loadFromUri('../models') 
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            video.srcObject = stream;
            statusText.innerText = "Please look at the camera";
        })
        .catch(err => console.error(err));
}

video.addEventListener('play', () => {
    const canvas = document.getElementById('canvas');
    const displaySize = { width: video.width || 640, height: video.height || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetection);

            const { box } = detection.detection;
            const landmarks = detection.landmarks;

            
            const faceArea = box.width * box.height;
            const videoArea = displaySize.width * displaySize.height;
            if ((faceArea / videoArea) < 0.15) {
                statusText.innerText = "Move Closer";
                statusText.className = "warning";
                registerBtn.disabled = true;
                return;
            }

            
            const nose = landmarks.getNose()[3];
            const leftJaw = landmarks.getJawOutline()[0];
            const rightJaw = landmarks.getJawOutline()[16];
            const turnRatio = (nose.x - leftJaw.x) / (rightJaw.x - nose.x);

            if (turnRatio < 0.75 || turnRatio > 1.25) {
                statusText.innerText = "Look Straight";
                statusText.className = "warning";
                registerBtn.disabled = true;
                return;
            }

            
            statusText.innerText = "Ready! Click Capture.";
            statusText.className = "success";
            registerBtn.disabled = false;
            latestDescriptor = detection.descriptor; 
        } else {
            statusText.innerText = "No face detected";
            statusText.className = "error";
            registerBtn.disabled = true;
        }
    }, 500);
});


registerBtn.addEventListener('click', async () => {
    if (!latestDescriptor) return;

    registerBtn.disabled = true;
    statusText.innerText = "Saving to Database...";
    statusText.className = "warning";

    try {
        const faceDataArray = Array.from(latestDescriptor);
        const voteId = sessionStorage.getItem("voteid"); 
        if (!voteId) {
            statusText.innerText = "No Vote ID found. Please register first.";
            statusText.className = "error";
            registerBtn.disabled = false;
            return;
        }
        await setDoc(doc(db, "facelock", voteId), {
            faceDescriptor: faceDataArray,
            registeredAt: new Date()
        });

        statusText.innerText = "Face Registered Successfully!";
        statusText.className = "success";

    } catch (error) {
        console.error("Error writing document: ", error);
        statusText.innerText = "Database Error. Try Again.";
        statusText.className = "error";
        registerBtn.disabled = false;
    }
});
