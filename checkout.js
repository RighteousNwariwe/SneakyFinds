// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-storage.js";

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
const storage = getStorage(app);

// Generate unique order ID
function generateOrderId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `SF-${timestamp}-${randomStr}`.toUpperCase();
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
            orderId: generateOrderId(),
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            cardName: document.getElementById('cardName').value,
            cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
            expiry: document.getElementById('expiry').value,
            cvv: document.getElementById('cvv').value,
            items: JSON.parse(sessionStorage.getItem('checkoutItems')) || JSON.parse(localStorage.getItem('cartItems')) || [],
            total: document.getElementById('checkoutTotal').textContent,
            orderDate: new Date().toISOString(),
            userId: auth.currentUser?.uid || 'guest',
            status: 'pending'
        };

        // Validate form data
        if (!validateFormData(formData)) {
            throw new Error('Please fill in all required fields correctly.');
        }
        
        // Validate payment details
        if (!validatePaymentDetails(formData)) {
            throw new Error('Please enter valid payment details.');
        }
        
        // Process payment (simulate payment processing)
        await processPayment(formData);
        
        // Save order to Firestore
        const orderRef = await addDoc(collection(db, 'orders'), {
            orderId: formData.orderId,
            userId: formData.userId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            items: formData.items,
            total: formData.total,
            orderDate: formData.orderDate,
            status: formData.status,
            paymentMethod: 'card',
            paymentStatus: 'completed'
        });
        
        // Send confirmation email
        await sendOrderConfirmationEmail({
            ...formData,
            orderId: formData.orderId,
            orderRef: orderRef.id
        });
        
        // Clear cart and checkout items
        localStorage.removeItem('cartItems');
        sessionStorage.removeItem('checkoutItems');
        
        // Show success message
        successMessage.textContent = 'Order placed successfully! You will receive a confirmation email shortly.';
        successMessage.style.display = 'block';
        
        // Redirect to success page or order tracking
        setTimeout(() => {
            window.location.href = `track-order.html?orderId=${orderRef.id}`;
        }, 2000);
        
    } catch (error) {
        console.error('Checkout error:', error);
        errorMessage.textContent = error.message || 'An error occurred while processing your payment. Please try again.';
        errorMessage.style.display = 'block';
        payButton.disabled = false;
        payButton.textContent = 'Pay Now';
    }
});

// Validate form data
function validateFormData(formData) {
    const required = ['name', 'email', 'phone', 'address', 'cardName', 'cardNumber', 'expiry', 'cvv'];
    return required.every(field => formData[field] && formData[field].trim() !== '');
}
    try {
        // Create checkout
        const checkout = await shopifyClient.checkout.create();
        
        // Add line items to checkout
        const lineItems = formData.items.map(item => ({
            variantId: item.variantId, // You'll need to store Shopify variant IDs with your products
            quantity: item.quantity,
            customAttributes: [
                { key: 'orderId', value: formData.orderId }
            ]
        }));
        
        // Update checkout with line items and customer info
        const updatedCheckout = await shopifyClient.checkout.addLineItems(checkout.id, lineItems);
        
        // Update customer information
        await shopifyClient.checkout.updateEmail(checkout.id, formData.email);
        await shopifyClient.checkout.updateShippingAddress(checkout.id, {
            address1: formData.address,
            phone: formData.phone,
            firstName: formData.name.split(' ')[0],
            lastName: formData.name.split(' ').slice(1).join(' '),
            city: 'Vaal', // You might want to make these fields dynamic
            province: 'Gauteng',
            country: 'South Africa',
            zip: '1900'
        });
        
        return updatedCheckout;
    } catch (error) {
        console.error('Error creating Shopify checkout:', error);
        throw error;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            localStorage.setItem('previousPage', window.location.href);
            window.location.href = 'login.html';
            return;
        }
        
        // Load user data from Firestore
        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                document.getElementById('name').value = userData.displayName || user.displayName || '';
                document.getElementById('phone').value = userData.phone || userData.phoneNumber || '';
                document.getElementById('address').value = userData.location || '';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
        
        const pendingCheckout = localStorage.getItem('pendingCheckout');
        if (pendingCheckout) {
            localStorage.removeItem('pendingCheckout');
            loadCartItems();
        } else {
            loadCartItems();
        }
        
        document.getElementById('email').value = user.email || '';
    });
});

// Function to upload image to Firebase Storage
async function uploadImageToStorage(imageFile, path) {
    try {
        const imageRef = ref(storage, path);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw error;
    }
}

// Load cart items from sessionStorage
function loadCartItems() {
    // Try to get items from sessionStorage first (items selected for checkout)
    let cartItems = JSON.parse(sessionStorage.getItem('checkoutItems')) || [];
    
    // If no items in sessionStorage, try localStorage (fallback)
    if (cartItems.length === 0) {
        cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    }
    
    const checkoutItems = document.getElementById('checkoutItems');
    const checkoutTotal = document.getElementById('checkoutTotal');
    
    // Redirect if cart is empty
    if (cartItems.length === 0) {
        window.location.href = 'shop.html';
        return;
    }
    
    checkoutItems.innerHTML = '';
    let total = 0;
    
    cartItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width: 80px; height: 80px; object-fit: cover;">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p class="item-price">R${item.price.toFixed(2)} x ${item.quantity}</p>
                <p class="item-subtotal">Subtotal: R${(item.price * item.quantity).toFixed(2)}</p>
            </div>
        `;
        checkoutItems.appendChild(itemElement);
        total += item.price * item.quantity;
    });
    
    checkoutTotal.textContent = total.toFixed(2);

}

// Function to send order confirmation email
async function sendOrderConfirmationEmail(orderData) {
    const emailData = {
        to: orderData.email,
        subject: 'Order Confirmation - SneakyFinds',
        html: `
            <h2>Thank you for your order!</h2>
            <p>Order ID: ${orderData.orderId}</p>
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
            <p>3. Track your order: <a href="${window.location.origin}/track-order.html?orderId=${orderData.orderRef}">Track Order</a></p>
            <p>4. For any questions, please contact us at sneakyfinds04@gmail.com</p>
        `
    };
    
    // In a real application, you would send this via your email service
    console.log('Sending email:', emailData);
    
    // For demo purposes, show a success message
    return Promise.resolve({ success: true });
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