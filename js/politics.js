import { db } from "./firebase.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js"

document.addEventListener("DOMContentLoaded", async () => {

    const vote_found = sessionStorage.getItem("vote_found");
    const isvoted = sessionStorage.getItem("isvoted");
    const aadhar_found = sessionStorage.getItem("aadhar_found");
    const info_loaded = sessionStorage.getItem("info_loaded");
    const voteid = sessionStorage.getItem("voteid");

    if (!voteid) {
        alert("Session expired or unauthorized access.");
        window.location.href = "voting.html";
        return;
    }

    try {
  
        const docRef = doc(db, "voting", voteid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("Voter record not found.");
            window.location.href = "voting.html";
            return;
        }

        window.addEventListener("offline", async () => {
            console.log("Offline");
            await updateDoc(docRef, {
                access: false
            });
        });

        window.addEventListener("online", async () => {
            console.log("Back Online");
            const access = docSnap.data().access;
            if (access !== true) {
                await updateDoc(docRef, {
                    access: true
                });
            }
        });

        window.addEventListener("beforeunload", async () => {
            navigator.sendBeacon("/log"); 
            await updateDoc(docRef, {
                access: false
            });
        });

        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                navigator.sendBeacon('/api/exit-endpoint', "hidden");
                updateDoc(docRef, {
                    access: false
                });
            }
        });

        const data = docSnap.data();

        if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true" && data.isvoted !== true && info_loaded !== "true") {
            alert("Unauthorized access");
            window.location.href = "voting.html";
            return;
        }

        if (data.isvoted === true) {
            alert("You have already cast your vote.");
            window.location.href = "voting.html";
            return;
        }

        const rows = document.querySelectorAll(".candidate-row");
        const voteBtn = document.getElementById("voteBtn");
        const submitBtn = document.getElementById("submitBtn");
        const message = document.getElementById("message");

    
        let selectedRow = null;
        let confirmed = false;

        rows.forEach(row => {
            row.addEventListener("click", () => {
                if (confirmed) return;

                rows.forEach(r => r.classList.remove("selected"));

                row.classList.add("selected");

                const radio = row.querySelector("input");
                if (radio) radio.checked = true;

                selectedRow = row;
                showMsg("Selected: " + row.dataset.leader, "info");
            });
        });

        voteBtn.addEventListener("click", () => {
            if (!selectedRow) {
                showMsg("Please select a candidate!", "error");
                return;
            }

            const leader = selectedRow.dataset.leader;
            const confirmVote = confirm("Confirm vote for " + leader + " ?");

            if (confirmVote) {
                confirmed = true;
                voteBtn.disabled = true;
                submitBtn.disabled = false;
                showMsg("Selection confirmed. Click Submit.", "info");
            }
        });

        submitBtn.addEventListener("click", async () => {
            if (!confirmed) {
                showMsg("Please confirm first!", "error");
                return;
            }

            try {
                submitBtn.disabled = true;
                showMsg("Submitting vote...", "info");

                await updateDoc(docRef, {
                    isvoted: true,
                    leader: selectedRow.dataset.leader
                });

                showMsg("✅ Vote submitted successfully!", "success");

                sessionStorage.removeItem("isvoted");
                sessionStorage.removeItem("vote_found");
                sessionStorage.removeItem("aadhar_found");

                disableAll();
                await updateDoc(docRef, {
                    access: false
                });
                setTimeout(() => {
                    window.location.href = "voting.html"; 
                }, 1500);

            } catch (error) {
                console.error(error);
                submitBtn.disabled = false;
                showMsg("Error submitting vote! Try again.", "error");
            }
        });

        
        function showMsg(text, type) {
            message.style.display = "block";
            message.className = type;
            message.innerText = text;
        }

        function disableAll() {
            rows.forEach(row => {
                row.style.pointerEvents = "none";
            });
            submitBtn.disabled = true;
        }

    } catch (error) {
        console.error("Error loading profile:", error);
        alert("An error occurred connecting to the server.");
    }
});