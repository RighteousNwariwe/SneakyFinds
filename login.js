// Import Firebase functions
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, verifyPasswordResetCode, confirmPasswordReset, sendEmailVerification } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBYLJHGw8qRya0Y9fF7dy7pzpYjx15pPw0",
    authDomain: "sneakyfinds-5b308.firebaseapp.com",
    databaseURL: "https://sneakyfinds-5b308-default-rtdb.firebaseio.com",
    projectId: "sneakyfinds-5b308",
    storageBucket: "sneakyfinds-5b308.firebasestorage.app",
    messagingSenderId: "228153574320",
    appId: "1:228153574320:web:0fbc2743ab4287b0634c75",
    measurementId: "G-NZ17V7Q1SQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Function to save user details to Firestore
async function saveUserDetails(user, additionalData = {}) {
    try {
        if (!user || !user.uid) {
            throw new Error('Invalid user data');
        }

        const userRef = doc(db, 'users', user.uid);
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || additionalData.displayName || user.email.split('@')[0],
            phoneNumber: user.phoneNumber || additionalData.phoneNumber || '',
            location: additionalData.location || '',
            lastLogin: new Date().toISOString(),
            createdAt: additionalData.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            photoURL: user.photoURL || '',
            provider: user.providerData[0]?.providerId || 'password'
        };

        // Check if user already exists
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
            // Update existing user
            await setDoc(userRef, {
                ...userData,
                createdAt: userDoc.data().createdAt // Preserve original creation date
            }, { merge: true });
        } else {
            // Create new user
            await setDoc(userRef, userData);
        }

        return userData;
    } catch (error) {
        console.error('Error saving user details:', error);
        throw error;
    }
}

// Function to handle successful login
async function handleLoginSuccess(user, additionalData = {}) {
    try {
        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            await auth.signOut();
            showError(document.getElementById('loginError'), 'Account not registered. Please sign up first.');
            return;
        }

        // Check if email is verified
        if (!user.emailVerified && user.providerData[0].providerId === 'password') {
            await auth.signOut();
            showError(document.getElementById('loginError'), 'Please verify your email before logging in.');
            // Offer to resend verification email
            const resendLink = document.createElement('a');
            resendLink.href = '#';
            resendLink.textContent = 'Resend verification email';
            resendLink.onclick = async (e) => {
                e.preventDefault();
                await sendVerificationEmail(user);
            };
            document.getElementById('loginError').appendChild(document.createElement('br'));
            document.getElementById('loginError').appendChild(resendLink);
            return;
        }

        // Get the previous page URL from localStorage
        const previousPage = localStorage.getItem('previousPage');
        const pendingCheckout = localStorage.getItem('pendingCheckout');

        // Save additional user details if provided
        if (Object.keys(additionalData).length > 0) {
            await saveUserDetails(user, additionalData);
        }

        // Show success notification
        showNotification('Login successful!', 'success');

        // Determine redirect URL
        let redirectUrl = 'index.html';
        if (pendingCheckout === 'true') {
            redirectUrl = 'checkout.html';
            localStorage.removeItem('pendingCheckout');
        } else if (previousPage && !previousPage.includes('login.html')) {
            redirectUrl = previousPage;
            localStorage.removeItem('previousPage');
        }

        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = redirectUrl;
        }, 1500);

    } catch (error) {
        console.error('Login error:', error);
        showError(document.getElementById('loginError'), getErrorMessage(error));
    }
}

