const views = [
  document.getElementById("typeStep"),
  document.getElementById("worldStep"),
  document.getElementById("performanceStep"),
  document.getElementById("reviewStep")
];
const serviceStep = document.getElementById("serviceStep");
const wizardProgress = document.getElementById("wizardProgress");
const wizardFooter = document.getElementById("wizardFooter");
const wizardBackBtn = document.getElementById("wizardBackBtn");
const wizardNextBtn = document.getElementById("wizardNextBtn");
const stepHint = document.getElementById("stepHint");
const installError = document.getElementById("installError");
const installName = document.getElementById("installName");
const installVersion = document.getElementById("installVersion");
const installPort = document.getElementById("installPort");
const installRam = document.getElementById("installRam");
const ramValue = document.getElementById("ramValue");
const installAutoStart = document.getElementById("installAutoStart");
const reviewGrid = document.getElementById("reviewGrid");
const loaderCards = Array.from(document.querySelectorAll("[data-loader]"));
const loaderPrevBtn = document.getElementById("loaderPrevBtn");
const loaderNextBtn = document.getElementById("loaderNextBtn");
const loaderPageDots = document.getElementById("loaderPageDots");
const loaderPageStatus = document.getElementById("loaderPageStatus");
const typeStepTitle = document.getElementById("typeStepTitle");
const typeStepSubtitle = document.getElementById("typeStepSubtitle");
const detailsStepTitle = document.getElementById("detailsStepTitle");
const detailsStepSubtitle = document.getElementById("detailsStepSubtitle");
const installVersionField = document.getElementById("installVersionField");
const PROXY_LOADERS = new Set(["velocity", "bungeecord"]);

let currentStep = 0;
let selectedService = "minecraft";
let selectedLoader = "paper";
let submitting = false;
let loaderPage = 0;
const loaderPageSize = 3;

function getServiceLoaderCards() {
  return loaderCards.filter((card) => PROXY_LOADERS.has(card.dataset.loader) === (selectedService === "proxy"));
}

function renderLoaderPage() {
  const serviceCards = getServiceLoaderCards();
  const loaderPageCount = Math.max(1, Math.ceil(serviceCards.length / loaderPageSize));
  loaderPage = Math.max(0, Math.min(loaderPageCount - 1, loaderPage));
  loaderCards.forEach((card) => card.classList.add("loader-page-hidden"));
  serviceCards.forEach((card, index) => {
    card.classList.toggle("loader-page-hidden", Math.floor(index / loaderPageSize) !== loaderPage);
  });
  loaderPrevBtn.disabled = loaderPage === 0;
  loaderNextBtn.disabled = loaderPage === loaderPageCount - 1;
  loaderPageStatus.textContent = `${loaderPage + 1} / ${loaderPageCount}`;
  loaderPageDots.innerHTML = Array.from({ length: loaderPageCount }, (_, index) =>
    `<i class="${index === loaderPage ? "active" : ""}"></i>`
  ).join("");
}

function selectLoader(loader) {
  selectedLoader = loader;
  loaderCards.forEach((item) => {
    const selected = item.dataset.loader === loader;
    item.classList.toggle("selected", selected);
    item.setAttribute("aria-checked", selected ? "true" : "false");
    item.querySelector(".select-label").textContent = selected
      ? "Selected"
      : `Select ${item.querySelector("strong")?.textContent || item.dataset.loader}`;
  });
}

function selectService(service) {
  selectedService = service === "proxy" ? "proxy" : "minecraft";
  selectLoader(selectedService === "proxy" ? "velocity" : "paper");
  loaderPage = 0;
  typeStepTitle.textContent = selectedService === "proxy" ? "Proxy Type Setup" : "Server Type Setup";
  typeStepSubtitle.textContent = selectedService === "proxy"
    ? "Select the proxy software for your Minecraft network."
    : "Select the type of Minecraft server you want to run.";
  detailsStepTitle.textContent = selectedService === "proxy" ? "Proxy Details" : "World Setup";
  detailsStepSubtitle.textContent = selectedService === "proxy"
    ? "Name the proxy and choose its public listening port."
    : "Name the server and choose its Minecraft version and port.";
  installVersionField.classList.toggle("hidden", selectedService === "proxy");
  installName.placeholder = selectedService === "proxy" ? "Network Proxy" : "Survival Server";
  renderLoaderPage();
  showStep(0);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  }[char]));
}

