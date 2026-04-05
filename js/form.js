// form.js
import { db } from "./firebase.js";
import {
    doc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

async function insertdata() {
    const name = document.getElementById("name").value.trim();
    const aadhar = document.getElementById("aadhar").value.trim().replaceAll(" ", "");
    const birth = document.getElementById("birth").value;
    const ph_no = document.getElementById("phonenumber").value.trim();
    const vote_id = document.getElementById("voteid").value.trim();
    const gmail = document.getElementById("gmail").value.trim();
    const gender = document.getElementById("gender").value.trim().toLowerCase();
    const address = document.getElementById("address").value.trim();
    
    function isValidVoterId(voteId) {
        const regex = /^[a-zA-Z]{3}\d+$/;
        return regex.test(voteId);
    }

    if (!name || !aadhar || !birth || !ph_no || !vote_id || !gmail || !gender || !address) {
        message.innerHTML = "<span class='error'>All fields are required!</span>";
        return;
    }
    if (gender !== "male" && gender !== "female" && gender !== "other") {
        message.innerHTML = "<span class='error'>Invalid gender!</span>";
        return;
    }
    if (aadhar.length != 12 || isNaN(aadhar)) {
        message.innerHTML = "<span class='error'>Invalid Aadhar number!</span>";
        return;
    }
    if (ph_no.length != 10 || isNaN(ph_no)) {
        message.innerHTML = "<span class='error'>Invalid phone number!</span>";
        return;
    }
    if (vote_id.length != 10 || !isValidVoterId(vote_id)) {
        message.innerHTML = "<span class='error'>Invalid Voter ID!</span>";
        return;
    }
    
    const today = new Date();
    const birthDate = new Date(birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age < 18) {
        alert("You must be 18+");
        return;
    }

    try {
        submitBtn.disabled = true;
        message.innerHTML = "<span class='success'>Verifying...</span>";

        const docRef = doc(db, "voting", vote_id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            message.innerHTML = "<span class='error'>Vote ID already registered!</span>";
            submitBtn.disabled = false;
            return;
        }

        const q = query(collection(db, "voting"), where("aadhar", "==", aadhar));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            message.innerHTML = "<span class='error'>Aadhar already registered!</span>";
            submitBtn.disabled = false;
            return;
        }

        sessionStorage.setItem("voteid", vote_id);
        sessionStorage.setItem("name", name);
        sessionStorage.setItem("aadhar", aadhar);
        sessionStorage.setItem("birth", birth);
        sessionStorage.setItem("phonenumber", ph_no);
        sessionStorage.setItem("gmail", gmail);
        sessionStorage.setItem("gender", gender);
        sessionStorage.setItem("address", address);
        sessionStorage.setItem("info_entered", "true");

        message.innerHTML = "<span class='success'>Registration Details Saved! Redirecting...</span>";
        window.location.href = "face_register.html";
        
    } catch (error) {
        message.innerHTML = "<span class='error'>" + error.message + "</span>";
        submitBtn.disabled = false;
    }
}

document.getElementById("submitBtn").addEventListener("click", insertdata);