// ShortNews Vertical Scroll - YouTube Shorts Style
(function () {
    let currentCardIndex = 0;
    let isScrolling = false;
    const cards = document.querySelectorAll('.short-card-container');
    const container = document.querySelector('.shorts-container');

    if (!cards.length || !container) return;

    // Hide all cards except the first one
    function showCard(index) {
        cards.forEach((card, i) => {
            if (i === index) {
                card.style.opacity = '1';
                card.style.visibility = 'visible';
                card.style.pointerEvents = 'auto';
            } else {
                card.style.opacity = '0';
                card.style.visibility = 'hidden';
                card.style.pointerEvents = 'none';
            }
        });
    }

    // Add smooth transition to all cards
    cards.forEach((card) => {
        card.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    });

    // Show first card
    showCard(0);

    // Handle wheel scroll
    function handleWheel(e) {
        if (isScrolling) return;

        e.preventDefault();
        const delta = e.deltaY;

        if (delta > 0 && currentCardIndex < cards.length - 1) {
            // Scroll down - next card
            isScrolling = true;
            currentCardIndex++;
            showCard(currentCardIndex);
            setTimeout(() => { isScrolling = false; }, 600);
        } else if (delta < 0 && currentCardIndex > 0) {
            // Scroll up - previous card
            isScrolling = true;
            currentCardIndex--;
            showCard(currentCardIndex);
            setTimeout(() => { isScrolling = false; }, 600);
        }
    }

    // Handle touch swipe (vertical)
    let touchStartY = 0;
    let touchEndY = 0;

    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchMove(e) {
        touchEndY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        if (isScrolling) return;

        const swipeDistance = touchStartY - touchEndY;
        const minSwipeDistance = 50;

        if (swipeDistance > minSwipeDistance && currentCardIndex < cards.length - 1) {
            // Swipe up - next card
            isScrolling = true;
            currentCardIndex++;
            showCard(currentCardIndex);
            setTimeout(() => { isScrolling = false; }, 600);
        } else if (swipeDistance < -minSwipeDistance && currentCardIndex > 0) {
            // Swipe down - previous card
            isScrolling = true;
            currentCardIndex--;
            showCard(currentCardIndex);
            setTimeout(() => { isScrolling = false; }, 600);
        }
    }

    // Add event listeners
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Keyboard navigation (optional)
    document.addEventListener('keydown', (e) => {
        if (isScrolling) return;

        if (e.key === 'ArrowDown' && currentCardIndex < cards.length - 1) {
            isScrolling = true;
            currentCardIndex++;
            showCard(currentCardIndex);
            setTimeout(() => { isScrolling = false; }, 600);
        } else if (e.key === 'ArrowUp' && currentCardIndex > 0) {
            isScrolling = true;
            currentCardIndex--;
            showCard(currentCardIndex);
            setTimeout(() => { isScrolling = false; }, 600);
        }
    });
})();
