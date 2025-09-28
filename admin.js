// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
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

// Check if user is admin
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }

    // Check if user is admin
    const userDoc = await getDocs(collection(db, 'users'), where('uid', '==', user.uid));
    if (!userDoc.exists() || !userDoc.data().isAdmin) {
        window.location.href = 'index.html';
        return;
    }

    // Load dashboard data
    loadDashboardData();
    loadProducts();
    loadOrders();
    loadCustomers();
});

// Show/Hide sections
function showSection(sectionName) {
    document.querySelectorAll('.admin-section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.admin-nav button').forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(`${sectionName}Section`).classList.add('active');
    document.querySelector(`button[onclick="showSection('${sectionName}')"]`).classList.add('active');
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        // Get orders
        const orders = await getDocs(collection(db, 'orders'));
        const products = await getDocs(collection(db, 'products'));
        
        // Update stats
        document.getElementById('totalOrders').textContent = orders.size;
        document.getElementById('totalProducts').textContent = products.size;

        // Process data for charts
        const salesData = processOrdersForChart(orders);
        const productData = processProductsForChart(products, orders);

        // Create charts
        createSalesChart(salesData);
        createProductsChart(productData);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Process orders for chart
function processOrdersForChart(orders) {
    const salesByMonth = {};
    orders.forEach(order => {
        const date = new Date(order.data().orderDate);
        const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
        salesByMonth[monthYear] = (salesByMonth[monthYear] || 0) + parseFloat(order.data().total);
    });
    return salesByMonth;
}

// Process products for chart
function processProductsForChart(products, orders) {
    const productSales = {};
    orders.forEach(order => {
        order.data().items.forEach(item => {
            productSales[item.name] = (productSales[item.name] || 0) + item.quantity;
        });
    });
    return productSales;
}

// Create Sales Chart
function createSalesChart(data) {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Sales (R)',
                data: Object.values(data),
                borderColor: '#d40b0b',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Create Products Chart
function createProductsChart(data) {
    const ctx = document.getElementById('productsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: 'Units Sold',
                data: Object.values(data),
                backgroundColor: '#d40b0b'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Product Management
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    try {
        submitButton.disabled = true;
        
        // Upload image
        const imageFile = document.getElementById('productImage').files[0];
        const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(imageRef, imageFile);
        const imageUrl = await getDownloadURL(snapshot.ref);

        // Add product to Firestore
        await addDoc(collection(db, 'products'), {
            name: form.productName.value,
            description: form.productDescription.value,
            price: parseFloat(form.productPrice.value),
            image: imageUrl,
            createdAt: new Date().toISOString()
        });

        // Reset form and reload products
        form.reset();
        loadProducts();
        showNotification('Product added successfully!', 'success');
    } catch (error) {
        console.error('Error adding product:', error);
        showNotification('Error adding product. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
    }
});

// Load Products
async function loadProducts() {
    try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const tableBody = document.getElementById('productTableBody');
        tableBody.innerHTML = '';

        querySnapshot.forEach(doc => {
            const product = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><img src="${product.image}" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;"></td>
                <td>${product.name}</td>
                <td>R${product.price.toFixed(2)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="editProduct('${doc.id}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteProduct('${doc.id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showNotification('Error loading products.', 'error');
    }
}

// Load Orders
async function loadOrders() {
    try {
        const querySnapshot = await getDocs(collection(db, 'orders'));
        const tableBody = document.getElementById('orderTableBody');
        tableBody.innerHTML = '';

        querySnapshot.forEach(doc => {
            const order = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${order.name}</td>
                <td>${new Date(order.orderDate).toLocaleDateString()}</td>
                <td>R${order.total}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="updateOrderStatus('${doc.id}')">Update Status</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Error loading orders.', 'error');
    }
}

// Load Customers
async function loadCustomers() {
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const tableBody = document.getElementById('customerTableBody');
        tableBody.innerHTML = '';

        for (const doc of querySnapshot.docs) {
            const user = doc.data();
            const orders = await getDocs(collection(db, 'orders'), where('userId', '==', doc.id));
            const totalSpent = orders.docs.reduce((sum, order) => sum + parseFloat(order.data().total), 0);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.displayName || 'N/A'}</td>
                <td>${user.email}</td>
                <td>${orders.size}</td>
                <td>R${totalSpent.toFixed(2)}</td>
                <td>
                    <button class="action-btn edit-btn" onclick="viewCustomerDetails('${doc.id}')">View Details</button>
                </td>
            `;
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading customers:', error);
        showNotification('Error loading customers.', 'error');
    }
}

// Update Order Status
async function updateOrderStatus(orderId) {
    const status = prompt('Enter new status (pending/processing/shipped/delivered):');
    if (!status) return;

    try {
        // Get the order data first
        const orderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!orderDoc.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderDoc.data();
        
        // Update the status
        await updateDoc(doc(db, 'orders', orderId), {
            status: status.toLowerCase()
        });

        // Send status update email
        await sendOrderStatusEmail({
            ...orderData,
            orderId: orderId,
            status: status.toLowerCase()
        });

        loadOrders();
        showNotification('Order status updated and email sent successfully!', 'success');
    } catch (error) {
        console.error('Error updating order status:', error);
        showNotification('Error updating order status.', 'error');
    }
}

// Delete Product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
        await deleteDoc(doc(db, 'products', productId));
        loadProducts();
        showNotification('Product deleted successfully!', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Error deleting product.', 'error');
    }
}

// Show Notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions available globally
window.showSection = showSection;
window.updateOrderStatus = updateOrderStatus;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;
window.viewCustomerDetails = viewCustomerDetails; 