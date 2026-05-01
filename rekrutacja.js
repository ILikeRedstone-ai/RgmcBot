const API_BASE = "https://dmg.alrijadbotpanel.workers.dev";

const form = document.querySelector("#recruitment-form");
const statusPill = document.querySelector("#recruitment-status");

function setStatus(text, type = "") {
  statusPill.textContent = text;
  statusPill.className = `status-pill ${type}`.trim();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus("Wysyłam");

  const payload = {
    mcNick: document.querySelector("#mcNick").value.trim(),
    discordName: document.querySelector("#discordName").value.trim(),
    age: document.querySelector("#age").value.trim(),
    activity: document.querySelector("#activity").value.trim(),
    reason: document.querySelector("#reason").value.trim(),
    contribution: document.querySelector("#contribution").value.trim(),
    extra: document.querySelector("#extra").value.trim(),
  };

  try {
    const response = await fetch(`${API_BASE}/recruit`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Nie udało się wysłać zgłoszenia");

    form.reset();
    setStatus("Wysłano", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
});
