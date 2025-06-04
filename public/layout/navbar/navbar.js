let translations = {};

// Function to change language
async function changeLanguage(lang) {
    try {
        const response = await fetch(`../Locales/${lang}.json`);
        const translation = await response.json();
        
        // Update text content for all translatable elements
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (translation[key]) {
                element.textContent = translation[key];
            }
        });

        // Update RTL/LTR direction
        if (lang === 'he') {
            document.body.dir = 'rtl';
        } else {
            document.body.dir = 'ltr';
        }

        // Save the selected language to localStorage
        localStorage.setItem('selectedLanguage', lang);
        
        // Update the document language
        document.documentElement.lang = lang;
    } catch (error) {
        console.error('Error changing language:', error);
    }
}

// Function to apply translations to dynamically loaded content
function applyTranslationsToNewContent() {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    changeLanguage(savedLanguage);
}

// Initialize language when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    const languageSelect = document.getElementById('language-select');
    
    if (languageSelect) {
        languageSelect.value = savedLanguage;
        languageSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
    
    // Initial language load
    changeLanguage(savedLanguage);

    // Set up mutation observer to watch for dynamically loaded content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                applyTranslationsToNewContent();
            }
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}); 