document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.short-card-container');
    const container = document.querySelector('.shorts-container');

    cards.forEach(card => {
        // 1. Inject Like/Nope Indicators
        const likeBadge = document.createElement('div');
        likeBadge.className = 'swipe-indicator swipe-like';
        likeBadge.innerText = '❤️';

        const nopeBadge = document.createElement('div');
        nopeBadge.className = 'swipe-indicator swipe-nope';
        nopeBadge.innerText = '💔';

        // Insert badges into the card (before content to sit on top)
        card.appendChild(likeBadge);
        card.appendChild(nopeBadge);

        // 2. State Variables
        let isDragging = false;
        let startX = 0;
        let currentX = 0;
        const threshold = 100; // Minimum distance to trigger swipe

        // 3. Event Listeners
        card.addEventListener('mousedown', startDrag);
        card.addEventListener('touchstart', startDrag, { passive: true });

        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('touchmove', moveDrag, { passive: false }); // passive: false to allow preventDefault if needed

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        function startDrag(e) {
            // Only allow dragging if we are interacting with THIS card
            // and not clicking a link or button
            if (e.target.closest('a') || e.target.closest('button')) return;

            isDragging = true;
            startX = getClientX(e);
            card.style.transition = 'none'; // Remove transition for instant follow
        }

        function moveDrag(e) {
            if (!isDragging) return;

            currentX = getClientX(e);
            const deltaX = currentX - startX;

            // Optional: Lock vertical scroll if dragging horizontally?
            // For now, we just move the card

            // Calculate rotation (max 15deg)
            const rotate = deltaX * 0.05;

            // Apply transform
            card.style.transform = `translateX(${deltaX}px) rotate(${rotate}deg)`;

            // Show Indicators
            if (deltaX > 0) {
                // Dragging Right -> LIKE (Heart on Right)
                // Active: Scale up, Opacity stays 1
                const progress = Math.min(deltaX / (threshold * 0.8), 1);
                likeBadge.style.opacity = 1;
                likeBadge.style.transform = `scale(${1 + (0.5 * progress)}) rotate(0deg)`;

                // Inactive: Fade out
                nopeBadge.style.opacity = 1 - progress;
                nopeBadge.style.transform = `scale(${1 - (0.2 * progress)}) rotate(0deg)`;
            } else {
                // Dragging Left -> NOPE (Broken Heart on Left)
                // Active: Scale up, Opacity stays 1
                const progress = Math.min(Math.abs(deltaX) / (threshold * 0.8), 1);
                nopeBadge.style.opacity = 1;
                nopeBadge.style.transform = `scale(${1 + (0.5 * progress)}) rotate(0deg)`;

                // Inactive: Fade out
                likeBadge.style.opacity = 1 - progress;
                likeBadge.style.transform = `scale(${1 - (0.2 * progress)}) rotate(0deg)`;
            }
        }

        function endDrag(e) {
            if (!isDragging) return;
            isDragging = false;

            const deltaX = currentX - startX;

            if (Math.abs(deltaX) > threshold) {
                // SWIPE ACTION TRIGGERED
                const direction = deltaX > 0 ? 1 : -1; // 1 = Right, -1 = Left
                const endX = window.innerWidth * direction; // Fly off screen

                // Scroll to next card IMMEDIATELY
                scrollToNextCard();

                // Animate card off screen
                card.style.transition = 'transform 0.3s ease-out, opacity 0.2s ease-out';
                card.style.transform = `translateX(${endX}px) rotate(${direction * 30}deg)`;
                card.style.opacity = '0';

                // Disable interaction with swiped card
                setTimeout(() => {
                    card.style.pointerEvents = 'none';
                }, 50);



            } else {
                // RESET (Back to center)
                card.style.transition = 'transform 0.3s ease-out';
                card.style.transform = 'translateX(0) rotate(0)';

                // Reset badges to default state
                likeBadge.style.opacity = 1;
                likeBadge.style.transform = 'scale(1) rotate(0deg)';
                nopeBadge.style.opacity = 1;
                nopeBadge.style.transform = 'scale(1) rotate(0deg)';
            }
        }

        function getClientX(e) {
            return e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        }
    });

    function scrollToNextCard() {
        // Find the next article element
        const articles = document.querySelectorAll('.short-article');
        const container = document.querySelector('.shorts-container');

        // Find which article is currently visible
        let currentIndex = -1;
        articles.forEach((article, index) => {
            const rect = article.getBoundingClientRect();
            // Check if article is in viewport
            if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
                currentIndex = index;
            }
        });

        // Scroll to next article if it exists
        if (currentIndex >= 0 && currentIndex < articles.length - 1) {
            const nextArticle = articles[currentIndex + 1];
            nextArticle.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
    }
});
