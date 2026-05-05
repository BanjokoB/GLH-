//  STATS (LIVE)


function loadStats() {
  fetch("/api/admin/stats")
    .then(res => res.json())
    .then(data => {
      const stats = [
        { label: "Orders Today", value: data.orders_today },
        { label: "Revenue", value: `£${Number(data.revenue).toFixed(2)}` },
        { label: "Customers", value: data.customers },
        { label: "Products", value: data.products }
      ];

      const container = document.getElementById("statsContainer");
      if (!container) return;

      container.innerHTML = "";

      stats.forEach(stat => {
        container.innerHTML += `
          <div class="col-md-3">
            <div class="card p-4">
              <small class="text-muted">${stat.label}</small>
              <h3 class="fw-bold">${stat.value}</h3>
            </div>
          </div>
        `;
      });
    })
    .catch(err => console.error("Stats failed:", err));
}

loadStats();
setInterval(loadStats, 5000);

//  ORDERS (LIVE ADMIN)
function loadOrders() {
  fetch("/api/admin/orders")
    .then(res => res.json())
    .then(orders => {
      const table = document.getElementById("ordersTable");
      if (!table) return;

      table.innerHTML = "";

      orders.forEach(order => {
        table.innerHTML += `
          <tr>
            <td>${order.id}</td>
            <td>${order.first_name} ${order.last_name}</td>
            <td>£${Number(order.total).toFixed(2)}</td>

            <td>
              <select class="form-select form-select-sm"
                onchange="updateOrder(${order.id}, this)">
                <option ${order.status === "Pending" ? "selected" : ""}>Pending</option>
                <option ${order.status === "Processing" ? "selected" : ""}>Processing</option>
                <option ${order.status === "Completed" ? "selected" : ""}>Completed</option>
              </select>
            </td>

            <td>
              <input type="date"
                class="form-control form-control-sm"
                value="${order.delivery_date || ''}"
                onchange="updateOrder(${order.id}, this)">
            </td>

            <td>
              <input type="time"
                class="form-control form-control-sm"
                value="${order.collection_time || ''}"
                onchange="updateOrder(${order.id}, this)">
            </td>
          </tr>
        `;
      });
    });
}

loadOrders();

  //  UPDATE ORDER
function updateOrder(orderId, element) {
  const row = element.closest("tr");

  const status = row.querySelector("select").value;
  const delivery_date = row.querySelector('input[type="date"]').value;
  const collection_time = row.querySelector('input[type="time"]').value;

  fetch(`/api/admin/orders/${orderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      delivery_date,
      collection_time
    })
  })
    .then(res => res.json())
    .then(() => loadOrders())
    .catch(err => console.error(err));
}


  //  INVENTORY
function loadInventory() {
  fetch("/api/inventory")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("inventoryTable");
      if (!table) return;

      table.innerHTML = "";

      data.forEach(product => {
        table.innerHTML += `
          <tr>
            <td>${product.name}</td>

            <td>
              <span class="badge bg-dark">
                ${product.stock}
              </span>
            </td>

            <td>
              <input type="number"
                id="stock-${product.id}"
                class="form-control form-control-sm d-inline w-50"
                value="${product.stock}">

              <button class="btn btn-sm btn-primary"
                onclick="updateStock(${product.id})">
                Save
              </button>
            </td>
          </tr>
        `;
      });
    });
}

function updateStock(id) {
  const stock = document.getElementById(`stock-${id}`).value;

  fetch(`/api/inventory/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stock })
  })
    .then(res => res.json())
    .then(() => loadInventory());
}

loadInventory();

  //  QUICK ACTIONS
function renderActions(containerId, title, actions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="card p-4">
      <h5 class="fw-bold mb-3">${title}</h5>
      ${actions.map(a => `
        <button class="btn btn-outline-dark w-100 mb-2">${a}</button>
      `).join("")}
    </div>
  `;
}

renderActions("actions1", "Manage Products", ["Add Product", "Edit Prices", "Categories"]);
renderActions("actions2", "Orders", ["Process Orders", "View History", "Refunds"]);
renderActions("actions3", "Reports", ["Sales Report", "Analytics", "Export Data"]);