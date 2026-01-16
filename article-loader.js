// Article Page Dynamic Content Loader
// Loads article content based on URL parameters

document.addEventListener('DOMContentLoaded', () => {
    // Get article ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');

    if (!articleId) {
        // If no article ID, show default content
        console.log('No article ID provided');
        return;
    }

    // Fetch article data from localStorage or use default data
    loadArticleContent(articleId);
});

function loadArticleContent(articleId) {
    // Try to get article data from localStorage (if saved from main page)
    const articlesData = localStorage.getItem('articlesData');
    let article = null;

    if (articlesData) {
        const articles = JSON.parse(articlesData);
        article = articles.find(a => a.title === decodeURIComponent(articleId));
    }

    // If article found, update the page content
    if (article) {
        updatePageContent(article);
    } else {
        // Use default content with the article ID as title
        console.log('Article not found, using default content');
    }
}

function updatePageContent(article) {
    // Update page title
    document.title = `${article.title} - OREEGAM'IA`;

    // Update article title
    const titleElement = document.querySelector('.article-title');
    if (titleElement) {
        titleElement.textContent = article.title;
    }

    // Update breadcrumb
    const breadcrumbSpan = document.querySelector('.article-breadcrumb span:last-child');
    if (breadcrumbSpan) {
        breadcrumbSpan.textContent = article.title.substring(0, 30) + '...';
    }

    // Update tags
    const tagsContainer = document.querySelector('.article-tags');
    if (tagsContainer && article.tags) {
        tagsContainer.innerHTML = article.tags.map(tag =>
            `<a href="#" class="article-tag">${tag}</a>`
        ).join('');
    }

    // Update category badge in breadcrumb
    const categoryLink = document.querySelector('.article-breadcrumb a:nth-child(3)');
    if (categoryLink && article.category) {
        categoryLink.textContent = article.category;
    }

    // Update featured image if available
    const featuredImage = document.querySelector('.article-featured-image');
    if (featuredImage && article.image) {
        featuredImage.style.backgroundImage = `url(${article.image})`;
        featuredImage.style.backgroundSize = 'cover';
        featuredImage.style.backgroundPosition = 'center';
    }

    // Update article excerpt/description
    const firstParagraph = document.querySelector('.article-content p:first-of-type');
    if (firstParagraph && article.description) {
        firstParagraph.textContent = article.description;
    }

    // Update source link
    const sourceBtn = document.querySelector('.article-source-btn');
    if (sourceBtn && article.link) {
        sourceBtn.href = article.link;
    }

    // Update read time if available
    const readTime = document.querySelector('.article-read-time');
    if (readTime && article.readTime) {
        readTime.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${article.readTime}
        `;
    }
}

// Store articles data in localStorage when on main page
if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    // This will be called from script.js after articles are loaded
    window.storeArticlesData = function (articles) {
        localStorage.setItem('articlesData', JSON.stringify(articles));
    };
}
