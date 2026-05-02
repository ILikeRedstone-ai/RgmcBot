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

function valueOf(selector) {
  return document.querySelector(selector)?.value.trim() || "";
}

function getMentionPolicy() {
  const mode = valueOf("#announcementMentions");
  if (mode === "everyone") return { parse: ["users", "roles", "everyone"] };
  if (mode === "roles") return { parse: ["users", "roles"] };
  if (mode === "users") return { parse: ["users"] };
  return { parse: [] };
}

function getAnnouncementFields() {
  const names = [...document.querySelectorAll(".field-name")];
  const values = [...document.querySelectorAll(".field-value")];
  const inlineValues = [...document.querySelectorAll(".field-inline")];

  return names.map((nameInput, index) => ({
    name: nameInput.value.trim(),
    value: values[index]?.value.trim() || "",
    inline: inlineValues[index]?.value !== "false",
  })).filter((field) => field.name && field.value);
}

function buildAnnouncementMessage() {
  const title = valueOf("#announcementTitle");
  const description = valueOf("#announcementDescription");
  const image = valueOf("#announcementImage");
  const thumbnail = valueOf("#announcementThumbnail");
  const author = valueOf("#announcementAuthor");
  const authorIcon = valueOf("#announcementAuthorIcon");
  const footer = valueOf("#announcementFooter");
  const titleUrl = valueOf("#announcementUrl");
  const fields = getAnnouncementFields();

  const embed = {
    title: title || undefined,
    url: titleUrl || undefined,
    description: description || undefined,
    color: hexToDiscordColor(document.querySelector("#announcementColor").value),
    author: author ? { name: author, icon_url: authorIcon || undefined } : undefined,
    thumbnail: thumbnail ? { url: thumbnail } : undefined,
    image: image ? { url: image } : undefined,
    footer: footer ? { text: footer } : undefined,
    fields: fields.length ? fields : undefined,
    timestamp: valueOf("#announcementTimestamp") === "yes" ? new Date().toISOString() : undefined,
  };

  const hasEmbed = embed.title || embed.description || embed.image || embed.thumbnail || embed.author || embed.footer || embed.fields;

  return {
    content: valueOf("#announcementContent") || undefined,
    username: valueOf("#announcementUsername") || "Al-Rijad",
    avatar_url: valueOf("#announcementAvatar") || undefined,
    allowed_mentions: getMentionPolicy(),
    embeds: hasEmbed ? [embed] : undefined,
  };
}

function setImage(element, url) {
  if (!url) {
    element.hidden = true;
    element.removeAttribute("src");
    return;
  }

  element.src = url;
  element.hidden = false;
}

function updateAnnouncementPreview() {
  const message = buildAnnouncementMessage();
  const embed = message.embeds?.[0];
  const avatar = document.querySelector("#preview-avatar");
  const avatarUrl = valueOf("#announcementAvatar");
  const username = message.username || "Al-Rijad";

  document.querySelector("#preview-username").textContent = username;
  document.querySelector("#preview-content").textContent = message.content || "Treść nad embedem pojawi się tutaj.";
  document.querySelector("#preview-color").style.background = document.querySelector("#announcementColor").value;

  avatar.textContent = "";
  if (avatarUrl) {
    const image = new Image();
    image.src = avatarUrl;
    image.alt = "";
    image.onload = () => {
      avatar.textContent = "";
      avatar.append(image);
    };
    image.onerror = () => {
      avatar.textContent = username.slice(0, 1).toUpperCase();
    };
  } else {
    avatar.textContent = username.slice(0, 1).toUpperCase();
  }

  const previewEmbed = document.querySelector("#preview-embed");
  previewEmbed.hidden = !embed;
  if (!embed) return;

  const author = document.querySelector("#preview-author");
  author.hidden = !embed.author?.name;
  author.textContent = embed.author?.name || "";

  const title = document.querySelector("#preview-title");
  title.textContent = embed.title || "Tytuł embeda";
  title.href = embed.url || "#";
  title.removeAttribute("aria-disabled");

  document.querySelector("#preview-description").textContent = embed.description || "Opis embeda...";
  setImage(document.querySelector("#preview-thumbnail"), embed.thumbnail?.url);
  setImage(document.querySelector("#preview-image"), embed.image?.url);

  const footer = document.querySelector("#preview-footer");
  footer.hidden = !embed.footer?.text && !embed.timestamp;
  footer.textContent = [embed.footer?.text, embed.timestamp ? "teraz" : ""].filter(Boolean).join(" • ");

  const fieldsContainer = document.querySelector("#preview-fields");
  fieldsContainer.replaceChildren();
  (embed.fields || []).forEach((field) => {
    const item = document.createElement("div");
    item.className = field.inline ? "embed-field inline" : "embed-field";
    item.innerHTML = `<strong></strong><span></span>`;
    item.querySelector("strong").textContent = field.name;
    item.querySelector("span").textContent = field.value;
    fieldsContainer.append(item);
  });
}

document.querySelector("#announcement-form").addEventListener("input", updateAnnouncementPreview);
document.querySelector("#announcement-form").addEventListener("change", updateAnnouncementPreview);
updateAnnouncementPreview();

document.querySelector("#announcement-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("#announcement-status", "Wysyłam");

  const message = buildAnnouncementMessage();

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
