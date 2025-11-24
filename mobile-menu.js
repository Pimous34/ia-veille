
// Toggle Mobile Menu
function toggleMobileMenu() {
    const nav = document.querySelector('.main-nav');
    const overlay = document.getElementById('mobileMenuOverlay');

    if (nav && overlay) {
        nav.classList.toggle('active');
        overlay.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (nav.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
}

// Close mobile menu when clicking on a link
document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 767) {
                toggleMobileMenu();
            }
        });
    });
});
