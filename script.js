// Function to toggle popup visibility
function togglePopup() {
    var popup = document.getElementById("cartPopup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
    document.getElementById("overlay").style.display = popup.style.display;
  }

 // Function to add item to cart
function addToCart(productName, price) {
    var cartItems = document.getElementById("cartItems");
    var cartTotal = document.getElementById("cartTotal");
    var cartCount = document.getElementById("cartCount");

    // Create a new list item for the cart
    var cartItem = document.createElement("li");
    cartItem.textContent = productName + " - R" + price.toFixed(2);

    // Add a delete button to the item
    var deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.onclick = function() {
        deleteCartItem(cartItem, price); // Pass price as an argument
    };
    cartItem.appendChild(deleteButton);

    // Append the new item to the cart
    cartItems.appendChild(cartItem);

    // Update the total price
    var total = parseFloat(cartTotal.textContent);
    total += price;
    cartTotal.textContent = total.toFixed(2);

    // Update cart count
    var count = parseInt(cartCount.textContent) + 1;
    cartCount.textContent = count;

    // Show popup
    var popup = document.getElementById("cartPopup");
    popup.style.display = "block";
    document.getElementById("overlay").style.display = "block";
}

// Function to delete an item from the cart
function deleteCartItem(item, price) {
    var cartItems = document.getElementById("cartItems");
    var cartTotal = document.getElementById("cartTotal");
    var cartCount = document.getElementById("cartCount");

    // Remove the item from the cart list
    cartItems.removeChild(item);

    // Update the total price
    var total = parseFloat(cartTotal.textContent);
    total -= price;
    cartTotal.textContent = total.toFixed(2);

    // Check if the total is NaN or less than 0, then set it to 0
    if (isNaN(total) || total < 0) {
        total = 0;
    }

    // Update cart count
    var count = parseInt(cartCount.textContent) - 1;
    cartCount.textContent = count;

    // If there are no more items in the cart, hide the popup
    if (count === 0) {
        hidePopup();
    }
}

// Retrieve cart from localStorage or initialize an empty cart
let cart = JSON.parse(localStorage.getItem("cart")) || [];

// Function to update cart count
function updateCartCount() {
    document.getElementById("cartCount").innerText = cart.length;
}

// Function to add an item to the cart
function addToCart(event) {
    let button = event.target;
    let item = {
        id: button.dataset.id,
        name: button.dataset.name,
        price: parseFloat(button.dataset.price)
    };

    cart.push(item);
    localStorage.setItem("cart", JSON.stringify(cart)); // Save to localStorage
    updateCartCount(); // Update cart icon count
    alert(item.name + " added to cart!");
}

// Attach event listeners to all Add to Cart buttons
document.querySelectorAll(".addCart-btn").forEach(button => {
    button.addEventListener("click", addToCart);
});

// Update cart count on page load
updateCartCount();


