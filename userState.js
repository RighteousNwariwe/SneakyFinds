// Function to update user info display
function updateUserDisplay() {
    const userDisplayElement = document.getElementById('userDisplay');
    const loginLink = document.getElementById('loginLink');
    const logoutLink = document.getElementById('logoutLink');
    
    if (!userDisplayElement) return;

    const user = getCurrentUser();
    if (user && (user.displayName || user.email)) {
        userDisplayElement.textContent = user.displayName || user.email.split('@')[0];
        userDisplayElement.style.display = 'block';
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'inline';
    } else {
        userDisplayElement.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'none';
    }
}

// Function to set current user
function setCurrentUser(user) {
    if (user) {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString()
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
    } else {
        localStorage.removeItem('currentUser');
    }
    updateUserDisplay();
}

// Function to get current user
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    try {
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
    }
}

// Function to handle logout
async function handleLogout() {
    try {
        // Get Firebase auth instance
        const auth = firebase.auth();
        // Sign out from Firebase
        await auth.signOut();
        // Clear local storage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('cartItems');
        // Update display
        updateUserDisplay();
        // Redirect to login page
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// Function to redirect to login page
function redirectToLogin() {
    const currentPage = window.location.href;
    if (!currentPage.includes('login.html')) {
        localStorage.setItem('previousPage', currentPage);
    }
    window.location.href = 'login.html';
}

// Function to get redirect URL after login
function getRedirectUrl() {
    const previousPage = localStorage.getItem('previousPage');
    localStorage.removeItem('previousPage'); // Clear it after getting it
    return previousPage || 'index.html';
}

// Initialize auth state observer
document.addEventListener('DOMContentLoaded', function() {
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
        updateUserDisplay();
    });
}); 