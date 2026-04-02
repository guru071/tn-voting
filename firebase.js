import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { 
    getFirestore, 
    doc,
    setDoc,
    getDoc,
    Timestamp 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// 🔹 Your Firebase Config
const firebaseConfig = {
                apiKey: "AIzaSyBjm6WKCRmUNILEub4lKecRx11Lwvf-koM",
    authDomain: "tn-voting-d09c5.firebaseapp.com",
    projectId: "tn-voting-d09c5",
    storageBucket: "tn-voting-d09c5.appspot.com",
    messagingSenderId: "739902489472",
    appId: "1:739902489472:web:362809592ddf36884c3765"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export{db};