// Load from localStorage or use an empty array
let cartItems = JSON.parse(localStorage.getItem("cart")) || [];

// Save cart data to localStorage
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cartItems));
}

// Render the cart items dynamically
function renderCart() {
  const container = document.getElementById("cart-items");
  container.innerHTML = "";

  if (cartItems.length === 0) {
    container.innerHTML = `<div class="p-4 text-center text-muted">Your cart is empty</div>`;
    updateSummary();
    return;
  }

  cartItems.forEach((item, index) => {
    const total = (item.price * item.quantity).toFixed(2);

    container.innerHTML += `
      <div class="list-group-item">
        <div class="row align-items-center">
          <div class="col-6 d-flex align-items-center gap-3">
            <img src="${item.image}" class="cart-img"/>
            <div>
              <h6 class="mb-0 fw-semibold">${item.name}</h6>
            </div>
          </div>

          <div class="col-2 text-center">
            <div class="d-flex justify-content-center align-items-center gap-2">
              <button class="btn btn-outline-secondary btn-sm qty-btn" onclick="updateQty(${index}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="btn btn-outline-secondary btn-sm qty-btn" onclick="updateQty(${index}, 1)">+</button>
            </div>
          </div>

          <div class="col-2 text-end fw-semibold">
            £${item.price.toFixed(2)}
          </div>

          <div class="col-2 text-end">
            <strong>£${total}</strong>
            <button class="btn btn-sm text-danger ms-2" onclick="removeItem(${index})">×</button>
          </div>
        </div>
      </div>
    `;
  });

  updateSummary();
}

// Update item quantity
function updateQty(index, change) {
  cartItems[index].quantity += change;

  if (cartItems[index].quantity < 1) {
    cartItems[index].quantity = 1;
  }

  saveCart();
  renderCart();
}

// Remove item from the cart
function removeItem(index) {
  cartItems.splice(index, 1);

  saveCart();
  renderCart();
}
// SINGLE addToCart (FIXED)
async function addToCart(productId) {
  const res = await fetch("/api/me");
  const currentUser = await res.json();

  if (!currentUser.logged_in) {
    alert("You must log in first");
    return;
  }

  const product = productArray.find(p => p.id === productId);
  if (!product) return;

  const index = cartItems.findIndex(item => item.id === product.id);

  if (index > -1) {
    cartItems[index].quantity += 1;
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  showSearchToast(`${product.name} added to cart`);
}

// CHECKOUT
async function checkout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const total = parseFloat(
    document.getElementById("total").innerText.replace("£", "")
  );

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      total,
      items: cart
    })
  });

  const data = await res.json();

  if (res.ok) {
    alert(`Order placed! You earned ${data.points_earned} points`);
    localStorage.removeItem("cart");
    renderCart();
    updateCartUI();
    if (typeof loadNavPoints === "function") {
      await loadNavPoints();
    }
  
    window.location.href = "/";
  } else {
    alert(data.error || "Checkout failed");
  }
}

// Add product to the cart (from the product page)
async function addToCart(productId, productName, productPrice, productImage) {
  const response = await fetch("/api/me");
  const currentUser = await response.json();

  if (!currentUser.logged_in) {
    alert("You need to be logged in to add items to the cart.");
    return;
  }

  const existingItemIndex = cartItems.findIndex(item => item.id === productId);

  if (existingItemIndex >= 0) {
    cartItems[existingItemIndex].quantity += 1;
  } else {
    cartItems.push({
      id: productId,
      name: productName,
      price: productPrice,
      quantity: 1,
      image: productImage
    });
  }

  saveCart();
  renderCart();
}


async function checkout() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const deliveryOption = document.getElementById("deliveryOption").value;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = deliveryOption === "pickup" ? 0 : (subtotal > 50 ? 0 : 5);
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      items: cart,
      subtotal,
      shipping,
      tax,
      total,
      deliveryOption
    })
  });

  const data = await res.json();

  if (res.ok) {
    alert(`Order placed! You earned ${data.points_earned} points`);

    localStorage.removeItem("cart");

    updateCartUI();
    if (typeof loadNavPoints === "function") {
      loadNavPoints();
    }

    window.location.href = "/";
  } else {
    alert(data.error || "Checkout failed");
  }
}
// Update summary (subtotal, shipping, tax, total)
// function updateSummary() {
//   const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   const shippingOption = document.getElementById("deliveryOption").value;
//   const shipping = shippingOption === "pickup" ? 0 : (subtotal > 50 ? 0 : 5); // Free delivery for orders above £50, else £5
//   const tax = subtotal * 0.1; // 10% tax
//   const total = subtotal + shipping + tax;

//   document.getElementById("subtotal").textContent = `£${subtotal.toFixed(2)}`;
//   document.getElementById("shipping").textContent = `£${shipping.toFixed(2)}`;
//   document.getElementById("tax").textContent = `£${tax.toFixed(2)}`;
//   document.getElementById("total").textContent = `£${total.toFixed(2)}`;
 
// }

// SUMMARY
function updateSummary() {
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingOption = document.getElementById("deliveryOption")?.value || "delivery";

  const shipping = shippingOption === "pickup" ? 0 : (subtotal > 50 ? 0 : 5);
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  document.getElementById("subtotal").textContent = `£${subtotal.toFixed(2)}`;
  document.getElementById("shipping").textContent = `£${shipping.toFixed(2)}`;
  document.getElementById("tax").textContent = `£${tax.toFixed(2)}`;
  document.getElementById("total").textContent = `£${total.toFixed(2)}`;
  document.getElementById("deliveryOption")?.addEventListener("change", updateSummary);
}

function updateQty(index, change) {
  cartItems[index].quantity += change;
  if (cartItems[index].quantity < 1) cartItems[index].quantity = 1;

  saveCart();
  renderCart();
  updateCartUI();
}

function removeItem(index) {
  cartItems.splice(index, 1);
  saveCart();
  renderCart();
  updateCartUI();
}

// CART UI COUNT
function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const el = document.getElementById("cartCount");

  if (el) {
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    el.textContent = totalItems;
  }
}

// Initial cart render
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartUI();
  loadCategories();
});