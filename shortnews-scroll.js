// ShortNews Fixed Card Scroll Handler
(function () {
    let currentCardIndex = 0;
    let isScrolling = false;
    const cards = document.querySelectorAll('.short-article');
    const container = document.querySelector('.shorts-container');

    if (!cards.length || !container) return;

    // Hide all cards except the first one
    function showCard(index) {
        cards.forEach((card, i) => {
            if (i === index) {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
                card.style.zIndex = '10';
            } else {
                card.style.opacity = '0';
                card.style.pointerEvents = 'none';
                card.style.zIndex = '1';
            }
        });
    }

    // Make all cards fixed position
    cards.forEach((card) => {
        card.style.position = 'fixed';
        card.style.top = '85px';
        card.style.left = '50%';
        card.style.transform = 'translateX(-50%)';
        card.style.width = 'calc(100% - 2rem)';
        card.style.maxWidth = '600px';
        card.style.transition = 'opacity 0.3s ease';
    });

    // Show first card
    showCard(0);

    // Handle wheel scroll
    function handleWheel(e) {
        if (isScrolling) return;

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

    // Handle touch swipe
    let touchStartY = 0;
    let touchEndY = 0;

    function handleTouchStart(e) {
        touchStartY = e.touches[0].clientY;
    }

    function handleTouchEnd(e) {
        touchEndY = e.changedTouches[0].clientY;
        handleSwipe();
    }

    function handleSwipe() {
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
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
})();
