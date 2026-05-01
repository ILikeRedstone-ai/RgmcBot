const API_BASE = "https://dmg.alrijadbotpanel.workers.dev";
const adminApp = document.querySelector("#admin-app");
const loginForm = document.querySelector("#login-form");
const loginCard = document.querySelector("#login-card");
const adminLayout = document.querySelector("#admin-layout");
const logoutButton = document.querySelector("#logout-button");
let adminPassword = "";

function getPassword() {
  return adminPassword;
}

function unlockPanel(password) {
  adminPassword = password;
  adminApp.classList.remove("locked");
  loginCard.hidden = true;
  adminLayout.hidden = false;
  setStatus("#login-status", "Odblokowany", "ok");
}

function lockPanel() {
  adminPassword = "";
  adminApp.classList.add("locked");
  loginCard.hidden = false;
  adminLayout.hidden = true;
  document.querySelector("#adminPassword").value = "";
  setStatus("#login-status", "Zablokowany");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const password = document.querySelector("#adminPassword").value;
  setStatus("#login-status", "Sprawdzam");

  try {
    const response = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nieprawidlowe haslo");
    unlockPanel(password);
  } catch (error) {
    setStatus("#login-status", error.message, "error");
  }
});

logoutButton.addEventListener("click", lockPanel);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((panel) => panel.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`#${tab.dataset.panel}`).classList.add("active");
  });
});

function setStatus(id, text, type = "") {
  const statusPill = document.querySelector(id);
  if (!statusPill) return;
  statusPill.textContent = text;
  statusPill.className = `status-pill ${type}`.trim();
}

function hexToDiscordColor(hex) {
  return Number.parseInt(hex.replace("#", ""), 16);
}

document.querySelector("#announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("#announcement-status", "Wysyłam");

  const title = document.querySelector("#announcementTitle").value.trim();
  const description = document.querySelector("#announcementDescription").value.trim();
  const image = document.querySelector("#announcementImage").value.trim();

  const message = {
    content: document.querySelector("#announcementContent").value.trim() || undefined,
    username: "Al-Rijad",
    allowed_mentions: { parse: [] },
    embeds: title || description || image ? [{
      title: title || undefined,
      description: description || undefined,
      color: hexToDiscordColor(document.querySelector("#announcementColor").value),
      image: image ? { url: image } : undefined,
      footer: { text: "Al-Rijad" },
    }] : undefined,
  };

  try {
    const response = await fetch(`${API_BASE}/announce`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        password: getPassword(),
        message,
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nie udało się wysłać");
    setStatus("#announcement-status", "Wysłano", "ok");
  } catch (error) {
    setStatus("#announcement-status", error.message, "error");
  }
});

document.querySelector("#deputy-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("#deputy-status", "Zapisuję");

  try {
    const response = await fetch(`${API_BASE}/deputy`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        password: getPassword(),
        userId: document.querySelector("#deputyUserId").value.trim(),
        rank: document.querySelector("#deputyRank").value,
        note: document.querySelector("#deputyNote").value.trim(),
      }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nie udało się zmienić roli");
    setStatus("#deputy-status", "Zapisano", "ok");
  } catch (error) {
    setStatus("#deputy-status", error.message, "error");
  }
});
