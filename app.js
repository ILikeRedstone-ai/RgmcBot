const API_URL = "https://dmg.alrijadbotpanel.workers.dev/send";

const form = document.querySelector("#message-form");
const statusPill = document.querySelector("#status-pill");
const copyJsonButton = document.querySelector("#copy-json");
const fields = {
  username: document.querySelector("#username"),
  avatarUrl: document.querySelector("#avatarUrl"),
  content: document.querySelector("#content"),
  password: document.querySelector("#password"),
  embedEnabled: document.querySelector("#embedEnabled"),
  embedFields: document.querySelector("#embed-fields"),
  embedTitle: document.querySelector("#embedTitle"),
  embedColor: document.querySelector("#embedColor"),
  embedDescription: document.querySelector("#embedDescription"),
  embedImage: document.querySelector("#embedImage"),
  embedFooter: document.querySelector("#embedFooter"),
};

const preview = {
  avatar: document.querySelector("#preview-avatar"),
  username: document.querySelector("#preview-username"),
  content: document.querySelector("#preview-content"),
  embed: document.querySelector("#preview-embed"),
  embedColor: document.querySelector("#preview-embed-color"),
  embedTitle: document.querySelector("#preview-embed-title"),
  embedDescription: document.querySelector("#preview-embed-description"),
  embedImage: document.querySelector("#preview-embed-image"),
  embedFooter: document.querySelector("#preview-embed-footer"),
};

function setStatus(text, type = "") {
  statusPill.textContent = text;
  statusPill.className = `status-pill ${type}`.trim();
}

function hexToDiscordColor(hex) {
  return Number.parseInt(hex.replace("#", ""), 16);
}

function getPayload() {
  const content = fields.content.value.trim();
  const username = fields.username.value.trim();
  const avatarUrl = fields.avatarUrl.value.trim();

  const payload = {
    content,
    username: username || undefined,
    avatar_url: avatarUrl || undefined,
    allowed_mentions: { parse: [] },
  };

  if (fields.embedEnabled.checked) {
    const embed = {
      title: fields.embedTitle.value.trim() || undefined,
      description: fields.embedDescription.value.trim() || undefined,
      color: hexToDiscordColor(fields.embedColor.value),
      image: fields.embedImage.value.trim() ? { url: fields.embedImage.value.trim() } : undefined,
      footer: fields.embedFooter.value.trim() ? { text: fields.embedFooter.value.trim() } : undefined,
    };

    if (embed.title || embed.description || embed.image || embed.footer) {
      payload.embeds = [embed];
    }
  }

  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
}

function updateAvatar() {
  const name = fields.username.value.trim() || "Discord";
  const avatarUrl = fields.avatarUrl.value.trim();
  preview.avatar.textContent = "";

  if (avatarUrl) {
    const image = new Image();
    image.alt = "";
    image.src = avatarUrl;
    image.onload = () => {
      preview.avatar.textContent = "";
      preview.avatar.append(image);
    };
    image.onerror = () => {
      preview.avatar.textContent = name.slice(0, 1).toUpperCase();
    };
    return;
  }

  preview.avatar.textContent = name.slice(0, 1).toUpperCase();
}

function updatePreview() {
  const payload = getPayload();
  const embed = payload.embeds?.[0];

  preview.username.textContent = payload.username || "Bot ogłoszeń";
  preview.content.textContent = payload.content || "Wpisz wiadomość, a podgląd pojawi się tutaj.";
  preview.embed.hidden = !embed;
  fields.embedFields.hidden = !fields.embedEnabled.checked;

  if (embed) {
    preview.embedColor.style.background = fields.embedColor.value;
    preview.embedTitle.textContent = embed.title || "Aktualizacja";
    preview.embedDescription.textContent = embed.description || "Opis embeda...";
    preview.embedFooter.textContent = embed.footer?.text || "";
    preview.embedFooter.hidden = !embed.footer?.text;

    if (embed.image?.url) {
      preview.embedImage.src = embed.image.url;
      preview.embedImage.hidden = false;
    } else {
      preview.embedImage.removeAttribute("src");
      preview.embedImage.hidden = true;
    }
  }

  updateAvatar();
}

async function sendMessage(event) {
  event.preventDefault();
  const payload = getPayload();

  if (!payload.content && !payload.embeds?.length) {
    setStatus("Brak treści", "error");
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  setStatus("Wysyłam");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        password: fields.password.value,
        message: payload,
      }),
    });

    if (!response.ok) {
      const problem = await response.json().catch(() => ({ error: "Nie udało się wysłać" }));
      throw new Error(problem.error || "Nie udało się wysłać");
    }

    setStatus("Wysłano", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    submitButton.disabled = false;
  }
}

async function copyJson() {
  await navigator.clipboard.writeText(JSON.stringify(getPayload(), null, 2));
  setStatus("Skopiowano", "ok");
}

form.addEventListener("input", updatePreview);
fields.embedEnabled.addEventListener("change", updatePreview);
form.addEventListener("submit", sendMessage);
copyJsonButton.addEventListener("click", copyJson);
updatePreview();
