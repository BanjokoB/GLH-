// Fetch user data dynamically based on logged-in user
fetch("/api/user")
  .then(res => res.json())
  .then(user => {

    //handle not logged in / API error
    if (user.error) {
      console.error("User error:", user.error);
      window.location.href = "/login";
      return;
    }

    console.log("USER DATA:", user); 

    // Render user profile data
    document.getElementById("userName").innerText =
      `${user.first_name || ""} ${user.last_name || ""}`;

    document.getElementById("userEmail").innerText =
      user.email || "";

    //  SAFE DATA HANDLING
    const orders = user.orders || [];
    const savedItems = user.saved_items || [];
    const addresses = user.addresses || [];

    // Display Orders and Stats
    document.getElementById("orderCount").innerText = orders.length;
    document.getElementById("savedItemsCount").innerText = savedItems.length;

    const totalSpent = orders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    document.getElementById("totalSpent").innerText =
      `£${totalSpent.toFixed(2)}`;

    loadOrders();
    setInterval(loadOrders, 5000);

    // Render Orders
    const orderContainer = document.getElementById("orders");
    orderContainer.innerHTML = ""; //  prevent duplicates

    orders.forEach(order => {
      orderContainer.innerHTML += `
        <div class="p-3 border-bottom">
          <div class="d-flex justify-content-between mb-2">
            <div>
              <strong>${order.order_id || "N/A"}</strong><br>
              <small class="text-muted">${order.date || ""}</small>
            </div>
            <span class="badge ${getStatusBadge(order.status)}">
              ${order.status || "Unknown"}
            </span>
          </div>

          <div class="d-flex justify-content-between small">
            <span class="text-muted">${order.items || 0} items</span>
            <strong>£${Number(order.total || 0).toFixed(2)}</strong>
          </div>

          <div class="small text-muted mt-1">
            ${
              order.delivery_date
                ? `Delivery: ${new Date(order.delivery_date).toLocaleDateString()}`
                : order.collection_time
                ? `Ready for collection at: ${order.collection_time}`
                : "No delivery info yet"
            }
          </div>

          <div class="mt-2 d-flex gap-2">
            <button class="btn btn-dark btn-sm w-50">Track</button>
            <button class="btn btn-outline-secondary btn-sm w-50">Details</button>
          </div>
        </div>
      `;
    });

    // Render Saved Items
    const savedContainer = document.getElementById("savedItems");
    savedContainer.innerHTML = ""; // prevent duplicates

    savedItems.forEach(item => {
      savedContainer.innerHTML += `
        <div class="col-md-4">
          <div class="border rounded overflow-hidden h-100">
            <div class="bg-light d-flex align-items-center justify-content-center" style="height:120px;">
              <img src="https://via.placeholder.com/200?text=${item.name}" class="img-fluid h-100 object-fit-cover">
            </div>
            <div class="p-2">
              <h6 class="fw-bold mb-1">${item.name}</h6>
              <p class="fw-bold mb-2">£${Number(item.price || 0).toFixed(2)}</p>
              <button class="btn btn-dark btn-sm w-100">Add</button>
            </div>
          </div>
        </div>
      `;
    });

    // Display user-specific addresses
    const userAddresses = document.getElementById("userAddresses");
    userAddresses.innerHTML = ""; // prevent duplicates

    addresses.forEach(address => {
      userAddresses.innerHTML += `
        <div class="col-md-6">
          <div class="border rounded p-3">
            <div class="d-flex justify-content-between">
              <span class="badge bg-secondary">Default</span>
              <button class="btn btn-sm btn-link text-muted">Edit</button>
            </div>
            <h6 class="fw-bold mt-2">${address.type}</h6>
            <p class="text-muted small mb-0">
              ${address.line1}<br>
              ${address.line2}<br>
              ${address.city}, ${address.zip}
            </p>
          </div>
        </div>
      `;
    });

    // Logout functionality
    const logoutBtn = document.getElementById("logoutBtn");
    logoutBtn.style.display = "block";

    logoutBtn.addEventListener("click", () => {
      fetch("/logout")
        .then(() => {
          window.location.href = "/";
        })
        .catch(error => console.error('Logout failed:', error));
    });

  })
  .catch(err => {
    console.error("Failed to load user data:", err);
  });


  function loadOrders() {
    fetch("/api/user")
      .then(res => res.json())
      .then(user => {
  
        if (user.error) return;
  
        const orderContainer = document.getElementById("orders");
        orderContainer.innerHTML = "";
  
        (user.orders || []).forEach(order => {
          orderContainer.innerHTML += `
            <div class="p-3 border-bottom">
              <div class="d-flex justify-content-between mb-2">
                <div>
                  <strong>${order.order_id}</strong><br>
                  <small class="text-muted">${order.date}</small>
                </div>
                <span class="badge ${getStatusBadge(order.status)}">
                  ${order.status}
                </span>
              </div>
  
              <div class="d-flex justify-content-between small">
                <span class="text-muted">${order.items || 0} items</span>
                <strong>£${Number(order.total || 0).toFixed(2)}</strong>
              </div>
  
              <div class="small text-muted mt-1">
                ${
                  order.delivery_date
                    ? `Delivery: ${new Date(order.delivery_date).toLocaleDateString()}`
                    : order.collection_time
                    ? `Ready for collection at: ${order.collection_time}`
                    : "No delivery info yet"
                }
              </div>
  
              <div class="mt-2 d-flex gap-2">
                <button class="btn btn-dark btn-sm w-50">Track</button>
                <button class="btn btn-outline-secondary btn-sm w-50">Details</button>
              </div>
            </div>
          `;
        });
      })
      .catch(err => console.error("Live update error:", err));
  }


// Get status badge based on the order status
function getStatusBadge(status) {
  switch (status) {
    case "Delivered":
      return "bg-secondary";
    case "In Transit":
      return "bg-dark";
    case "Processing":
      return "bg-light text-dark border";
    default:
      return "bg-light text-dark";
  }
}