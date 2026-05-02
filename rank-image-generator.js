const elements = {
  playerName: document.querySelector("#playerName"),
  rank: document.querySelector("#rank"),
  headline: document.querySelector("#headline"),
  subtitle: document.querySelector("#subtitle"),
  textX: document.querySelector("#textX"),
  textY: document.querySelector("#textY"),
  textSize: document.querySelector("#textSize"),
  yaw: document.querySelector("#yaw"),
  pitch: document.querySelector("#pitch"),
  zoom: document.querySelector("#zoom"),
  playerX: document.querySelector("#playerX"),
  playerY: document.querySelector("#playerY"),
  playerScale: document.querySelector("#playerScale"),
  playerBrightness: document.querySelector("#playerBrightness"),
  bgColorA: document.querySelector("#bgColorA"),
  bgColorB: document.querySelector("#bgColorB"),
  skinUpload: document.querySelector("#skinUpload"),
  backgroundUpload: document.querySelector("#backgroundUpload"),
  posterCanvas: document.querySelector("#posterCanvas"),
  skinCanvas: document.querySelector("#skinCanvas"),
  status: document.querySelector("#status"),
};

const rankLabels = {
  jr: "jr-zastępcą",
  regular: "zastępcą",
  senior: "senior-zastępcą",
};

const basePreset = {
  textX: 86,
  textY: 405,
  textSize: 76,
  playerX: 720,
  playerY: -5,
  playerScale: 102,
  playerBrightness: 240,
  yaw: -35,
  pitch: 2,
  zoom: 78,
};

const poster = elements.posterCanvas.getContext("2d");
let backgroundImage = null;
let renderQueued = false;

const skinViewer = new skinview3d.SkinViewer({
  canvas: elements.skinCanvas,
  width: 520,
  height: 680,
  skin: "https://minotar.net/skin/Steve",
});

skinViewer.fov = 38;
skinViewer.zoom = 0.78;
skinViewer.globalLight.intensity = 1.18;
skinViewer.cameraLight.intensity = 1.35;

function setStatus(text) {
  elements.status.textContent = text;
}

function value(name) {
  return elements[name].value;
}

function number(name) {
  return Number(elements[name].value);
}

function degreesToRadians(valueInDegrees) {
  return (valueInDegrees * Math.PI) / 180;
}

function applyViewerPose() {
  skinViewer.zoom = number("zoom") / 100;

  if (skinViewer.playerObject) {
    skinViewer.playerObject.rotation.y = degreesToRadians(number("yaw"));
    skinViewer.playerObject.rotation.x = degreesToRadians(number("pitch"));
  }
}

function drawCoverImage(context, image, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const targetWidth = image.width * scale;
  const targetHeight = image.height * scale;
  context.drawImage(image, (width - targetWidth) / 2, (height - targetHeight) / 2, targetWidth, targetHeight);
}

function drawBackground() {
  const gradient = poster.createLinearGradient(0, 0, elements.posterCanvas.width, elements.posterCanvas.height);
  gradient.addColorStop(0, value("bgColorA"));
  gradient.addColorStop(1, value("bgColorB"));
  poster.fillStyle = gradient;
  poster.fillRect(0, 0, 1280, 720);

  if (backgroundImage) {
    poster.globalAlpha = 0.58;
    drawCoverImage(poster, backgroundImage, 1280, 720);
    poster.globalAlpha = 1;
  }

  poster.fillStyle = "rgba(0, 0, 0, 0.34)";
  poster.fillRect(0, 0, 1280, 720);

  const shine = poster.createRadialGradient(920, 160, 20, 920, 160, 520);
  shine.addColorStop(0, "rgba(255, 230, 170, 0.26)");
  shine.addColorStop(1, "rgba(255, 230, 170, 0)");
  poster.fillStyle = shine;
  poster.fillRect(0, 0, 1280, 720);
}

function drawPlayer() {
  if (typeof skinViewer.render === "function") {
    skinViewer.render();
  }

  const scale = number("playerScale") / 100;
  const width = 520 * scale;
  const height = 680 * scale;
  const x = number("playerX");
  const y = number("playerY");
  const brightness = number("playerBrightness") / 100;

  poster.save();
  poster.shadowColor = "rgba(0, 0, 0, 0.34)";
  poster.shadowBlur = 24;
  poster.shadowOffsetY = 16;
  poster.filter = `brightness(${brightness})`;
  poster.drawImage(elements.skinCanvas, x, y, width, height);
  poster.restore();

  poster.save();
  poster.globalCompositeOperation = "screen";
  poster.globalAlpha = Math.max(0.08, (brightness - 1) * 0.34);
  poster.drawImage(elements.skinCanvas, x, y, width, height);
  poster.restore();
}

