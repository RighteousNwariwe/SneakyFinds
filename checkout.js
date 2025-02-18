// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
const auth = getAuth(app);
const db = getFirestore(app);

// Check authentication state
document.addEventListener('DOMContentLoaded', function() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            // Save the current URL for redirect after login
            sessionStorage.setItem('redirectUrl', window.location.href);
            // Redirect to login page if not authenticated
            window.location.href = 'login.html';
        } else {
            // Load cart items if authenticated
            loadCartItems();
            // Pre-fill email if available
            document.getElementById('email').value = user.email || '';
        }
    });
});

// Load cart items from localStorage
function loadCartItems() {
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    checkoutItems.innerHTML = '';
    let total = 0;
    
    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>R${item.price.toFixed(2)} x ${item.quantity}</p>
                <p>Subtotal: R${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        `;
        checkoutItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    checkoutTotal.textContent = total.toFixed(2);
}

// Handle form submission
document.getElementById('paymentForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payButton = document.querySelector('.pay-button');
    const errorMessage = document.getElementById('paymentError');
    const successMessage = document.getElementById('paymentSuccess');
    
    payButton.disabled = true;
    payButton.textContent = 'Processing...';
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
    
    try {
        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            cardName: document.getElementById('cardName').value,
            cardNumber: document.getElementById('cardNumber').value,
            expiry: document.getElementById('expiry').value,
            cvv: document.getElementById('cvv').value,
            items: JSON.parse(localStorage.getItem('cartItems')) || [],
            total: document.getElementById('checkoutTotal').textContent,
            orderDate: new Date().toISOString(),
            userId: auth.currentUser.uid
        };
        
        // Validate card details
        if (!validateCardDetails(formData)) {
            throw new Error('Invalid card details');
        }
        
        // Save order to Firestore
        const orderRef = await addDoc(collection(db, 'orders'), {
            userId: formData.userId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            items: formData.items,
            total: formData.total,
            orderDate: formData.orderDate,
            status: 'pending'
        });
        
        // Send confirmation email
        await sendOrderConfirmationEmail(formData, orderRef.id);
        
        // Clear cart
        localStorage.removeItem('cartItems');
        
        // Show success message
        successMessage.textContent = 'Order placed successfully! Check your email for confirmation.';
        successMessage.style.display = 'block';
        
        // Redirect to success page after 2 seconds
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Checkout error:', error);
        errorMessage.textContent = 'An error occurred while processing your payment. Please try again.';
        errorMessage.style.display = 'block';
        payButton.disabled = false;
        payButton.textContent = 'Pay Now';
    }
});

// Validate card details
function validateCardDetails(formData) {
    // Card number validation (16 digits)
    const cardNumberRegex = /^[0-9]{16}$/;
    if (!cardNumberRegex.test(formData.cardNumber)) {
        return false;
    }
    
    // Expiry date validation (MM/YY format)
    const expiryRegex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!expiryRegex.test(formData.expiry)) {
        return false;
    }
    
    // CVV validation (3-4 digits)
    const cvvRegex = /^[0-9]{3,4}$/;
    if (!cvvRegex.test(formData.cvv)) {
        return false;
    }
    
    return true;
}

// Function to send order confirmation email
async function sendOrderConfirmationEmail(orderData, orderId) {
    const emailData = {
        to: orderData.email,
        subject: 'Order Confirmation - SneakyFinds',
        html: `
            <h2>Thank you for your order!</h2>
            <p>Order ID: ${orderId}</p>
            <h3>Order Details:</h3>
            <ul>
                ${orderData.items.map(item => `
                    <li>${item.name} - R${item.price} x ${item.quantity}</li>
                `).join('')}
            </ul>
            <p><strong>Total: R${orderData.total}</strong></p>
            <h3>Delivery Information:</h3>
            <p>Address: ${orderData.address}</p>
            <p>Phone: ${orderData.phone}</p>
            <h3>Next Steps:</h3>
            <p>1. We will process your order within 24 hours.</p>
            <p>2. You will receive a delivery confirmation email once your order is shipped.</p>
            <p>3. For any questions, please contact us at sneakyfinds04@gmail.com</p>
        `
    };
    
    // Send email using your preferred email service
    // This is a placeholder - implement your email sending logic here
    console.log('Sending email:', emailData);
}

// Input validation and formatting
document.getElementById('cardNumber').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '').substring(0, 16);
});

document.getElementById('expiry').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '').substring(0, 4);
    if (this.value.length > 2) {
        this.value = this.value.substring(0, 2) + '/' + this.value.substring(2);
    }
});

document.getElementById('cvv').addEventListener('input', function(e) {
    this.value = this.value.replace(/\D/g, '').substring(0, 3);
}); 