// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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
const db = getFirestore(app);

// Track Order Function
async function trackOrder() {
    const orderId = document.getElementById('orderIdInput').value.trim();
    const errorElement = document.getElementById('trackingError');
    const orderDetails = document.getElementById('orderDetails');

    if (!orderId) {
        showError('Please enter an order ID');
        return;
    }

    try {
        // Get order from Firestore
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        
        if (!orderDoc.exists()) {
            showError('Order not found. Please check the order ID and try again.');
            return;
        }

        const order = orderDoc.data();
        
        // Show order details
        showOrderDetails(order);
        
        // Show tracking timeline
        showTrackingTimeline(order);
        
        // Show the order details section
        orderDetails.classList.add('active');
        errorElement.style.display = 'none';
    } catch (error) {
        console.error('Error tracking order:', error);
        showError('An error occurred while tracking your order. Please try again.');
    }
}

// Show Order Details
function showOrderDetails(order) {
    const orderItems = document.getElementById('orderItems');
    const orderTotal = document.getElementById('orderTotal');
    
    // Clear existing items
    orderItems.innerHTML = '';
    
    // Add order items
    order.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="order-item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-price">R${item.price.toFixed(2)} x ${item.quantity}</div>
            </div>
        `;
        orderItems.appendChild(itemElement);
    });
    
    // Update total
    orderTotal.textContent = order.total;
}

// Show Tracking Timeline
function showTrackingTimeline(order) {
    const timeline = document.getElementById('trackingTimeline');
    timeline.innerHTML = '';

    const statuses = [
        {
            status: 'pending',
            title: 'Order Placed',
            description: 'Your order has been placed successfully.'
        },
        {
            status: 'processing',
            title: 'Processing',
            description: 'We are processing your order.'
        },
        {
            status: 'shipped',
            title: 'Shipped',
            description: 'Your order has been shipped.'
        },
        {
            status: 'delivered',
            title: 'Delivered',
            description: 'Your order has been delivered.'
        }
    ];

    let currentStatusFound = false;
    statuses.forEach(status => {
        const isActive = !currentStatusFound && (
            status.status === order.status || 
            (status.status === 'pending' && order.status === 'processing') ||
            (status.status === 'pending' && order.status === 'shipped') ||
            (status.status === 'processing' && order.status === 'shipped') ||
            (status.status === 'pending' && order.status === 'delivered') ||
            (status.status === 'processing' && order.status === 'delivered') ||
            (status.status === 'shipped' && order.status === 'delivered')
        );

        if (status.status === order.status) {
            currentStatusFound = true;
        }

        const timelineItem = document.createElement('div');
        timelineItem.className = `timeline-item${isActive ? ' active' : ''}`;
        timelineItem.innerHTML = `
            <div class="timeline-content">
                <div class="timeline-date">${formatDate(order.orderDate)}</div>
                <div class="timeline-title">${status.title}</div>
                <div class="timeline-description">${status.description}</div>
            </div>
        `;
        timeline.appendChild(timelineItem);
    });
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show Error Message
function showError(message) {
    const errorElement = document.getElementById('trackingError');
    const orderDetails = document.getElementById('orderDetails');
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    orderDetails.classList.remove('active');
}

// Make functions available globally
window.trackOrder = trackOrder; 