function fitText(text, maxWidth, baseSize) {
  let size = baseSize;
  poster.font = `900 ${size}px Inter, Arial, sans-serif`;
  while (poster.measureText(text).width > maxWidth && size > 32) {
    size -= 2;
    poster.font = `900 ${size}px Inter, Arial, sans-serif`;
  }
  return size;
}

function drawText() {
  const nick = value("playerName") || "Gracz";
  const rank = rankLabels[value("rank")];
  const headline = value("headline")
    .replaceAll("{nick}", nick)
    .replaceAll("{rank}", rank);
  const subtitle = value("subtitle");
  const x = number("textX");
  const y = number("textY");
  const size = fitText(headline, 760, number("textSize"));

  poster.textBaseline = "alphabetic";
  poster.shadowColor = "rgba(0, 0, 0, 0.55)";
  poster.shadowBlur = 18;
  poster.shadowOffsetY = 7;
  poster.font = `900 ${size}px Inter, Arial, sans-serif`;
  poster.fillStyle = "#fff7df";
  poster.fillText(headline, x, y);

  poster.shadowBlur = 9;
  poster.font = "800 29px Inter, Arial, sans-serif";
  poster.fillStyle = "#f3d68d";
  poster.fillText(subtitle, x + 4, y + 48);

  poster.shadowBlur = 0;
  poster.fillStyle = "rgba(255, 255, 255, 0.12)";
  poster.fillRect(x, y + 72, 340, 3);
}

function drawBadge() {
  poster.save();
  poster.shadowColor = "transparent";
  poster.shadowBlur = 0;
  poster.shadowOffsetY = 0;

  const rank = value("rank");
  const label = {
    jr: "JR-ZASTĘPCA",
    regular: "ZASTĘPCA",
    senior: "SENIOR-ZASTĘPCA",
  }[rank];

  poster.font = "900 24px Inter, Arial, sans-serif";
  const width = poster.measureText(label).width + 42;
  poster.fillStyle = "rgba(214, 177, 94, 0.92)";
  poster.beginPath();
  poster.roundRect(86, 82, width, 48, 8);
  poster.fill();
  poster.fillStyle = "#1f1b13";
  poster.fillText(label, 107, 114);
  poster.restore();
}

function renderPoster() {
  applyViewerPose();
  drawBackground();
  drawPlayer();
  drawBadge();
  drawText();
}

function queueRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderPoster();
  });
}

async function loadSkinFromName() {
  const nick = value("playerName").trim() || "Steve";
  setStatus("Ładuję skin...");
  try {
    await skinViewer.loadSkin(`https://minotar.net/skin/${encodeURIComponent(nick)}`);
    setStatus("Skin załadowany");
    queueRender();
  } catch (error) {
    setStatus("Nie udało się załadować skina z nicku. Wgraj PNG ręcznie.");
  }
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.querySelector("#loadSkin").addEventListener("click", loadSkinFromName);

elements.skinUpload.addEventListener("change", async () => {
  const file = elements.skinUpload.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  await skinViewer.loadSkin(url);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus("Skin z pliku załadowany");
  queueRender();
});

elements.backgroundUpload.addEventListener("change", async () => {
  const file = elements.backgroundUpload.files?.[0];
  if (!file) return;
  backgroundImage = await loadImageFromFile(file);
  setStatus("Background załadowany");
  queueRender();
});

document.querySelectorAll("input, select").forEach((input) => {
  input.addEventListener("input", queueRender);
  input.addEventListener("change", queueRender);
});

document.querySelector("#basePreset").addEventListener("click", () => {
  Object.entries(basePreset).forEach(([key, val]) => {
    elements[key].value = val;
  });
  queueRender();
});

document.querySelector("#downloadImage").addEventListener("click", () => {
  try {
    const link = document.createElement("a");
    link.download = `al-rijad-${value("rank")}-${value("playerName") || "gracz"}.png`;
    link.href = elements.posterCanvas.toDataURL("image/png");
    link.click();
  } catch {
    setStatus("Eksport zablokowany przez CORS. Wgraj skin PNG ręcznie.");
  }
});

setTimeout(() => {
  renderPoster();
}, 700);
