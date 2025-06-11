let translations = {};
let currentLanguage = null;

// Function to change language
async function changeLanguage(lang) {
  if (lang === currentLanguage && Object.keys(translations).length > 0) {
    applyTranslations(document.body);
    // Always force navbar to LTR after translation
    const navbar = document.getElementById("navbar");
    if (navbar) {
      navbar.dir = "ltr";
    }
    return;
  }
  try {
    const response = await fetch(`../Locales/${lang}.json`);
    translations = await response.json();
    currentLanguage = lang;

    applyTranslations(document.body);

    // Update RTL/LTR direction
    document.body.dir = lang === "he" ? "rtl" : "ltr";
    // Always force navbar to LTR after translation
    const navbar = document.getElementById("navbar");
    if (navbar) {
      navbar.dir = "ltr";
    }

    // Save the selected language to localStorage
    localStorage.setItem("selectedLanguage", lang);

    // Update the document language
    document.documentElement.lang = lang;
  } catch (error) {
    console.error("Error changing language:", error);
  }
}

// Function to apply translations to a given root node
function applyTranslations(root) {
  root.querySelectorAll("[data-translate]").forEach((element) => {
    const key = element.getAttribute("data-translate");
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
}

function setupLanguageSelect() {
  const savedLanguage = localStorage.getItem("selectedLanguage") || "en";
  const languageSelect = document.getElementById("language-select");
  if (languageSelect) {
    languageSelect.value = savedLanguage;
    languageSelect.onchange = (e) => changeLanguage(e.target.value);
  }
}

// Initialize language when the document is ready
document.addEventListener("DOMContentLoaded", () => {
  setupLanguageSelect();

  // Initial language load
  const savedLanguage = localStorage.getItem("selectedLanguage") || "en";
  changeLanguage(savedLanguage);

  // Set up mutation observer to watch for dynamically loaded content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          applyTranslations(node);
          // If navbar is dynamically loaded, re-setup language select and force ltr
          if (
            node.id === "navbar" ||
            node.querySelector?.("#language-select")
          ) {
            setupLanguageSelect();
          }
          if (node.id === "navbar") {
            node.dir = "ltr";
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
});

// toggle the navigation menu
function toggleMenu() {
  const nav = document.getElementById("nav-menu");
  nav.classList.toggle("active");
}
