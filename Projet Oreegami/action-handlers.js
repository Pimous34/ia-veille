// Action Handlers for ShortNews Cards
// Handles Save, Watch Later, and Share actions without affecting swipe/scroll

document.addEventListener('DOMContentLoaded', () => {
    // Get all action buttons
    const actionButtons = document.querySelectorAll('.action-btn');

    actionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling to swipe handlers

            const action = button.getAttribute('aria-label');
            const card = button.closest('.short-card-container');
            const title = card.querySelector('.short-title').textContent;

            // Handle different actions
            if (action === 'Sauvegarder') {
                handleSave(button, title);
            } else if (action === 'À regarder plus tard') {
                handleWatchLater(button, title);
            } else if (action === 'Partager') {
                handleShare(button, title);
            }
        });
    });

    function handleSave(button, title) {
        // Toggle saved state
        const isSaved = button.classList.toggle('active');

        if (isSaved) {
            // Add to saved items (localStorage for now)
            let savedItems = JSON.parse(localStorage.getItem('savedArticles') || '[]');
            if (!savedItems.includes(title)) {
                savedItems.push(title);
                localStorage.setItem('savedArticles', JSON.stringify(savedItems));
            }

            // Visual feedback
            button.style.color = '#2563eb';
            const svg = button.querySelector('svg');
            svg.setAttribute('fill', '#2563eb');

            showToast('Article sauvegardé ✓');
        } else {
            // Remove from saved items
            let savedItems = JSON.parse(localStorage.getItem('savedArticles') || '[]');
            savedItems = savedItems.filter(item => item !== title);
            localStorage.setItem('savedArticles', JSON.stringify(savedItems));

            // Reset visual
            button.style.color = '';
            const svg = button.querySelector('svg');
            svg.setAttribute('fill', 'none');

            showToast('Article retiré des favoris');
        }
    }

    function handleWatchLater(button, title) {
        // Toggle watch later state
        const isAdded = button.classList.toggle('active');

        if (isAdded) {
            // Add to watch later list
            let watchLaterItems = JSON.parse(localStorage.getItem('watchLater') || '[]');
            if (!watchLaterItems.includes(title)) {
                watchLaterItems.push(title);
                localStorage.setItem('watchLater', JSON.stringify(watchLaterItems));
            }

            // Visual feedback - only change color, keep stroke (don't fill)
            button.style.color = '#2563eb';

            showToast('Ajouté à "À regarder plus tard" ✓');
        } else {
            // Remove from watch later
            let watchLaterItems = JSON.parse(localStorage.getItem('watchLater') || '[]');
            watchLaterItems = watchLaterItems.filter(item => item !== title);
            localStorage.setItem('watchLater', JSON.stringify(watchLaterItems));

            // Reset visual
            button.style.color = '';

            showToast('Retiré de "À regarder plus tard"');
        }
    }

    function handleShare(button, title) {
        // Use Web Share API if available, otherwise copy link
        const url = window.location.href;
        const text = `Découvrez cet article : ${title}`;

        if (navigator.share) {
            navigator.share({
                title: title,
                text: text,
                url: url
            }).then(() => {
                showToast('Article partagé ✓');
            }).catch((error) => {
                // User cancelled or error occurred
                if (error.name !== 'AbortError') {
                    fallbackShare(url, title);
                }
            });
        } else {
            fallbackShare(url, title);
        }
    }

    function fallbackShare(url, title) {
        // Copy link to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showToast('Lien copié dans le presse-papier ✓');
        }).catch(() => {
            showToast('Impossible de copier le lien');
        });
    }

    function showToast(message) {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = 'action-toast';
        toast.textContent = message;
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 2.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    // Restore saved states on load
    restoreSavedStates();

    function restoreSavedStates() {
        const savedArticles = JSON.parse(localStorage.getItem('savedArticles') || '[]');
        const watchLaterItems = JSON.parse(localStorage.getItem('watchLater') || '[]');

        document.querySelectorAll('.short-card-container').forEach(card => {
            const title = card.querySelector('.short-title').textContent;

            // Restore save button state
            if (savedArticles.includes(title)) {
                const saveBtn = card.querySelector('[aria-label="Sauvegarder"]');
                if (saveBtn) {
                    saveBtn.classList.add('active');
                    saveBtn.style.color = '#2563eb';
                    saveBtn.querySelector('svg').setAttribute('fill', '#2563eb');
                }
            }

            // Restore watch later button state (only color, no fill)
            if (watchLaterItems.includes(title)) {
                const watchBtn = card.querySelector('[aria-label="À regarder plus tard"]');
                if (watchBtn) {
                    watchBtn.classList.add('active');
                    watchBtn.style.color = '#2563eb';
                    // Don't fill the SVG, keep it as stroke only
                }
            }
        });
    }
});
