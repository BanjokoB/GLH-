async function loadUsers() {
    const res = await fetch("/api/users");
    const users = await res.json();
  
    const table = document.getElementById("userTable");
    table.innerHTML = "";
  
    users.forEach(user => {
      table.innerHTML += `
        <tr>
          <td>${user.email}</td>
          <td>${user.role}</td>
          <td>
            ${user.role === "admin"
              ? `<button class="btn btn-warning btn-sm" onclick="setRole(${user.id}, 'user')">Remove Admin</button>`
              : `<button class="btn btn-success btn-sm" onclick="setRole(${user.id}, 'admin')">Make Admin</button>`
            }
          </td>
        </tr>
      `;
    });
  }
  
  async function setRole(userId, role) {
    await fetch(`/api/users/${userId}/role`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ role })
    });
  
    loadUsers();
  }
  
  loadUsers();