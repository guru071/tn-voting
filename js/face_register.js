import { db } from "./firebase.js"; 
import { doc, setDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const video = document.getElementById('video');
const statusText = document.getElementById('status');
const registerBtn = document.getElementById('registerBtn');
const flipBtn = document.getElementById('flipBtn'); 
const previewImg = document.getElementById('previewImg'); 

const CLOUD_NAME = 'ddg6utnk9';
const UPLOAD_PRESET = 'tn voting';

let latestDescriptor = null; 
let isAutoCapturing = false;
let currentStream = null;
let currentFacingMode = "user";
let faceDetectionInterval = null;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.ageGenderNet.loadFromUri('./models') 
]).then(startVideo);

function startVideo() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacingMode } })
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
            if(previewImg) previewImg.style.display = 'none';
            statusText.innerText = "Please look at the camera";
        })
        .catch(err => console.error(err));
}

if (flipBtn) {
    flipBtn.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
        startVideo();
    });
}

video.addEventListener('play', () => {
    const canvas = document.getElementById('canvas');
    const displaySize = { width: video.width || 640, height: video.height || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    if (faceDetectionInterval) clearInterval(faceDetectionInterval);

    faceDetectionInterval = setInterval(async () => {
        if (video.style.display === 'none' || video.paused || video.ended) return; 

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
            
            if ((faceArea / videoArea) < 0.08) {
                statusText.innerText = "Move Closer";
                statusText.className = "warning";
                registerBtn.disabled = true;
                isAutoCapturing = false;
                return;
            }

            const nose = landmarks.getNose()[3];
            const leftJaw = landmarks.getJawOutline()[0];
            const rightJaw = landmarks.getJawOutline()[16];
            const turnRatio = (nose.x - leftJaw.x) / (rightJaw.x - nose.x);

            if (turnRatio < 0.6 || turnRatio > 1.4) {
                statusText.innerText = "Look Straight";
                statusText.className = "warning";
                registerBtn.disabled = true;
                isAutoCapturing = false;
                return;
            }

            latestDescriptor = detection.descriptor; 
            
            const toggle = document.getElementById('autoCaptureToggle');
            const autoCaptureOn = toggle ? toggle.checked : false;

            if (autoCaptureOn && !isAutoCapturing) {
                isAutoCapturing = true; 
                statusText.innerText = "Hold still... Capturing!";
                statusText.className = "warning";
                registerBtn.disabled = true;

                setTimeout(() => {
                    if (latestDescriptor && isAutoCapturing) {
                        registerBtn.disabled = false;
                        registerBtn.click();
                    }
                }, 1000);

            } else if (!autoCaptureOn && !isAutoCapturing) {
                statusText.innerText = "Ready! Click Capture.";
                statusText.className = "success";
                registerBtn.disabled = false;
            }

        } else {
            statusText.innerText = "No face detected";
            statusText.className = "error";
            registerBtn.disabled = true;
            isAutoCapturing = false;
        }
    }, 500);
});

async function uploadToCloudinary(imageBlob, voteId) {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', imageBlob, 'face.jpg');
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('public_id', `${voteId}_profile`);
        formData.append('folder', 'vote_faces');
        
        fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => resolve(data.secure_url))
        .catch(err => reject(err));
    });
}

registerBtn.addEventListener('click', async () => {
    if (!latestDescriptor) return;

    registerBtn.disabled = true;
    isAutoCapturing = false; 
    clearInterval(faceDetectionInterval); 
    
    statusText.innerText = "Capturing photo & Saving...";
    statusText.className = "warning";

    try {
        const voteId = sessionStorage.getItem("voteid"); 
        
        if (!voteId) {
            statusText.innerText = "No Vote ID found. Please register first.";
            statusText.className = "error";
            registerBtn.disabled = false;
            return;
        }

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        tempCanvas.getContext('2d').drawImage(video, 0, 0);
        
        video.style.display = 'none';
        if(previewImg) {
            previewImg.src = tempCanvas.toDataURL('image/jpeg');
            previewImg.style.display = 'block';
        }

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        const blob = await new Promise(resolve => tempCanvas.toBlob(resolve, 'image/jpeg'));

        const imageUrl = await uploadToCloudinary(blob, voteId);
        const faceDataArray = Array.from(latestDescriptor);

        await setDoc(doc(db, "facelock", voteId), {
            faceDescriptor: faceDataArray,
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
            faceImageUrl: imageUrl 
        });

        statusText.innerText = "Face Registered! Redirecting...";
        statusText.className = "success";

        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = "form.html"; 
        }, 1500);

    } catch (error) {
        console.error("Error writing document: ", error);
        statusText.innerText = "Database Error. Refresh & Try Again.";
        statusText.className = "error";
        registerBtn.disabled = false;
    }
});