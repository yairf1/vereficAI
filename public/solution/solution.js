
   function checkInput() {
     const value = document.getElementById("input").value.trim();
     const red = document.getElementById("red");
     const yellow = document.getElementById("yellow");
     const green = document.getElementById("green");
     // איפוס
     red.classList.remove("active");
     yellow.classList.remove("active");
     green.classList.remove("active");
     // התאמה
     if (value === "עצור") {
       red.classList.add("active");
     } else if (value === "חכה") {
       yellow.classList.add("active");
     } else if (value === "סע") {
       green.classList.add("active");
     }
   }