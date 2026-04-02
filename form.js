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
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const message = document.getElementById("message");

async function insertdata() {

    const name = document.getElementById("name").value.trim();
    const aadhar = document.getElementById("aadhar").value.trim().replaceAll(" ","");
    const birth = document.getElementById("birth").value;
    const ph_no = document.getElementById("phonenumber").value.trim();
    const vote_id = document.getElementById("voteid").value.trim();
    const gmail = document.getElementById("gmail").value.trim();
    if (!name || !aadhar || !birth || !ph_no || !vote_id || !gmail) {
        message.innerHTML = "<span class='error'>All fields are required!</span>";
        return;
    }
    if (aadhar.length != 12   || isNaN(aadhar)) {
        alert("Enter vaild aadhar");
    }
    // AGE CHECK
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

        // 🔥 Check if Vote ID already exists
        const docRef = doc(db, "voting", vote_id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            message.innerHTML = "<span class='error'>Vote ID already registered!</span>";
            return;
        }

        // 🔥 Check if Aadhar already exists
        const q = query(
            collection(db, "voting"),
            where("aadhar", "==", aadhar)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            message.innerHTML = "<span class='error'>Aadhar already registered!</span>";
            return;
        }

        // ✅ Insert Data
        await setDoc(docRef, {
            name: name,
            aadhar: Number(aadhar),
            birth: Timestamp.fromDate(new Date(birth)),
            isvoted: false,
            ph_no: Number(ph_no),
            vote_id: vote_id,
            gmail: gmail
        });

        message.innerHTML = "<span class='success'>Registration Successful!</span>";

        document.getElementById("name").value = "";
        document.getElementById("aadhar").value = "";
        document.getElementById("birth").value = "";
        document.getElementById("phonenumber").value = "";
        document.getElementById("voteid").value = "";
        document.getElementById("gmail").value = "";
    } catch (error) {
        message.innerHTML = "<span class='error'>" + error.message + "</span>";
    }
}

document.getElementById("submitBtn")
    .addEventListener("click", insertdata);