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
function handleCheckout() {
    // Check if user is logged in
    const auth = firebase.auth();
    const user = auth.currentUser;
    
    if (!user) {
        // Save current URL for redirect after login
        sessionStorage.setItem('redirectUrl', 'checkout.html');
        // Redirect to login page
        window.location.href = 'login.html';
        return;
    }
    
    // If user is logged in, proceed to checkout
    window.location.href = 'checkout.html';
}

// Initialize cart when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart UI
    updateCartUI();
    
    // Add event listener for checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleCheckout();
        });
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
    
    // Add event listener for cart icon
    const cartIcon = document.querySelector('.shopping-cart');
    if (cartIcon) {
        cartIcon.addEventListener('click', togglePopup);
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