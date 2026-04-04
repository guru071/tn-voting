import { db } from "./firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    getDocs,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

const message = document.getElementById("message");

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
    if (gender !== "male" && gender !== "female" && gender !== "other") {
        message.innerHTML = "<span class='error'>Invalid gender!</span>";
        return;
    }
    if (!name || !aadhar || !birth || !ph_no || !vote_id || !gmail || !gender || !address) {
        message.innerHTML = "<span class='error'>All fields are required!</span>";
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

        
        const docRef = doc(db, "voting", vote_id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            message.innerHTML = "<span class='error'>Vote ID already registered!</span>";
            return;
        }

        
        const q = query(
            collection(db, "voting"),
            where("aadhar", "==", aadhar)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            message.innerHTML = "<span class='error'>Aadhar already registered!</span>";
            return;
        }

        
        await setDoc(docRef, {
            name: name,
            aadhar: Number(aadhar),
            birth: Timestamp.fromDate(new Date(birth)),
            gender: gender,
            isvoted: false,
            ph_no: Number(ph_no),
            vote_id: vote_id,
            gmail: gmail,
            address: address
        });

        message.innerHTML = "<span class='success'>Registration Successful!</span>";

        document.getElementById("name").value = "";
        document.getElementById("aadhar").value = "";
        document.getElementById("birth").value = "";
        document.getElementById("phonenumber").value = "";
        document.getElementById("voteid").value = "";
        document.getElementById("gmail").value = "";
        document.getElementById("gender").value = "";
        document.getElementById("address").value = "";
        sessionStorage.setItem("voteid", vote_id);
        window.location.href = "face_register.html";
    } catch (error) {
        message.innerHTML = "<span class='error'>" + error.message + "</span>";
    }
}

document.getElementById("submitBtn")
    .addEventListener("click", insertdata);