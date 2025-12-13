// Toggle Mobile Menu
function toggleMobileMenu() {
    const menuContainer = document.getElementById('mobileMenuContainer');

    if (menuContainer) {
        menuContainer.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (menuContainer.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Close menu when clicking outside (optional, but good UX if we had a partial menu)
// Since it's full screen, we rely on the close button and links.

