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
async function handleLogin(event) {
    event.preventDefault();
    
    if (typeof _supabase === 'undefined') {
        alert('Erreur: Supabase non initialisé. Vérifiez la configuration.');
        return;
    }

    const email = event.target.querySelector('input[type="email"]').value;
    const password = event.target.querySelector('input[type="password"]').value;
    
    try {
        const { data, error } = await _supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) throw error;

        console.log('Connexion réussie:', data);
        window.location.href = 'index.html';
        
    } catch (error) {
        console.error('Erreur Login:', error);
        alert('Erreur de connexion: ' + error.message);
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();

    if (typeof _supabase === 'undefined') {
        alert('Erreur: Supabase non initialisé. Vérifiez la configuration.');
        return;
    }
    
    const inputs = event.target.querySelectorAll('input');
    const name = inputs[0].value;
    const email = inputs[1].value;
    const password = inputs[2].value;
    const confirmPassword = inputs[3].value;

    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    try {
        const { data, error } = await _supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });

        if (error) throw error;

        alert('Inscription réussie ! Veuillez vérifier votre email pour confirmer votre compte.');
        
    } catch (error) {
        console.error('Erreur Signup:', error);
        alert('Erreur d\'inscription: ' + error.message);
    }
}

// Social login functions
async function loginWithGoogle() {
    if (typeof _supabase === 'undefined') {
        alert('Erreur: Supabase non initialisé. Vérifiez la configuration.');
        return;
    }
    
    try {
        const { data, error } = await _supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/index.html'
            }
        });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Erreur Google Auth:', error);
        alert('Erreur lors de la connexion avec Google: ' + error.message);
    }
}

function loginWithFacebook() {
    alert('Connexion avec Facebook (Non implémenté)');
    // Add Facebook OAuth logic here
}

function loginWithApple() {
    alert('Connexion avec Apple (Non implémenté)');
    // Add Apple OAuth logic here
}
