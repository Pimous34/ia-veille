
// Toggle Search Overlay
function toggleSearch() {
    const overlay = document.getElementById('searchOverlay');
    if (!overlay) return;

    const isVisible = overlay.classList.contains('active');

    if (isVisible) {
        overlay.classList.remove('active');
    } else {
        overlay.classList.add('active');
        // Focus on input after animation
        setTimeout(() => {
            const input = overlay.querySelector('.search-overlay-input');
            if (input) input.focus();
        }, 300);
    }
}

// Close search overlay when clicking outside
document.addEventListener('click', function (event) {
    const overlay = document.getElementById('searchOverlay');
    const searchBtn = document.querySelector('.search-toggle-btn');

    if (overlay && overlay.classList.contains('active')) {
        if (!overlay.contains(event.target) && searchBtn && !searchBtn.contains(event.target)) {
            overlay.classList.remove('active');
        }
    }
});
