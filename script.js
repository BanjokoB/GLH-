// CATEGORIES
function loadCategories() {
  fetch("/api/categories")
    .then(res => res.json())
    .then(categories => {
      const container = document.getElementById("categories");
      if (!container) return;

      container.innerHTML = "";

      // Get user role for admin controls
      fetch("/api/me")
        .then(res => res.json())
        .then(currentUser => {

          categories.forEach(cat => {
            container.innerHTML += `
              <div class="col-6 col-md-4 col-lg-2" id="category-${cat.id}">
                <div class="border rounded text-center p-3 bg-white h-100">
                  <img src="${cat.image}" style="width:80px;height:80px;object-fit:cover;">
                  <p class="mt-2 mb-1 fw-semibold">${cat.name}</p>

                  ${
                    currentUser.role === "admin"
                      ? `<button class="btn btn-danger btn-sm mt-2" onclick="deleteCategory(${cat.id})">
                          Delete
                        </button>`
                      : ""
                  }
                </div>
              </div>
            `;
          });

        });
    })
    .catch(err => console.error("Failed to load categories:", err));
}

// Delete category function
async function deleteCategory(id) {
  const confirmDelete = confirm("Delete this category?");
  if (!confirmDelete) return;

  const res = await fetch(`/api/categories/${id}`, {
    method: "DELETE"
  });

  await res.json();

  const el = document.getElementById(`category-${id}`);
  if (el) el.remove();

  showSearchToast("Category deleted");
}

async function deleteProduct(id) {
  const confirmDelete = confirm("Delete this product?");
  if (!confirmDelete) return;

  const res = await fetch(`/api/products/${id}`, {
    method: "DELETE"
  });

  await res.json();

  const el = document.getElementById(`product-${id}`);
  if (el) el.remove();

  showSearchToast("Product deleted");
}
// CART STATE

let cartItems = JSON.parse(localStorage.getItem("cart")) || [];

// Save cart
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cartItems));
}

// RENDER CART
function renderCart() {
  cartItems = JSON.parse(localStorage.getItem("cart")) || [];

  const container = document.getElementById("cart-items");
  if (!container) return;

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
              <button class="btn btn-outline-secondary btn-sm" onclick="updateQty(${index}, -1)">-</button>
              <span>${item.quantity}</span>
              <button class="btn btn-outline-secondary btn-sm" onclick="updateQty(${index}, 1)">+</button>
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

// CART ACTIONS
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

  const deliveryOption = document.getElementById("deliveryOption")?.value || "delivery";

  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: cart,
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
    window.location.href = "/orderSuccess";
  } else {
    alert(data.error || "Checkout failed");
  }
}

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
}
function continueShopping(){
  window.location.href = "/"
}
document.getElementById("")
// CART UI COUNT
function updateCartUI() {
  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const el = document.getElementById("cartCount");

  if (el) {
    const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);
    el.textContent = totalItems;
  }
}

// SEARCH TOAST
function showSearchToast(message) {
  const toastEl = document.getElementById("searchToast");
  const toastBody = document.getElementById("searchToastBody");

  if (!toastEl || !toastBody) return;

  toastBody.textContent = message;
  new bootstrap.Toast(toastEl).show();
}

// PRODUCTS
let productArray = [];

fetch("/api/products")
  .then(res => res.json())
  .then(products => {
    const container = document.getElementById("products");
    if (!container) return;

    productArray = products;

    fetch("/api/me")
      .then(res => res.json())
      .then(currentUser => {
        container.innerHTML = "";

        products.forEach(product => {
          container.innerHTML += `
            <div class="col-12 col-sm-6 col-lg-3">
              <div class="card h-100">
                <img src="${product.image}" class="card-img-top">
                <div class="card-body">
                  <h5>${product.name}</h5>
                  <p>${product.description}</p>
                  <strong>£${product.price}</strong>

                  ${currentUser.role === "admin"
                    ? `<button class="btn btn-danger btn-sm mt-2" onclick="deleteProduct(${product.id})">Delete</button>`
                    : ""}

                  <button class="btn btn-primary btn-sm mt-2" onclick="addToCart(${product.id})">
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          `;
        });
      });
  });

// SEARCH 
async function filterProducts() {
  const q = document.getElementById("searchInput").value;

  const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`);
  const products = await res.json();

  const userRes = await fetch("/api/me");
  const currentUser = await userRes.json();

  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "";

  products.forEach(product => {
    container.innerHTML += `
      <div class="col-12 col-sm-6 col-lg-3">
        <div class="card h-100">
          <img src="${product.image}" class="card-img-top">
          <div class="card-body">
            <h5>${product.name}</h5>
            <p>${product.description}</p>
            <strong>£${product.price}</strong>

            ${currentUser.role === "admin"
              ? `<button class="btn btn-danger btn-sm mt-2" onclick="deleteProduct(${product.id})">Delete</button>`
              : ""}
          </div>
        </div>
      </div>
    `;
  });

  showSearchToast(`Found ${products.length} products`);
}

// add prodcuts
document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("productForm");

  if (!form) {
    console.log("Product form not found on this page");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // stops JSON page

    const formData = new FormData();

    formData.append("name", document.getElementById("name").value);
    formData.append("price", document.getElementById("price").value);
    formData.append("category", document.getElementById("category").value);
    formData.append("description", document.getElementById("description").value);
    formData.append("producer", document.getElementById("producer").value);

    const imageFile = document.getElementById("image").files[0];
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (res.ok) {
        alert("Product added successfully!");
        form.reset();
        window.location.href = "/admin";
      } else {
        alert(data.message || "Failed to add product");
      }

    } catch (err) {
      console.error("Add product error:", err);
      alert("Server error");
    }
  });

});

// COOKIES 

// Show banner if not already accepted/declined
function checkCookieConsent() {
  const consent = localStorage.getItem("cookieConsent");

  if (!consent) {
    const banner = document.getElementById("cookieBanner");
    if (banner) {
      setTimeout(() => banner.classList.add("show"), 500);
    }
  }
}

// Accept cookies
function acceptCookies() {
  localStorage.setItem("cookieConsent", "accepted");
  hideCookieBanner();
}

// Decline cookies
function declineCookies() {
  localStorage.setItem("cookieConsent", "declined");
  hideCookieBanner();
}

// Hide banner
function hideCookieBanner() {
  const banner = document.getElementById("cookieBanner");
  if (banner) banner.classList.remove("show");
}

// INIT
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
  updateCartUI();
  loadCategories();
  checkCookieConsent();
});