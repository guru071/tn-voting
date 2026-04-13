<<<<<<< HEAD
import { db } from "./firebase.js"; 
=======
import { db } from "./firebase.js";
>>>>>>> f4131a0 (bug fix)
import { doc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const video = document.getElementById('video');
const statusText = document.getElementById('status');
<<<<<<< HEAD
const previewImg = document.getElementById('previewImg'); 
=======
const previewImg = document.getElementById('previewImg');
const flipBtn = document.getElementById('flipBtn');
>>>>>>> f4131a0 (bug fix)
const confirmBtn = document.getElementById('confirmBtn');
const recaptureBtn = document.getElementById('recaptureBtn');

const CLOUD_NAME = 'ddg6utnk9';
const UPLOAD_PRESET = 'tn voting';

let currentStream = null;
let faceDetectionInterval = null;
<<<<<<< HEAD
let capturedBlob = null; 

const capturedDescriptors = { straight: null, left: null, right: null };
let capturePhase = 'profile'; 
=======
let capturedBlob = null;

const capturedDescriptors = { straight: null, left: null, right: null };
let capturePhase = 'profile';
>>>>>>> f4131a0 (bug fix)
let holdTimer = 0;

if (confirmBtn) confirmBtn.style.display = 'none';
if (recaptureBtn) recaptureBtn.style.display = 'none';

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
<<<<<<< HEAD
    faceapi.nets.ageGenderNet.loadFromUri('./models') 
=======
    faceapi.nets.ageGenderNet.loadFromUri('./models')
>>>>>>> f4131a0 (bug fix)
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
        .then(stream => {
            currentStream = stream;
            video.srcObject = stream;
            video.style.display = 'block';
<<<<<<< HEAD
            if(previewImg) previewImg.style.display = 'none';
=======
            if (previewImg) previewImg.style.display = 'none';
>>>>>>> f4131a0 (bug fix)
        })
        .catch(err => {
            statusText.innerText = "Camera access denied.";
            statusText.className = "error";
        });
}

<<<<<<< HEAD
=======
if (flipBtn) {
    flipBtn.addEventListener('click', () => {
        currentFacingMode = currentFacingMode === "user" ? "environment" : "user";
        startVideo();
    });
}
>>>>>>> f4131a0 (bug fix)
function getHeadTurn(landmarks) {
    const nose = landmarks.getNose()[3];
    const leftJaw = landmarks.getJawOutline()[0];
    const rightJaw = landmarks.getJawOutline()[16];
    return (nose.x - leftJaw.x) / (rightJaw.x - nose.x);
}

function captureProfileImage() {
    capturePhase = 'reviewing';
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    tempCanvas.getContext('2d').drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
<<<<<<< HEAD
    
=======

>>>>>>> f4131a0 (bug fix)
    if (previewImg) {
        previewImg.src = tempCanvas.toDataURL('image/jpeg', 1.0);
        previewImg.style.display = 'block';
    }
<<<<<<< HEAD
    
=======

>>>>>>> f4131a0 (bug fix)
    video.style.display = 'none';
    const trackingCanvas = document.getElementById('canvas');
    if (trackingCanvas) trackingCanvas.getContext('2d').clearRect(0, 0, trackingCanvas.width, trackingCanvas.height);

    tempCanvas.toBlob(blob => { capturedBlob = blob; }, 'image/jpeg', 0.9);

    statusText.innerText = "Review Profile Photo. Looks good?";
    statusText.className = "success";
<<<<<<< HEAD
    
=======

>>>>>>> f4131a0 (bug fix)
    if (confirmBtn) confirmBtn.style.display = 'inline-block';
    if (recaptureBtn) recaptureBtn.style.display = 'inline-block';
}

if (recaptureBtn) {
    recaptureBtn.addEventListener('click', () => {
        capturePhase = 'profile';
        holdTimer = 0;
        capturedBlob = null;
        capturedDescriptors.straight = null;

        if (previewImg) previewImg.style.display = 'none';
        video.style.display = 'block';
        confirmBtn.style.display = 'none';
        recaptureBtn.style.display = 'none';

        statusText.innerText = "Look STRAIGHT for Profile Photo";
        statusText.className = "warning";
    });
}

if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
        capturePhase = 'left';
        holdTimer = 0;

        if (previewImg) previewImg.style.display = 'none';
        video.style.display = 'block';
        confirmBtn.style.display = 'none';
        recaptureBtn.style.display = 'none';

        statusText.innerText = "Profile Saved! Now turn head LEFT for Face Lock";
        statusText.className = "warning";
    });
}