// Function to show additional details prompt
function showAdditionalDetailsPrompt(userId) {
    const promptContainer = document.createElement('div');
    promptContainer.className = 'details-prompt';
    promptContainer.innerHTML = `
        <div class="details-prompt-content">
            <h3>Complete Your Profile</h3>
            <p>Please provide additional details to complete your registration.</p>
            <form id="additionalDetailsForm">
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" required pattern="[0-9]{10}" placeholder="0123456789">
                </div>
                <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" required placeholder="Your delivery address">
                </div>
                <button type="submit" class="submit-btn">Save Details</button>
            </form>
        </div>
    `;
    document.body.appendChild(promptContainer);

    // Add styles for the prompt
    const style = document.createElement('style');
    style.textContent = `
        .details-prompt {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }
        
        .details-prompt-content {
            background: white;
            padding: 30px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
        }
        
        .form-group input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .submit-btn {
            background: #d40b0b;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            width: 100%;
            margin-top: 10px;
        }
        
        .submit-btn:hover {
            background: #b30909;
        }
    `;
    document.head.appendChild(style);

    // Handle form submission
    document.getElementById('additionalDetailsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('phone').value;
        const location = document.getElementById('location').value;

        try {
            await saveUserDetails({ uid: userId }, {
                phoneNumber: phone,
                location: location
            });
            
            promptContainer.remove();
            
            // Redirect based on pending checkout
            const pendingCheckout = localStorage.getItem('pendingCheckout');
            const previousPage = localStorage.getItem('previousPage');
            
            if (pendingCheckout === 'true' && previousPage === 'checkout.html') {
                window.location.href = 'checkout.html';
            } else {
                window.location.href = previousPage || 'index.html';
            }
            
            localStorage.removeItem('pendingCheckout');
            localStorage.removeItem('previousPage');
        } catch (error) {
            console.error('Error saving additional details:', error);
            showNotification('Error saving details. Please try again.', 'error');
        }
    });
}

// Function to handle Google sign-in
async function handleGoogleSignIn() {
    try {
        const provider = new GoogleAuthProvider();
        provider.addScope('email');
        provider.addScope('profile');
        
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        
        // Get additional user info
        const user = result.user;
        await handleLoginSuccess(user, {
            provider: 'google.com',
            displayName: user.displayName,
            photoURL: user.photoURL
        });
    } catch (error) {
        console.error('Google sign-in error:', error);
        showNotification(getErrorMessage(error), 'error');
    }
}

// Function to switch between login and signup tabs
function switchTab(tab) {
    try {
        const loginTab = document.querySelector('.auth-tab:first-child');
        const signupTab = document.querySelector('.auth-tab:last-child');
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        
        if (!loginTab || !signupTab || !loginForm || !signupForm) {
            throw new Error('Required elements not found');
        }

        // Remove active class from all tabs and forms
        [loginTab, signupTab].forEach(t => t.classList.remove('active'));
        [loginForm, signupForm].forEach(f => f.classList.remove('active'));

        // Add active class to selected tab and form
        if (tab === 'login') {
            loginTab.classList.add('active');
            loginForm.classList.add('active');
        } else {
            signupTab.classList.add('active');
            signupForm.classList.add('active');
        }

        // Clear any error messages
        document.querySelectorAll('.error-message').forEach(el => {
            el.style.display = 'none';
            el.textContent = '';
        });

        // Reset forms
        loginForm.reset();
        signupForm.reset();
    } catch (error) {
        console.error('Error switching tabs:', error);
        showNotification('Error switching between login and signup', 'error');
    }
}

// Function to handle password reset
async function handlePasswordReset(email) {
    try {
        if (!email) {
            throw { code: 'auth/missing-email' };
        }

        // Send password reset email
        await sendPasswordResetEmail(auth, email);
        
        // Show success message
        showNotification('Password reset email sent! Please check your inbox.', 'success');
        
        // Hide the reset modal if it exists
        const resetModal = document.querySelector('.modal');
        if (resetModal) {
            resetModal.style.display = 'none';
        }
        
        // Clear the email input
        const emailInput = document.getElementById('resetEmail');
        if (emailInput) {
            emailInput.value = '';
        }

    } catch (error) {
        console.error('Password reset error:', error);
        const errorElement = document.getElementById('resetPasswordError');
        if (errorElement) {
            showError(errorElement, getErrorMessage(error));
        } else {
            showNotification(getErrorMessage(error), 'error');
        }
    }
}

// Function to handle password reset confirmation
async function handlePasswordResetConfirmation(oobCode, newPassword) {
    try {
        // Verify the password reset code
        await verifyPasswordResetCode(auth, oobCode);
        
        // Confirm the password reset
        await confirmPasswordReset(auth, oobCode, newPassword);
        
        showNotification('Password has been reset successfully! You can now login.', 'success');
        
        // Switch to login tab after successful reset
        switchTab('login');
        
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
        console.error('Password reset confirmation error:', error);
        showNotification(getErrorMessage(error), 'error');
    }
}

