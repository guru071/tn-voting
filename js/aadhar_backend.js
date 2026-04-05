import { db } from "./firebase.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const SERVICE_ID = "service_xovjx9i";
const TEMPLATE_ID = "template_otyeqi2";
const PUBLIC_KEY = "uexBJl7IgsSYl3Pqt"; 

const otpInputs = document.querySelectorAll(".otp");
const mainBtn = document.getElementById("mainBtn");
const resendBtn = document.getElementById("resendBtn");
const aadharInput = document.getElementById("aadharno");
const timerDisplay = document.getElementById("timer");
const otpFields = document.getElementById("otpFields");

let generatedOTP = null;
let isOtpSent = false;
let timerInterval;
let userData = null;
let listenersAdded = false;
let isNavigating = false;

window.onload = function () {
    const vote_found = sessionStorage.getItem("vote_found");
    if (vote_found !== "true") {
        alert("Unauthorized access");
        window.location.href = "voting.html";
    }
};

otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        if (e.target.value && otpInputs[index + 1]) otpInputs[index + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && otpInputs[index - 1]) otpInputs[index - 1].focus();
    });
});

mainBtn.addEventListener("click", async () => {
    if (!isOtpSent) {
        await processAadharCheck();
    } else {
        validateOtpInput();
    }
});

resendBtn.addEventListener("click", () => processAadharCheck());

async function processAadharCheck() {
    const aadharNo = aadharInput.value.trim();
    if (aadharNo.length !== 12) return alert("Enter 12-digit Aadhaar");

    mainBtn.disabled = true;
    mainBtn.innerText = "Verifying...";

    try {
        const voteid = sessionStorage.getItem("voteid");
        const docRef = doc(db, "voting", voteid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            userData = docSnap.data();
            if (String(userData.aadhar) === aadharNo) {
                setupSecurityListeners(docRef);
                await dispatchEmailOtp(userData.gmail);
            } else {
                alert("Aadhaar mismatch");
                resetState();
            }
        } else {
            alert("Voter record not found");
            window.location.href = "voting.html";
        }
    } catch (err) {
        console.error(err);
        resetState();
    }
}

async function dispatchEmailOtp(email) {
    if (!email || email === "none") {
        alert("No Gmail address found in database for this user!");
        resetState();
        return;
    }
    
    generatedOTP = Math.floor(10000 + Math.random() * 90000).toString();
    mainBtn.innerText = "Sending...";

    const params = { 
        to_email: email, 
        otp_code: generatedOTP 
    };

    try {
        await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
        alert("Real OTP delivered to " + email);
        isOtpSent = true;
        mainBtn.disabled = false;
        mainBtn.innerText = "Submit OTP";
        aadharInput.disabled = true;
        otpFields.style.display = "flex";
        resendBtn.style.display = "inline-block";
        runCountdown();
    } catch (error) {
        alert("Email service error: " + error.text);
        resetState();
    }
}

function validateOtpInput() {
    let combined = "";
    otpInputs.forEach(input => combined += input.value);
    if (combined === generatedOTP) {
        sessionStorage.setItem("aadhar_found", "true");
        alert("Identity Confirmed");
        isNavigating = true;
        window.location.href = "facelock.html";
    } else {
        alert("Incorrect code");
    }
}

function runCountdown() {
    let count = 30;
    resendBtn.disabled = true;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timerDisplay.innerText = `Resend in ${count}s`;
        if (count <= 0) {
            clearInterval(timerInterval);
            timerDisplay.innerText = "Ready to resend";
            resendBtn.disabled = false;
        }
        count--;
    }, 1000);
}

function setupSecurityListeners(docRef) {
    if (!listenersAdded) {
        listenersAdded = true;
        window.addEventListener("offline", async () => await updateDoc(docRef, { access: false }));
        window.addEventListener("online", async () => {
            const currentSnap = await getDoc(docRef);
            if (currentSnap.exists() && currentSnap.data().access !== true) {
                await updateDoc(docRef, { access: true });
            }
        });
        window.addEventListener("beforeunload", () => { if (!isNavigating) updateDoc(docRef, { access: false }); });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !isNavigating) {
                updateDoc(docRef, { access: false });
            }
        });
    }
}

function resetState() {
    mainBtn.disabled = false;
    mainBtn.innerText = "Send OTP";
}