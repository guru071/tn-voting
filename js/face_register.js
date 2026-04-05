import { db } from "./firebase.js"; 
import { doc, setDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const video = document.getElementById('video');
const statusText = document.getElementById('status');
const registerBtn = document.getElementById('registerBtn');
const flipBtn = document.getElementById('flipBtn'); 
const previewImg = document.getElementById('previewImg'); 
const confirmBtn = document.getElementById('confirmBtn');
const recaptureBtn = document.getElementById('recaptureBtn');

const CLOUD_NAME = 'ddg6utnk9';
const UPLOAD_PRESET = 'tn voting';

let latestDescriptor = null; 
let isAutoCapturing = false;
let currentStream = null;
let currentFacingMode = "user";
let faceDetectionInterval = null;
let capturedBlob = null; 

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

        const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224 }))
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
                        handleCapture(); 
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
    }, 150); 
});

function handleCapture() {
    if (!latestDescriptor) return;

    isAutoCapturing = false; 
    clearInterval(faceDetectionInterval); 
    
    statusText.innerText = "Review your photo. Looks good?";
    statusText.className = "success";

    registerBtn.style.display = 'none';
    if(confirmBtn) confirmBtn.style.display = 'inline-block';
    if(recaptureBtn) recaptureBtn.style.display = 'inline-block';

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

    tempCanvas.toBlob(blob => {
        capturedBlob = blob;
    }, 'image/jpeg');
}

registerBtn.addEventListener('click', handleCapture);

if (recaptureBtn) {
    recaptureBtn.addEventListener('click', () => {
        recaptureBtn.style.display = 'none';
        confirmBtn.style.display = 'none';
        registerBtn.style.display = 'inline-block';
        registerBtn.disabled = true;
        
        capturedBlob = null;
        statusText.innerText = "Restarting camera...";
        statusText.className = "warning";

        startVideo();
    });
}

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

if (confirmBtn) {
    confirmBtn.addEventListener('click', async () => {
        if (!capturedBlob || !latestDescriptor) return;

        confirmBtn.disabled = true;
        recaptureBtn.disabled = true;
        
        statusText.innerText = "Saving to Database...";
        statusText.className = "warning";

        try {
            const voteId = sessionStorage.getItem("voteid"); 
            
            if (!voteId) {
                statusText.innerText = "No Vote ID found. Please register first.";
                statusText.className = "error";
                confirmBtn.disabled = false;
                recaptureBtn.disabled = false;
                return;
            }

            const imageUrl = await uploadToCloudinary(capturedBlob, voteId);
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
            confirmBtn.disabled = false;
            recaptureBtn.disabled = false;
        }
    });
}