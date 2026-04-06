import { db } from "./firebase.js"; 
import { doc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const video = document.getElementById('video');
const statusText = document.getElementById('status');
const previewImg = document.getElementById('previewImg'); 

const CLOUD_NAME = 'ddg6utnk9';
const UPLOAD_PRESET = 'tn voting';

let currentStream = null;
let faceDetectionInterval = null;
let capturedBlob = null; 

const capturedDescriptors = { straight: null, left: null, right: null };
let capturePhase = 'profile'; 
let holdTimer = 0;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.ageGenderNet.loadFromUri('./models') 
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            if(previewImg) previewImg.style.display = 'none';
        })
        .catch(err => console.error(err));
}

function getHeadTurn(landmarks) {
    const nose = landmarks.getNose()[3];
    const leftJaw = landmarks.getJawOutline()[0];
    const rightJaw = landmarks.getJawOutline()[16];
    return (nose.x - leftJaw.x) / (rightJaw.x - nose.x);
}

function captureProfileImage() {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    if(previewImg) {
        previewImg.src = tempCanvas.toDataURL('image/jpeg', 1.0);
        previewImg.style.display = 'block';
    }
    tempCanvas.toBlob(blob => capturedBlob = blob, 'image/jpeg', 0.9);
}

video.addEventListener('play', () => {
    const canvas = document.getElementById('canvas');
    const displaySize = { width: video.width || 640, height: video.height || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    faceDetectionInterval = setInterval(async () => {
        if (capturePhase === 'done' || video.style.display === 'none' || video.paused) return; 

        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detection) {
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
            faceapi.draw.drawDetections(canvas, resizedDetection);

            const turnRatio = getHeadTurn(detection.landmarks);

            if (capturePhase === 'profile') {
                statusText.innerText = "Look STRAIGHT for Profile Photo";
                statusText.className = "warning";
                if (turnRatio >= 0.8 && turnRatio <= 1.2) {
                    holdTimer++;
                    if (holdTimer > 6) {
                        capturedDescriptors.straight = detection.descriptor;
                        captureProfileImage(); 
                        capturePhase = 'left';
                        holdTimer = 0;
                    }
                } else { holdTimer = 0; }
            } 
            else if (capturePhase === 'left') {
                statusText.innerText = "Profile Saved! Now turn head LEFT for Face Lock";
                statusText.className = "warning";
                if (turnRatio > 1.6) {
                    holdTimer++;
                    if (holdTimer > 5) {
                        capturedDescriptors.left = detection.descriptor;
                        capturePhase = 'right';
                        holdTimer = 0;
                    }
                } else { holdTimer = 0; }
            }
            else if (capturePhase === 'right') {
                statusText.innerText = "Almost done. Turn head RIGHT";
                statusText.className = "warning";
                if (turnRatio < 0.5) {
                    holdTimer++;
                    if (holdTimer > 5) {
                        capturedDescriptors.right = detection.descriptor;
                        capturePhase = 'done';
                        finishRegistration();
                    }
                } else { holdTimer = 0; }
            }
        } else {
            statusText.innerText = "Face not detected properly";
            statusText.className = "error";
            holdTimer = 0;
        }
    }, 150); 
});

async function finishRegistration() {
    clearInterval(faceDetectionInterval);
    statusText.innerText = "All angles captured! Saving to database...";
    statusText.className = "success";

    const voteId = sessionStorage.getItem("voteid"); 
    if (!voteId || !capturedBlob) {
        statusText.innerText = "Error: Missing Data";
        statusText.className = "error";
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', capturedBlob, 'face.jpg');
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('public_id', `${voteId}_profile`);
        
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const uploadData = await uploadRes.json();

        await setDoc(doc(db, "facelock", voteId), {
            faceDescriptors: [
                Array.from(capturedDescriptors.straight),
                Array.from(capturedDescriptors.left),
                Array.from(capturedDescriptors.right)
            ],
            registeredAt: new Date()
        });
        
        await setDoc(doc(db, "voting", voteId), {
            name: sessionStorage.getItem("name"),
            aadhar: Number(sessionStorage.getItem("aadhar")),
            birth: Timestamp.fromDate(new Date(sessionStorage.getItem("birth"))),
            gender: sessionStorage.getItem("gender"),
            isvoted: false,
            ph_no: Number(sessionStorage.getItem("phonenumber")),
            vote_id: sessionStorage.getItem("voteid"),
            gmail: sessionStorage.getItem("gmail"),
            address: sessionStorage.getItem("address"),
            faceImageUrl: uploadData.secure_url 
        });

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        statusText.innerText = "Setup Complete! Redirecting...";
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = "form.html"; 
        }, 1500);

    } catch (error) {
        console.error(error);
        statusText.innerText = "Error saving profile.";
        statusText.className = "error";
    }
}