video.addEventListener('play', () => {
    const canvas = document.getElementById('canvas');
    const displaySize = { width: video.width || 640, height: video.height || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    faceDetectionInterval = setInterval(async () => {
<<<<<<< HEAD
        if (capturePhase === 'done' || capturePhase === 'reviewing' || video.style.display === 'none' || video.paused) return; 
=======
        if (capturePhase === 'done' || capturePhase === 'reviewing' || video.style.display === 'none' || video.paused) return;
>>>>>>> f4131a0 (bug fix)

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
<<<<<<< HEAD
                        captureProfileImage(); 
                        holdTimer = 0;
                    }
                } else { holdTimer = 0; }
            } 
=======
                        captureProfileImage();
                        holdTimer = 0;
                    }
                } else { holdTimer = 0; }
            }
>>>>>>> f4131a0 (bug fix)
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
            if (capturePhase !== 'reviewing') {
                statusText.innerText = "Face not detected properly";
                statusText.className = "error";
                holdTimer = 0;
            }
        }
<<<<<<< HEAD
    }, 150); 
=======
    }, 150);
>>>>>>> f4131a0 (bug fix)
});

async function finishRegistration() {
    clearInterval(faceDetectionInterval);
    statusText.innerText = "All angles captured! Saving to database...";
    statusText.className = "warning";

<<<<<<< HEAD
    const voteId = sessionStorage.getItem("voteid"); 
=======
    const voteId = sessionStorage.getItem("voteid");
>>>>>>> f4131a0 (bug fix)
    if (!voteId || !capturedBlob) {
        statusText.innerText = "Error: Missing Vote ID or Photo";
        statusText.className = "error";
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', capturedBlob, 'face.jpg');
        formData.append('upload_preset', UPLOAD_PRESET);
        formData.append('public_id', `${voteId}_profile`);
<<<<<<< HEAD
        
=======

>>>>>>> f4131a0 (bug fix)
        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });

        if (!uploadRes.ok) throw new Error("Cloudinary image upload failed");
<<<<<<< HEAD
        
        const uploadData = await uploadRes.json();
        
=======

        const uploadData = await uploadRes.json();

>>>>>>> f4131a0 (bug fix)
        let birthDate = new Date();
        const birthString = sessionStorage.getItem("birth");
        if (birthString && !isNaN(new Date(birthString).getTime())) {
            birthDate = new Date(birthString);
        }

        await setDoc(doc(db, "facelock", voteId), {
            faceDescriptors: {
                straight: Array.from(capturedDescriptors.straight),
                left: Array.from(capturedDescriptors.left),
                right: Array.from(capturedDescriptors.right)
            },
            registeredAt: new Date()
        });
<<<<<<< HEAD
        
=======

>>>>>>> f4131a0 (bug fix)
        await setDoc(doc(db, "voting", voteId), {
            name: sessionStorage.getItem("name") || "Unknown",
            aadhar: Number(sessionStorage.getItem("aadhar")) || 0,
            birth: Timestamp.fromDate(birthDate),
            gender: sessionStorage.getItem("gender") || "",
            isvoted: false,
            ph_no: Number(sessionStorage.getItem("phonenumber")) || 0,
            vote_id: voteId,
            gmail: sessionStorage.getItem("gmail") || "",
            address: sessionStorage.getItem("address") || "",
<<<<<<< HEAD
            faceImageUrl: uploadData.secure_url 
=======
            faceImageUrl: uploadData.secure_url
>>>>>>> f4131a0 (bug fix)
        });

        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
        }

        statusText.innerText = "Setup Complete! Redirecting...";
        statusText.className = "success";
<<<<<<< HEAD
        
        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = "form.html"; 
=======

        setTimeout(() => {
            sessionStorage.clear();
            window.location.href = "form.html";
>>>>>>> f4131a0 (bug fix)
        }, 1500);

    } catch (error) {
        let exactError = error.message;
        if (error.code) exactError += " (Code: " + error.code + ")";
<<<<<<< HEAD
        
        statusText.innerText = "FAILED: " + exactError;
        statusText.className = "error";
        
=======

        statusText.innerText = "FAILED: " + exactError;
        statusText.className = "error";

>>>>>>> f4131a0 (bug fix)
        capturePhase = 'right';
        holdTimer = 0;
    }
}
