document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("search-form");
    const input = form.querySelector("input[name='q']");
    const loader = document.getElementById("loaderWrapper");
    const resultBoxes = document.getElementById("results");
  
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (!question) return;
  
      loader.style.display = "block";
      resultBoxes.style.opacity = 0.3;
  
      try {
        const response = await fetch("http://localhost:5000/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ question })
        });
  
        const data = await response.json();
        console.log(data.answer);
  
        // תוכל לשנות כאן את ההצגה של התוצאה:
        alert("תשובת ChatGPT: " + data.answer);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        loader.style.display = "none";
        resultBoxes.style.opacity = 1;
      }
    });
  });
  