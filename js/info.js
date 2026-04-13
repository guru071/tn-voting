import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
<<<<<<< HEAD

=======
window.onload = async function () {
  const vote_found = sessionStorage.getItem("vote_found");
  const isvoted = sessionStorage.getItem("isvoted");
  const aadhar_found = sessionStorage.getItem("aadhar_found");
  const voteid = sessionStorage.getItem("voteid");
  const facelock_found = sessionStorage.getItem("facelock_found");
  const info_found = sessionStorage.getItem("info_found");
  if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true" && facelock_found === "true") {
    isNavigating = true;
    window.location.href = "voting.html";
    return;
  }
  if(info_found || info_found === "true"){
    window.location.href="politics.html"
  }
  loadVoterProfile();
};
function nextPage() {
    sessionStorage.setItem("info_found", "true");
    window.location.href = "politics.html";
}
>>>>>>> f4131a0 (bug fix)
async function loadVoterProfile() {
    const voteid = sessionStorage.getItem("voteid");
    
    if (!voteid) {
        window.location.href = "voting.html";
        return;
    }

    try {
        const docRef = doc(db, "voting", voteid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();

            document.getElementById("name").textContent = data.name || "---";
            document.getElementById("voteid").textContent = voteid;
            document.getElementById("aadhar").textContent = data.aadhar || "---";
            document.getElementById("gender").textContent = data.gender || "---";
            document.getElementById("contact").textContent = data.ph_no || "---";
            document.getElementById("address").textContent = data.address || "---";

            if (data.birth && typeof data.birth.toDate === 'function') {
                const dateObj = data.birth.toDate();
                const options = { year: 'numeric', month: 'long', day: 'numeric' };
                document.getElementById("dob").textContent = dateObj.toLocaleDateString('en-IN', options);
            } else {
                document.getElementById("dob").textContent = data.birth || "---";
            }

            const profileImg = document.getElementById("profileImage");
            if (data.faceImageUrl && data.faceImageUrl !== "none") {
                profileImg.src = data.faceImageUrl;
            } else {
                profileImg.src = "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            }

        } else {
            alert("No profile found");
            window.location.href = "voting.html";
        }
    } catch (error) {
        console.error(error);
    }
}
<<<<<<< HEAD

window.onload = function () {
    const vote_found = sessionStorage.getItem("vote_found");
    const aadhar_found = sessionStorage.getItem("aadhar_found");

    if (vote_found !== "true" || aadhar_found !== "true") {
        alert("Unauthorized access");
        window.location.href = "voting.html";
        return;
    }

    loadVoterProfile();
};
=======
>>>>>>> f4131a0 (bug fix)
