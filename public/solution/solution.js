document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("search-form");
  const loaderWrapper = document.getElementById("loaderWrapper");
  const resultBoxes = document.querySelectorAll(".box");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // איפוס כל הריבועים
    resultBoxes.forEach(box => {
      box.classList.remove("highlight");
      box.classList.remove("faded");
    });

    loaderWrapper.classList.add("show");

    const randomIndex = Math.floor(Math.random() * 3) + 1;

    setTimeout(() => {
      loaderWrapper.classList.remove("show");

      const selectedBox = document.getElementById(`box${randomIndex}`);
      selectedBox.classList.add("highlight");

      // אפור לשאר הריבועים
      resultBoxes.forEach(box => {
        if (box !== selectedBox) {
          box.classList.add("faded");
        }
      });

      // אם רוצים להחזיר הכל לקדמותו אחרי כמה זמן:
      setTimeout(() => {
        selectedBox.classList.remove("highlight");
        resultBoxes.forEach(box => box.classList.remove("faded"));
      }, 4000);

    }, 1000);
  });
});
