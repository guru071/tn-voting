import { db } from "./firebase.js";
import {
  doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

document.querySelector(".nextbtn").addEventListener("click", click_next);


let listenersAdded = false; 

async function click_next() {
  const voteid = document.getElementById("voteid").value;
  sessionStorage.setItem("voteid", voteid);

  const birth = new Date(document.getElementById("birth").value);

  if (!voteid) {
    alert("Enter vote id");
    return;
  }

  try {
    const docRef = doc(db, "voting", voteid);
    const docSnap = await getDoc(docRef);

    
    if (!docSnap.exists()) {
      alert("Invalid Login Details");
      return;
    }

    const data = docSnap.data();

    if (voteid == data.vote_id) {
      const ddate = data.birth.toDate();

      
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
          navigator.sendBeacon("/log", "user_leaving"); 
          updateDoc(docRef, { access: false });
        });

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            
            navigator.sendBeacon('/api/exit-endpoint', "hidden"); 
            updateDoc(docRef, { access: false });
          }
        });
      }

      if (ddate.getFullYear() == birth.getFullYear() && ddate.getMonth() == birth.getMonth() && ddate.getDate() == birth.getDate()) {

        if (data.isvoted === true) {
          alert("you are already voted");
          document.getElementById("voteid").value = "";
          document.getElementById("birth").value = "";
          return;
        }

        if (data.access === true) {
          alert("You have already accessed the voting page. Please proceed to vote.");
          document.getElementById("voteid").value = "";
          return;
        }

        alert("you are eligible to vote!");
        sessionStorage.setItem("isvoted", "true");
        sessionStorage.setItem("vote_found", "true");
        
        
        document.getElementById("voteid").value = "";
        document.getElementById("birth").value = "";
        
        await updateDoc(docRef, { access: true });
        window.location.href = "aadhar.html";

      } else {
        alert("Invalid Login Details");
      }
    } else {
      alert("Invalid Login Details");
    }
  } catch (error) {
    console.error("Debug Error:", error); 
    alert("Record not found");
  }
}