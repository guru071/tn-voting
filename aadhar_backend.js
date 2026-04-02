import { db } from "./firebase.js";

import { 
    doc,getDoc
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
const inputs = document.querySelector(".inputs");
inputs.addEventListener("input",function (e){
  const target = e.target;
  const val = target.value;
  if(isNaN(val)){
    target.value = "";
    return ;
  }
  console.log(val);
});

document.querySelector(".nextbtn")
  .addEventListener("click", aadhar_page);


window.onload = function () {
  
  const vote_found = sessionStorage.getItem("vote_found");

  if (vote_found !== "true" && sessionStorage.getItem("isvoted")!=="true") {
    alert("Unauthorized access");
    window.location.href = "voting.html";
  }
};

async function aadhar_page() {

  const aadharNo = document
    .getElementById("aadharno")
    .value.replaceAll(" ", "");

  if (aadharNo.length === 12 && !isNaN(aadharNo)) {

    alert("Valid Aadhaar");
    try{
      const voteid=sessionStorage.getItem("voteid");
      const docRef = await doc(db,"voting",voteid);
    const docSnap = await getDoc(docRef);
    if(docSnap.exists()){
      
      if(Number(docSnap.data().aadhar) === Number(aadharNo)){
        sessionStorage.setItem("aadhar_found","true");
        alert("Record founded !");
        document
    .getElementById("aadharno")
    .value="";
        window.location.href ="politics.html";
      }else{
        alert("Record not founded");
      }
    }
    }

   catch(error){
    console.error(error);
  }}
  else {
    alert("Enter valid Aadhaar number");
  }
}