function renderReview() {
  const items = [
    [selectedService === "proxy" ? "Proxy software" : "Server type", selectedLoader === "bungeecord" ? "BungeeCord" : selectedLoader[0].toUpperCase() + selectedLoader.slice(1)],
    ["Name", installName.value.trim() || "Not set"],
    [selectedService === "proxy" ? "Release" : "Minecraft", selectedService === "proxy" ? "Latest stable" : installVersion.value],
    ["Port", installPort.value],
    ["Memory", `${installRam.value} GB`],
    ["Auto-start", installAutoStart.checked ? "Enabled" : "Disabled"]
  ];
  reviewGrid.innerHTML = items.map(([label, value]) => `
    <div class="review-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
  `).join("");
}

function showStep(step) {
  currentStep = Math.max(0, Math.min(3, step));
  serviceStep.classList.remove("active");
  views.forEach((view, index) => view.classList.toggle("active", index === currentStep));
  wizardProgress.classList.remove("hidden");
  wizardFooter.classList.remove("hidden");
  document.querySelectorAll("[data-progress-step]").forEach((button, index) => {
    button.classList.toggle("active", index === currentStep);
    button.classList.toggle("done", index < currentStep);
  });
  if (currentStep === 3) renderReview();
  stepHint.textContent = `Step ${currentStep + 1} of 4`;
  wizardBackBtn.textContent = currentStep === 0 ? "Services" : "Back";
  wizardNextBtn.textContent = currentStep === 3 ? (selectedService === "proxy" ? "Create Proxy" : "Create Server") : "Continue";
  installError.textContent = "";
}

function showServices() {
  currentStep = 0;
  serviceStep.classList.add("active");
  views.forEach((view) => view.classList.remove("active"));
  wizardProgress.classList.add("hidden");
  wizardFooter.classList.add("hidden");
}

function validateStep() {
  if (currentStep !== 1) return true;
  const name = installName.value.trim();
  const port = Number(installPort.value);
  if (!name) {
    installName.focus();
    return false;
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    installPort.focus();
    return false;
  }
  return true;
}

async function createServer() {
  if (submitting) return;
  submitting = true;
  wizardNextBtn.disabled = true;
  wizardNextBtn.textContent = "Creating...";
  installError.textContent = "";
  try {
    const response = await fetch("/api/servers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        name: installName.value.trim(),
        loader: selectedLoader,
        mcVersion: selectedService === "proxy" ? "latest" : installVersion.value,
        port: Number(installPort.value),
        ramGb: Number(installRam.value),
        autoStart: installAutoStart.checked
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (response.status === 401) {
      window.location.assign("/");
      return;
    }
    if (!response.ok) throw new Error(payload.error || "Server creation failed.");
    if (payload?.server?.id) {
      localStorage.setItem("vyron-pending-onboarding", payload.server.id);
    }
    window.location.assign("/");
  } catch (error) {
    installError.textContent = error.message || "Server creation failed.";
    wizardNextBtn.disabled = false;
    wizardNextBtn.textContent = selectedService === "proxy" ? "Create Proxy" : "Create Server";
    submitting = false;
  }
}

document.querySelector('[data-service="minecraft"]')?.addEventListener("click", () => selectService("minecraft"));
document.querySelector('[data-service="proxy"]')?.addEventListener("click", () => selectService("proxy"));
loaderCards.forEach((card) => {
  card.addEventListener("click", () => {
    selectLoader(card.dataset.loader);
  });
});
loaderPrevBtn.addEventListener("click", () => { loaderPage -= 1; renderLoaderPage(); });
loaderNextBtn.addEventListener("click", () => { loaderPage += 1; renderLoaderPage(); });
wizardBackBtn.addEventListener("click", () => currentStep === 0 ? showServices() : showStep(currentStep - 1));
wizardNextBtn.addEventListener("click", () => {
  if (!validateStep()) return;
  if (currentStep === 3) createServer();
  else showStep(currentStep + 1);
});
document.querySelectorAll("[data-progress-step]").forEach((button, index) => {
  button.addEventListener("click", () => {
    if (index <= currentStep && validateStep()) showStep(index);
  });
});
installRam.addEventListener("input", () => { ramValue.textContent = installRam.value; });
document.getElementById("closeInstallBtn").addEventListener("click", () => window.location.assign("/"));
renderLoaderPage();

fetch("/api/auth/status", { credentials: "same-origin" })
  .then((response) => response.json())
  .then((status) => { if (!status.authenticated) window.location.assign("/"); })
  .catch(() => window.location.assign("/"));