// Function to check URL parameters for reset mode
function checkResetMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const oobCode = urlParams.get('oobCode');

    if (mode === 'resetPassword' && oobCode) {
        showNewPasswordForm(oobCode);
    } else if (urlParams.get('signup') === 'true') {
        switchTab('signup');
    }
}

// Function to show new password form
function showNewPasswordForm(oobCode) {
    const resetContainer = document.createElement('div');
    resetContainer.className = 'reset-password-container';
    resetContainer.innerHTML = `
        <div class="reset-password-content">
            <h3>Reset Your Password</h3>
            <form id="newPasswordForm">
                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <input type="password" id="newPassword" required minlength="6">
                </div>
                <div class="form-group">
                    <label for="confirmNewPassword">Confirm New Password</label>
                    <input type="password" id="confirmNewPassword" required minlength="6">
                </div>
                <div id="resetPasswordError" class="error-message"></div>
                <button type="submit" class="auth-button">Reset Password</button>
            </form>
        </div>
    `;

    // Hide other forms
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'none';

    // Add the reset form to the page
    document.querySelector('.auth-container').appendChild(resetContainer);

    // Handle form submission
    document.getElementById('newPasswordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmNewPassword').value;
        const errorElement = document.getElementById('resetPasswordError');

        if (newPassword !== confirmPassword) {
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.display = 'block';
            return;
        }

        if (newPassword.length < 6) {
            errorElement.textContent = 'Password must be at least 6 characters long';
            errorElement.style.display = 'block';
            return;
        }

        try {
            await handlePasswordResetConfirmation(oobCode, newPassword);
            resetContainer.remove();
            if (loginForm) loginForm.style.display = 'block';
        } catch (error) {
            errorElement.textContent = getErrorMessage(error);
            errorElement.style.display = 'block';
        }
    });
}

// Function to send verification email
async function sendVerificationEmail(user) {
    try {
        await sendEmailVerification(user);
        showNotification('Verification email sent! Please check your inbox.', 'success');
    } catch (error) {
        console.error('Error sending verification email:', error);
        showNotification('Failed to send verification email. Please try again.', 'error');
    }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Check for reset password mode
        checkResetMode();

        // Add click handlers for tabs
        const loginTab = document.querySelector('.auth-tab:first-child');
        const signupTab = document.querySelector('.auth-tab:last-child');
        
        if (loginTab) {
            loginTab.addEventListener('click', () => switchTab('login'));
        }
        if (signupTab) {
            signupTab.addEventListener('click', () => switchTab('signup'));
        }

        // Add click handler for the "Don't have an account?" divider
        const signupDivider = document.querySelector('.divider span');
        if (signupDivider && signupDivider.textContent.includes("Don't have an account?")) {
            signupDivider.parentElement.style.cursor = 'pointer';
            signupDivider.parentElement.addEventListener('click', () => switchTab('signup'));
        }

        // Add click handler for Google sign-in button
        const googleButton = document.querySelector('.social-button.google');
        if (googleButton) {
            googleButton.addEventListener('click', handleGoogleSignIn);
        }

        // Initialize forms
        initializeForms();

        // Add click handler for "Forgot Password?" link
        const forgotPasswordLink = document.querySelector('.forgot-password');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                showResetPasswordModal();
            });
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});

