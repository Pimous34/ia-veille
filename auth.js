// Authentication page functions

// Show login form
function showLoginForm() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'block';
    switchToLogin();
}

// Show signup form
function showSignupForm() {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('formScreen').style.display = 'block';
    switchToSignup();
}

// Switch to login tab
function switchToLogin() {
    document.getElementById('loginToggle').classList.add('active');
    document.getElementById('signupToggle').classList.remove('active');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('formTitle').textContent = 'Bienvenue';
}

// Switch to signup tab
function switchToSignup() {
    document.getElementById('loginToggle').classList.remove('active');
    document.getElementById('signupToggle').classList.add('active');
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.getElementById('formTitle').textContent = 'Créer un Compte';
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    // Add your login logic here
    alert('Connexion en cours...');
    // Redirect to home page after login
    // window.location.href = 'index.html';
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();
    // Add your signup logic here
    alert('Création de compte en cours...');
    // Redirect to home page after signup
    // window.location.href = 'index.html';
}

// Social login functions
function loginWithGoogle() {
    alert('Connexion avec Google...');
    // Add Google OAuth logic here
}

function loginWithFacebook() {
    alert('Connexion avec Facebook...');
    // Add Facebook OAuth logic here
}

function loginWithApple() {
    alert('Connexion avec Apple...');
    // Add Apple OAuth logic here
}
