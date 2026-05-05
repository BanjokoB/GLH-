const form = document.getElementById("signupForm");

const firstNameInput = document.getElementById("firstName");
const lastNameInput = document.getElementById("lastName");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const addressInput = document.getElementById("address");
const loyaltyInput = document.getElementById("loyalty");

const toggleBtn = document.getElementById("togglePassword");


// =======================
// VALIDATION HELPERS
// =======================
function showError(input, message) {
  input.classList.add("is-invalid");

  const container = input.closest(".mb-3");
  let feedback = container.querySelector(".invalid-feedback");

  if (!feedback) {
    feedback = document.createElement("div");
    feedback.className = "invalid-feedback";
    container.appendChild(feedback);
  }

  feedback.textContent = message;
}

function clearError(input) {
  input.classList.remove("is-invalid");

  const container = input.closest(".mb-3");
  const feedback = container?.querySelector(".invalid-feedback");
  if (feedback) feedback.remove();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// =======================
// SHOW / HIDE PASSWORD
// =======================
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";

    passwordInput.type = isHidden ? "text" : "password";
    confirmPasswordInput.type = isHidden ? "text" : "password";

    toggleBtn.textContent = isHidden ? "Hide" : "Show";
  });
}


// =======================
// SIGNUP (FLASK BACKEND)
// =======================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const first_name = firstNameInput.value.trim();
  const last_name = lastNameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  const confirm_password = confirmPasswordInput.value.trim();
  const address = addressInput.value.trim();
  const loyalty = loyaltyInput.checked;

  let isValid = true;

  // Clear all errors first
  [
    firstNameInput,
    lastNameInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    addressInput
  ].forEach(input => clearError(input));


  // =======================
  // VALIDATION
  // =======================

  if (!first_name) {
    showError(firstNameInput, "First name is required");
    isValid = false;
  }

  if (!last_name) {
    showError(lastNameInput, "Last name is required");
    isValid = false;
  }

  if (!email) {
    showError(emailInput, "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError(emailInput, "Enter a valid email");
    isValid = false;
  }

  if (!password) {
    showError(passwordInput, "Password is required");
    isValid = false;
  } else if (password.length < 6) {
    showError(passwordInput, "Password must be at least 6 characters");
    isValid = false;
  }

  if (!confirm_password) {
    showError(confirmPasswordInput, "Confirm your password");
    isValid = false;
  } else if (password !== confirm_password) {
    showError(confirmPasswordInput, "Passwords do not match");
    isValid = false;
  }

  if (!isValid) return;


  // =======================
  // SEND TO FLASK
  // =======================
  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        first_name,
        last_name,
        email,
        password,
        confirm_password,
        address,
        loyalty
      })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Signup failed");
      return;
    }

    alert("Signup successful!");

    // Redirect after signup
    window.location.href = "/login";

  } catch (error) {
    console.error(error);
    alert("Server error. Try again.");
  }
});