// Initialize form handlers
function initializeForms() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const submitButton = loginForm.querySelector('button[type="submit"]');
            const errorElement = document.getElementById('loginError');

            if (!email || !password) {
                showError(errorElement, 'Please fill in all fields');
                return;
            }

            try {
                submitButton.disabled = true;
                submitButton.textContent = 'Logging in...';
                errorElement.style.display = 'none';

                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                await handleLoginSuccess(userCredential.user, { provider: 'password' });
            } catch (error) {
                console.error('Login error:', error);
                showError(errorElement, getErrorMessage(error));
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        });
    }

    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('signupEmail').value.trim();
            const phone = document.getElementById('signupPhone').value.trim();
            const location = document.getElementById('signupLocation').value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('signupConfirmPassword').value;
            
            const submitButton = signupForm.querySelector('button[type="submit"]');
            const errorElement = document.getElementById('signupError');
            const successElement = document.getElementById('signupSuccess');

            try {
                // Validate all fields
                if (!email || !phone || !location || !password || !confirmPassword) {
                    throw { code: 'auth/missing-fields' };
                }

                // Reset messages
                errorElement.style.display = 'none';
                successElement.style.display = 'none';

                // Validate password match
                if (password !== confirmPassword) {
                    throw { code: 'auth/passwords-dont-match' };
                }

                // Validate password length
                if (password.length < 6) {
                    throw { code: 'auth/weak-password' };
                }

                // Validate phone number format
                const phoneRegex = /^[0-9]{10}$/;
                if (!phoneRegex.test(phone)) {
                    throw { code: 'auth/invalid-phone' };
                }

                submitButton.disabled = true;
                submitButton.textContent = 'Creating account...';

                // Create user account
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                console.log('User account created:', userCredential.user.uid);

                try {
                    // Send verification email
                    await sendVerificationEmail(userCredential.user);
                    console.log('Verification email sent');

                    // Save additional user data
                    await saveUserDetails(userCredential.user, {
                        phoneNumber: phone,
                        location: location,
                        createdAt: new Date().toISOString(),
                        emailVerified: false
                    });
                    console.log('User details saved');

                    // Show success message
                    successElement.textContent = 'Account created successfully! Please check your email for verification.';
                    successElement.style.display = 'block';
                    errorElement.style.display = 'none';

                    // Switch to login tab after showing success message
                    setTimeout(() => {
                        switchTab('login');
                        showNotification('Please verify your email before logging in.', 'success');
                    }, 1500);

                } catch (innerError) {
                    console.error('Error during signup process:', innerError);
                    // If there's an error after user creation, still show partial success
                    showError(errorElement, 'Account created but there was an issue with some additional setup. You can still proceed to login.');
                    setTimeout(() => {
                        switchTab('login');
                    }, 1500);
                }

            } catch (error) {
                console.error('Signup error:', error);
                showError(errorElement, getErrorMessage(error));
                submitButton.disabled = false;
                submitButton.textContent = 'Sign Up';
            }
        });
    }
}

// Helper function to show error messages
function showError(element, message) {
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
    }
}

// Update error message handling
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/user-not-found':
            return 'No account found with this email. Please sign up first.';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/email-already-in-use':
            return 'An account already exists with this email.';
        case 'auth/operation-not-allowed':
            return 'Email/password accounts are not enabled. Please contact support.';
        case 'auth/weak-password':
            return 'Password should be at least 6 characters.';
        case 'auth/missing-fields':
            return 'Please fill in all required fields.';
        case 'auth/passwords-dont-match':
            return 'Passwords do not match.';
        case 'auth/invalid-phone':
            return 'Please enter a valid phone number.';
        case 'auth/missing-email':
            return 'Please enter your email address.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please try again later.';
        case 'auth/email-not-verified':
            return 'Please verify your email before logging in.';
        case 'auth/verification-email-failed':
            return 'Failed to send verification email. Please try again.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// Show notification function
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add styles if not already present
    if (!document.getElementById('notificationStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationStyles';
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
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
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
    }

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Function to show reset password modal
function showResetPasswordModal() {
    const modalHtml = `
        <div class="modal">
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h3>Reset Password</h3>
                <p>Enter your email address to receive a password reset link.</p>
                <form id="resetPasswordForm">
                    <div class="form-group">
                        <input type="email" id="resetEmail" placeholder="Enter your email" required>
                    </div>
                    <div id="resetPasswordError" class="error-message"></div>
                    <button type="submit" class="auth-button">Send Reset Link</button>
                </form>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.querySelector('.modal');
    const closeBtn = document.querySelector('.modal-close');
    const resetForm = document.getElementById('resetPasswordForm');

    // Show modal
    modal.style.display = 'block';

    // Close modal when clicking the close button
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        modal.remove();
    }

    // Close modal when clicking outside
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
            modal.remove();
        }
    }

    // Handle form submission
    resetForm.onsubmit = async function(e) {
        e.preventDefault();
        const email = document.getElementById('resetEmail').value.trim();
        await handlePasswordReset(email);
    }
}

// Make functions available globally
window.switchTab = switchTab;
window.handleGoogleSignIn = handleGoogleSignIn;
window.handlePasswordReset = handlePasswordReset;
window.showResetPasswordModal = showResetPasswordModal; 