/**
 * Wanderlust Auth Experience JavaScript
 * Handles password visibility toggles, real-time password strength, and interactive validation.
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Password Visibility Toggle
  const toggleButtons = document.querySelectorAll(".toggle-password-btn");
  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const passwordInput = document.getElementById(targetId);
      if (!passwordInput) return;

      const isPassword = passwordInput.getAttribute("type") === "password";
      passwordInput.setAttribute("type", isPassword ? "text" : "password");

      const icon = btn.querySelector("i");
      if (icon) {
        if (isPassword) {
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
          btn.setAttribute("aria-label", "Hide password");
        } else {
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
          btn.setAttribute("aria-label", "Show password");
        }
      }
    });
  });

  // 2. Real-time Password Strength Meter (Signup Page)
  const signupPassword = document.getElementById("password");
  const strengthMeter = document.getElementById("passwordStrengthMeter");
  const strengthLabel = document.getElementById("passwordStrengthLabel");
  const reqLength = document.getElementById("req-length");
  const reqNumber = document.getElementById("req-number");
  const reqCase = document.getElementById("req-case");

  if (signupPassword && strengthMeter && strengthLabel) {
    signupPassword.addEventListener("input", () => {
      const val = signupPassword.value;
      if (!val) {
        strengthMeter.style.width = "0%";
        strengthMeter.className = "progress-bar";
        strengthLabel.textContent = "Enter a secure password";
        strengthLabel.className = "password-strength-text text-muted";
        resetCheckmarks(false, false, false);
        return;
      }

      const hasLength = val.length >= 8;
      const hasNumberOrSymbol = /[\d\W_]/.test(val);
      const hasCase = /[a-z]/.test(val) && /[A-Z]/.test(val);

      resetCheckmarks(hasLength, hasNumberOrSymbol, hasCase);

      // Calculate score (1 to 4)
      let score = 0;
      if (val.length >= 6) score++;
      if (hasLength) score++;
      if (hasCase) score++;
      if (hasNumberOrSymbol && hasLength) score++;

      strengthMeter.className = "progress-bar";

      switch (score) {
        case 1:
          strengthMeter.style.width = "25%";
          strengthMeter.classList.add("bg-danger");
          strengthLabel.textContent = "Weak password";
          strengthLabel.className = "password-strength-text text-danger";
          break;
        case 2:
          strengthMeter.style.width = "50%";
          strengthMeter.classList.add("bg-warning");
          strengthLabel.textContent = "Fair password";
          strengthLabel.className = "password-strength-text text-warning";
          break;
        case 3:
          strengthMeter.style.width = "75%";
          strengthMeter.classList.add("bg-info");
          strengthLabel.textContent = "Good password";
          strengthLabel.className = "password-strength-text text-info";
          break;
        case 4:
          strengthMeter.style.width = "100%";
          strengthMeter.classList.add("bg-success");
          strengthLabel.textContent = "Strong & secure password";
          strengthLabel.className = "password-strength-text text-success";
          break;
        default:
          strengthMeter.style.width = "15%";
          strengthMeter.classList.add("bg-danger");
          strengthLabel.textContent = "Too weak";
          strengthLabel.className = "password-strength-text text-danger";
      }
    });

    function resetCheckmarks(len, num, cs) {
      if (reqLength) {
        reqLength.className = len ? "req-item passed" : "req-item";
        const icon = reqLength.querySelector("i");
        if (icon) icon.className = len ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
      }
      if (reqNumber) {
        reqNumber.className = num ? "req-item passed" : "req-item";
        const icon = reqNumber.querySelector("i");
        if (icon) icon.className = num ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
      }
      if (reqCase) {
        reqCase.className = cs ? "req-item passed" : "req-item";
        const icon = reqCase.querySelector("i");
        if (icon) icon.className = cs ? "fa-solid fa-circle-check" : "fa-regular fa-circle";
      }
    }
  }

  // 3. Prevent double submit & animate button loading state
  const authForms = document.querySelectorAll(".auth-form");
  authForms.forEach((form) => {
    form.addEventListener("submit", (e) => {
      if (!form.checkValidity()) {
        return;
      }
      const submitBtn = form.querySelector(".btn-auth-submit");
      if (submitBtn) {
        const btnText = submitBtn.querySelector(".btn-text");
        const btnSpinner = submitBtn.querySelector(".btn-spinner");
        if (btnText && btnSpinner) {
          btnText.classList.add("d-none");
          btnSpinner.classList.remove("d-none");
        }
      }
    });
  });
});
