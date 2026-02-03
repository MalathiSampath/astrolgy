// Basic client-side validation and submission to n8n webhook

function $(selector) {
  return document.querySelector(selector);
}

function showFieldError(fieldName, message) {
  const field = document.getElementById(fieldName);
  const errorEl = document.querySelector(`[data-error-for="${fieldName}"]`);
  if (field) {
    if (message) {
      field.classList.add("error-input");
    } else {
      field.classList.remove("error-input");
    }
  }
  if (errorEl) {
    errorEl.textContent = message || "";
  }
}

function clearAllErrors() {
  document
    .querySelectorAll(".error-input")
    .forEach((el) => el.classList.remove("error-input"));
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });
}

function setStatus(message, type) {
  const statusEl = $("#form-status");
  if (!statusEl) return;
  statusEl.textContent = message || "";
  statusEl.classList.remove("status--success", "status--error");
  if (type === "success") statusEl.classList.add("status--success");
  if (type === "error") statusEl.classList.add("status--error");
}

function validateForm(form) {
  clearAllErrors();
  let isValid = true;

  const fullName = form.fullName.value.trim();
  const email = form.email.value.trim();
  const dateOfBirth = form.dateOfBirth.value;
  const placeOfBirth = form.placeOfBirth.value.trim();
  const focusArea = form.focusArea.value;
  const consent = form.consent.checked;

  if (!fullName) {
    showFieldError("fullName", "Please enter your full name.");
    isValid = false;
  }

  if (!email) {
    showFieldError("email", "Please enter your email.");
    isValid = false;
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showFieldError("email", "Please enter a valid email address.");
      isValid = false;
    }
  }

  if (!dateOfBirth) {
    showFieldError("dateOfBirth", "Please provide your date of birth.");
    isValid = false;
  }

  if (!placeOfBirth) {
    showFieldError("placeOfBirth", "Please enter your place of birth.");
    isValid = false;
  }

  if (!focusArea) {
    showFieldError("focusArea", "Please choose an area of focus.");
    isValid = false;
  }

  if (!consent) {
    showFieldError("consent", "You must acknowledge the guidance disclaimer to continue.");
    isValid = false;
  }

  return isValid;
}

async function submitForm(event) {
  event.preventDefault();
  const form = event.target;

  if (!validateForm(form)) {
    setStatus("Please correct the highlighted fields and try again.", "error");
    return;
  }

  const webhookUrl = window.N8N_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes("https://malathisampath.app.n8n.cloud/webhook/6fed348e-e948-48b0-8f2f-471e06d72a26")) {
    setStatus(
      "Webhook URL is not configured. Please set window.N8N_WEBHOOK_URL in index.html.",
      "error"
    );
    return;
  }

  const submitBtn = $("#submitBtn");
  submitBtn.disabled = true;
  setStatus("Sending your details securely…", null);

  const payload = {
    fullName: form.fullName.value.trim(),
    email: form.email.value.trim(),
    dateOfBirth: form.dateOfBirth.value,
    timeOfBirth: form.timeOfBirth.value || null,
    placeOfBirth: form.placeOfBirth.value.trim(),
    gender: form.gender.value || null,
    focusArea: form.focusArea.value,
    extraContext: form.extraContext.value.trim() || null,
    // Allows n8n to reason about frontend version if needed
    source: "astrology-prediction-site-v1",
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    setStatus(
      "Thank you! Your details were received. You will receive an email once your astrology insight has been generated.",
      "success"
    );
    form.reset();
  } catch (err) {
    console.error(err);
    setStatus(
      "Something went wrong while sending your request. Please try again in a moment.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#astrology-form");
  if (form) {
    form.addEventListener("submit", submitForm);
  }
});


