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
        if (logoutLink) {
            logoutLink.style.display = 'inline';
            logoutLink.innerHTML = `<i class="fas fa-sign-out-alt"></i> Logout`;
        }
    } else {
        userDisplayElement.style.display = 'none';
        if (loginLink) {
            loginLink.style.display = 'inline';
            loginLink.innerHTML = `<i class="fas fa-sign-in-alt"></i> Login`;
        }
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
        localStorage.removeItem('cartItems');
        sessionStorage.removeItem('checkoutItems');
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
        sessionStorage.removeItem('checkoutItems');
        // Show success message
        showNotification('Successfully logged out!', 'success');
        // Update display
        updateUserDisplay();
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error during logout. Please try again.', 'error');
    }
}

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
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
document.addEventListener('DOMContentLoaded', function () {
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            color: white;
            font-weight: 500;
        }
        
        .notification.success {
            background: #4CAF50;
        }
        
        .notification.error {
            background: #f44336;
        }
        
        .notification.fade-out {
            opacity: 0;
            transition: opacity 0.3s ease-out;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);

    // Initialize Firebase auth
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
        updateUserDisplay();
    });
}); 