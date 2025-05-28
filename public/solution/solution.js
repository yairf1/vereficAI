const isLocal = window.location.hostname === 'localhost';
const API_BASE = isLocal ? 'http://localhost:5000/chat' : 'http://16.171.254.122:5000/chat';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('search-form');
  const input = form.querySelector("input[name='claim']");
  const loader = document.getElementById('loaderWrapper');
  const resultBoxes = document.getElementById('results');
  const responseDisplay = document.getElementById('response-display');

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const question = input.value.trim();
    if (!question) return;

    loader.style.display = 'block';
    resultBoxes.style.opacity = 0.3;
    responseDisplay.style.display = 'none';

    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      const data = await response.json();
      console.log(data.reply);

      // Display the full response
      responseDisplay.textContent = data.reply.content;
      responseDisplay.style.display = 'block';

      // Reset all boxes
      const boxes = resultBoxes.querySelectorAll('.box');
      boxes.forEach(box => {
        box.classList.remove('highlight', 'faded');
      });

      // Determine which box to highlight based on the response
      const responseText = data.reply.content.toLowerCase();
      let targetBox;

      if (
        responseText.includes('true') ||
        responseText.includes('reliable') ||
        responseText.includes('confirmed')
      ) {
        targetBox = document.getElementById('box1');
      } else if (
        responseText.includes('false') ||
        responseText.includes('unreliable') ||
        responseText.includes('fake')
      ) {
        targetBox = document.getElementById('box3');
      } else {
        targetBox = document.getElementById('box2');
      }

      // Highlight the target box and fade others
      targetBox.classList.add('highlight');
      boxes.forEach(box => {
        if (box !== targetBox) {
          box.classList.add('faded');
        }
      });
    } catch (error) {
      console.error('Error:', error);
      responseDisplay.textContent =
        'An error occurred while processing your request.';
      responseDisplay.style.display = 'block';
    } finally {
      loader.style.display = 'none';
      resultBoxes.style.opacity = 1;
    }
  });
});
