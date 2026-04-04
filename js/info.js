import { db } from "./firebase.js";
import {
    doc, getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"
async function loadInfo() {
    const voteid = sessionStorage.getItem("voteid");
    const docRef = doc(db, "voting", voteid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const name = await docSnap.data().name;
        const dob = await docSnap.data().birth.toDate();
        const aadhar = docSnap.data().aadhar;
        const vote_id = docSnap.data().vote_id;
        const gender = docSnap.data().gender;
        const contact = docSnap.data().ph_no;
        const address = docSnap.data().address;

        document.getElementById("name").textContent = name;
        document.getElementById("dob").textContent = dob.toDateString();
        document.getElementById("aadhar").textContent = aadhar;
        document.getElementById("voteid").textContent = vote_id;
        document.getElementById("gender").textContent = gender;
        document.getElementById("contact").textContent = contact;
        document.getElementById("address").textContent = address;
    }
}

window.onload = function () {

    const vote_found = sessionStorage.getItem("vote_found");
    const isvoted = sessionStorage.getItem("isvoted");
    const aadhar_found = sessionStorage.getItem("aadhar_found");

    if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true" && docSnap.data().isvoted !== true) {
        alert("Unauthorized access");
        window.location.href = "voting.html";
    }

}
loadInfo();