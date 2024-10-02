document.addEventListener('DOMContentLoaded', () => {
    // Cache DOM elements
    const navbarMenu = document.querySelector(".navbar .links");
    const hamburgerBtn = document.querySelector(".hamburger-btn");
    const hideMenuBtn = navbarMenu.querySelector(".close-btn");
    const showPopupBtn = document.querySelector(".login-btn");
    const formPopup = document.querySelector(".form-popup");
    const hidePopupBtn = formPopup.querySelector(".close-btn");
    const signupLoginLinks = formPopup.querySelectorAll(".bottom-link a");

    // Initialize typewriter effect
    const typewriterElement = document.getElementById('typewriter');

    if (typewriterElement) {
        new Typewriter(typewriterElement, {
            loop: true,
            delay: 75
        })
        .typeString('Innovation is like looking for pieces in a jigsaw puzzle.<br> You have to find a lot of pieces that don\'t match to find <br> the one or two pieces that match.')
        .pauseFor(2000)
        .deleteAll()
        .start();
    }

    // Toggle navigation menu visibility
    hamburgerBtn.addEventListener("click", () => {
        navbarMenu.classList.toggle("show-menu");
    });

    // Hide menu when close button is clicked
    hideMenuBtn.addEventListener("click", () => {
        navbarMenu.classList.remove("show-menu");
    });

    // Toggle popup visibility
    showPopupBtn.addEventListener("click", () => {
        document.body.classList.toggle("show-popup");
    });

    // Hide popup when close button is clicked
    hidePopupBtn.addEventListener("click", () => {
        document.body.classList.remove("show-popup");
    });

    // Switch between signup and login forms
    signupLoginLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            if (link.id === 'signup-link') {
                formPopup.classList.add("show-signup");
            } else {
                formPopup.classList.remove("show-signup");
            }
        });
    });
});