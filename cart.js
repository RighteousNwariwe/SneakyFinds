// Initialize cart from localStorage or create empty cart
let cart = JSON.parse(localStorage.getItem('cartItems')) || [];

// Function to update cart UI
function updateCartUI() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartCount || !cartItems || !cartTotal) return;
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Clear existing cart items
    cartItems.innerHTML = '';
    
    // Update cart items list
    cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="cart-item-details">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">R${item.price.toFixed(2)}</span>
                    <span class="item-quantity">x${item.quantity}</span>
                </div>
                <button class="remove-item" onclick="removeFromCart('${item.name}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(li);
    });
    
    // Update total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    
    // Save cart to localStorage
    localStorage.setItem('cartItems', JSON.stringify(cart));
}

// Function to add item to cart
function addToCart(name, price, image) {
    // Check if item already exists in cart
    const existingItem = cart.find(item => item.name === name);
    
    if (existingItem) {
        // Show error notification if item already exists
        showNotification(`${name} is already in your cart. Only one of each item is available.`, 'error');
        return;
    }

    // Add new item to cart
    cart.push({
        name,
        price: parseFloat(price),
        image,
        quantity: 1
    });
    
    // Update cart UI first
    updateCartUI();
    
    // Show success message
    showNotification(`${name} added to cart!`, 'success');
    
    // Open cart popup with a slight delay for better UX
    setTimeout(() => {
        showCartPopup();
    }, 300);
}

// Function to remove item from cart
function removeFromCart(name) {
    const index = cart.findIndex(item => item.name === name);
    if (index !== -1) {
        if (cart[index].quantity > 1) {
            cart[index].quantity -= 1;
        } else {
            cart.splice(index, 1);
        }
        updateCartUI();
    }
}

// Function to clear cart
function clearCart() {
    cart = [];
    updateCartUI();
    hidePopup();
}

// Function to show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `cart-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Function to show cart popup
function showCartPopup() {
    const popup = document.getElementById('cartPopup');
    const overlay = document.getElementById('overlay');
    
    if (popup) {
        popup.style.display = 'block';
        setTimeout(() => {
            popup.classList.add('active');
        }, 10);
    }
    
    if (overlay) {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);
    }
}

// Function to hide cart popup
function hidePopup() {
    const popup = document.getElementById('cartPopup');
    const overlay = document.getElementById('overlay');
    if (popup) popup.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
}

// Function to toggle cart popup
function togglePopup() {
    const popup = document.getElementById('cartPopup');
    if (!popup) return;
    
    if (popup.style.display === 'none') {
        showCartPopup();
    } else {
        hidePopup();
    }
}

// Function to handle checkout button click
async function handleCheckout(e) {
    if (e) {
        e.preventDefault();
    }

    // Check if cart is empty
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    if (cartItems.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }

    // Check if user is logged in
    const user = getCurrentUser();
    if (!user) {
        // Store cart state and intended destination
        localStorage.setItem('pendingCheckout', 'true');
        localStorage.setItem('previousPage', 'checkout.html');
        
        // Show login prompt
        showLoginPrompt();
        return;
    }

    // Check if terms are accepted
    if (!hasAcceptedTerms()) {
        showNotification('Please accept the terms and conditions before checkout', 'error');
        document.getElementById('termsConsent').style.display = 'block';
        return;
    }

    try {
        // Hide cart popup
        hidePopup();
        
        // Store cart items in sessionStorage for checkout page
        sessionStorage.setItem('checkoutItems', JSON.stringify(cartItems));
        
        // Redirect to checkout page
        window.location.href = 'checkout.html';
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification('An error occurred during checkout. Please try again.', 'error');
    }
}

// Function to show login prompt
function showLoginPrompt() {
    // Create login prompt container
    const promptContainer = document.createElement('div');
    promptContainer.className = 'login-prompt';
    promptContainer.innerHTML = `
        <div class="login-prompt-content">
            <h3>Please Log In to Continue</h3>
            <p>You need to be logged in to proceed with checkout.</p>
            <div class="login-prompt-buttons">
                <button onclick="redirectToLogin('login')" class="login-btn">Log In</button>
                <button onclick="redirectToLogin('signup')" class="signup-btn">Sign Up</button>
            </div>
            <button onclick="closeLoginPrompt()" class="close-prompt">×</button>
        </div>
    `;
    document.body.appendChild(promptContainer);

    // Add styles for login prompt if not already present
    if (!document.getElementById('loginPromptStyles')) {
        const style = document.createElement('style');
        style.id = 'loginPromptStyles';
        style.textContent = `
            .login-prompt {
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
                animation: fadeIn 0.3s ease-out;
            }
            
            .login-prompt-content {
                background: white;
                padding: 30px;
                border-radius: 8px;
                text-align: center;
                position: relative;
                max-width: 400px;
                width: 90%;
                animation: slideDown 0.3s ease-out;
            }
            
            .login-prompt-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-top: 20px;
            }
            
            .login-prompt button {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .login-btn {
                background: #d40b0b;
                color: white;
            }
            
            .login-btn:hover {
                background: #b30909;
            }
            
            .signup-btn {
                background: #4CAF50;
                color: white;
            }
            
            .signup-btn:hover {
                background: #45a049;
            }
            
            .close-prompt {
                position: absolute;
                top: 10px;
                right: 10px;
                background: none;
                border: none;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                line-height: 30px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideDown {
                from { transform: translateY(-50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to close login prompt
function closeLoginPrompt() {
    const prompt = document.querySelector('.login-prompt');
    if (prompt) {
        prompt.style.opacity = '0';
        setTimeout(() => {
            prompt.remove();
        }, 300);
    }
}

// Function to redirect to login/signup page
function redirectToLogin(type = 'login') {
    // Save current page URL and cart state
    localStorage.setItem('previousPage', 'checkout.html');
    localStorage.setItem('pendingCheckout', 'true');
    
    // Redirect to login page with appropriate query parameter
    window.location.href = `login.html${type === 'signup' ? '?signup=true' : ''}`;
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart UI
    updateCartUI();
    
    // Add event listener for checkout buttons
    const checkoutBtns = document.querySelectorAll('.checkout-btn');
    checkoutBtns.forEach(btn => {
        btn.addEventListener('click', handleCheckout);
    });
    
    // Add event listener for cart icon
    const cartIcon = document.querySelector('.shopping-cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', togglePopup);
    }

    // Add event listener for clear cart button
    const clearCartBtn = document.querySelector('.clear-cart');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    // Add event listener for close cart button
    const closeCartBtn = document.querySelector('.close-cart');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', hidePopup);
    }

    // Add styles for notification animations
    const style = document.createElement('style');
    style.textContent = `
        .cart-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 4px;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            transition: opacity 0.3s ease-out;
            color: white;
            font-weight: 500;
        }
        
        .cart-notification.success {
            background: #4CAF50;
        }
        
        .cart-notification.error {
            background: #f44336;
        }
        
        .cart-notification.fade-out {
            opacity: 0;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .quantity-controls {
            display: none; /* Hide quantity controls since only one item is allowed */
        }
    `;
    document.head.appendChild(style);
});

// Make functions available globally
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.togglePopup = togglePopup;
window.hidePopup = hidePopup;
window.handleCheckout = handleCheckout;
window.redirectToLogin = redirectToLogin;
window.closeLoginPrompt = closeLoginPrompt; 

