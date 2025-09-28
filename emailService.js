// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-functions.js";

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
const functions = getFunctions(app);

// Function to send order confirmation email
export async function sendOrderConfirmationEmail(orderData) {
    try {
        const sendEmail = httpsCallable(functions, 'sendOrderConfirmationEmail');
        const emailData = {
            to: orderData.email,
            subject: 'Order Confirmation - SneakyFinds',
            orderId: orderData.orderId,
            customerName: orderData.name,
            orderDetails: {
                items: orderData.items,
                total: orderData.total,
                address: orderData.address,
                phone: orderData.phone,
                orderDate: orderData.orderDate
            }
        };
        
        const result = await sendEmail(emailData);
        console.log('Email sent successfully:', result);
        return true;
    } catch (error) {
        console.error('Error sending confirmation email:', error);
        return false;
    }
}

// Function to send order status update email
export async function sendOrderStatusEmail(orderData, newStatus) {
    try {
        const sendEmail = httpsCallable(functions, 'sendOrderStatusEmail');
        const emailData = {
            to: orderData.email,
            subject: `Order Status Update - ${newStatus.toUpperCase()}`,
            orderId: orderData.orderId,
            customerName: orderData.name,
            status: newStatus,
            orderDetails: {
                items: orderData.items,
                total: orderData.total,
                address: orderData.address,
                orderDate: orderData.orderDate
            }
        };
        
        const result = await sendEmail(emailData);
        console.log('Status update email sent successfully:', result);
        return true;
    } catch (error) {
        console.error('Error sending status update email:', error);
        return false;
    }
}

// Function to format order items for email
function formatOrderItemsHtml(items) {
    return items.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">R${item.price.toFixed(2)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">R${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');
}

// Function to generate email template
function generateEmailTemplate(type, data) {
    const templates = {
        confirmation: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Thank you for your order!</h2>
                <p>Dear ${data.customerName},</p>
                <p>Your order has been received and is being processed.</p>
                
                <h3>Order Details:</h3>
                <p>Order ID: ${data.orderId}</p>
                <p>Order Date: ${new Date(data.orderDate).toLocaleString()}</p>
                
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 10px; text-align: left;">Image</th>
                            <th style="padding: 10px; text-align: left;">Item</th>
                            <th style="padding: 10px; text-align: left;">Price</th>
                            <th style="padding: 10px; text-align: left;">Quantity</th>
                            <th style="padding: 10px; text-align: left;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${formatOrderItemsHtml(data.items)}
                    </tbody>
                </table>
                
                <div style="margin-top: 20px; text-align: right;">
                    <strong>Total: R${data.total}</strong>
                </div>
                
                <div style="margin-top: 20px;">
                    <h3>Delivery Information:</h3>
                    <p>Delivery Address: ${data.address}</p>
                    <p>Contact Number: ${data.phone}</p>
                </div>
                
                <div style="margin-top: 20px;">
                    <p>You can track your order status here: <a href="track-order.html?orderId=${data.orderId}">Track Order</a></p>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p>If you have any questions, please contact us at sneakyfinds04@gmail.com</p>
                </div>
            </div>
        `,
        status: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Order Status Update</h2>
                <p>Dear ${data.customerName},</p>
                <p>Your order status has been updated to: <strong>${data.status.toUpperCase()}</strong></p>
                
                <div style="margin-top: 20px;">
                    <p>Order ID: ${data.orderId}</p>
                    <p>You can track your order here: <a href="track-order.html?orderId=${data.orderId}">Track Order</a></p>
                </div>
                
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
                    <p>If you have any questions, please contact us at sneakyfinds04@gmail.com</p>
                </div>
            </div>
        `
    };
    
    return templates[type];
} 