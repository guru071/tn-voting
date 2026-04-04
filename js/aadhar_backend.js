import { db } from "./firebase.js";
import {
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

const inputs = document.querySelector(".inputs");
inputs.addEventListener("input", function (e) {
  const target = e.target;
  const val = target.value;
  if (isNaN(val)) {
    target.value = "";
    return;
  }
  console.log(val);
});

document.querySelector(".nextbtn").addEventListener("click", aadhar_page);

window.onload = function () {
  const vote_found = sessionStorage.getItem("vote_found");
  if (vote_found !== "true" && sessionStorage.getItem("isvoted") !== "true") {
    alert("Unauthorized access");
    window.location.href = "voting.html";
  }
};

let listenersAdded = false;
let isNavigating = false;

async function aadhar_page() {
  const aadharNo = document.getElementById("aadharno").value.replaceAll(" ", "");

  if (aadharNo.length === 12 && !isNaN(aadharNo)) {
    alert("Valid Aadhaar");
    try {
      const voteid = sessionStorage.getItem("voteid");
      const docRef = doc(db, "voting", voteid); 
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        if (!listenersAdded) {
          listenersAdded = true;

          window.addEventListener("offline", async () => {
            console.log("Offline");
            await updateDoc(docRef, { access: false });
          });

          window.addEventListener("online", async () => {
            console.log("Back Online");
            const currentSnap = await getDoc(docRef);
            if (currentSnap.exists() && currentSnap.data().access !== true) {
              await updateDoc(docRef, { access: true });
            }
          });

          window.addEventListener("beforeunload", () => {
            if (!isNavigating) {
              navigator.sendBeacon("/log", "user_leaving"); 
              updateDoc(docRef, { access: false });
            }
          });

          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden' && !isNavigating) {
              navigator.sendBeacon('/api/exit-endpoint', "hidden");
              updateDoc(docRef, { access: false });
            }
          });
        }

        if (Number(docSnap.data().aadhar) === Number(aadharNo)) {
          sessionStorage.setItem("aadhar_found", "true");
          alert("Record founded !");
          document.getElementById("aadharno").value = "";
          
          isNavigating = true; 
          
          window.location.href = "facelock.html";
        } else {
          alert("Record not founded");
        }
      }
    } catch (error) {
      console.error(error);
    }
  } else {
    alert("Enter valid Aadhaar number");
  }
}