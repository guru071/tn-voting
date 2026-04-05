import { db } from "./firebase.js"; 
import { doc, setDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const video = document.getElementById('video');
const statusText = document.getElementById('status');
const registerBtn = document.getElementById('registerBtn');

const CLOUD_NAME = 'ddg6utnk9';
const UPLOAD_PRESET = 'tn voting';

let latestDescriptor = null; 
let isAutoCapturing = false;

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('./models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('./models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('./models'),
    faceapi.nets.ageGenderNet.loadFromUri('./models') 
]).then(startVideo);

function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } })
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
                isAutoCapturing = false;
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
                isAutoCapturing = false;
                return;
            }

            latestDescriptor = detection.descriptor; 
            
            const toggle = document.getElementById('autoCaptureToggle');
            const autoCaptureOn = toggle ? toggle.checked : false;

            if (autoCaptureOn && !isAutoCapturing) {
                isAutoCapturing = true; 
                statusText.innerText = "Hold still... Capturing in 1 second!";
                statusText.className = "warning";
                registerBtn.disabled = true;

                setTimeout(() => {
                    if (latestDescriptor) {
                        registerBtn.disabled = false;
                        registerBtn.click();
                    }
                }, 1000);

            } else if (!autoCaptureOn) {
                statusText.innerText = "Ready! Click Capture.";
                statusText.className = "success";
                registerBtn.disabled = false;
                isAutoCapturing = false;
            }

        } else {
            statusText.innerText = "No face detected";
            statusText.className = "error";
            registerBtn.disabled = true;
            isAutoCapturing = false;
        }
    }, 500);
});

// Image Upload Logic added here
async function uploadToCloudinary(videoElement, voteId) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        canvas.getContext('2d').drawImage(videoElement, 0, 0);

        canvas.toBlob(async (blob) => {
            if (!blob) return reject("Capture failed");
            const formData = new FormData();
            formData.append('file', blob, 'face.jpg');
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('public_id', `${voteId}_profile`);
            formData.append('folder', 'vote_faces');
            
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                resolve(data.secure_url);
            } catch (err) {
                reject(err);
            }
        }, 'image/jpeg');
    });
}

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
        
        // 1. Upload to Cloudinary
        const imageUrl = await uploadToCloudinary(video, voteId);

        // 2. Save descriptor to facelock
        await setDoc(doc(db, "facelock", voteId), {
            faceDescriptor: faceDataArray,
            registeredAt: new Date()
        });
        
        // 3. Save to voting (including the image URL)
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

        statusText.innerText = "Face Registered Successfully!";
        statusText.className = "success";

    } catch (error) {
        console.error("Error writing document: ", error);
        statusText.innerText = "Database Error. Try Again.";
        statusText.className = "error";
        registerBtn.disabled = false;
        isAutoCapturing = false;
    }
});