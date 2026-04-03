import { db } from "./firebase.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Do synchronous checks immediately
    const vote_found = sessionStorage.getItem("vote_found");
    const isvoted = sessionStorage.getItem("isvoted");
    const aadhar_found = sessionStorage.getItem("aadhar_found");
    const info_loaded = sessionStorage.getItem("info_loaded");
    const voteid = sessionStorage.getItem("voteid");

    // If there is no voteid at all, kick them out immediately to prevent errors
    if (!voteid) {
        alert("Session expired or unauthorized access.");
        window.location.href = "voting.html";
        return;
    }

    try {
        // 2. Fetch Firebase data AFTER the page has loaded
        // Note: doc() does not need 'await', only getDoc() does.
        const docRef = doc(db, "voting", voteid);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            alert("Voter record not found.");
            window.location.href = "voting.html";
            return;
        }

        const data = docSnap.data();

        // 3. Database & Session Security Check
        if (vote_found !== "true" && isvoted !== "true" && aadhar_found !== "true" && data.isvoted !== true && info_loaded !== "true") {
            alert("Unauthorized access");
            window.location.href = "voting.html";
            return;
        }

        // If they already voted in the database, block them
        if (data.isvoted === true) {
            alert("You have already cast your vote.");
            window.location.href = "voting.html";
            return;
        }

        // 4. Initialize UI Elements securely
        const rows = document.querySelectorAll(".candidate-row");
        const voteBtn = document.getElementById("voteBtn");
        const submitBtn = document.getElementById("submitBtn");
        const message = document.getElementById("message");

        /* STATE */
        let selectedRow = null;
        let confirmed = false;

        /* ROW CLICK */
        rows.forEach(row => {
            row.addEventListener("click", () => {
                if (confirmed) return;

                // Remove previous selection
                rows.forEach(r => r.classList.remove("selected"));

                // Select current
                row.classList.add("selected");

                // Check radio
                const radio = row.querySelector("input");
                if (radio) radio.checked = true;

                selectedRow = row;
                showMsg("Selected: " + row.dataset.leader, "info");
            });
        });

        /* VOTE BUTTON */
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

        /* SUBMIT BUTTON */
        submitBtn.addEventListener("click", async () => {
            if (!confirmed) {
                showMsg("Please confirm first!", "error");
                return;
            }

            try {
                // Disable UI while submitting
                submitBtn.disabled = true;
                showMsg("Submitting vote...", "info");

                await updateDoc(docRef, {
                    isvoted: true,
                    leader: selectedRow.dataset.leader
                });

                showMsg("✅ Vote submitted successfully!", "success");

                // FIX: Use removeItem instead of clear() to remove specific keys
                sessionStorage.removeItem("isvoted");
                sessionStorage.removeItem("vote_found");
                sessionStorage.removeItem("aadhar_found");

                disableAll();
                await updateDoc(docRef, {
                    access: false
                });
                // Add a small delay so they can read the success message
                setTimeout(() => {
                    window.location.href = "voting.html"; // Make sure to add .html
                }, 1500);

            } catch (error) {
                console.error(error);
                submitBtn.disabled = false;
                showMsg("Error submitting vote! Try again.", "error");
            }
        });

        /* HELPERS */
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