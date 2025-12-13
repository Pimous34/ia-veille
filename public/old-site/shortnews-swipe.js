// ShortNews Swipe Functionality - Tinder-style
(function () {
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isDragging = false;
    let currentCard = null;

    // Initialize swipe functionality
    function initSwipe() {
        const articles = document.querySelectorAll('.short-article');

        articles.forEach(article => {
            const card = article.querySelector('.short-card-container');
            if (!card) return;

            // Touch events
            card.addEventListener('touchstart', handleTouchStart, { passive: true });
            card.addEventListener('touchmove', handleTouchMove, { passive: false });
            card.addEventListener('touchend', handleTouchEnd);

            // Mouse events for desktop testing
            card.addEventListener('mousedown', handleMouseDown);
            card.addEventListener('mousemove', handleMouseMove);
            card.addEventListener('mouseup', handleMouseEnd);
            card.addEventListener('mouseleave', handleMouseEnd);

            // Prevent default drag behavior
            card.style.userSelect = 'none';
            card.style.webkitUserSelect = 'none';
        });
    }

    function handleTouchStart(e) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget);
    }

    function handleMouseDown(e) {
        startDrag(e.clientX, e.clientY, e.currentTarget);
    }

    function startDrag(x, y, card) {
        startX = x;
        startY = y;
        currentX = 0;
        currentY = 0;
        isDragging = true;
        currentCard = card;
        currentCard.style.transition = 'none';
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }

    function handleMouseMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        moveDrag(e.clientX, e.clientY);
    }

    function moveDrag(x, y) {
        if (!isDragging || !currentCard) return;

        currentX = x - startX;
        currentY = y - startY;

        // Only allow horizontal swipe
        const angle = Math.abs(Math.atan2(currentY, currentX) * 180 / Math.PI);
        if (angle > 45 && angle < 135) {
            // Vertical swipe - let scroll happen
            return;
        }

        // Apply transform
        const rotation = currentX / 20;
        currentCard.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

        // Show like/dislike indicator
        const opacity = Math.min(Math.abs(currentX) / 100, 1);

        if (currentX > 0) {
            // Swiping right - Like
            showLikeIndicator(currentCard, opacity);
            hidDislikeIndicator(currentCard);
        } else if (currentX < 0) {
            // Swiping left - Dislike
            showDislikeIndicator(currentCard, opacity);
            hideLikeIndicator(currentCard);
        }
    }

    function handleTouchEnd(e) {
        endDrag();
    }

    function handleMouseEnd(e) {
        endDrag();
    }

    function endDrag() {
        if (!isDragging || !currentCard) return;

        isDragging = false;
        const threshold = 100; // pixels to trigger swipe

        if (Math.abs(currentX) > threshold) {
            // Swipe completed
            swipeCard(currentX > 0 ? 'like' : 'dislike');
        } else {
            // Return to original position
            currentCard.style.transition = 'transform 0.3s ease';
            currentCard.style.transform = '';
            hideLikeIndicator(currentCard);
            hidDislikeIndicator(currentCard);
        }

        currentCard = null;
    }

    function swipeCard(action) {
        if (!currentCard) return;

        const direction = action === 'like' ? 1 : -1;
        currentCard.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
        currentCard.style.transform = `translateX(${direction * 500}px) rotate(${direction * 30}deg)`;
        currentCard.style.opacity = '0';

        // Log the action (you can save this to localStorage or send to server)
        console.log(`${action.toUpperCase()}: Article swiped`);

        // Remove the card after animation
        setTimeout(() => {
            const article = currentCard.closest('.short-article');
            if (article) {
                article.style.display = 'none';
            }
            hideLikeIndicator(currentCard);
            hidDislikeIndicator(currentCard);
        }, 400);
    }

    function showLikeIndicator(card, opacity) {
        let indicator = card.querySelector('.swipe-like-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'swipe-like-indicator';
            indicator.textContent = '❤️';
            indicator.style.cssText = `
                position: absolute;
                top: 50%;
                right: 1rem;
                transform: translateY(-50%);
                font-size: 3rem;
                z-index: 10;
                pointer-events: none;
                filter: drop-shadow(0 2px 8px rgba(76, 175, 80, 0.5));
            `;
            card.appendChild(indicator);
        }
        indicator.style.opacity = opacity;
        indicator.style.display = 'block';
    }

    function hideLikeIndicator(card) {
        const indicator = card.querySelector('.swipe-like-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    function showDislikeIndicator(card, opacity) {
        let indicator = card.querySelector('.swipe-dislike-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'swipe-dislike-indicator';
            indicator.textContent = '💔';
            indicator.style.cssText = `
                position: absolute;
                top: 50%;
                left: 1rem;
                transform: translateY(-50%);
                font-size: 3rem;
                z-index: 10;
                pointer-events: none;
                filter: drop-shadow(0 2px 8px rgba(244, 67, 54, 0.5));
            `;
            card.appendChild(indicator);
        }
        indicator.style.opacity = opacity;
        indicator.style.display = 'block';
    }

    function hidDislikeIndicator(card) {
        const indicator = card.querySelector('.swipe-dislike-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSwipe);
    } else {
        initSwipe();
    }
})();
