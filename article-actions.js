// Gestion des actions sur les articles (Sauvegarder, Like, Partager, etc.)

function saveArticle() {
    const btn = document.querySelector('button[onclick="saveArticle()"]');
    const icon = btn.querySelector('svg');

    // Toggle state
    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        btn.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
        btn.style.color = '#667eea';
        icon.style.fill = 'none';
        showToast('Article retiré des sauvegardes');
    } else {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btn.style.color = 'white';
        icon.style.fill = 'currentColor';
        showToast('Article sauvegardé !');
    }
}

function watchLater() {
    const btn = document.querySelector('button[onclick="watchLater()"]');
    const icon = btn.querySelector('svg');

    if (btn.classList.contains('active')) {
        btn.classList.remove('active');
        btn.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
        btn.style.color = '#667eea';
        icon.style.fill = 'none';
        showToast('Retiré de "À regarder plus tard"');
    } else {
        btn.classList.add('active');
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        btn.style.color = 'white';
        icon.style.fill = 'currentColor';
        showToast('Ajouté à "À regarder plus tard"');
    }
}

function shareArticle() {
    if (navigator.share) {
        navigator.share({
            title: document.title,
            text: 'Découvrez cet article sur OREEGAM\'IA !',
            url: window.location.href,
        })
            .then(() => console.log('Partage réussi'))
            .catch((error) => console.log('Erreur de partage', error));
    } else {
        // Fallback: copier le lien
        navigator.clipboard.writeText(window.location.href);
        showToast('Lien copié dans le presse-papier !');
    }
}

function likeArticle() {
    const likeBtn = document.querySelector('.like-btn');
    const dislikeBtn = document.querySelector('.dislike-btn');

    // Reset dislike if active
    if (dislikeBtn.classList.contains('active')) {
        dislikeBtn.classList.remove('active');
        dislikeBtn.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)';
        dislikeBtn.style.color = '#ef4444';
        dislikeBtn.querySelector('svg').style.fill = 'none';
    }

    // Toggle like
    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        likeBtn.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)';
        likeBtn.style.color = '#10b981';
        likeBtn.querySelector('svg').style.fill = 'none';
    } else {
        likeBtn.classList.add('active');
        likeBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        likeBtn.style.color = 'white';
        likeBtn.querySelector('svg').style.fill = 'currentColor';
        showToast('Vous aimez cet article !');
    }
}

function dislikeArticle() {
    const likeBtn = document.querySelector('.like-btn');
    const dislikeBtn = document.querySelector('.dislike-btn');

    // Reset like if active
    if (likeBtn.classList.contains('active')) {
        likeBtn.classList.remove('active');
        likeBtn.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)';
        likeBtn.style.color = '#10b981';
        likeBtn.querySelector('svg').style.fill = 'none';
    }

    // Toggle dislike
    if (dislikeBtn.classList.contains('active')) {
        dislikeBtn.classList.remove('active');
        dislikeBtn.style.background = 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)';
        dislikeBtn.style.color = '#ef4444';
        dislikeBtn.querySelector('svg').style.fill = 'none';
    } else {
        dislikeBtn.classList.add('active');
        dislikeBtn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        dislikeBtn.style.color = 'white';
        dislikeBtn.querySelector('svg').style.fill = 'currentColor';
        showToast('Vous n\'aimez pas cet article');
    }
}

// Fonction utilitaire pour afficher un toast notification
function showToast(message) {
    // Créer le toast s'il n'existe pas
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(15, 23, 42, 0.9);
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 0.9rem;
            font-weight: 500;
            z-index: 1000;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(toast);
    }

    // Mettre à jour le message
    toast.textContent = message;

    // Afficher
    requestAnimationFrame(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    // Cacher après 3 secondes
    clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(100px)';
    }, 3000);
}
