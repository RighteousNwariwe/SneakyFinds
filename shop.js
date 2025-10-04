// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";

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

// Sample products data (fallback if Firebase is empty)
const sampleProducts = [
    {
        id: '1',
        name: 'Vintage Denim Jacket',
        description: 'Classic blue denim jacket in excellent condition',
        price: 150,
        image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'jackets',
        condition: 'excellent',
        size: 'M'
    },
    {
        id: '2',
        name: 'Retro Band T-Shirt',
        description: 'Authentic vintage band tee from the 90s',
        price: 80,
        image: 'https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'shirts',
        condition: 'good',
        size: 'L'
    },
    {
        id: '3',
        name: 'High-Waisted Jeans',
        description: 'Trendy high-waisted jeans, perfect fit',
        price: 120,
        image: 'https://images.pexels.com/photos/1598505/pexels-photo-1598505.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'pants',
        condition: 'excellent',
        size: 'S'
    },
    {
        id: '4',
        name: 'Leather Bomber Jacket',
        description: 'Genuine leather bomber jacket, timeless style',
        price: 300,
        image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'jackets',
        condition: 'good',
        size: 'L'
    },
    {
        id: '5',
        name: 'Floral Summer Dress',
        description: 'Beautiful floral dress perfect for summer',
        price: 90,
        image: 'https://images.pexels.com/photos/1536619/pexels-photo-1536619.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'dresses',
        condition: 'excellent',
        size: 'M'
    },
    {
        id: '6',
        name: 'Vintage Sneakers',
        description: 'Classic white sneakers in great condition',
        price: 110,
        image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'shoes',
        condition: 'good',
        size: '9'
    },
    {
        id: '7',
        name: 'Wool Sweater',
        description: 'Cozy wool sweater, perfect for winter',
        price: 70,
        image: 'https://images.pexels.com/photos/7679720/pexels-photo-7679720.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'shirts',
        condition: 'excellent',
        size: 'M'
    },
    {
        id: '8',
        name: 'Designer Handbag',
        description: 'Authentic designer handbag, barely used',
        price: 250,
        image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
        category: 'accessories',
        condition: 'excellent',
        size: 'One Size'
    }
];

let allProducts = [];
let filteredProducts = [];

// Load products from Firebase or use sample data
async function loadProducts() {
    const loadingMessage = document.getElementById('loadingMessage');
    const productGrid = document.getElementById('productGrid');
    
    try {
        loadingMessage.style.display = 'block';
        
        // Try to load from Firebase first
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            allProducts = [];
            querySnapshot.forEach((doc) => {
                allProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        } else {
            // Use sample data if Firebase is empty
            allProducts = sampleProducts;
        }
        
        filteredProducts = [...allProducts];
        displayProducts(filteredProducts);
        
    } catch (error) {
        console.error('Error loading products:', error);
        // Fallback to sample data
        allProducts = sampleProducts;
        filteredProducts = [...allProducts];
        displayProducts(filteredProducts);
    } finally {
        loadingMessage.style.display = 'none';
    }
}

// Display products in the grid
function displayProducts(products) {
    const productGrid = document.getElementById('productGrid');
    const noProductsMessage = document.getElementById('noProductsMessage');
    
    if (products.length === 0) {
        productGrid.innerHTML = '';
        noProductsMessage.style.display = 'block';
        return;
    }
    
    noProductsMessage.style.display = 'none';
    
    productGrid.innerHTML = products.map(product => `
        <div class="card" data-category="${product.category}" data-price="${product.price}">
            <div class="card-img">
                <div class="img">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'">
                </div>
            </div>
            <div class="card-title">${product.name}</div>
            <div class="card-subtitle">${product.description}</div>
            <div class="card-divider"></div>
            <div class="card-footer">
                <div class="card-price">R${product.price.toFixed(2)}</div>
                <button class="addCart-btn" onclick="addToCart('${product.name}', ${product.price}, '${product.image}')">
                    <i class="fas fa-cart-plus"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Filter products based on search and filters
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const priceFilter = parseFloat(document.getElementById('priceFilter').value) || Infinity;
    const sortFilter = document.getElementById('sortFilter').value;
    
    // Filter products
    filteredProducts = allProducts.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesPrice = product.price <= priceFilter;
        
        return matchesSearch && matchesCategory && matchesPrice;
    });
    
    // Sort products
    switch (sortFilter) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // Keep original order
            break;
    }
    
    displayProducts(filteredProducts);
}

// Initialize the shop page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Firebase auth state
    const auth = firebase.auth();
    auth.onAuthStateChanged((user) => {
        setCurrentUser(user);
        updateUserDisplay();
    });
    
    // Load products
    loadProducts();
    
    // Initialize cart
    updateCartUI();
    
    // Add event listeners for real-time search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterProducts, 300));
    }
});

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make functions available globally
window.filterProducts = filterProducts;
window.addToCart = addToCart;
window.togglePopup = togglePopup;
window.hidePopup = hidePopup;
window.clearCart = clearCart;
window.handleCheckout = handleCheckout;