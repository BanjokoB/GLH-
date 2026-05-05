function loadLayout() {
  // Fetch current user to populate navbar dynamically
    fetch("/api/me")
      .then(res => res.json())
      .then(rawUser => {
  
        // SAFE DEFAULT
        const currentUser = rawUser || { logged_in: false, role: "user" };
        const isLoggedIn = currentUser.logged_in === true;
        const isAdmin = currentUser.role === "admin";
  
        const navbarContainer = document.getElementById("navbar");
        if (!navbarContainer || navbarContainer.innerHTML.trim() !== "") return;
  
        const navbar = `
  <header class="bg-white border-bottom sticky-top shadow-sm" style="z-index: 1030;">
    <div class="container py-3 d-flex justify-content-between align-items-center">
  
      <a href="/" class="fw-bold fs-4 text-primary text-decoration-none">GLH</a>
  
      <!-- Desktop -->
      <div class="d-none d-md-flex gap-3 align-items-center">
        <a href="/cart" class="btn btn-outline-dark">Cart</a>
  
        <a href="/loyalty" class="btn btn-outline-primary">
          Rewards (<span id="navPoints">0</span>)
        </a>
  
        ${isAdmin ? `
          <a href="/admin" class="btn btn-warning">
            Admin Dashboard
          </a>
        ` : ""}

        ${isAdmin ? `<a href="/manager" class="btn btn-warning">Admin Panel</a>` : ""}
  
        <a href="/login" class="btn btn-dark"
          style="${isLoggedIn ? 'display:none' : 'display:block'}">
          Login
        </a>
  
        <a href="/account" class="btn btn-dark"
          style="${isLoggedIn ? 'display:block' : 'display:none'}">
          My Account
        </a>
  
        <button class="btn btn-danger"
          onclick="logout()"
          style="${isLoggedIn ? 'display:block' : 'display:none'}">
          Logout
        </button>
      </div>
  
      <!-- MOBILE HAMBURGER -->
      <button class="btn d-md-none" type="button" data-bs-toggle="collapse" data-bs-target="#mobileMenu">
        <i class="fa-solid fa-bars fs-4"></i>
      </button>
  
    </div>
  
    <!-- MOBILE MENU -->
    <div class="collapse bg-white border-top d-md-none" id="mobileMenu">
      <div class="container py-3 d-flex flex-column gap-2">
  
        <a href="/cart" class="btn btn-outline-dark w-100">Cart</a>
  
        <a href="/loyalty" class="btn btn-outline-primary w-100">
          Rewards (<span id="navPointsMobile">0</span>)
        </a>
  
        ${isAdmin ? `
          <a href="/admin" class="btn btn-warning w-100">
            Admin Dashboard
          </a>
        ` : ""}
  
        <a href="/login" class="btn btn-dark w-100"
          style="${isLoggedIn ? 'display:none' : 'display:block'}">
          Login
        </a>
  
        <a href="/account" class="btn btn-dark w-100"
          style="${isLoggedIn ? 'display:block' : 'display:none'}">
          My Account
        </a>
  
        <button class="btn btn-danger w-100"
          onclick="logout()"
          style="${isLoggedIn ? 'display:block' : 'display:none'}">
          Logout
        </button>
  
      </div>
    </div>
  </header>
  `;
  
        navbarContainer.innerHTML = navbar;
  
      })
      .catch(err => {
        console.error("Navbar error:", err);
  
        document.getElementById("navbar").innerHTML = `
          <header class="bg-white border-bottom sticky-top shadow-sm">
            <div class="container py-3">
              <a href="/" class="fw-bold fs-4 text-primary">GLH</a>
            </div>
          </header>
        `;
      });
  
    // FOOTER 
    const footer = `
      <footer class="bg-white border-top mt-5">
        <div class="container py-5">
          <div class="row g-4">
            <div class="col-md-3">
              <h6 class="fw-bold">Info</h6>
              <a href="#" class="d-block text-muted small">About</a>
              <a href="#" class="d-block text-muted small">Contact</a>
              <a href="/accessibility" class="d-block text-muted small">Accessibility</a>
            </div>
            <div class="col-md-3">
              <h6 class="fw-bold">Help</h6>
              <a href="#" class="d-block text-muted small">Support</a>
              <a href="#" class="d-block text-muted small">Returns</a>
            </div>
            <div class="col-md-3">
              <h6 class="fw-bold">Shop</h6>
              <a href="#" class="d-block text-muted small">All Items</a>
              <a href="#" class="d-block text-muted small">Deals</a>
            </div>
            <div class="col-md-3">
              <h6 class="fw-bold">Updates</h6>
              <div class="d-flex gap-2">
                <input class="form-control" placeholder="Email">
                <button class="btn btn-dark">Submit</button>
              </div>
            </div>
          </div>
          <div class="text-center mt-4 small text-muted border-top pt-3">
            © 2026 GLH Designed by Banjoko Omofeola Bassit
          </div>
        </div>
      </footer>
    `;
  
    document.getElementById("footer").innerHTML = footer;
  
    setActiveNav();
    setupMobileMenu();
  }
async function loadNavPoints() {
  try {
    const res = await fetch("/api/loyalty");
    if (!res.ok) return;

    const data = await res.json();

    const desktop = document.getElementById("navPoints");
    const mobile = document.getElementById("navPointsMobile");

    if (desktop) desktop.textContent = data.totalPoints;
    if (mobile) mobile.textContent = data.totalPoints;

  } catch (err) {
    console.error("Failed to load nav points", err);
  }
}
loadNavPoints();

// Initialize layout after DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadLayout();
});

// This function will handle the logout functionality
function logout() {
  fetch("/logout")
    .then(() => {
      window.location.href = "/";  // Redirect to home page after logout
    })
    .catch(error => console.error('Logout failed:', error));
}

function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll("[data-page]").forEach(link => {
    link.classList.remove("fw-bold", "text-dark", "border-bottom", "text-muted");
    if (
      (path === "/" && link.dataset.page === "index") ||
      path.includes(link.dataset.page)
    ) {
      link.classList.add("fw-bold", "text-dark", "border-bottom");
    } else {
      link.classList.add("text-muted");
    }
  });
}



function setupMobileMenu() {
  const mobileNav = document.getElementById("mobileNav");
  const menuIcon = document.getElementById("menuIcon");

  if (!mobileNav || !menuIcon) return;

  mobileNav.addEventListener("show.bs.collapse", () => {
    menuIcon.classList.remove("fa-bars");
    menuIcon.classList.add("fa-xmark");
  });

  mobileNav.addEventListener("hide.bs.collapse", () => {
    menuIcon.classList.remove("fa-xmark");
    menuIcon.classList.add("fa-bars");
  });
}
// Initialize layout after DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
  loadLayout();
});