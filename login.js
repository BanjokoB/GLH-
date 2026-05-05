const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("togglePassword");


// VALIDATION
function showError(input, message) {
  input.classList.add("is-invalid");

  let feedback = input.parentNode.querySelector(".invalid-feedback");

  if (!feedback) {
    feedback = document.createElement("div");
    feedback.className = "invalid-feedback";
    input.parentNode.appendChild(feedback);
  }

  feedback.textContent = message;
}

function clearError(input) {
  input.classList.remove("is-invalid");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// SHOW / HIDE PASSWORD
if (toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    toggleBtn.textContent = isPassword ? "Hide" : "Show";
  });
}


// LOGIN (FLASK BACKEND)
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let isValid = true;

  clearError(emailInput);
  clearError(passwordInput);

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
    showError(passwordInput, "Password is too short");
    isValid = false;
  }

  if (!isValid) return;

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    alert("Login successful!");

    //ROLE-BASED REDIRECT
    if (data.role === "admin") {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }

  } catch (error) {
    console.error(error);
    alert("Server error. Try again.");
  }
});
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
// import {
//   getAuth,
//   signInWithEmailAndPassword,
//   signInWithPopup,
//   GoogleAuthProvider,
//   FacebookAuthProvider
// } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// // Replace with real firebase config later on
// const firebaseConfig = {
//   apiKey: "API_KEY",
//   authDomain: "AUTH_DOMAIN",
//   projectId: "PROJECT_ID",
//   appId: "APP_ID"
// };

// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

// // Providers for Google and Facebook
// const googleProvider = new GoogleAuthProvider();
// const facebookProvider = new FacebookAuthProvider();

// // DOM Elements
// const form = document.getElementById("loginForm");
// const emailInput = document.getElementById("email");
// const passwordInput = document.getElementById("password");
// const toggleBtn = document.getElementById("togglePassword");


// // VALIDATION
// function showError(input, message) {
//   input.classList.add("is-invalid");

//   let feedback = input.parentNode.querySelector(".invalid-feedback");

//   if (!feedback) {
//     feedback = document.createElement("div");
//     feedback.className = "invalid-feedback";
//     input.parentNode.appendChild(feedback);
//   }

//   feedback.textContent = message;
// }

// function clearError(input) {
//   input.classList.remove("is-invalid");
// }

// function isValidEmail(email) {
//   return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
// }


// // SHOW / HIDE PASSWORD
// if (toggleBtn) {
//   toggleBtn.addEventListener("click", () => {
//     const isPassword = passwordInput.type === "password";
//     passwordInput.type = isPassword ? "text" : "password";
//     toggleBtn.textContent = isPassword ? "Hide" : "Show";
//   });
// }


// // EMAIL LOGIN
// form.addEventListener("submit", async (e) => {
//   e.preventDefault();

//   const email = emailInput.value.trim();
//   const password = passwordInput.value.trim();

//   let isValid = true;

//   clearError(emailInput);
//   clearError(passwordInput);

//   if (!email) {
//     showError(emailInput, "Email is required");
//     isValid = false;
//   } else if (!isValidEmail(email)) {
//     showError(emailInput, "Enter a valid email");
//     isValid = false;
//   }

//   if (!password) {
//     showError(passwordInput, "Password is required");
//     isValid = false;
//   } else if (password.length < 8) {
//     showError(passwordInput, "Minimum 8 characters required");
//     isValid = false;
//   }

//   if (!isValid) return;

//   try {
//     await signInWithEmailAndPassword(auth, email, password);

//     alert("Login successful!");

//     window.location.href = "/";

//   } catch (error) {
//     alert(error.message);
//   }
// });


// // GOOGLE LOGIN
// document.getElementById("googleLogin").addEventListener("click", async () => {
//   try {
//     await signInWithPopup(auth, googleProvider);

//     alert("Google login successful!");
//     window.location.href = "/";

//   } catch (error) {
//     alert(error.message);
//   }
// });


// // FACEBOOK LOGIN
// document.getElementById("facebookLogin").addEventListener("click", async () => {
//   try {
//     await signInWithPopup(auth, facebookProvider);

//     alert("Facebook login successful!");
//     window.location.href = "/";

//   } catch (error) {
//     alert(error.message);
//   }
// });