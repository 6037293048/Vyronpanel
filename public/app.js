const serverListEl = document.getElementById("serverList");
const statsEl = document.getElementById("stats");
const serverCountText = document.getElementById("serverCountText");

const modal = document.getElementById("serverModal");
const serverForm = document.getElementById("serverForm");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");
const saveServerBtn = document.getElementById("saveServerBtn");
const customJarField = document.getElementById("customJarField");
const customJarInput = document.getElementById("customJarInput");
const customJarLabel = document.getElementById("customJarLabel");
const creationKindStep = document.getElementById("creationKindStep");
const serverConfigStep = document.getElementById("serverConfigStep");
const creationBackBtn = document.getElementById("creationBackBtn");
const serverLoaderField = document.getElementById("serverLoaderField");
const serverVersionField = document.getElementById("serverVersionField");
const voiceProxyPluginField = document.getElementById("voiceProxyPluginField");
const voiceProxyPluginInput = document.getElementById("voiceProxyPluginInput");
const SERVICE_PROXY_LOADERS = new Set(["velocity", "bungeecord", "custom-proxy"]);
const MINECRAFT_LOADER_OPTIONS = [
  ["vanilla", "Vanilla"], ["paper", "Paper"], ["purpur", "Purpur"],
  ["fabric", "Fabric"], ["forge", "Forge"], ["quilt", "Quilt"],
  ["neoforge", "NeoForge"], ["folia", "Folia"], ["custom", "Custom (Upload JAR)"]
];
const SERVICE_PROXY_LOADER_OPTIONS = [
  ["velocity", "Velocity (Recommended)"],
  ["bungeecord", "BungeeCord"],
  ["custom-proxy", "Custom Proxy (Upload JAR)"]
];

const openCreateBtn = document.getElementById("openCreateBtn");
const logoutBtn = document.getElementById("logoutBtn");
const startAllBtn = document.getElementById("startAllBtn");
const stopAllBtn = document.getElementById("stopAllBtn");
const seedBtn = document.getElementById("seedBtn");
const donateOpenBtn = document.getElementById("donateOpenBtn");
const donateOverlayPanel = document.getElementById("donateOverlayPanel");
const donateCloseBtn = document.getElementById("donateCloseBtn");
const panelDonateFrameEl = document.getElementById("panelDonateFrame");
const javaStatusText = document.getElementById("javaStatusText");
const refreshJavaBtn = document.getElementById("refreshJavaBtn");
const installJavaBtn = document.getElementById("installJavaBtn");
const panelUpdateBanner = document.getElementById("panelUpdateBanner");
const panelUpdateText = document.getElementById("panelUpdateText");
const panelUpdateBtn = document.getElementById("panelUpdateBtn");

const authGate = document.getElementById("authGate");
const authForm = document.getElementById("authForm");
const authModeLabel = document.getElementById("authModeLabel");
const authTitle = document.getElementById("authTitle");
const authSubtitle = document.getElementById("authSubtitle");
const authError = document.getElementById("authError");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authConnectionStatus = document.getElementById("authConnectionStatus");
const authPasswordToggle = document.getElementById("authPasswordToggle");
const authCapsLock = document.getElementById("authCapsLock");
const appShell = document.querySelector(".app-shell");
const sidebarToggleBtn = document.getElementById("sidebarToggleBtn");

const template = document.getElementById("serverCardTemplate");
const detailNameEl = document.getElementById("detailName");
const detailMetaEl = document.getElementById("detailMeta");
const detailBadgeEl = document.getElementById("detailBadge");
const detailContentEl = document.getElementById("detailContent");
const detailTabsEl = document.getElementById("detailTabs");
const backToOverviewBtn = document.getElementById("backToOverviewBtn");
const sidebarNavItems = Array.from(document.querySelectorAll(".nav-item[data-tab]"));
const editorOverlayEl = document.getElementById("editorOverlay");
const editorTabsBarEl = document.getElementById("editorTabsBar");
const editorPathTextEl = document.getElementById("editorPathText");
const editorCloseBtn = document.getElementById("editorCloseBtn");
const editorUploadInput = document.getElementById("editorUploadInput");
const storeOverlayEl = document.getElementById("storeOverlay");
const storeCloseBtn = document.getElementById("storeCloseBtn");
const storeTabBar = document.getElementById("storeTabBar");
const storeQueryInput = document.getElementById("storeQueryInput");
const storeSortSelect = document.getElementById("storeSortSelect");
const storeLoaderSelect = document.getElementById("storeLoaderSelect");
const storeVersionSelect = document.getElementById("storeVersionSelect");
const storeStatusText = document.getElementById("storeStatusText");
const storeResultsGrid = document.getElementById("storeResultsGrid");
const storeSearchBtn = document.getElementById("storeSearchBtn");
const storePagination = document.getElementById("storePagination");
const storePrevPageBtn = document.getElementById("storePrevPageBtn");
const storeNextPageBtn = document.getElementById("storeNextPageBtn");
const storePageInput = document.getElementById("storePageInput");
const storePageCount = document.getElementById("storePageCount");
const storeResultRange = document.getElementById("storeResultRange");
const storeProjectDetailEl = document.getElementById("storeProjectDetail");
const storeProjectDetailContent = document.getElementById("storeProjectDetailContent");
const storeProjectDetailActions = document.getElementById("storeProjectDetailActions");
const playerOverlayEl = document.getElementById("playerOverlay");
const playerCloseBtn = document.getElementById("playerCloseBtn");
const playerPopupTitle = document.getElementById("playerPopupTitle");
const playerPopupMeta = document.getElementById("playerPopupMeta");
const playerStatsGrid = document.getElementById("playerStatsGrid");
const playerEffectsList = document.getElementById("playerEffectsList");
const playerInventoryGrid = document.getElementById("playerInventoryGrid");
const playerInventorySource = document.getElementById("playerInventorySource");
const playerEffectSelect = document.getElementById("playerEffectSelect");
const playerEffectDuration = document.getElementById("playerEffectDuration");
const playerEffectAmplifier = document.getElementById("playerEffectAmplifier");
const playerActionReason = document.getElementById("playerActionReason");
const aiFabBtn = document.getElementById("aiFabBtn");
const aiWidgetEl = document.getElementById("aiWidget");
const aiWidgetCloseBtn = document.getElementById("aiWidgetCloseBtn");
const aiWidgetMessagesEl = document.getElementById("aiWidgetMessages");
const aiWidgetInputEl = document.getElementById("aiWidgetInput");
const aiWidgetSendBtn = document.getElementById("aiWidgetSendBtn");
const aiConfirmBarEl = document.getElementById("aiConfirmBar");
const aiConfirmTextEl = document.getElementById("aiConfirmText");
const aiConfirmAcceptBtn = document.getElementById("aiConfirmAcceptBtn");
const aiConfirmDeclineBtn = document.getElementById("aiConfirmDeclineBtn");
const aiQuestionBarEl = document.getElementById("aiQuestionBar");
const aiQuestionTextEl = document.getElementById("aiQuestionText");
const aiQuestionInputEl = document.getElementById("aiQuestionInput");
const aiQuestionSendBtn = document.getElementById("aiQuestionSendBtn");
const aiQuestionAnswerBtn = document.getElementById("aiQuestionAnswerBtn");
const aiQuestionDismissBtn = document.getElementById("aiQuestionDismissBtn");
const aiThreadListEl = document.getElementById("aiThreadList");
const aiNewThreadBtn = document.getElementById("aiNewThreadBtn");
const eulaModal = document.getElementById("eulaModal");
const eulaAcceptBtn = document.getElementById("eulaAcceptBtn");
const eulaDeclineBtn = document.getElementById("eulaDeclineBtn");
const fileContextMenuEl = document.getElementById("fileContextMenu");
const addonContextMenuEl = document.getElementById("addonContextMenu");
const worldContextMenuEl = document.getElementById("worldContextMenu");
const serverContextMenuEl = document.getElementById("serverContextMenu");
const serverImportInput = document.getElementById("serverImportInput");
const worldImportInput = document.getElementById("worldImportInput");
const toastRegionEl = document.getElementById("toastRegion");
const uploadQueuePanelEl = document.getElementById("uploadQueuePanel");
const uploadQueueListEl = document.getElementById("uploadQueueList");
const uploadQueueClearBtn = document.getElementById("uploadQueueClearBtn");
const cookieConsentEl = document.getElementById("cookieConsent");
const cookieNecessaryBtn = document.getElementById("cookieNecessaryBtn");
const cookieAcceptBtn = document.getElementById("cookieAcceptBtn");
const COOKIE_CONSENT_KEY = "vyron_cookie_consent";
const serverOnboardingOverlay = document.getElementById("serverOnboardingOverlay");
const serverOnboardingUsernameStep = document.getElementById("serverOnboardingUsernameStep");
const serverOnboardingProgressStep = document.getElementById("serverOnboardingProgressStep");
const serverOnboardingProgressTitle = document.getElementById("serverOnboardingProgressTitle");
const serverOnboardingProgressEyebrow = document.getElementById("serverOnboardingProgressEyebrow");
const serverOnboardingForm = document.getElementById("serverOnboardingForm");
const serverOnboardingUsername = document.getElementById("serverOnboardingUsername");
const serverOnboardingEula = document.getElementById("serverOnboardingEula");
const serverOnboardingFormError = document.getElementById("serverOnboardingFormError");
const serverOnboardingStatusList = document.getElementById("serverOnboardingStatusList");
const serverOnboardingAddress = document.getElementById("serverOnboardingAddress");
const serverOnboardingAddressLabel = document.getElementById("serverOnboardingAddressLabel");
const serverOnboardingAddressValue = document.getElementById("serverOnboardingAddressValue");
const serverOnboardingProgressError = document.getElementById("serverOnboardingProgressError");
const serverOnboardingSkipBtn = document.getElementById("serverOnboardingSkipBtn");
const serverOnboardingRetryBtn = document.getElementById("serverOnboardingRetryBtn");
const serverOnboardingContinueBtn = document.getElementById("serverOnboardingContinueBtn");
const serverOnboardingCopyBtn = document.getElementById("serverOnboardingCopyBtn");
const serverOnboardingSnakeBtn = document.getElementById("serverOnboardingSnakeBtn");
const serverOnboardingSnakePanel = document.getElementById("serverOnboardingSnakePanel");
const serverOnboardingSnakeCanvas = document.getElementById("serverOnboardingSnakeCanvas");
const serverOnboardingSnakeScore = document.getElementById("serverOnboardingSnakeScore");
const serverOnboardingSnakeMessage = document.getElementById("serverOnboardingSnakeMessage");
const serverOnboardingSnakeCloseBtn = document.getElementById("serverOnboardingSnakeCloseBtn");
const serverOnboardingSnakeRestartBtn = document.getElementById("serverOnboardingSnakeRestartBtn");

let servers = [];
let editTargetId = null;
let creationKind = "minecraft";
let eulaAcceptanceCallback = null;
let selectedServerId = null;
let selectedTab = "console";
let currentRouteSlug = getRouteSlug();
let authMode = "login";
let authSubmitting = false;
let consolePollId = null;
const consoleStreams = new Map();
let javaStatus = null;
let panelVersionStatus = null;
let panelUpdateBusy = false;
let tabPollId = null;
let monitoringData = null;
const MAX_MONITORING_POINTS = 60;
const monitoringHistoryByServer = new Map();
let configState = { raw: "", properties: {} };
let proxyRoutesState = { serverId: "", routes: [], configFile: "", generated: true, error: "" };
let worldsState = [];
let backupsState = [];
let playersState = [];
let selectedPlayerName = "";
let storeState = {
  query: "",
  type: "all",
  tab: "all",
  sort: "downloads",
  loading: false,
  error: "",
  results: [],
  page: 1,
  pageSize: 100,
  totalHits: 0,
  offset: 0,
  selectedProjectId: "",
  selectedProjectType: "",
  projectDetail: null,
  detailLoading: false,
  detailTab: "overview",
  installingVersionId: "",
  versions: [],
  selectedLoader: "",
  selectedVersionId: ""
};
const STORE_SUPPORTED_TYPES = new Set(["all", "plugin", "mod", "modpack", "datapack", "resourcepack"]);
const STORE_LIKES_KEY = "vyron_store_likes";
const VYRON_ACCOUNT_TOKEN_KEY = "vyron_account_token";
let storeLikedProjects = loadStoreLikes();
let fileManagerState = { path: "", entries: [] };
let fileContextState = { path: "", kind: "file" };
let addonContextState = { id: "", name: "" };
let worldContextState = { name: "", seed: "" };
let serverContextState = { id: "", name: "" };
let premiumState = { loading: false, error: "", account: null };
let uploadQueue = [];
let uploadQueueRunning = false;
let activeFileDropTarget = null;
let serverOnboardingState = {
  server: null,
  username: "",
  running: false,
  complete: false,
  error: "",
  steps: ["pending", "pending", "pending"]
};
let onboardingSnakeTimer = null;
let onboardingSnake = [];
let onboardingSnakeFood = { x: 14, y: 10 };
let onboardingSnakeDirection = { x: 1, y: 0 };
let onboardingSnakeNextDirection = { x: 1, y: 0 };
let onboardingSnakeScoreValue = 0;
let fileEditorState = { path: "", content: "" };
let fileEditorTabs = [];
let activeFileEditorPath = "";
let aceEditor = null;
let shouldStickToBottom = true;
let tabRefreshVersion = 0;
let playerPopupState = {
  loading: false,
  error: "",
  sourceFile: "",
  player: null,
  stats: null,
  effects: [],
  inventory: []
};
let aiState = {
  status: null,
  loading: false,
  activeThreadId: "",
  threads: []
};

function createAiThread(initialTitle = "New Chat") {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: String(initialTitle || "New Chat").slice(0, 40),
    pendingActions: [],
    pendingQuestion: null,
    messages: [
      {
        role: "assistant",
        text: "What do you want me to do on this server?"
      }
    ]
  };
}

function ensureAiState() {
  if (!Array.isArray(aiState.threads) || !aiState.threads.length) {
    const first = createAiThread();
    aiState.threads = [first];
    aiState.activeThreadId = first.id;
    return;
  }

  if (!aiState.threads.some((thread) => thread.id === aiState.activeThreadId)) {
    aiState.activeThreadId = aiState.threads[0].id;
  }
}

function getAiStorageKey() {
  return "vyron_ai_threads_v1";
}

function persistAiThreads() {
  try {
    const payload = {
      activeThreadId: aiState.activeThreadId,
      threads: (aiState.threads || []).slice(0, 12).map((thread) => ({
        id: thread.id,
        title: String(thread.title || "New Chat").slice(0, 40),
        pendingActions: Array.isArray(thread.pendingActions) ? thread.pendingActions.slice(0, 6) : [],
        pendingQuestion: thread.pendingQuestion && typeof thread.pendingQuestion === "object"
          ? {
            type: String(thread.pendingQuestion.type || ""),
            text: String(thread.pendingQuestion.text || "")
          }
          : null,
        messages: Array.isArray(thread.messages) ? thread.messages.slice(-80) : []
      }))
    };
    localStorage.setItem(getAiStorageKey(), JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
}

function loadAiThreads() {
  try {
    const raw = localStorage.getItem(getAiStorageKey());
    if (!raw) {
      ensureAiState();
      return;
    }

    const parsed = JSON.parse(raw);
    const threads = Array.isArray(parsed?.threads)
      ? parsed.threads
        .map((thread) => ({
          id: String(thread.id || ""),
          title: String(thread.title || "New Chat"),
          pendingActions: Array.isArray(thread.pendingActions) ? thread.pendingActions.map((item) => String(item || "")) : [],
          pendingQuestion: thread.pendingQuestion && typeof thread.pendingQuestion === "object"
            ? {
              type: String(thread.pendingQuestion.type || ""),
              text: String(thread.pendingQuestion.text || "")
            }
            : null,
          messages: Array.isArray(thread.messages)
            ? thread.messages.map((msg) => ({ role: msg?.role === "user" ? "user" : "assistant", text: String(msg?.text || "") }))
            : []
        }))
        .filter((thread) => thread.id)
      : [];

    aiState.threads = threads;
    aiState.activeThreadId = String(parsed?.activeThreadId || "");
    ensureAiState();
  } catch {
    ensureAiState();
  }
}

function getActiveAiThread() {
  ensureAiState();
  return aiState.threads.find((thread) => thread.id === aiState.activeThreadId) || aiState.threads[0];
}

function setActiveAiThread(threadId) {
  if (!threadId || !aiState.threads.some((thread) => thread.id === threadId)) {
    return;
  }
  aiState.activeThreadId = threadId;
  persistAiThreads();
  renderAiWidget();
}

function createNewAiThread() {
  const thread = createAiThread();
  aiState.threads.unshift(thread);
  aiState.activeThreadId = thread.id;
  aiState.loading = false;
  persistAiThreads();
  renderAiWidget();
}

function deleteAiThread(threadId) {
  if (!threadId) {
    return;
  }

  const existing = Array.isArray(aiState.threads) ? aiState.threads : [];
  const nextThreads = existing.filter((thread) => thread.id !== threadId);
  if (!nextThreads.length) {
    const fresh = createAiThread();
    aiState.threads = [fresh];
    aiState.activeThreadId = fresh.id;
  } else {
    aiState.threads = nextThreads;
    if (!nextThreads.some((thread) => thread.id === aiState.activeThreadId)) {
      aiState.activeThreadId = nextThreads[0].id;
    }
  }

  aiState.loading = false;
  persistAiThreads();
  renderAiWidget();
}

function renderAiThreadList() {
  if (!aiThreadListEl) {
    return;
  }
  const threads = Array.isArray(aiState.threads) ? aiState.threads : [];
  aiThreadListEl.innerHTML = threads
    .slice(0, 8)
    .map((thread) => {
      const active = thread.id === aiState.activeThreadId;
      const cls = active ? "ai-thread-chip active" : "ai-thread-chip";
      return `<div class="ai-thread-chip-wrap ${active ? "active" : ""}">
        <button class="${cls}" type="button" data-ai-thread-id="${escapeAttr(thread.id)}">${escapeHtml(thread.title || "New Chat")}</button>
        <button class="ai-thread-delete" type="button" data-ai-delete-thread="${escapeAttr(thread.id)}" aria-label="Delete chat">x</button>
      </div>`;
    })
    .join("");
}

loadAiThreads();
const PLAYER_EFFECTS = [
  "speed", "slowness", "haste", "mining_fatigue", "strength", "instant_health", "instant_damage",
  "jump_boost", "nausea", "regeneration", "resistance", "fire_resistance", "water_breathing", "invisibility",
  "blindness", "night_vision", "hunger", "weakness", "poison", "wither", "health_boost", "absorption",
  "saturation", "glowing", "levitation", "luck", "unluck", "slow_falling", "conduit_power", "dolphins_grace",
  "bad_omen", "hero_of_the_village", "darkness", "trial_omen", "raid_omen", "wind_charged", "weaving",
  "oozing", "infested"
];
const PLAYER_MAIN_SLOTS = Array.from({ length: 27 }, (_, i) => ({ slot: i + 9, label: `Inventory ${i + 1}` }));
const PLAYER_HOTBAR_SLOTS = Array.from({ length: 9 }, (_, i) => ({ slot: i, label: `Hotbar ${i + 1}` }));
const PLAYER_ARMOR_SLOTS = [
  { slot: 103, label: "Helmet" },
  { slot: 102, label: "Chestplate" },
  { slot: 101, label: "Leggings" },
  { slot: 100, label: "Boots" }
];
const PLAYER_OFFHAND_SLOT = { slot: 40, label: "Offhand" };

function isEditorPopupOpen() {
  return Boolean(editorOverlayEl && !editorOverlayEl.classList.contains("hidden"));
}

function isPlayerPopupOpen() {
  return Boolean(playerOverlayEl && !playerOverlayEl.classList.contains("hidden"));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getRouteSlug() {
  return decodeURIComponent(window.location.pathname.slice(1).split("/").filter(Boolean)[0] || "");
}

function getServerSlug(server) {
  return slugify(server?.name || server?.id || "");
}

function syncRouteMode() {
  document.body.classList.toggle("server-route", Boolean(currentRouteSlug));
}

function findServerForRoute() {
  if (!currentRouteSlug) {
    return null;
  }

  return servers.find((item) => getServerSlug(item) === currentRouteSlug || item.id === currentRouteSlug) || null;
}

function formatTime(iso) {
  if (!iso) {
    return "Never";
  }
  const date = new Date(iso);
  return date.toLocaleString();
}

function setFormValues(server) {
  serverForm.name.value = server?.name || "";
  serverForm.loader.value = (server?.loader || "paper").toLowerCase();
  serverForm.mcVersion.value = server?.mcVersion || "1.21.11";
  serverForm.port.value = server?.port || "";
  serverForm.ramGb.value = server?.ramGb || "";
  if (serverForm.autoStart) {
    serverForm.autoStart.checked = server?.autoStart !== false;
  }
  if (customJarInput) {
    customJarInput.value = "";
  }
  updateCustomJarFormState();
}

function setServerLoaderOptions(kind, selectedLoader = "") {
  const options = kind === "service-proxy" ? SERVICE_PROXY_LOADER_OPTIONS : MINECRAFT_LOADER_OPTIONS;
  serverForm.loader.innerHTML = options
    .map(([value, label]) => `<option value="${escapeAttr(value)}">${escapeHtml(label)}</option>`)
    .join("");
  const fallback = kind === "service-proxy" ? "velocity" : "paper";
  serverForm.loader.value = options.some(([value]) => value === selectedLoader) ? selectedLoader : fallback;
}

function updateCustomJarFormState() {
  if (!serverForm || !customJarField || !customJarInput) {
    return;
  }

  const selectedLoader = String(serverForm.loader?.value || "").toLowerCase();
  const isCustom = selectedLoader === "custom" || selectedLoader === "custom-proxy";
  customJarField.classList.toggle("hidden", !isCustom);
  customJarInput.required = isCustom && !editTargetId;

  if (!isCustom) {
    customJarInput.value = "";
  }
}

function getRuntimeLabel(server) {
  if (SERVICE_PROXY_LOADERS.has(String(server?.loader || "").toLowerCase())) {
    const labels = { velocity: "Velocity Proxy", bungeecord: "BungeeCord Proxy", "custom-proxy": "Custom Proxy" };
    return labels[String(server.loader).toLowerCase()] || "Server Proxy";
  }
  if (server?.mcVersion && server?.loader) {
    return `${server.mcVersion} ${server.loader}`;
  }
  return server?.version || "unknown runtime";
}

const MINECRAFT_DETAIL_TABS = [
  ["console", "Console"], ["chat", "Chat"], ["errors", "Errors"], ["warnings", "Warnings"],
  ["players", "Player Manager"], ["files", "File Manager"], ["config", "Config"], ["worlds", "Worlds"],
  ["addons", "Addons"], ["logs", "Logs"], ["network", "Network"], ["backups", "Backups"],
  ["schedules", "Schedules"], ["monitoring", "Monitoring"], ["activity", "Activity"]
];

const PROXY_DETAIL_TABS = [
  ["proxy-overview", "Proxy Overview"], ["console", "Console"], ["addons", "Plugins"],
  ["files", "Files"], ["proxy-config", "Proxy Config"], ["network", "Routing"],
  ["logs", "Logs"], ["monitoring", "Monitoring"], ["backups", "Backups"],
  ["schedules", "Schedules"], ["activity", "Activity"]
];

function syncServerNavigation(server) {
  const isProxy = SERVICE_PROXY_LOADERS.has(String(server?.loader || "").toLowerCase());
  const tabs = isProxy ? PROXY_DETAIL_TABS : MINECRAFT_DETAIL_TABS;
  const allowedTabs = new Set(tabs.map(([name]) => name));
  if (!allowedTabs.has(selectedTab)) selectedTab = isProxy ? "proxy-overview" : "console";

  detailTabsEl.innerHTML = tabs.map(([name, label]) =>
    `<button class="detail-tab ${selectedTab === name ? "active" : ""}" data-tab="${escapeAttr(name)}">${escapeHtml(label)}</button>`
  ).join("");

  const scopeLabel = document.getElementById("serverScopeNavLabel");
  if (scopeLabel) scopeLabel.textContent = isProxy ? "Proxy" : "Minecraft";
  document.querySelectorAll("[data-proxy-only]").forEach((element) => element.classList.toggle("hidden", !isProxy));
  document.querySelectorAll("[data-minecraft-only]").forEach((element) => element.classList.toggle("hidden", isProxy));

  const configNav = document.querySelector('.nav-item[data-tab="config"], .nav-item[data-tab="proxy-config"]');
  if (configNav) {
    configNav.dataset.tab = isProxy ? "proxy-config" : "config";
    configNav.title = isProxy ? "Proxy Config" : "Config";
    const label = configNav.querySelector(".nav-text");
    if (label) label.textContent = isProxy ? "Proxy Config" : "Config";
  }
  const addonsNav = document.querySelector('.nav-item[data-tab="addons"] .nav-text');
  if (addonsNav) addonsNav.textContent = isProxy ? "Plugins" : "Addons";
  const networkNav = document.querySelector('.nav-item[data-tab="network"]');
  if (networkNav) {
    networkNav.title = isProxy ? "Routing" : "Network";
    const label = networkNav.querySelector(".nav-text");
    if (label) label.textContent = isProxy ? "Routing" : "Network";
  }
  sidebarNavItems.forEach((button) => button.classList.toggle("tab-active", button.dataset.tab === selectedTab));
}

function getSelectedServer() {
  if (currentRouteSlug) {
    return findServerForRoute();
  }

  return servers.find((item) => item.id === selectedServerId) || servers[0] || null;
}

function shortDateTime(iso) {
  if (!iso) {
    return "N/A";
  }
  return new Date(iso).toLocaleString();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function compactText(value, maxLength = 60) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function renderConsoleLines(lines) {
  const safeLines = Array.isArray(lines) ? lines : [];
  if (!safeLines.length) {
    return '<div class="console-line">No console output yet. Start the server to stream logs.</div>';
  }
  return safeLines.map((line) => {
    const text = String(line || "");
    const severity = /\b(fatal|error|exception|failed)\b/i.test(text)
      ? "error"
      : /\bwarn(?:ing)?\b/i.test(text)
        ? "warning"
        : /\b(done|started|success|ready)\b/i.test(text)
          ? "success"
          : /<[^>]{1,24}>/.test(text) ? "chat" : "info";
    const ansiColors = { 30: "black", 31: "red", 32: "green", 33: "yellow", 34: "blue", 35: "magenta", 36: "cyan", 37: "white", 90: "gray", 91: "red", 92: "green", 93: "yellow", 94: "blue", 95: "magenta", 96: "cyan", 97: "white" };
    let activeColor = "";
    let bold = false;
    let markup = "";
    let cursor = 0;
    const ansi = /\x1b\[([0-9;]*)m/g;
    for (const match of text.matchAll(ansi)) {
      const chunk = text.slice(cursor, match.index);
      if (chunk) markup += `<span class="${activeColor ? `ansi-${activeColor}` : ""}${bold ? " ansi-bold" : ""}">${escapeHtml(chunk)}</span>`;
      for (const code of (match[1] || "0").split(";").map(Number)) {
        if (code === 0) { activeColor = ""; bold = false; }
        else if (code === 1) bold = true;
        else if (ansiColors[code]) activeColor = ansiColors[code];
      }
      cursor = Number(match.index) + match[0].length;
    }
    const tail = text.slice(cursor);
    if (tail || !markup) markup += `<span class="${activeColor ? `ansi-${activeColor}` : ""}${bold ? " ansi-bold" : ""}">${escapeHtml(tail)}</span>`;
    return `<div class="console-line console-${severity}">${markup}</div>`;
  }).join("");
}

function extractWarningLines(lines) {
  const safeLines = Array.isArray(lines) ? lines : [];
  return safeLines.filter((line) => /\b(warn|error|exception|failed|fatal)\b/i.test(String(line || "")));
}

function extractChatMessages(lines) {
  const safeLines = Array.isArray(lines) ? lines : [];
  return safeLines
    .map((line) => {
      const text = String(line || "");
      const match = text.match(/<([^>]{1,20})>\s*(.+)$/);
      if (!match) {
        return null;
      }
      return { player: match[1], message: match[2], raw: text };
    })
    .filter(Boolean);
}

function derivePlayerState(lines, maxPlayers = 20) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const online = new Set();
  const recentEvents = [];

  for (const line of safeLines) {
    const text = String(line || "");
    const join = text.match(/([A-Za-z0-9_]{3,16})\s+joined the game/i);
    const left = text.match(/([A-Za-z0-9_]{3,16})\s+left the game/i);

    if (join) {
      const name = join[1];
      online.add(name);
      recentEvents.push(`${name} joined`);
      continue;
    }

    if (left) {
      const name = left[1];
      online.delete(name);
      recentEvents.push(`${name} left`);
    }
  }

  return {
    online: Array.from(online),
    recentEvents: recentEvents.slice(-8),
    maxPlayers
  };
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value < 1024) {
    return `${Math.max(0, Math.round(value))} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function getPanelHostAddress() {
  const host = String(window.location.hostname || "").trim();
  if (!host) {
    return "localhost";
  }

  if (host === "::1") {
    return "localhost";
  }

  if (host.startsWith("[") && host.endsWith("]")) {
    return host.slice(1, -1) || "localhost";
  }

  return host;
}

function formatTrafficRate(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num <= 0) {
    return "0.00 MB/s";
  }
  return `${num.toFixed(2)} MB/s`;
}

async function copyTextToClipboard(text) {
  const value = String(text || "").trim();
  if (!value) {
    throw new Error("Nothing to copy.");
  }

  const clipboard = globalThis.navigator?.clipboard;
  if (clipboard && typeof clipboard.writeText === "function") {
    try {
      await clipboard.writeText(value);
      return;
    } catch {
      // Fall back for HTTP/LAN contexts and blocked clipboard permissions.
    }
  }

  const tempInput = document.createElement("textarea");
  tempInput.value = value;
  tempInput.setAttribute("readonly", "true");
  tempInput.style.position = "fixed";
  tempInput.style.opacity = "0";
  document.body.appendChild(tempInput);
  tempInput.select();
  const ok = document.execCommand("copy");
  tempInput.remove();
  if (!ok) {
    throw new Error("Clipboard is not available.");
  }
}

function showToast(message, type = "success") {
  if (!toastRegionEl) {
    return;
  }
  const toast = document.createElement("div");
  toast.className = `toast-message ${type === "error" ? "error" : "success"}`;
  toast.textContent = String(message || "Done");
  toastRegionEl.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 180);
  }, 3200);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function setCookieConsent(choice) {
  try { localStorage.setItem(COOKIE_CONSENT_KEY, choice); } catch {}
  cookieConsentEl?.classList.add("hidden");
}

function initializeCookieConsent() {
  let choice = "";
  try { choice = localStorage.getItem(COOKIE_CONSENT_KEY) || ""; } catch {}
  cookieConsentEl?.classList.toggle("hidden", Boolean(choice));
}

function getInternalServerAddress(server) {
  const host = getPanelHostAddress();
  const formattedHost = host.includes(":") ? `[${host}]` : host;
  return `${formattedHost}:${server.port}`;
}

function renderServerOnboarding() {
  const isProxy = SERVICE_PROXY_LOADERS.has(String(serverOnboardingState.server?.loader || "").toLowerCase());
  const proxyName = getRuntimeLabel(serverOnboardingState.server).replace(/ Proxy$/, "");
  const labels = isProxy
    ? ["Preparing proxy files", `Starting ${proxyName} proxy`, "Opening proxy listener"]
    : [
        `Adding ${serverOnboardingState.username || "player"} to operators`,
        "Preparing server files",
        "Starting Minecraft server"
      ];
  if (serverOnboardingStatusList) {
    serverOnboardingStatusList.innerHTML = labels.map((label, index) => {
      const status = serverOnboardingState.steps[index] || "pending";
      return `<div class="server-onboarding-status-row ${escapeAttr(status)}"><span class="server-onboarding-status-icon"></span><span>${escapeHtml(label)}</span></div>`;
    }).join("");
  }
  if (serverOnboardingProgressError) {
    serverOnboardingProgressError.textContent = serverOnboardingState.error || "";
  }
  if (serverOnboardingProgressTitle) {
    serverOnboardingProgressTitle.textContent = serverOnboardingState.complete
      ? (isProxy ? "Your proxy is ready" : "Your server is ready")
      : (serverOnboardingState.error ? "Setup needs attention" : (isProxy ? "Starting your proxy" : "Starting your server"));
  }
  if (serverOnboardingProgressEyebrow) serverOnboardingProgressEyebrow.textContent = isProxy ? "Proxy setup" : "Server setup";
  if (serverOnboardingAddressLabel) serverOnboardingAddressLabel.textContent = isProxy ? "Internal Proxy Address" : "Internal Server Address";
  serverOnboardingAddress?.classList.toggle("hidden", !serverOnboardingState.complete);
  serverOnboardingRetryBtn?.classList.toggle("hidden", !serverOnboardingState.error || serverOnboardingState.running);
  serverOnboardingContinueBtn?.classList.toggle("hidden", !serverOnboardingState.complete && !serverOnboardingState.error);
  if (serverOnboardingAddressValue && serverOnboardingState.server) {
    serverOnboardingAddressValue.textContent = getInternalServerAddress(serverOnboardingState.server);
  }
}

function openServerOnboarding(server) {
  const isProxy = SERVICE_PROXY_LOADERS.has(String(server?.loader || "").toLowerCase());
  serverOnboardingState = {
    server,
    username: "",
    running: false,
    complete: false,
    error: "",
    steps: ["pending", "pending", "pending"]
  };
  serverOnboardingUsernameStep?.classList.toggle("hidden", isProxy);
  serverOnboardingProgressStep?.classList.toggle("hidden", !isProxy);
  if (serverOnboardingUsername) {
    serverOnboardingUsername.value = "";
  }
  if (serverOnboardingEula) {
    serverOnboardingEula.checked = false;
  }
  if (serverOnboardingFormError) {
    serverOnboardingFormError.textContent = "";
  }
  serverOnboardingOverlay?.classList.remove("hidden");
  document.body.classList.add("editor-open");
  if (isProxy) {
    renderServerOnboarding();
    setTimeout(() => startCreatedServerOnboarding(), 0);
  } else {
    setTimeout(() => serverOnboardingUsername?.focus(), 0);
  }
}

function closeServerOnboarding() {
  closeOnboardingSnake();
  serverOnboardingOverlay?.classList.add("hidden");
  document.body.classList.remove("editor-open");
}

function drawOnboardingSnake() {
  const context = serverOnboardingSnakeCanvas?.getContext("2d");
  if (!context) return;
  const cell = serverOnboardingSnakeCanvas.width / 20;
  context.fillStyle = "#080c16";
  context.fillRect(0, 0, serverOnboardingSnakeCanvas.width, serverOnboardingSnakeCanvas.height);
  context.strokeStyle = "rgba(132, 151, 204, 0.08)";
  context.lineWidth = 1;
  for (let index = 1; index < 20; index += 1) {
    const offset = index * cell + 0.5;
    context.beginPath();
    context.moveTo(offset, 0);
    context.lineTo(offset, serverOnboardingSnakeCanvas.height);
    context.moveTo(0, offset);
    context.lineTo(serverOnboardingSnakeCanvas.width, offset);
    context.stroke();
  }
  context.fillStyle = "#ff7188";
  context.beginPath();
  context.arc((onboardingSnakeFood.x + 0.5) * cell, (onboardingSnakeFood.y + 0.5) * cell, cell * 0.32, 0, Math.PI * 2);
  context.fill();
  onboardingSnake.forEach((part, index) => {
    context.fillStyle = index === 0 ? "#78f0bd" : "#37bd8b";
    context.fillRect(part.x * cell + 2, part.y * cell + 2, cell - 4, cell - 4);
  });
}

function placeOnboardingSnakeFood() {
  const freeCells = [];
  for (let y = 0; y < 20; y += 1) {
    for (let x = 0; x < 20; x += 1) {
      if (!onboardingSnake.some((part) => part.x === x && part.y === y)) freeCells.push({ x, y });
    }
  }
  onboardingSnakeFood = freeCells[Math.floor(Math.random() * freeCells.length)] || { x: 14, y: 10 };
}

function finishOnboardingSnake() {
  clearInterval(onboardingSnakeTimer);
  onboardingSnakeTimer = null;
  serverOnboardingSnakeMessage?.classList.remove("hidden");
}

function stepOnboardingSnake() {
  onboardingSnakeDirection = onboardingSnakeNextDirection;
  const head = onboardingSnake[0];
  const next = { x: head.x + onboardingSnakeDirection.x, y: head.y + onboardingSnakeDirection.y };
  const hitWall = next.x < 0 || next.x >= 20 || next.y < 0 || next.y >= 20;
  const hitSelf = onboardingSnake.some((part) => part.x === next.x && part.y === next.y);
  if (hitWall || hitSelf) {
    finishOnboardingSnake();
    return;
  }
  onboardingSnake.unshift(next);
  if (next.x === onboardingSnakeFood.x && next.y === onboardingSnakeFood.y) {
    onboardingSnakeScoreValue += 1;
    if (serverOnboardingSnakeScore) serverOnboardingSnakeScore.textContent = `Score ${onboardingSnakeScoreValue}`;
    placeOnboardingSnakeFood();
  } else {
    onboardingSnake.pop();
  }
  drawOnboardingSnake();
}

function setOnboardingSnakeDirection(directionName) {
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };
  const next = directions[directionName];
  if (!next || (next.x === -onboardingSnakeDirection.x && next.y === -onboardingSnakeDirection.y)) return;
  onboardingSnakeNextDirection = next;
}

function startOnboardingSnake() {
  clearInterval(onboardingSnakeTimer);
  onboardingSnake = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
  onboardingSnakeDirection = { x: 1, y: 0 };
  onboardingSnakeNextDirection = { x: 1, y: 0 };
  onboardingSnakeScoreValue = 0;
  placeOnboardingSnakeFood();
  if (serverOnboardingSnakeScore) serverOnboardingSnakeScore.textContent = "Score 0";
  serverOnboardingSnakeMessage?.classList.add("hidden");
  serverOnboardingSnakePanel?.classList.remove("hidden");
  serverOnboardingSnakePanel?.closest(".server-onboarding-shell")?.classList.add("snake-open");
  drawOnboardingSnake();
  onboardingSnakeTimer = setInterval(stepOnboardingSnake, 125);
  serverOnboardingSnakeCanvas?.focus();
}

function closeOnboardingSnake() {
  clearInterval(onboardingSnakeTimer);
  onboardingSnakeTimer = null;
  serverOnboardingSnakePanel?.classList.add("hidden");
  serverOnboardingSnakePanel?.closest(".server-onboarding-shell")?.classList.remove("snake-open");
}

async function waitForCreatedServerReady(serverId, baselineLine, onProcessStarted, isProxy = false, timeoutMs = 600000) {
  const startedAt = Date.now();
  let processStarted = false;
  let runningSince = 0;
  while (Date.now() - startedAt < timeoutMs) {
    const data = await api(`/api/servers/${serverId}/console?limit=400`);
    const lines = Array.isArray(data.lines) ? data.lines : [];
    const baselineIndex = baselineLine ? lines.lastIndexOf(baselineLine) : -1;
    const currentAttemptLines = lines.slice(baselineIndex + 1);
    if (data.running && !processStarted) {
      processStarted = true;
      runningSince = Date.now();
      onProcessStarted?.();
    }
    const readyLine = currentAttemptLines.some((line) => isProxy
      ? /Listening on\b|proxy.+(?:ready|started)|started.+proxy/i.test(String(line))
      : /Done \(.+\)! For help/i.test(String(line)));
    const stableProxy = isProxy && data.running && runningSince && Date.now() - runningSince >= 3000;
    if (readyLine || stableProxy) {
      if (!processStarted) {
        processStarted = true;
        onProcessStarted?.();
      }
      return;
    }
    const exited = currentAttemptLines.slice(-15).some((line) => /Process exited|Start failed|FATAL|unexpected exception/i.test(String(line)));
    if (!data.running && exited) {
      throw new Error(`${isProxy ? "Proxy" : "Minecraft"} stopped during startup. Check the Console tab for details.`);
    }
    await delay(1000);
  }
  throw new Error(`${isProxy ? "Proxy" : "Minecraft"} did not become ready within 10 minutes.`);
}

async function startCreatedServerOnboarding() {
  const server = serverOnboardingState.server;
  const isProxy = SERVICE_PROXY_LOADERS.has(String(server?.loader || "").toLowerCase());
  if (!server || serverOnboardingState.running) {
    return;
  }
  serverOnboardingState.running = true;
  serverOnboardingState.complete = false;
  serverOnboardingState.error = "";
  serverOnboardingState.steps = ["active", "pending", "pending"];
  renderServerOnboarding();

  try {
    if (!isProxy) {
      await api(`/api/servers/${server.id}/operators`, {
        method: "POST",
        body: JSON.stringify({ username: serverOnboardingState.username })
      });
      serverOnboardingState.steps = ["done", "active", "pending"];
      renderServerOnboarding();
    }

    const initialConsole = await api(`/api/servers/${server.id}/console?limit=400`);
    const initialLines = Array.isArray(initialConsole.lines) ? initialConsole.lines : [];
    const baselineLine = initialLines.at(-1) || "";
    await api(`/api/servers/${server.id}/action`, {
      method: "POST",
      body: JSON.stringify({ action: "start" })
    });
    if (isProxy) {
      serverOnboardingState.steps = ["done", "active", "pending"];
      renderServerOnboarding();
    }

    await waitForCreatedServerReady(server.id, baselineLine, () => {
      serverOnboardingState.steps = ["done", "done", "active"];
      renderServerOnboarding();
    }, isProxy);
    serverOnboardingState.steps = ["done", "done", "done"];
    serverOnboardingState.complete = true;
    await fetchServers();
    showToast(isProxy ? "Proxy created and started" : "Server created and started");
  } catch (error) {
    serverOnboardingState.error = error.message || "Server setup failed.";
  } finally {
    serverOnboardingState.running = false;
    renderServerOnboarding();
  }
}

function buildMetricBars(points, maxValue = 100, valueFormatter = (value) => String(value)) {
  const safePoints = Array.isArray(points)
    ? points
        .map((item) => ({
          value: Number(item?.value),
          at: String(item?.at || "")
        }))
        .filter((item) => Number.isFinite(item.value))
    : [];

  if (!safePoints.length) {
    return '<p class="chart-empty">No samples yet.</p>';
  }

  const cap = Math.max(1, Number(maxValue || 1));
  const width = 100;
  const height = 100;
  const linePoints = safePoints
    .map((entry, index) => {
      const x = safePoints.length > 1 ? (index / (safePoints.length - 1)) * width : width / 2;
      const normalized = Math.max(0, Math.min(1, Number(entry.value || 0) / cap));
      const y = height - normalized * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const hoverPoints = safePoints
    .map((entry, index) => {
      const x = safePoints.length > 1 ? (index / (safePoints.length - 1)) * 100 : 50;
      const normalized = Math.max(0, Math.min(1, Number(entry.value || 0) / cap));
      const y = 100 - normalized * 100;
      const parsedDate = new Date(entry.at);
      const time = Number.isNaN(parsedDate.getTime())
        ? entry.at
        : parsedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      const label = `${time} - ${valueFormatter(entry.value)}`;
      return `<button class="metric-chart-point" type="button" style="left:${x.toFixed(2)}%;top:${y.toFixed(2)}%;" aria-label="${escapeAttr(label)}"><span>${escapeHtml(label)}</span></button>`;
    })
    .join("");

  return `<div class="metric-chart-line" role="img" aria-label="Metric line chart">
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
      <polyline points="${linePoints}" />
    </svg>
    <div class="metric-chart-points">${hoverPoints}</div>
  </div>`;
}

function buildDailyPlayerBars(days) {
  const values = Array.isArray(days) ? days : [];
  if (!values.length) return '<p class="chart-empty">Player visits will appear after the first join.</p>';
  const maximum = Math.max(1, ...values.map((item) => Number(item.players || 0)));
  return `<div class="daily-player-chart">${values.map((item) => {
    const value = Number(item.players || 0);
    const height = Math.max(4, (value / maximum) * 100);
    const label = `${item.date}: ${value} unique player${value === 1 ? "" : "s"}`;
    return `<div class="daily-player-column" title="${escapeAttr(label)}"><span style="height:${height.toFixed(1)}%"></span><small>${escapeHtml(String(item.date || "").slice(5))}</small></div>`;
  }).join("")}</div>`;
}

function pushMonitoringHistory(serverId, sample) {
  if (!serverId || !sample || typeof sample !== "object") {
    return;
  }

  const list = monitoringHistoryByServer.get(serverId) || [];
  list.push({
    at: String(sample.updatedAt || new Date().toISOString()),
    cpuPercent: Number(sample.cpuPercent || 0),
    ramPercent: Number(sample.ramPercent || 0),
    tps: Number(sample.tps || 0),
    networkMbps: Math.max(0, Number(sample.inboundMbps || 0)) + Math.max(0, Number(sample.outboundMbps || 0))
  });

  if (list.length > MAX_MONITORING_POINTS) {
    list.splice(0, list.length - MAX_MONITORING_POINTS);
  }

  monitoringHistoryByServer.set(serverId, list);
}

function getMonitoringSeries(serverId, key) {
  const list = monitoringHistoryByServer.get(serverId) || [];
  return list.map((entry) => ({
    value: Number(entry?.[key] || 0),
    at: String(entry?.at || "")
  }));
}

async function createWorld(server) {
  const name = getDetailFieldValue("world-name");
  const seed = getDetailFieldValue("world-seed");

  if (!name) {
    throw new Error("World name is required.");
  }

  await api(`/api/servers/${server.id}/worlds`, {
    method: "POST",
    body: JSON.stringify({ name, seed })
  });

  setDetailFieldValue("world-name", "");
  setDetailFieldValue("world-seed", "");
}

async function updateWorld(server, currentName, nextName, seed) {
  await api(`/api/servers/${server.id}/worlds`, {
    method: "PATCH",
    body: JSON.stringify({ currentName, name: nextName, seed })
  });
}

async function removeWorld(server, worldName) {
  await api(`/api/servers/${server.id}/worlds`, {
    method: "DELETE",
    body: JSON.stringify({ name: worldName })
  });
}

async function editWorldInteractive(server, currentName, currentSeed = "") {
  const nextName = window.prompt("World name", currentName);
  if (nextName === null) return false;

  const nextSeed = window.prompt("Custom seed (optional, leave blank to clear)", currentSeed);
  if (nextSeed === null) return false;

  await updateWorld(server, currentName, nextName, nextSeed);
  await loadWorlds(server.id);
  renderDetail();
  showToast("World updated");
  return true;
}

async function duplicateWorld(server, worldName) {
  const newName = String(window.prompt("Name for the duplicated world", `${worldName}_copy`) || "").trim();
  if (!newName) return;
  await api(`/api/servers/${server.id}/worlds/duplicate`, {
    method: "POST",
    body: JSON.stringify({ name: worldName, newName })
  });
  await loadWorlds(server.id);
  renderDetail();
  showToast("World duplicated");
}

function exportWorld(server, worldName) {
  const link = document.createElement("a");
  link.href = `/api/servers/${encodeURIComponent(server.id)}/worlds/export?name=${encodeURIComponent(worldName)}`;
  link.download = `${worldName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast("World export started");
}

async function importWorldArchive(server, file) {
  if (!file || !String(file.name || "").toLowerCase().endsWith(".zip")) {
    throw new Error("Choose a Minecraft world .zip file.");
  }
  const requestedName = window.prompt("Imported world name", String(file.name).replace(/\.zip$/i, ""));
  if (requestedName === null) return;
  const form = new FormData();
  form.append("world", file);
  form.append("name", requestedName.trim());
  const response = await fetch(`/api/servers/${encodeURIComponent(server.id)}/worlds/import`, {
    method: "POST",
    body: form,
    credentials: "same-origin"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "World import failed.");
  await loadWorlds(server.id);
  renderDetail();
  showToast(payload.restartRequired ? "World imported - restart the server to use it" : "World imported");
}

async function uploadCustomJar(serverId, file) {
  if (!serverId || !file) {
    return;
  }

  if (!String(file.name || "").toLowerCase().endsWith(".jar")) {
    throw new Error("Custom installation requires a .jar file.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const response = await fetch(`/api/servers/${encodeURIComponent(serverId)}/custom-jar?fileName=${encodeURIComponent(file.name || "server.jar")}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream"
    },
    credentials: "same-origin",
    body: arrayBuffer
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Custom jar upload failed.");
  }
}

async function uploadProxyPlugin(serverId, file) {
  if (!serverId || !file || !String(file.name || "").toLowerCase().endsWith(".jar")) {
    throw new Error("Select the Simple Voice Chat proxy plugin .jar file.");
  }
  const bytes = await file.arrayBuffer();
  await api(`/api/servers/${serverId}/addons/upload`, {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentBase64: arrayBufferToBase64(bytes)
    })
  });
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function applyConsoleScrollBehavior() {
  const frame = detailContentEl.querySelector(".console-frame");
  if (!frame) {
    return;
  }

  frame.addEventListener("scroll", () => {
    const distance = frame.scrollHeight - frame.clientHeight - frame.scrollTop;
    shouldStickToBottom = distance < 24;
  });

  const isLogTab = new Set(["console", "logs", "chat", "warnings", "errors", "players"]).has(selectedTab);
  if (isLogTab && shouldStickToBottom) {
    frame.scrollTop = frame.scrollHeight;
  }
}

function isUserTypingInDetail() {
  const active = document.activeElement;
  if (!active || !detailContentEl.contains(active)) {
    return false;
  }

  const tag = String(active.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") {
    return true;
  }

  return active.getAttribute("contenteditable") === "true";
}

function inferEditorMode(filePath) {
  const lower = String(filePath || "").toLowerCase();
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs")) return "ace/mode/javascript";
  if (lower.endsWith(".ts")) return "ace/mode/typescript";
  if (lower.endsWith(".json")) return "ace/mode/json";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "ace/mode/yaml";
  if (lower.endsWith(".properties")) return "ace/mode/properties";
  if (lower.endsWith(".sh")) return "ace/mode/sh";
  if (lower.endsWith(".xml")) return "ace/mode/xml";
  return "ace/mode/text";
}

function getActiveEditorTab() {
  return fileEditorTabs.find((tab) => tab.path === activeFileEditorPath) || null;
}

function saveActiveEditorDraftToState() {
  const activeTab = getActiveEditorTab();
  if (!activeTab) {
    return;
  }

  if (aceEditor && typeof aceEditor.getValue === "function") {
    const content = aceEditor.getValue();
    activeTab.content = content;
    activeTab.dirty = true;
    fileEditorState = { path: activeTab.path, content: activeTab.content };
    return;
  }

  const fallbackEl = document.querySelector('[data-field="file-content-fallback"]');
  if (fallbackEl) {
    activeTab.content = String(fallbackEl.value || "");
    activeTab.dirty = true;
    fileEditorState = { path: activeTab.path, content: activeTab.content };
  }
}

function setActiveFileTab(pathValue) {
  const match = fileEditorTabs.find((tab) => tab.path === pathValue);
  if (!match) {
    return;
  }
  activeFileEditorPath = match.path;
  fileEditorState = {
    path: match.path,
    content: match.content
  };
}

function upsertFileEditorTab(pathValue, contentValue) {
  const pathText = String(pathValue || "").trim();
  if (!pathText) {
    return;
  }

  const existing = fileEditorTabs.find((tab) => tab.path === pathText);
  if (existing) {
    existing.content = String(contentValue || "");
    existing.dirty = false;
  } else {
    fileEditorTabs.push({
      path: pathText,
      content: String(contentValue || ""),
      dirty: false
    });
  }

  setActiveFileTab(pathText);
}

function closeFileEditorTab(pathValue) {
  const index = fileEditorTabs.findIndex((tab) => tab.path === pathValue);
  if (index === -1) {
    return;
  }
  fileEditorTabs.splice(index, 1);

  if (activeFileEditorPath === pathValue) {
    const next = fileEditorTabs[Math.max(0, index - 1)] || fileEditorTabs[0] || null;
    activeFileEditorPath = next?.path || "";
    fileEditorState = {
      path: next?.path || "",
      content: next?.content || ""
    };
  }
}

function downloadTextFile(filePath, content) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = String(filePath || "file.txt").split("/").pop() || "file.txt";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function renderEditorTabsMarkup() {
  if (!fileEditorTabs.length) {
    return '<span class="muted">No file opened</span>';
  }

  return fileEditorTabs
    .map((tab) => {
      const isActive = tab.path === activeFileEditorPath;
      return `<button class="editor-tab ${isActive ? "active" : ""}" data-action="select-editor-tab" data-path="${escapeAttr(tab.path)}">${escapeHtml(tab.path.split("/").pop() || tab.path)}${tab.dirty ? " *" : ""}<span data-action="close-editor-tab" data-path="${escapeAttr(tab.path)}"> x</span></button>`;
    })
    .join("");
}

function renderEditorPopup() {
  if (!isEditorPopupOpen()) {
    return;
  }

  if (editorTabsBarEl) {
    editorTabsBarEl.innerHTML = renderEditorTabsMarkup();
  }

  const activeTab = getActiveEditorTab();
  if (editorPathTextEl) {
    editorPathTextEl.textContent = activeTab?.path || "No file opened";
  }

  initCodeEditor();
}

function openEditorPopup() {
  if (!editorOverlayEl) {
    return;
  }
  editorOverlayEl.classList.remove("hidden");
  document.body.classList.add("editor-open");
  renderEditorPopup();
}

function closeEditorPopup() {
  saveActiveEditorDraftToState();
  if (editorOverlayEl) {
    editorOverlayEl.classList.add("hidden");
  }
  document.body.classList.remove("editor-open");
  if (aceEditor) {
    aceEditor.destroy();
    aceEditor = null;
  }
}

function initCodeEditor() {
  if (!isEditorPopupOpen()) {
    return;
  }

  const mount = document.getElementById("editorPopupCodeEditor");
  if (!mount) {
    return;
  }

  const activeTab = getActiveEditorTab();
  if (!activeTab) {
    mount.innerHTML = "<p class=\"muted\">Select a file to open it in the editor.</p>";
    if (aceEditor) {
      aceEditor.destroy();
      aceEditor = null;
    }
    return;
  }

  if (!window.ace) {
    mount.innerHTML = `<textarea data-field="file-content-fallback" rows="16" style="width:100%;resize:vertical;">${escapeHtml(activeTab.content || "")}</textarea>`;
    return;
  }

  if (aceEditor) {
    aceEditor.destroy();
    aceEditor = null;
  }

  aceEditor = window.ace.edit(mount);
  aceEditor.setTheme("ace/theme/monokai");
  aceEditor.session.setMode(inferEditorMode(activeTab.path));
  aceEditor.setValue(activeTab.content || "", -1);
  aceEditor.setOptions({
    fontSize: "13px",
    enableBasicAutocompletion: true,
    enableLiveAutocompletion: true,
    showPrintMargin: false,
    tabSize: 2,
    useSoftTabs: true
  });

  aceEditor.session.on("change", () => {
    const tab = getActiveEditorTab();
    if (!tab) {
      return;
    }
    tab.content = aceEditor.getValue();
    tab.dirty = true;
    fileEditorState = {
      path: tab.path,
      content: tab.content
    };
  });
}

function renderDetail() {
  const premiumView = selectedTab === "premium";
  const multiConsoleView = selectedTab === "multi-console";
  document.body.classList.toggle("premium-global-view", premiumView);
  document.body.classList.toggle("multi-console-global-view", multiConsoleView);
  if (premiumView) {
    if (!premiumState.account) {
      detailContentEl.innerHTML = `
        <section class="premium-login-page">
          <div class="detail-card premium-login-card">
            <p class="eyebrow">Vyron Account</p>
            <h3>Login</h3>
            <div class="fields">
              <label>Username or Email<input data-field="premium-login" autocomplete="username" /></label>
              <label>Password<input data-field="premium-password" type="password" autocomplete="current-password" /></label>
            </div>
            <p class="error">${escapeHtml(premiumState.error)}</p>
            <button class="btn primary full" data-action="premium-login" ${premiumState.loading ? "disabled" : ""}>${premiumState.loading ? "Signing in..." : "Login"}</button>
          </div>
        </section>`;
      return;
    }
    const accountName = premiumState.account.username || premiumState.account.email || premiumState.account.login || "Vyron user";
    const premiumPlan = String(premiumState.account.subscription || "free").toLowerCase() === "plus" ? "Plus" : "Free";
    const linkedPanels = Array.isArray(premiumState.account.panels) ? premiumState.account.panels.length : 0;
    detailContentEl.innerHTML = `
      <section class="premium-account-page">
        <header class="premium-page-heading">
          <div><p class="eyebrow">Vyron Account</p><h2>${escapeHtml(accountName)}</h2><p>Manage your subscription and cloud services for every linked panel.</p></div>
          <div class="premium-heading-actions"><button class="btn ghost" data-action="premium-logout" type="button">Log out</button><button class="btn primary premium-buy-button" type="button" disabled>Buy Plus - Unavailable</button></div>
        </header>
        <div class="premium-summary-grid">
          <article><span>Current plan</span><strong>${escapeHtml(premiumPlan)}</strong></article>
          <article><span>Linked panels</span><strong>${linkedPanels}</strong></article>
          <article><span>Monthly price</span><strong>${premiumPlan === "Plus" ? "5 EUR" : "0 EUR"}</strong></article>
        </div>
        <section class="premium-cloud-section">
          <span class="premium-unavailable-label">Unavailable</span>
          <div class="premium-section-heading"><div><h3>Cloud Storage</h3><p>Encrypted cloud backup storage shared by your linked panels.</p></div><strong>0 GB</strong></div>
          <div class="premium-storage-labels"><span>0 GB used</span><span>0 GB maximum</span></div>
          <progress class="premium-storage-meter" max="1" value="0" aria-label="Cloud storage usage" aria-valuetext="0 GB used of 0 GB maximum"></progress>
        </section>
        <section class="premium-plan-section">
          <div class="premium-section-heading"><div><h3>Subscription</h3><p>Compare Free with the upcoming Vyron Plus plan.</p></div></div>
          <div class="premium-plan-grid">
            <article class="premium-plan-card ${premiumPlan === "Free" ? "current" : ""}">
              <div class="premium-plan-title"><div><span>Current</span><h3>Free</h3></div><strong>0 EUR<small>/month</small></strong></div>
              <ul><li>Unlimited self-hosted panels</li><li>Core server management</li><li>Monitoring and addon store</li><li>Single panel administrator</li></ul>
              <button class="btn ghost full" type="button" disabled>${premiumPlan === "Free" ? "Active plan" : "Free plan"}</button>
            </article>
            <article class="premium-plan-card plus ${premiumPlan === "Plus" ? "current" : ""}">
              <span class="premium-unavailable-label">Unavailable</span>
              <div class="premium-plan-title"><div><span>Upgrade</span><h3>Plus</h3></div><strong>5 EUR<small>/month</small></strong></div>
              <ul><li>Sub-users and panel roles</li><li>Simple Voice Chat Proxy</li><li>Encrypted cloud backups</li><li>Cloud storage quota</li><li>Scheduled backup retention</li><li>Extended account audit history</li><li>Priority support and early features</li></ul>
              <button class="btn primary full" type="button" disabled>Buy Plus - Unavailable</button>
            </article>
          </div>
        </section>
      </section>`;
    return;
  }

  if (multiConsoleView) {
    const multiConsoleMarkup = servers.map((item) => `
      <article class="multi-console-card">
        <header><div><strong>${escapeHtml(item.name)}</strong><span class="badge ${escapeAttr(item.badge || "offline")}">${escapeHtml(item.status || "offline")}</span></div></header>
        <div class="console-frame"><div class="console-output compact-console" data-live-console="${escapeAttr(item.id)}">${renderConsoleLines(item.consoleTail || [])}</div></div>
        <div class="multi-console-command"><input data-multi-command="${escapeAttr(item.id)}" type="text" placeholder="Command for ${escapeAttr(item.name)}" /><button class="btn tiny" data-action="send-multi-console-command" data-server-id="${escapeAttr(item.id)}">Send</button></div>
      </article>`).join("");
    detailContentEl.innerHTML = `
      <section class="multi-console-page">
        <div class="global-view-heading">
          <p class="eyebrow">All Servers</p>
          <h2>Multi Console</h2>
        </div>
        <div class="multi-console-grid">${multiConsoleMarkup || '<p class="chart-empty">No servers available.</p>'}</div>
      </section>`;
    applyConsoleScrollBehavior();
    return;
  }

  const server = getSelectedServer();

  if (!server) {
    if (currentRouteSlug) {
      detailNameEl.textContent = "Server not found";
      detailMetaEl.textContent = `No server matches /${currentRouteSlug}.`;
      detailBadgeEl.textContent = "missing";
      detailBadgeEl.className = "badge offline";
      detailContentEl.innerHTML = `
        <div class="detail-card">
          <h4>Missing server</h4>
          <p>The route is valid, but no server entry exists for this page.</p>
        </div>
      `;
      return;
    }

    detailNameEl.textContent = "No server selected";
    detailMetaEl.textContent = "Choose a server from the list to preview its console.";
    detailBadgeEl.textContent = "preview";
    detailBadgeEl.className = "badge transition";
    detailContentEl.innerHTML = `
      <div class="detail-card">
        <h4>Preview mode</h4>
        <p>This area will show server-specific views once you pick a server.</p>
      </div>
    `;
    return;
  }

  selectedServerId = server.id;
  syncServerNavigation(server);
  detailNameEl.textContent = server.name;
  detailMetaEl.textContent = currentRouteSlug
    ? `/${getServerSlug(server)} • ${getRuntimeLabel(server)} • Port ${server.port} • RAM ${server.ramGb} GB`
    : `${getRuntimeLabel(server)} • Port ${server.port} • RAM ${server.ramGb} GB`;
  detailBadgeEl.textContent = server.status;
  detailBadgeEl.className = `badge ${server.badge || "offline"}`;

  const addonsMarkup = (server.addons || []).length
    ? server.addons
        .map(
          (addon) =>
            `<li><button class="player-row addon-entry-row" type="button" data-addon-id="${escapeAttr(addon.id)}" data-addon-name="${escapeAttr(addon.name)}"><span class="online-dot"></span>${escapeHtml(addon.name)}</button></li>`
        )
        .join("")
    : "<li>No addons installed yet.</li>";

  const cfg = configState.properties || {};
  const resourcePack = server.resourcePack || null;
  const resourcePackUrl = String(resourcePack?.downloadUrl || cfg["resource-pack"] || "");
  const resourcePackMarkup = `
    <div class="detail-card resource-pack-card">
      <div class="resource-pack-heading">
        <div>
          <h4>Required Resource Pack</h4>
          <p class="muted">${resourcePack ? "Required for every player on join" : "No custom pack configured"}</p>
        </div>
        <span class="resource-pack-state ${resourcePack ? "active" : ""}">${resourcePack ? "Required" : "Not set"}</span>
      </div>
      ${resourcePack ? `
        <div class="resource-pack-summary">
          <div><span>File</span><strong>${escapeHtml(resourcePack.fileName || "server-resource-pack.zip")}</strong></div>
          <div><span>Size</span><strong>${escapeHtml(formatBytes(resourcePack.size || 0))}</strong></div>
          <div><span>SHA-1</span><strong class="resource-pack-hash">${escapeHtml(resourcePack.sha1 || cfg["resource-pack-sha1"] || "unknown")}</strong></div>
          <div><span>Uploaded</span><strong>${escapeHtml(formatTime(resourcePack.uploadedAt))}</strong></div>
        </div>
        <label class="resource-pack-url-label">Download URL
          <input type="text" value="${escapeAttr(resourcePackUrl)}" readonly />
        </label>` : ""}
      <div class="resource-pack-upload-grid">
        <label>Resource Pack ZIP
          <input data-field="resource-pack-file" type="file" accept=".zip,application/zip" />
        </label>
        <label>Join Prompt (optional)
          <input data-field="resource-pack-prompt" type="text" maxlength="180" value="${escapeAttr(resourcePack?.prompt || "")}" placeholder="This server requires its custom resource pack." />
        </label>
      </div>
      <div class="detail-pill-row resource-pack-actions">
        <button class="btn tiny" data-action="upload-resource-pack" type="button">${resourcePack ? "Replace Pack" : "Upload Pack"}</button>
        ${resourcePackUrl ? `<button class="btn tiny ghost" data-action="copy-resource-pack-url" data-url="${escapeAttr(resourcePackUrl)}" type="button">Copy URL</button>` : ""}
        ${resourcePack ? '<button class="btn tiny danger" data-action="remove-resource-pack" type="button">Remove</button>' : ""}
      </div>
    </div>`;

  const schedulesMarkup = (server.schedules || []).length
    ? server.schedules.map((schedule) => `<li>${schedule.name} - ${schedule.cron} - ${schedule.action}</li>`).join("")
    : "<li>No schedules configured yet.</li>";

  const webhooksMarkup = (server.webhooks || []).length
    ? server.webhooks.map((hook) => `<li>${hook.name} - ${hook.event} - ${hook.url}</li>`).join("")
    : "<li>No webhooks configured yet.</li>";

  const timelineMarkup = (server.timeline || []).length
    ? server.timeline.slice(0, 8).map((entry) => `<li>${entry}</li>`).join("")
    : "<li>No activity recorded yet.</li>";

  const worldsMarkup = (worldsState || []).length
    ? worldsState
        .map((world) => {
          const worldName = String(world?.name || "");
          const worldSeed = String(world?.seed || "");
          return `<li class="world-entry-row" data-world-name="${escapeAttr(worldName)}" data-world-seed="${escapeAttr(worldSeed)}" title="Right-click for world actions">
            <span class="world-entry-icon" aria-hidden="true">◎</span>
            <span class="world-entry-copy"><strong>${escapeHtml(worldName)}</strong>${worldSeed ? `<small>Seed: ${escapeHtml(worldSeed)}</small>` : "<small>Minecraft world</small>"}</span>
            <button class="world-more-button" type="button" data-action="world-menu" data-world-name="${escapeAttr(worldName)}" data-world-seed="${escapeAttr(worldSeed)}" title="World actions" aria-label="Actions for ${escapeAttr(worldName)}">⋮</button>
          </li>`;
        })
        .join("")
    : "<li>No worlds found yet. Start server once to generate worlds.</li>";

  const backupsMarkup = (backupsState || []).length
    ? backupsState
        .map(
          (backup) =>
            `<li>${escapeHtml(backup.name)} <span class="muted">${formatBytes(backup.size || 0)}</span> <button class="btn tiny" data-action="restore-backup" data-backup="${escapeAttr(backup.name)}" ${backup.restorable === false || backup.legacy ? "disabled" : ""}>${backup.legacy ? "Legacy" : "Restore"}</button></li>`
        )
        .join("")
    : "<li>No backups created yet.</li>";

  const fileEntriesMarkup = (fileManagerState.entries || []).length
    ? fileManagerState.entries
        .map((entry) => {
          const typeLabel = entry.type === "dir" ? "[DIR]" : "[FILE]";
          const nextPath = fileManagerState.path
            ? `${fileManagerState.path.replace(/\\/g, "/")}/${entry.name}`
            : entry.name;
          const escapedPath = escapeAttr(nextPath);
          const activeClass = nextPath === activeFileEditorPath ? "player-row active" : "player-row";
          return `<li><button class="${activeClass} file-entry-row" data-action="select-file-entry" data-path="${escapedPath}" data-kind="${entry.type}"><span class="${entry.type === "dir" ? "offline-dot" : "online-dot"}"></span>${typeLabel} ${escapeHtml(entry.name)}</button></li>`;
        })
        .join("")
    : "<li>This folder is empty.</li>";

  const consoleLines = Array.isArray(server.consoleTail) ? server.consoleTail : [];
  const warningLines = extractWarningLines(consoleLines);
  const chatMessages = extractChatMessages(consoleLines);
  const playerState = derivePlayerState(consoleLines, server.maxPlayers || 20);
  const roster = Array.isArray(playersState) ? playersState : [];
  const onlineCount = roster.filter((item) => item.online).length;
  if (roster.length && (!selectedPlayerName || !roster.some((item) => item.name === selectedPlayerName))) {
    selectedPlayerName = roster[0].name;
  }
  const selectedPlayer = roster.find((item) => item.name === selectedPlayerName) || null;

  const warningsMarkup = warningLines.length
    ? warningLines.slice(-20).map((line) => `<li>${escapeHtml(line)}</li>`).join("")
    : "<li>No warnings detected in current log window.</li>";

  const chatMarkup = chatMessages.length
    ? chatMessages.slice(-20).map((item) => `<li><strong>${escapeHtml(item.player)}:</strong> ${escapeHtml(item.message)}</li>`).join("")
    : "<li>No chat messages detected yet. Use the field to send one.</li>";

  const playerListMarkup = playerState.online.length
    ? playerState.online.map((name) => `<li>${escapeHtml(name)} - online</li>`).join("")
    : "<li>No players currently detected online.</li>";

  const playerEventMarkup = playerState.recentEvents.length
    ? playerState.recentEvents.map((item) => `<li>${escapeHtml(item)}</li>`).join("")
    : "<li>No recent join/leave events in current log window.</li>";

  const playerRosterMarkup = roster.length
    ? roster
        .map((item) => {
          const activeClass = item.name === selectedPlayerName ? "player-row active" : "player-row";
          const statusClass = item.online ? "online-dot" : "offline-dot";
          return `<li><button class="${activeClass}" data-action="select-player" data-player="${escapeAttr(item.name)}"><span class="${statusClass}"></span>${escapeHtml(item.name)}<span class="muted">${item.online ? "online" : "offline"}</span></button></li>`;
        })
        .join("")
    : "<li>No known players yet.</li>";
  const aiMode = String(aiState.status?.mode || "built-in");
  const internalAddress = `${getPanelHostAddress()}:${server.port}`;
  const isProxy = SERVICE_PROXY_LOADERS.has(String(server.loader || "").toLowerCase());
  const hasManagedProxyRoutes = new Set(["velocity", "bungeecord"]).has(String(server.loader || "").toLowerCase());
  const proxyConfigFile = String(server.loader || "").toLowerCase() === "velocity" ? "velocity.toml" : "config.yml";
  const proxySoftware = getRuntimeLabel(server);
  const currentProxyRoutes = proxyRoutesState.serverId === server.id ? proxyRoutesState.routes : [];
  const proxyRoutesMarkup = currentProxyRoutes.length
    ? currentProxyRoutes.map((route, index) => `
        <div class="proxy-route-row" data-proxy-route-row data-original-name="${escapeAttr(route.originalName || route.name)}">
          <label><span>Name</span><input data-route-field="name" value="${escapeAttr(route.name)}" maxlength="32" placeholder="lobby" /></label>
          <label><span>Host / IP</span><input data-route-field="host" value="${escapeAttr(route.host)}" maxlength="253" placeholder="127.0.0.1" /></label>
          <label><span>Port</span><input data-route-field="port" type="number" min="1" max="65535" value="${escapeAttr(route.port)}" /></label>
          <button class="proxy-route-delete" type="button" data-action="delete-proxy-route" data-route-index="${index}" title="Delete route" aria-label="Delete ${escapeAttr(route.name)} route">&times;</button>
        </div>`).join("")
    : '<div class="proxy-route-empty"><strong>No backend routes</strong><span>Add your lobby or game server below.</span></div>';
  const inboundTraffic = formatTrafficRate(monitoringData?.inboundMbps);
  const outboundTraffic = formatTrafficRate(monitoringData?.outboundMbps);
  const peakSockets = Number(monitoringData?.peakSockets || 0);
  const monitoringSeriesCpu = getMonitoringSeries(server.id, "cpuPercent");
  const monitoringSeriesRam = getMonitoringSeries(server.id, "ramPercent");
  const monitoringSeriesTps = getMonitoringSeries(server.id, "tps");
  const monitoringSeriesNetwork = getMonitoringSeries(server.id, "networkMbps");
  const networkMax = Math.max(1, ...monitoringSeriesNetwork.map((entry) => entry.value));
  const contentMap = {
    "proxy-overview": `
      <div class="detail-grid proxy-detail-grid">
        <div class="detail-card proxy-status-card" style="grid-column:1 / -1;">
          <div class="proxy-status-heading">
            <div>
              <p class="eyebrow">Proxy Network</p>
              <h4>${escapeHtml(proxySoftware)}</h4>
              <p class="muted">Routes players through one public listener to your backend Minecraft servers.</p>
            </div>
            <span class="badge ${escapeAttr(server.badge || "offline")}">${escapeHtml(server.status || "offline")}</span>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="console-start">Start</button>
            <button class="btn tiny" data-action="console-restart">Restart</button>
            <button class="btn tiny" data-action="console-stop">Stop</button>
            <button class="btn tiny" data-action="copy-internal-address" data-address="${escapeAttr(internalAddress)}">Copy Listener</button>
          </div>
        </div>
        <div class="detail-card">
          <h4>Listener</h4>
          <ul class="list-tight">
            <li>Address: <strong>${escapeHtml(internalAddress)}</strong></li>
            <li>Port: ${escapeHtml(server.port)}</li>
            <li>State: ${server.running ? "Accepting connections" : "Offline"}</li>
          </ul>
          <button class="btn tiny" data-action="jump-detail-tab" data-target-tab="network">Open Routing</button>
        </div>
        <div class="detail-card">
          <h4>Proxy Configuration</h4>
          <ul class="list-tight">
            <li>Main file: <strong>${escapeHtml(proxyConfigFile)}</strong></li>
            <li>Plugins: <strong>plugins/</strong></li>
            <li>Memory: ${escapeHtml(server.ramGb)} GB</li>
          </ul>
          <button class="btn tiny" data-action="open-proxy-config">Edit ${escapeHtml(proxyConfigFile)}</button>
        </div>
        <div class="detail-card">
          <h4>Network Tools</h4>
          <div class="proxy-tool-list">
            <button data-action="jump-detail-tab" data-target-tab="console"><span>Console</span><small>Commands and live output</small></button>
            <button data-action="jump-detail-tab" data-target-tab="addons"><span>Plugins</span><small>Manage proxy extensions</small></button>
            <button data-action="jump-detail-tab" data-target-tab="monitoring"><span>Monitoring</span><small>CPU, memory and traffic</small></button>
          </div>
        </div>
      </div>
    `,
    "proxy-config": `
      <div class="detail-grid">
        <div class="detail-card" style="grid-column:1 / -1;">
          <p class="eyebrow">${escapeHtml(proxySoftware)}</p>
          <h4>Proxy Configuration</h4>
          <p class="muted">Edit routing, forwarding, listener and backend server settings in <strong>${escapeHtml(proxyConfigFile)}</strong>.</p>
          <div class="detail-pill-row" style="margin-top:12px;">
            <button class="btn tiny" data-action="open-proxy-config">Open ${escapeHtml(proxyConfigFile)}</button>
            <button class="btn tiny" data-action="jump-detail-tab" data-target-tab="files">Browse All Files</button>
            <button class="btn tiny" data-action="console-restart">Restart Proxy</button>
          </div>
        </div>
        <div class="detail-card">
          <h4>Listener</h4>
          <ul class="list-tight"><li>${escapeHtml(internalAddress)}</li><li>Configured automatically during first start.</li></ul>
        </div>
        <div class="detail-card">
          <h4>Backend Servers</h4>
          <p class="muted">Add lobby, survival and other backend addresses with the visual route editor.</p>
          <button class="btn tiny" data-action="jump-detail-tab" data-target-tab="network">Manage Routes</button>
        </div>
      </div>
    `,
    console: `
      <div class="detail-grid">
        <div class="detail-card" style="grid-column: 1 / -1;">
          <h4>Console</h4>
          <div class="console-frame">
            <div class="console-output compact-console" data-live-console="${escapeAttr(server.id)}">
              ${renderConsoleLines(consoleLines)}
            </div>
          </div>
          <div class="detail-pill-row" style="margin-top:10px;">
            <button class="btn tiny" data-action="console-start">Start</button>
            <button class="btn tiny" data-action="console-stop">Stop</button>
            <button class="btn tiny" data-action="console-restart">Restart</button>
            <button class="btn tiny" data-action="refresh-console">Refresh</button>
          </div>
        </div>
        <div class="detail-card" style="grid-column: 1 / -1;">
          <h4>Command Input</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              Send Command
              <input data-field="console-command" type="text" placeholder="say Hello from Vyron" />
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="send-console-command">Send</button>
          </div>
          <p style="margin-top:10px;color:var(--muted);font-size:0.9rem;">Status: ${server.running ? "running" : "offline"} • Last update ${shortDateTime(server.updatedAt)}</p>
        </div>
      </div>
    `,
    ai: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Assistant Chat</h4>
          <p class="muted" style="margin:0 0 8px 0;">Mode: ${escapeHtml(aiMode)} • Open the bottom-right chat icon for the full experience.</p>
          <div class="ai-chat-box">${getAiMessagesMarkup()}</div>
          <div class="fields" style="margin-top:10px;">
            <label>
              Prompt
              <textarea data-field="ai-prompt" rows="4" placeholder="Type a task like: restart, run command say hello, or create schedule"></textarea>
            </label>
          </div>
          <div class="detail-pill-row" style="margin-top:10px;">
            <button class="btn tiny" data-action="ai-send" ${aiState.loading ? "disabled" : ""}>${aiState.loading ? "Thinking..." : "Send"}</button>
            <button class="btn tiny" data-action="ai-refresh-status">Refresh AI Status</button>
          </div>
        </div>
        <div class="detail-card">
          <h4>How It Works</h4>
          <ul class="list-tight">
            <li>Assistant can always read server context.</li>
            <li>For edits (restart, commands, schedules, player actions), it asks for confirmation in chat.</li>
            <li>Type <strong>confirm</strong> to apply pending action.</li>
          </ul>
        </div>
      </div>
    `,
    chat: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Chat Stream</h4>
          <ul class="list-tight">
            ${chatMarkup}
          </ul>
        </div>
        <div class="detail-card">
          <h4>Chat Actions</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              Broadcast Message
              <input data-field="chat-message" type="text" placeholder="Server restart in 5 minutes" />
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="send-chat-message">Send to Chat</button>
            <button class="btn tiny" data-action="refresh-console">Refresh</button>
          </div>
        </div>
      </div>
    `,
    errors: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Error Log</h4>
          <ul class="list-tight">
            ${warningsMarkup}
          </ul>
        </div>
        <div class="detail-card">
          <h4>Error Filters</h4>
          <div class="detail-pill-row">
            <span class="detail-pill">All</span>
            <span class="detail-pill">Critical</span>
            <span class="detail-pill">Plugin</span>
            <span class="detail-pill">Network</span>
          </div>
        </div>
      </div>
    `,
    warnings: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Warnings</h4>
          <ul class="list-tight">
            ${warningsMarkup}
          </ul>
        </div>
        <div class="detail-card">
          <h4>Alert Policy</h4>
          <div class="detail-pill-row">
            <span class="detail-pill">CPU &gt; 85%</span>
            <span class="detail-pill">RAM &gt; 80%</span>
            <span class="detail-pill">TPS &lt; 18.5</span>
          </div>
          <div class="detail-pill-row" style="margin-top:10px;">
            <button class="btn tiny" data-action="refresh-console">Refresh Warnings</button>
          </div>
        </div>
      </div>
    `,
    players: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Player Manager</h4>
          <p class="muted" style="margin:0 0 10px 0;">Click any player row to open the full player popup with inventory and effects.</p>
          <ul class="list-tight">
            <li>Known players: ${roster.length} • Online: ${onlineCount}</li>
            ${playerRosterMarkup}
          </ul>
        </div>
        <div class="detail-card">
          <h4>Selected Player</h4>
          <p style="margin-bottom:10px; color: var(--muted);">${selectedPlayer ? `${escapeHtml(selectedPlayer.name)} • ${selectedPlayer.online ? "online" : "offline"}` : "Select a player from the list."}</p>
          <div class="detail-pill-row" style="margin-bottom:10px;">
            <button class="btn tiny" data-action="player-open-popup">Open Player Popup</button>
          </div>
          <h4>Player Events</h4>
          <ul class="list-tight">
            ${playerEventMarkup}
          </ul>
          <div class="detail-pill-row" style="margin-top:10px;">
            <button class="btn tiny" data-action="refresh-console">Refresh Players</button>
          </div>
        </div>
      </div>
    `,
    config: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Server Settings</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              MOTD
              <input data-field="cfg-motd" type="text" value="${escapeAttr(cfg["motd"] || "Managed by Vyron")}" />
            </label>
            <label>
              Max Players
              <input data-field="cfg-max-players" type="number" min="1" max="500" value="${escapeAttr(cfg["max-players"] || "20")}" />
            </label>
            <label>
              Difficulty
              <select data-field="cfg-difficulty">
                <option value="peaceful" ${(cfg["difficulty"] || "normal") === "peaceful" ? "selected" : ""}>peaceful</option>
                <option value="easy" ${(cfg["difficulty"] || "normal") === "easy" ? "selected" : ""}>easy</option>
                <option value="normal" ${(cfg["difficulty"] || "normal") === "normal" ? "selected" : ""}>normal</option>
                <option value="hard" ${(cfg["difficulty"] || "normal") === "hard" ? "selected" : ""}>hard</option>
              </select>
            </label>
            <label>
              Game Mode
              <select data-field="cfg-gamemode">
                <option value="survival" ${(cfg["gamemode"] || "survival") === "survival" ? "selected" : ""}>survival</option>
                <option value="creative" ${(cfg["gamemode"] || "survival") === "creative" ? "selected" : ""}>creative</option>
                <option value="adventure" ${(cfg["gamemode"] || "survival") === "adventure" ? "selected" : ""}>adventure</option>
                <option value="spectator" ${(cfg["gamemode"] || "survival") === "spectator" ? "selected" : ""}>spectator</option>
              </select>
            </label>
            <label>
              View Distance
              <input data-field="cfg-view-distance" type="number" min="2" max="32" value="${escapeAttr(cfg["view-distance"] || "10")}" />
            </label>
            <label>
              Simulation Distance
              <input data-field="cfg-simulation-distance" type="number" min="2" max="32" value="${escapeAttr(cfg["simulation-distance"] || "6")}" />
            </label>
            <label>
              PVP
              <select data-field="cfg-pvp">
                <option value="true" ${(cfg["pvp"] || "true") === "true" ? "selected" : ""}>Enabled</option>
                <option value="false" ${(cfg["pvp"] || "true") === "false" ? "selected" : ""}>Disabled</option>
              </select>
            </label>
            <label>
              Online Mode
              <select data-field="cfg-online-mode">
                <option value="true" ${(cfg["online-mode"] || "true") === "true" ? "selected" : ""}>Enabled</option>
                <option value="false" ${(cfg["online-mode"] || "true") === "false" ? "selected" : ""}>Disabled</option>
              </select>
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="save-config">Save Config</button>
            <button class="btn tiny" data-action="reload-config">Reload Config</button>
          </div>
        </div>
        <div class="detail-card">
          <h4>Runtime Flags</h4>
          <ul class="list-tight">
            <li>Xms: ${server.ramGb}G</li>
            <li>Xmx: ${server.ramGb}G</li>
            <li>Port: ${server.port}</li>
            <li>Auto-start: ${server.autoStart !== false ? "Enabled" : "Disabled"}</li>
            <li>Server jar: server.jar</li>
          </ul>
          <div class="fields" style="margin-top:10px;">
            <label>
              Runtime Port
              <input data-field="runtime-port" type="number" min="1" max="65535" value="${escapeAttr(server.port)}" />
            </label>
            <label>
              Runtime RAM (GB)
              <input data-field="runtime-ram" type="number" min="1" max="64" value="${escapeAttr(server.ramGb)}" />
            </label>
            <label class="setting-toggle">
              <span class="toggle-text">Auto-start on panel/host reboot</span>
              <span class="toggle-switch">
                <input class="toggle-input" data-field="runtime-autostart" type="checkbox" ${server.autoStart !== false ? "checked" : ""} />
                <span class="toggle-track"></span>
                <span class="toggle-knob"></span>
              </span>
            </label>
            <div style="margin-top:12px;">
              <label style="margin-bottom:8px;">Custom Start Command (optional)</label>
              <div style="background:rgba(13,15,24,0.6);border:1px solid rgba(153,165,218,0.16);border-radius:8px;padding:10px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-size:0.85rem;color:#b8c0dd;">Default template:</span>
                  <button class="btn tiny" data-action="copy-default-cmd" type="button" style="padding:4px 8px;font-size:0.8rem;">Copy</button>
                </div>
                <code style="display:block;background:rgba(0,0,0,0.3);padding:6px;border-radius:4px;font-size:0.8rem;color:#a8b5d8;font-family:monospace;word-break:break-all;">$JAVA -Xms$RAMg -Xmx$RAMg -jar $JAR nogui</code>
              </div>
              <textarea data-field="runtime-custom-cmd" style="font-family:monospace;font-size:0.85rem;min-height:80px;" placeholder="Leave empty for default command&#10;Placeholders: $JAVA (java path), $RAM (GB), $JAR (server.jar)&#10;Example: $JAVA -Xms$RAMg -Xmx$RAMg -XX:+UseG1GC -jar $JAR nogui">${escapeAttr(server.customStartCmd || "")}</textarea>
            </div>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="save-runtime-settings">Save Runtime Settings</button>
          </div>
        </div>
        ${resourcePackMarkup}
      </div>
    `,
    worlds: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Worlds</h4>
          <ul class="list-tight world-list">${worldsMarkup}</ul>
        </div>
        <div class="detail-card">
          <h4>World Actions</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              World Name
              <input data-field="world-name" type="text" placeholder="world_mountain" />
            </label>
            <label>
              Custom Seed (optional)
              <input data-field="world-seed" type="text" placeholder="my-seed-123" />
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="world-add">Add World</button>
            <button class="btn tiny" data-action="world-import">Import World ZIP</button>
            <button class="btn tiny" data-action="refresh-worlds">Refresh Worlds</button>
            <button class="btn tiny" data-action="create-backup">Create Backup</button>
          </div>
        </div>
      </div>
    `,
    addons: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>${isProxy ? "Proxy Plugins" : "Addons / Plugins"}</h4>
          <ul class="list-tight">${addonsMarkup}</ul>
        </div>
        <div class="detail-card">
          <h4>${isProxy ? "Plugin Actions" : "Addon Actions"}</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              ${isProxy ? "Plugin URL" : "Addon URL"}
              <input data-field="addon-url" type="url" placeholder="https://example.com/plugin.jar" />
            </label>
            <label>
              ${isProxy ? "Plugin Jar File" : "Addon Jar File"}
              <input data-field="addon-file" type="file" accept=".jar" />
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="install-addon-url">Install from URL</button>
            <button class="btn tiny" data-action="upload-addon-jar">Upload Jar</button>
          </div>
          <h4 style="margin-top:14px;">Store (Modrinth)</h4>
          <p class="muted" style="margin-bottom:8px;">Open the store popup for full browsing and explicit loader/version selection before install.</p>
          <div class="detail-pill-row" style="margin-bottom:10px;">
            <button class="btn tiny" data-action="store-open">Open Store Popup</button>
          </div>
        </div>
      </div>
    `,
    logs: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Live Logs</h4>
          <div class="console-frame">
            <div class="console-output compact-console" data-live-console="${escapeAttr(server.id)}">
              ${renderConsoleLines(consoleLines)}
            </div>
          </div>
        </div>
        <div class="detail-card">
          <h4>Log Channels</h4>
          <div class="detail-pill-row">
            <span class="detail-pill">latest.log</span>
            <span class="detail-pill">debug.log</span>
            <span class="detail-pill">crash-reports</span>
          </div>
          <div class="detail-pill-row" style="margin-top:10px;">
            <button class="btn tiny" data-action="refresh-console">Refresh Logs</button>
          </div>
        </div>
      </div>
    `,
    network: isProxy ? `
      <div class="detail-grid">
        <div class="detail-card proxy-routing-editor" style="grid-column:1 / -1;">
          <div class="proxy-routing-heading">
            <div>
              <p class="eyebrow">${escapeHtml(proxySoftware)}</p>
              <h4>Backend Routes</h4>
              <p class="muted">Players connecting to ${escapeHtml(internalAddress)} can be sent to these Minecraft servers.</p>
            </div>
            <span class="detail-pill">${escapeHtml(proxyConfigFile)}</span>
          </div>
          ${proxyRoutesState.error ? `<p class="error">${escapeHtml(proxyRoutesState.error)}</p>` : ""}
          ${!hasManagedProxyRoutes ? '<p class="error">The visual route editor is available for Velocity and BungeeCord.</p>' : ""}
          ${hasManagedProxyRoutes && proxyRoutesState.generated === false ? `<p class="error">Start the proxy once so ${escapeHtml(proxyConfigFile)} can be generated.</p>` : ""}
          <div class="proxy-route-list">${proxyRoutesMarkup}</div>
          <div class="detail-pill-row proxy-route-actions">
            <button class="btn tiny" data-action="add-proxy-route" ${!hasManagedProxyRoutes ? "disabled" : ""}>Add Route</button>
            <button class="btn tiny primary" data-action="save-proxy-routes" ${!hasManagedProxyRoutes || proxyRoutesState.generated === false ? "disabled" : ""}>Save Routes</button>
            <button class="btn tiny" data-action="refresh-proxy-routes" ${!hasManagedProxyRoutes ? "disabled" : ""}>Reload</button>
            <button class="btn tiny" data-action="console-restart">Restart Proxy</button>
          </div>
        </div>
        <div class="detail-card">
          <h4>Listener</h4>
          <ul class="list-tight">
            <li>Address: ${escapeHtml(internalAddress)}</li>
            <li>Firewall profile: proxy-listener</li>
            <li>Configured routes: ${currentProxyRoutes.length}</li>
          </ul>
          <button class="btn tiny" data-action="copy-internal-address" data-address="${escapeAttr(internalAddress)}">Copy Listener</button>
        </div>
        <div class="detail-card">
          <h4>Proxy Traffic</h4>
          <ul class="list-tight">
            <li>Inbound traffic: ${inboundTraffic}</li>
            <li>Outbound traffic: ${outboundTraffic}</li>
            <li>Peak concurrent sockets: ${peakSockets}</li>
          </ul>
        </div>
      </div>
    ` : `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Network</h4>
          <ul class="list-tight"><li>Internal address: ${escapeHtml(internalAddress)}</li><li>Firewall profile: minecraft-default</li></ul>
          <button class="btn tiny" data-action="copy-internal-address" data-address="${escapeAttr(internalAddress)}">Copy Address</button>
        </div>
        <div class="detail-card">
          <h4>Connection Metrics</h4>
          <ul class="list-tight"><li>Inbound traffic: ${inboundTraffic}</li><li>Outbound traffic: ${outboundTraffic}</li><li>Peak concurrent sockets: ${peakSockets}</li></ul>
        </div>
      </div>
    `,
    backups: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Backups</h4>
          <ul class="list-tight">${backupsMarkup}</ul>
        </div>
        <div class="detail-card">
          <h4>Backup Actions</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              Backup Note
              <input data-field="backup-note" type="text" placeholder="manual backup" />
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="create-backup">Create Backup</button>
            <button class="btn tiny" data-action="refresh-backups">Refresh Backups</button>
          </div>
        </div>
        <div class="detail-card cloud-backup-card">
          <span class="unavailable-badge">Unavailable</span>
          <h4>Cloud Backups</h4>
          <p class="muted">Encrypted off-site backups are reserved for a future Plus release.</p>
          <button class="btn tiny" type="button" disabled>Connect Cloud Storage</button>
        </div>
      </div>
    `,
    files: `
      <div class="detail-grid">
        <div class="detail-card" style="grid-column: 1 / -1;">
          <h4>File Manager</h4>
          <p style="margin-bottom:10px; color: var(--muted);">Current path: /${escapeHtml(fileManagerState.path || "")}</p>
          <p style="margin-bottom:10px; color: var(--muted);">Click any folder or file to open it.</p>
          <div class="detail-pill-row" style="margin-bottom:10px;">
            <button class="btn tiny" data-action="file-up">Up</button>
            <button class="btn tiny" data-action="file-refresh">Refresh</button>
          </div>
          <div class="file-drop-zone" data-drop-dir="${escapeAttr(fileManagerState.path || "")}">
            <ul class="list-tight">${fileEntriesMarkup}</ul>
          </div>
        </div>
      </div>
    `,
    schedules: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Schedules</h4>
          <ul class="list-tight">${schedulesMarkup}</ul>
        </div>
        <div class="detail-card">
          <h4>Automation</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              Schedule Name
              <input data-field="schedule-name" type="text" placeholder="Daily Restart" />
            </label>
            <label>
              Cron
              <input data-field="schedule-cron" type="text" placeholder="0 5 * * *" />
            </label>
            <label>
              Action
              <input data-field="schedule-action" type="text" placeholder="restart" />
            </label>
          </div>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="create-schedule">Create Schedule</button>
            <button class="btn tiny" data-action="open-cron-builder">Cron Builder</button>
            <button class="btn tiny" data-action="add-webhook">Add Webhook</button>
          </div>
        </div>
        <div class="detail-card" style="grid-column: 1 / -1;">
          <h4>Webhooks</h4>
          <div class="fields" style="margin-bottom:10px;">
            <label>
              Webhook Name
              <input data-field="webhook-name" type="text" placeholder="Discord Alerts" />
            </label>
            <label>
              Webhook URL
              <input data-field="webhook-url" type="url" placeholder="https://example.com/webhook" />
            </label>
            <label>
              Event
              <input data-field="webhook-event" type="text" placeholder="crash" />
            </label>
          </div>
          <ul class="list-tight">${webhooksMarkup}</ul>
        </div>
      </div>
    `,
    monitoring: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>CPU</h4>
          <p class="muted">Current: ${monitoringData?.cpuPercent ?? 0}%</p>
          ${buildMetricBars(monitoringSeriesCpu, 100, (value) => `${Number(value).toFixed(1)}%`)}
        </div>
        <div class="detail-card">
          <h4>RAM</h4>
          <p class="muted">Current: ${monitoringData?.ramPercent ?? 0}%</p>
          ${buildMetricBars(monitoringSeriesRam, 100, (value) => `${Number(value).toFixed(1)}%`)}
        </div>
        <div class="detail-card">
          <h4>Network</h4>
          <p class="muted">Current: ${formatTrafficRate((monitoringData?.inboundMbps || 0) + (monitoringData?.outboundMbps || 0))}</p>
          ${buildMetricBars(monitoringSeriesNetwork, networkMax, (value) => formatTrafficRate(value))}
        </div>
        <div class="detail-card">
          <h4>TPS</h4>
          <p class="muted">Current: ${(Number(monitoringData?.tps || 0)).toFixed(2)} TPS</p>
          ${buildMetricBars(monitoringSeriesTps, 20, (value) => `${Number(value).toFixed(2)} TPS`)}
        </div>
        <div class="detail-card">
          <h4>Metrics Log</h4>
          <ul class="list-tight">
            <li>Panel process memory: ${formatBytes((monitoringData?.processMemoryMb || 0) * 1024 * 1024)}</li>
            <li>Runtime uptime: ${monitoringData?.uptimeSec || 0}s</li>
            <li>Updated: ${shortDateTime(monitoringData?.updatedAt)}</li>
          </ul>
        </div>
        <div class="detail-card" style="grid-column: 1 / -1;">
          <h4>Players per Day</h4>
          <p class="muted">Unique players who joined each day. Hover a bar for details.</p>
          ${buildDailyPlayerBars(monitoringData?.playersPerDay || [])}
        </div>
      </div>
    `,
    activity: `
      <div class="detail-grid">
        <div class="detail-card">
          <h4>Activity Timeline</h4>
          <ul class="list-tight">${timelineMarkup}</ul>
        </div>
        <div class="detail-card">
          <h4>Audit Summary</h4>
          <div class="detail-pill-row">
            <button class="btn tiny" data-action="simulate-start">Simulate Start</button>
            <button class="btn tiny" data-action="simulate-crash">Simulate Crash</button>
            <button class="btn tiny" data-action="simulate-restart">Simulate Restart</button>
          </div>
        </div>
      </div>
    `
  };

  detailContentEl.innerHTML = contentMap[selectedTab] || contentMap.console;
  applyConsoleScrollBehavior();
}

function setSelectedServer(serverId) {
  const server = servers.find((item) => item.id === serverId);
  if (!server) {
    return;
  }

  window.location.assign(`/${getServerSlug(server)}`);
}

function setSelectedTab(tabName) {
  selectedTab = tabName;
  tabRefreshVersion += 1;
  const expectedVersion = tabRefreshVersion;
  detailTabsEl.querySelectorAll(".detail-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  sidebarNavItems.forEach((button) => {
    button.classList.toggle("tab-active", button.dataset.tab === tabName);
  });
  renderDetail();
  refreshSelectedTabData(expectedVersion).catch(() => {
    renderDetail();
  });
  ensureConsolePolling();
}

function showCreationKindStep() {
  creationKindStep?.classList.remove("hidden");
  serverConfigStep?.classList.add("hidden");
  modal?.classList.add("creation-kind-open");
  modalTitle.textContent = "Create New";
  formError.textContent = "";
}

function showServerConfigStep(kind) {
  creationKind = new Set(["voice-proxy", "service-proxy"]).has(kind) ? kind : "minecraft";
  creationKindStep?.classList.add("hidden");
  serverConfigStep?.classList.remove("hidden");
  modal?.classList.remove("creation-kind-open");
  creationBackBtn?.classList.toggle("hidden", Boolean(editTargetId));
  const isVoiceProxy = creationKind === "voice-proxy";
  const isServiceProxy = creationKind === "service-proxy";
  serverLoaderField?.classList.toggle("hidden", isVoiceProxy);
  serverVersionField?.classList.toggle("hidden", isVoiceProxy || isServiceProxy);
  voiceProxyPluginField?.classList.toggle("hidden", !isVoiceProxy);
  if (voiceProxyPluginInput) {
    voiceProxyPluginInput.required = isVoiceProxy && !editTargetId;
    if (!isVoiceProxy) voiceProxyPluginInput.value = "";
  }
  const currentLoader = String(serverForm.loader?.value || "").toLowerCase();
  setServerLoaderOptions(isServiceProxy ? "service-proxy" : "minecraft", currentLoader);
  if (customJarLabel) {
    customJarLabel.textContent = isServiceProxy ? "Custom Proxy JAR" : (isVoiceProxy ? "Velocity Proxy JAR" : "Custom Server Jar");
  }
  if (isVoiceProxy) {
    modalTitle.textContent = "Simple Voice Chat Proxy";
    saveServerBtn.textContent = "Create Proxy";
    serverForm.loader.value = "custom";
    serverForm.mcVersion.value = "1.21.11";
    serverForm.name.placeholder = "Voice Proxy EU-1";
    serverForm.port.value = serverForm.port.value || "25565";
    serverForm.ramGb.value = serverForm.ramGb.value || "1";
  } else if (isServiceProxy) {
    modalTitle.textContent = editTargetId ? "Edit Server Proxy" : "Server Proxy Setup";
    saveServerBtn.textContent = editTargetId ? "Update Proxy" : "Create Proxy";
    serverForm.mcVersion.value = "1.21.11";
    serverForm.name.placeholder = "Network Proxy EU-1";
    serverForm.port.value = serverForm.port.value || "25565";
    serverForm.ramGb.value = serverForm.ramGb.value || "1";
  } else {
    modalTitle.textContent = editTargetId ? "Edit Server" : "Minecraft Server Setup";
    saveServerBtn.textContent = editTargetId ? "Update Server" : "Continue";
    serverForm.name.placeholder = "Skyblock EU-1";
    if (!editTargetId) {
      serverForm.loader.value = "paper";
    }
  }
  updateCustomJarFormState();
  setTimeout(() => serverForm.name?.focus(), 0);
}

function openModalForCreate() {
  window.location.assign("/install");
}

function openModalForEdit(server) {
  editTargetId = server.id;
  formError.textContent = "";
  creationKind = SERVICE_PROXY_LOADERS.has(String(server?.loader || "").toLowerCase()) ? "service-proxy" : "minecraft";
  showServerConfigStep(creationKind);
  setFormValues(server);
  updateCustomJarFormState();
  modal.showModal();
}

function renderStats() {
  const running = servers.filter((item) => item.status === "running").length;
  const offline = servers.filter((item) => item.status !== "running").length;
  const players = servers.reduce((sum, item) => sum + (item.playersOnline || 0), 0);
  const totalRam = servers.reduce((sum, item) => sum + (item.ramGb || 0), 0);

  const values = [
    { label: "Total Servers", value: servers.length },
    { label: "Running", value: running },
    { label: "Offline", value: offline },
    { label: "Players Online", value: players },
    { label: "Allocated RAM", value: `${totalRam} GB` }
  ];

  statsEl.innerHTML = "";

  values.forEach((stat) => {
    const box = document.createElement("article");
    box.className = "stat-box";
    box.innerHTML = `<p class="stat-label">${stat.label}</p><p class="stat-value">${stat.value}</p>`;
    statsEl.appendChild(box);
  });

  serverCountText.textContent = `${servers.length} total`;
}

function renderServers() {
  serverListEl.innerHTML = "";

  if (!servers.length) {
    serverListEl.innerHTML = "<div class=\"empty\">No servers yet. Create your first node to begin managing your Minecraft network.</div>";
    renderDetail();
    return;
  }

  if (!selectedServerId || !servers.some((item) => item.id === selectedServerId)) {
    selectedServerId = servers[0].id;
  }

  servers.forEach((server) => {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".server-card");
    card.dataset.serverId = server.id;
    if (server.id === selectedServerId) {
      card.classList.add("active");
    }

    clone.querySelector(".server-name").textContent = server.name;
    clone.querySelector(".server-meta").textContent = `${getRuntimeLabel(server)} • Port ${server.port}`;

    const badgeEl = clone.querySelector(".badge");
    badgeEl.textContent = server.status;
    badgeEl.classList.add(server.badge || "offline");

    const chipsWrap = clone.querySelector(".chips");
    [
      `RAM ${server.ramGb} GB`,
      `Players ${server.playersOnline}/${server.maxPlayers || 20}`
    ].forEach((text) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = text;
      chipsWrap.appendChild(chip);
    });

    clone.querySelector(".muted").textContent = `Last action: ${formatTime(server.lastActionAt)}`;

    clone.querySelector(".start-btn").addEventListener("click", () => runAction(server.id, "start"));
    clone.querySelector(".stop-btn").addEventListener("click", () => runAction(server.id, "stop"));
    clone.querySelector(".restart-btn").addEventListener("click", () => runAction(server.id, "restart"));
    clone.querySelector(".edit-btn").addEventListener("click", () => openModalForEdit(server));
    clone.querySelector(".delete-btn").addEventListener("click", () => removeServer(server.id, server.name));
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) {
        return;
      }
      setSelectedServer(server.id);
    });
    card.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      showServerContextMenu(event, server);
    });

    serverListEl.appendChild(card);
  });

  renderDetail();
}

function setAuthMode(mode, message = "") {
  authMode = mode;
  authError.textContent = message;

  if (mode === "setup") {
    authModeLabel.textContent = "Setup";
    authTitle.textContent = "Create Your Admin Account";
    authSubtitle.textContent = "First launch detected. Create one admin user for this local panel.";
    authSubmitBtn.textContent = "Create Admin";
    authForm.password.autocomplete = "new-password";
    return;
  }

  authModeLabel.textContent = "Login";
  authTitle.textContent = "Sign In";
  authSubtitle.textContent = "Use the admin account you created on first launch.";
  authSubmitBtn.textContent = "Login";
  authForm.password.autocomplete = "current-password";
}

function setAuthConnectionState(state) {
  if (!authConnectionStatus) return;
  authConnectionStatus.classList.toggle("is-checking", state === "checking");
  authConnectionStatus.classList.toggle("is-offline", state === "offline");
  const label = authConnectionStatus.querySelector("span");
  if (label) {
    label.textContent = state === "online" ? "Online" : state === "offline" ? "Offline" : "Connecting";
  }
}

function setAuthSubmitting(submitting) {
  authSubmitting = submitting;
  authSubmitBtn.disabled = submitting;
  authSubmitBtn.setAttribute("aria-busy", String(submitting));
  authSubmitBtn.textContent = submitting
    ? (authMode === "setup" ? "Creating account..." : "Signing in...")
    : (authMode === "setup" ? "Create Admin" : "Login");
}

function setSidebarCollapsed(collapsed, persist = true) {
  if (!appShell || !sidebarToggleBtn) return;
  const nextCollapsed = window.matchMedia("(min-width: 981px)").matches && Boolean(collapsed);
  appShell.classList.toggle("sidebar-collapsed", nextCollapsed);
  sidebarToggleBtn.innerHTML = nextCollapsed ? "&rsaquo;" : "&lsaquo;";
  sidebarToggleBtn.setAttribute("aria-label", nextCollapsed ? "Expand sidebar" : "Collapse sidebar");
  sidebarToggleBtn.title = nextCollapsed ? "Expand sidebar" : "Collapse sidebar";
  if (persist) {
    localStorage.setItem("vyron_sidebar_collapsed", nextCollapsed ? "1" : "0");
  }
}

function showAuth(mode, message = "") {
  setAuthMode(mode, message);
  setAuthSubmitting(false);
  authGate.classList.remove("hidden");
  document.body.classList.add("auth-open");
  window.setTimeout(() => authForm.username?.focus(), 80);
}

function hideAuth() {
  authGate.classList.add("hidden");
  document.body.classList.remove("auth-open");
  authError.textContent = "";
}

function renderJavaStatus() {
  if (!javaStatusText) {
    return;
  }

  if (!javaStatus) {
    javaStatusText.textContent = "Checking Java status...";
    if (installJavaBtn) {
      installJavaBtn.disabled = false;
      installJavaBtn.textContent = "Install Java 17";
    }
    return;
  }

  if (javaStatus.installing) {
    javaStatusText.textContent = "Java installation in progress...";
    if (installJavaBtn) {
      installJavaBtn.disabled = true;
      installJavaBtn.textContent = "Installing...";
    }
    return;
  }

  if (javaStatus.installed) {
    javaStatusText.textContent = `Java ready: ${javaStatus.executable || "java"}`;
    if (installJavaBtn) {
      installJavaBtn.disabled = true;
      installJavaBtn.textContent = "Java Installed";
    }
    return;
  }

  javaStatusText.textContent = "Java missing. Install Java 17 to run Minecraft servers.";
  if (installJavaBtn) {
    installJavaBtn.disabled = false;
    installJavaBtn.textContent = "Install Java 17";
  }
}

function renderPanelVersionBanner() {
  if (!panelUpdateBanner || !panelUpdateText || !panelUpdateBtn) {
    return;
  }

  if (!panelVersionStatus) {
    panelUpdateBanner.classList.add("hidden");
    return;
  }

  const hasIssue = Boolean(panelVersionStatus.checkError) || Boolean(panelVersionStatus.update?.lastError);
  const showBanner = Boolean(panelVersionStatus.outdated) || hasIssue || Boolean(panelVersionStatus.update?.running);
  if (!showBanner) {
    panelUpdateBanner.classList.add("hidden");
    return;
  }

  panelUpdateBanner.classList.remove("hidden");

  const currentVersion = String(panelVersionStatus.currentVersion || "0.0.0");
  const latestVersion = String(panelVersionStatus.latestVersion || "0.0.0");
  if (panelVersionStatus.update?.running) {
    panelUpdateText.textContent = `Update running (${currentVersion} -> ${latestVersion})...`;
  } else if (panelVersionStatus.update?.lastError) {
    panelUpdateText.textContent = `Update failed: ${panelVersionStatus.update.lastError}`;
  } else if (panelVersionStatus.checkError) {
    panelUpdateText.textContent = `Version check failed: ${panelVersionStatus.checkError}`;
  } else {
    panelUpdateText.textContent = `Your version is outdated (${currentVersion} -> ${latestVersion}).`;
  }

  panelUpdateBtn.disabled = panelUpdateBusy || Boolean(panelVersionStatus.update?.running);
  panelUpdateBtn.textContent = panelVersionStatus.update?.running
    ? "Updating..."
    : (panelUpdateBusy ? "Starting..." : "Update");
}

async function fetchPanelVersionStatus() {
  try {
    panelVersionStatus = await api("/api/system/version");
  } catch {
    panelVersionStatus = null;
  }
  renderPanelVersionBanner();
}

async function triggerPanelUpdateFromUi() {
  if (panelUpdateBusy) {
    return;
  }

  panelUpdateBusy = true;
  renderPanelVersionBanner();

  try {
    const result = await api("/api/system/update", {
      method: "POST",
      body: JSON.stringify({})
    });

    if (!panelVersionStatus || typeof panelVersionStatus !== "object") {
      panelVersionStatus = {};
    }

    panelVersionStatus.update = {
      ...(panelVersionStatus.update || {}),
      running: true,
      lastStartedAt: result?.startedAt || new Date().toISOString(),
      lastError: ""
    };
    panelUpdateText.textContent = "Update started. The panel may restart in a few seconds.";
    setTimeout(() => {
      fetchPanelVersionStatus().catch(() => {});
    }, 3000);
  } catch (error) {
    window.alert(error.message || "Failed to start update.");
  } finally {
    panelUpdateBusy = false;
    renderPanelVersionBanner();
  }
}

async function fetchJavaStatus() {
  try {
    javaStatus = await api("/api/system/java-status");
  } catch {
    javaStatus = null;
  }
  renderJavaStatus();
}

async function installJavaFromUi() {
  if (installJavaBtn) {
    installJavaBtn.disabled = true;
    installJavaBtn.textContent = "Installing...";
  }
  if (javaStatusText) {
    javaStatusText.textContent = "Installing Java 17, this can take a minute...";
  }

  try {
    const result = await api("/api/system/java-install", {
      method: "POST",
      body: JSON.stringify({})
    });
    javaStatus = {
      installed: Boolean(result.installed),
      executable: result.executable || null,
      installing: false
    };
    renderJavaStatus();
  } catch (error) {
    if (javaStatusText) {
      javaStatusText.textContent = `Java install failed: ${error.message}`;
    }
    if (installJavaBtn) {
      installJavaBtn.disabled = false;
      installJavaBtn.textContent = "Install Java 17";
    }
  }
}

async function api(path, options = {}) {
  try {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      ...options
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) {
        showAuth(payload.requiresSetup ? "setup" : "login", payload.error || "Please sign in.");
      }
      const modeHeader = response.headers.get("x-vyron-command-mode") || "unknown";
      const buildHeader = response.headers.get("x-vyron-build") || "unknown";
      const base = payload.error || `Server responded with status ${response.status}`;
      const staleHint = modeHeader === "unknown" && buildHeader === "unknown"
        ? " Backend is missing Vyron build headers; restart/redeploy the panel server so the latest backend code is running."
        : "";
      throw new Error(`${base}${staleHint} [backendMode=${modeHeader} build=${buildHeader}]`);
    }

    return payload;
  } catch (error) {
    console.error(`API Error: ${options.method || "GET"} ${path}`, error);
    if (error instanceof TypeError) {
      throw new Error(`Network error: Cannot reach backend server. Make sure the panel is running on port 4170.`);
    }
    throw error;
  }
}

async function getAuthStatus() {
  setAuthConnectionState("checking");
  try {
    const response = await fetch("/api/auth/status", {
      credentials: "same-origin"
    });
    if (!response.ok) {
      throw new Error(`Auth status returned ${response.status}`);
    }
    const status = await response.json();
    setAuthConnectionState("online");
    return status;
  } catch (error) {
    setAuthConnectionState("offline");
    throw error;
  }
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (authSubmitting) return;
  authError.textContent = "";

  const username = String(authForm.username.value || "").trim();
  const password = String(authForm.password.value || "");

  if (!username || !password) {
    authError.textContent = "Username and password are required.";
    return;
  }

  const path = authMode === "setup" ? "/api/auth/setup" : "/api/auth/login";

  try {
    setAuthSubmitting(true);
    const response = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ username, password })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setAuthMode(payload.requiresSetup ? "setup" : authMode, payload.error || "Authentication failed.");
      return;
    }

    setAuthConnectionState("online");
    authForm.password.value = "";
    hideAuth();
    await fetchServers();
    openPendingServerOnboarding();
    linkPanelToVyronAccount(username, password).then(applyPremiumAccountSession).catch(() => {});
  } catch (error) {
    if (error instanceof TypeError) {
      setAuthConnectionState("offline");
    }
    authError.textContent = "Could not reach panel backend.";
  } finally {
    setAuthSubmitting(false);
  }
}

function openPendingServerOnboarding() {
  const pendingId = localStorage.getItem("vyron-pending-onboarding");
  if (!pendingId) return;
  const server = servers.find((item) => item.id === pendingId);
  if (!server) return;
  localStorage.removeItem("vyron-pending-onboarding");
  openServerOnboarding(server);
}

async function linkPanelToVyronAccount(login, password) {
  return api("/api/account/link", {
    method: "POST",
    body: JSON.stringify({
      login,
      password,
      panel: {
        name: `Panel on ${window.location.hostname}`,
        url: window.location.origin
      }
    })
  });
}

function applyPremiumAccountSession(payload) {
  if (payload?.token) {
    try { localStorage.setItem(VYRON_ACCOUNT_TOKEN_KEY, payload.token); } catch {}
  }
  if (payload?.account) premiumState.account = payload.account;
  if (selectedTab === "premium") renderDetail();
  return payload;
}

async function restorePremiumAccountSession() {
  let token = "";
  try { token = localStorage.getItem(VYRON_ACCOUNT_TOKEN_KEY) || ""; } catch {}
  if (!token) return null;
  const response = await fetch("/api/account/me", {
    credentials: "same-origin",
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json().catch(() => ({}));
  if (response.status === 401) {
    try { localStorage.removeItem(VYRON_ACCOUNT_TOKEN_KEY); } catch {}
    premiumState.account = null;
    return null;
  }
  if (!response.ok) throw new Error(payload.error || "Could not restore Vyron account login.");
  premiumState.account = payload.account || null;
  if (selectedTab === "premium") renderDetail();
  return premiumState.account;
}

async function logoutPremiumAccountSession() {
  let token = "";
  try { token = localStorage.getItem(VYRON_ACCOUNT_TOKEN_KEY) || ""; } catch {}
  if (token) {
    await fetch("/api/account/logout", {
      method: "POST",
      credentials: "same-origin",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: "{}"
    }).catch(() => {});
  }
  try { localStorage.removeItem(VYRON_ACCOUNT_TOKEN_KEY); } catch {}
  premiumState.account = null;
  premiumState.error = "";
  renderDetail();
}

async function bootstrap() {
  try {
    const status = await getAuthStatus();

    if (status.requiresSetup) {
      showAuth("setup");
      return;
    }

    if (!status.authenticated) {
      showAuth("login");
      return;
    }

    hideAuth();
    restorePremiumAccountSession().catch(() => {});
    await fetchJavaStatus();
    await fetchPanelVersionStatus();
    await fetchServers();
    openPendingServerOnboarding();
  } catch {
    showAuth("login", "Backend unavailable. Start the panel and try again.");
  }
}

async function fetchServers() {
  currentRouteSlug = getRouteSlug();
  syncRouteMode();
  const data = await api("/api/servers");
  servers = data.servers || [];

  if (currentRouteSlug) {
    const routeServer = findServerForRoute();
    selectedServerId = routeServer?.id || selectedServerId;
  }

  renderStats();
  renderServers();
  await refreshSelectedTabData(tabRefreshVersion);
  ensureConsolePolling();
  ensureTabAutoPolling();
}

async function refreshConsole(serverId) {
  const data = await api(`/api/servers/${serverId}/console?limit=120`);
  const server = servers.find((item) => item.id === serverId);
  const previousLines = Array.isArray(server?.consoleTail) ? server.consoleTail : [];
  const previousStatus = String(server?.status || "");
  const previousBadge = String(server?.badge || "");
  const previousRunning = Boolean(server?.running);
  const nextLines = Array.isArray(data.lines) ? data.lines : [];
  const linesChanged = previousLines.length !== nextLines.length
    || previousLines.some((line, idx) => line !== nextLines[idx]);

  if (server) {
    server.consoleTail = nextLines;
    server.running = Boolean(data.running);
    if (data.status) {
      server.status = data.status;
    }
    if (data.badge) {
      server.badge = data.badge;
    }
  }

  const statusChanged = previousStatus !== String(server?.status || "")
    || previousBadge !== String(server?.badge || "")
    || previousRunning !== Boolean(server?.running);
  const changed = linesChanged || statusChanged;

  const logBackedTabs = new Set(["console", "chat", "warnings", "players", "logs", "errors"]);
  if (changed && logBackedTabs.has(selectedTab) && getSelectedServer()?.id === serverId && !isUserTypingInDetail()) {
    renderDetail();
  }
}

async function loadMonitoring(serverId) {
  const data = await api(`/api/servers/${serverId}/monitoring`);
  monitoringData = data.monitoring || null;
  if (monitoringData) {
    pushMonitoringHistory(serverId, monitoringData);
  }
}

async function loadConfig(serverId) {
  const data = await api(`/api/servers/${serverId}/config`);
  configState = {
    raw: data.raw || "",
    properties: data.properties || {}
  };
}

async function loadWorlds(serverId) {
  const data = await api(`/api/servers/${serverId}/worlds`);
  worldsState = Array.isArray(data.worlds) ? data.worlds : [];
}

async function loadBackups(serverId) {
  const data = await api(`/api/servers/${serverId}/backups`);
  backupsState = Array.isArray(data.backups) ? data.backups : [];
}

async function loadPlayers(serverId) {
  const data = await api(`/api/servers/${serverId}/players`);
  playersState = Array.isArray(data.players) ? data.players : [];
  if (playersState.length && !playersState.some((item) => item.name === selectedPlayerName)) {
    selectedPlayerName = playersState[0].name;
  }
}

async function loadFiles(serverId, targetPath = fileManagerState.path || "") {
  saveActiveEditorDraftToState();
  const data = await api(`/api/servers/${serverId}/files?path=${encodeURIComponent(targetPath)}`);
  fileManagerState = {
    path: data.path || "",
    entries: Array.isArray(data.entries) ? data.entries : []
  };
}

function getAiMessagesMarkup() {
  const activeThread = getActiveAiThread();
  const safe = Array.isArray(activeThread?.messages) ? activeThread.messages : [];
  if (!safe.length) {
    return '<div class="ai-msg assistant"><p>No messages yet.</p></div>';
  }

  return safe
    .slice(-30)
    .map((msg) => `<div class="ai-msg ${msg.role === "user" ? "user" : "assistant"}"><p>${escapeHtml(msg.text || "")}</p></div>`)
    .join("");
}

async function loadAiStatus(serverId) {
  const data = await api(`/api/ai/status?serverId=${encodeURIComponent(serverId || "")}`);
  aiState.status = data;
}

function renderAiWidget() {
  if (!aiWidgetMessagesEl) {
    return;
  }
  renderAiThreadList();
  aiWidgetMessagesEl.innerHTML = getAiMessagesMarkup();
  aiWidgetMessagesEl.scrollTop = aiWidgetMessagesEl.scrollHeight;

  const activeThread = getActiveAiThread();
  const pendingActions = Array.isArray(activeThread?.pendingActions) ? activeThread.pendingActions : [];
  const hasPendingAction = pendingActions.length > 0;
  const pendingQuestionText = String(activeThread?.pendingQuestion?.text || "").trim();
  const hasPendingQuestion = Boolean(pendingQuestionText);
  if (aiConfirmBarEl) {
    aiConfirmBarEl.classList.toggle("hidden", !hasPendingAction);
  }
  if (aiConfirmTextEl) {
    aiConfirmTextEl.textContent = hasPendingAction ? pendingActions.join(" | ") : "No action pending.";
  }
  if (aiConfirmAcceptBtn) {
    aiConfirmAcceptBtn.disabled = aiState.loading || !hasPendingAction;
  }
  if (aiConfirmDeclineBtn) {
    aiConfirmDeclineBtn.disabled = aiState.loading || !hasPendingAction;
  }

  if (aiQuestionBarEl) {
    aiQuestionBarEl.classList.toggle("hidden", !hasPendingQuestion);
  }
  if (aiQuestionTextEl) {
    aiQuestionTextEl.textContent = hasPendingQuestion ? pendingQuestionText : "No question pending.";
  }
  if (aiQuestionInputEl && !hasPendingQuestion) {
    aiQuestionInputEl.value = "";
  }
  if (aiQuestionInputEl) {
    aiQuestionInputEl.disabled = aiState.loading || !hasPendingQuestion;
  }
  if (aiQuestionSendBtn) {
    aiQuestionSendBtn.disabled = aiState.loading || !hasPendingQuestion;
  }
  if (aiQuestionAnswerBtn) {
    aiQuestionAnswerBtn.disabled = aiState.loading || !hasPendingQuestion;
  }
  if (aiQuestionDismissBtn) {
    aiQuestionDismissBtn.disabled = aiState.loading || !hasPendingQuestion;
  }
}

function openAiWidget() {
  if (!aiWidgetEl) {
    return;
  }
  aiWidgetEl.classList.remove("hidden");
  renderAiWidget();
}

function closeAiWidget() {
  if (!aiWidgetEl) {
    return;
  }
  aiWidgetEl.classList.add("hidden");
}

async function sendAiMessage(server, promptText = "") {
  const activeThread = getActiveAiThread();
  const prompt = String(promptText || getDetailFieldValue("ai-prompt") || "").trim();
  if (!prompt) {
    throw new Error("Enter a prompt first.");
  }

  activeThread.messages.push({ role: "user", text: prompt });
  if (activeThread.title === "New Chat") {
    activeThread.title = compactText(prompt, 28) || "New Chat";
  }
  aiState.loading = true;
  if (aiWidgetInputEl) {
    aiWidgetInputEl.value = "";
  }
  setDetailFieldValue("ai-prompt", "");
  persistAiThreads();
  renderAiWidget();
  renderDetail();

  try {
    const data = await api("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify({ serverId: server.id, message: prompt })
    });

    const actionSummary = Array.isArray(data.actionResults) && data.actionResults.length
      ? `\n\nAction results: ${data.actionResults.map((item) => (item.ok ? "ok" : "denied/error")).join(", ")}`
      : "";

    activeThread.pendingActions = Array.isArray(data.pendingActions)
      ? data.pendingActions.map((item) => String(item || "")).filter(Boolean)
      : (data.requiresConfirmation ? [String(data.pendingAction || "").trim()].filter(Boolean) : []);
    activeThread.pendingQuestion = data.pendingQuestion && typeof data.pendingQuestion === "object"
      ? {
        type: String(data.pendingQuestion.type || ""),
        text: String(data.pendingQuestion.text || "")
      }
      : null;

    activeThread.messages.push({
      role: "assistant",
      text: `${String(data.reply || "Done.")}${actionSummary}`
    });
    persistAiThreads();
  } catch (error) {
    activeThread.pendingActions = [];
    activeThread.pendingQuestion = null;
    activeThread.messages.push({ role: "assistant", text: `Error: ${error.message || "AI request failed."}` });
    persistAiThreads();
    throw error;
  } finally {
    aiState.loading = false;
    renderAiWidget();
  }
}

async function refreshSelectedTabData(expectedVersion = tabRefreshVersion) {
  const tabAtStart = selectedTab;
  if (tabAtStart === "multi-console") {
    ensureConsolePolling();
    return;
  }
  const server = getSelectedServer();
  if (!server) {
    return;
  }
  const serverIdAtStart = server.id;

  const shouldApply = () => {
    return expectedVersion === tabRefreshVersion && selectedTab === tabAtStart && getSelectedServer()?.id === serverIdAtStart;
  };

  if (new Set(["console", "chat", "warnings", "players", "logs", "errors"]).has(tabAtStart)) {
    await refreshConsole(server.id);
    if (!shouldApply()) {
      return;
    }

    if (tabAtStart === "players") {
      await loadPlayers(server.id);
      if (shouldApply() && !isUserTypingInDetail()) {
        renderDetail();
      }
    }
    return;
  }

  if (tabAtStart === "monitoring" || tabAtStart === "network") {
    await loadMonitoring(server.id);
  }

  if (tabAtStart === "network" && SERVICE_PROXY_LOADERS.has(String(server.loader || "").toLowerCase()) && proxyRoutesState.serverId !== server.id) {
    await loadProxyRoutes(server.id);
  }

  if (tabAtStart === "config") {
    await loadConfig(server.id);
  }

  if (tabAtStart === "worlds") {
    await loadWorlds(server.id);
  }

  if (tabAtStart === "backups") {
    await loadBackups(server.id);
  }

  if (tabAtStart === "ai") {
    await loadAiStatus(server.id);
  }

  if (!shouldApply()) {
    return;
  }

  if (tabAtStart === "files") {
    if (!getActiveEditorTab()) {
      await loadFiles(server.id);
    }
    if (shouldApply() && !isUserTypingInDetail()) {
      renderDetail();
    }
    return;
  }

  if (shouldApply() && !isUserTypingInDetail()) {
    renderDetail();
  }
}

function ensureConsolePolling() {
  if (consolePollId) {
    clearInterval(consolePollId);
    consolePollId = null;
  }
  const logTabs = new Set(["console", "chat", "warnings", "players", "logs", "errors"]);
  const selected = getSelectedServer();
  const desired = selectedTab === "multi-console"
    ? servers.map((server) => server.id)
    : (logTabs.has(selectedTab) && selected ? [selected.id] : []);

  for (const [serverId, stream] of consoleStreams.entries()) {
    if (!desired.includes(serverId)) {
      stream.close();
      consoleStreams.delete(serverId);
    }
  }
  desired.forEach((serverId) => {
    if (consoleStreams.has(serverId)) return;
    const stream = new EventSource("/api/servers/" + encodeURIComponent(serverId) + "/console/stream");
    const applyLines = (lines) => {
      const server = servers.find((item) => item.id === serverId);
      if (!server) return;
      server.consoleTail = Array.isArray(lines) ? lines.slice(-400) : [];
      detailContentEl.querySelectorAll('[data-live-console="' + CSS.escape(serverId) + '"]').forEach((output) => {
        const wasBottom = output.scrollHeight - output.scrollTop - output.clientHeight < 40;
        output.innerHTML = renderConsoleLines(server.consoleTail);
        if (wasBottom) output.scrollTop = output.scrollHeight;
      });
    };
    stream.addEventListener("snapshot", (event) => {
      try { applyLines(JSON.parse(event.data).lines); } catch {}
    });
    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const server = servers.find((item) => item.id === serverId);
        if (!server || !payload.line) return;
        applyLines([...(server.consoleTail || []), payload.line]);
      } catch {}
    };
    consoleStreams.set(serverId, stream);
  });
}

async function loadProxyRoutes(serverId) {
  try {
    const data = await api(`/api/servers/${serverId}/proxy/routes`);
    proxyRoutesState = {
      serverId,
      routes: Array.isArray(data.routes) ? data.routes : [],
      configFile: String(data.configFile || ""),
      generated: data.generated !== false,
      error: ""
    };
  } catch (error) {
    proxyRoutesState = { serverId, routes: [], configFile: "", generated: true, error: error.message || "Could not load proxy routes." };
  }
}

function readProxyRouteDrafts() {
  return Array.from(detailContentEl.querySelectorAll("[data-proxy-route-row]")).map((row) => ({
    originalName: String(row.dataset.originalName || ""),
    name: String(row.querySelector('[data-route-field="name"]')?.value || "").trim(),
    host: String(row.querySelector('[data-route-field="host"]')?.value || "").trim(),
    port: Number(row.querySelector('[data-route-field="port"]')?.value || 0)
  }));
}

function ensureTabAutoPolling() {
  if (tabPollId) {
    clearInterval(tabPollId);
    tabPollId = null;
  }

  tabPollId = setInterval(() => {
    if (isEditorPopupOpen()) {
      return;
    }
    if (isPlayerPopupOpen()) {
      return;
    }
    if (storeOverlayEl && !storeOverlayEl.classList.contains("hidden")) {
      return;
    }
    if (isUserTypingInDetail()) {
      return;
    }
    refreshSelectedTabData().catch(() => {});
  }, 1000);
}

async function saveServer(event) {
  event.preventDefault();
  formError.textContent = "";

  const formData = new FormData(serverForm);
  const loader = String(formData.get("loader") || "").trim().toLowerCase();
  const customJarFile = customJarInput?.files?.[0] || null;
  const proxyPluginFile = voiceProxyPluginInput?.files?.[0] || null;
  const isEditing = Boolean(editTargetId);
  const isVoiceProxy = !isEditing && creationKind === "voice-proxy";
  const isServiceProxy = creationKind === "service-proxy";

  if ((loader === "custom" || loader === "custom-proxy") && !editTargetId && !customJarFile) {
    formError.textContent = "Select a custom .jar file for custom installation.";
    return;
  }
  if (isVoiceProxy && !proxyPluginFile) {
    formError.textContent = "Select the Simple Voice Chat proxy plugin .jar file.";
    return;
  }

  const body = {
    name: formData.get("name"),
    loader,
    mcVersion: isServiceProxy ? "latest" : formData.get("mcVersion"),
    port: Number(formData.get("port")),
    ramGb: Number(formData.get("ramGb")),
    autoStart: formData.get("autoStart") === "on"
  };

  try {
    let response;
    if (editTargetId) {
      response = await api(`/api/servers/${editTargetId}`, {
        method: "PATCH",
        body: JSON.stringify(body)
      });
    } else {
      response = await api("/api/servers", {
        method: "POST",
        body: JSON.stringify(body)
      });
    }

    const serverId = String(response?.server?.id || editTargetId || "");
    if ((loader === "custom" || loader === "custom-proxy") && customJarFile && serverId) {
      await uploadCustomJar(serverId, customJarFile);
    }
    if (isVoiceProxy && serverId) {
      await uploadProxyPlugin(serverId, proxyPluginFile);
      await api(`/api/servers/${serverId}`, {
        method: "PATCH",
        body: JSON.stringify({ customStartCmd: "$JAVA -Xms$RAMG -Xmx$RAMG -jar $JAR" })
      });
      setEulaAccepted(serverId);
    }

    modal.close();
    await fetchServers();
    if (isVoiceProxy && response?.server) {
      showToast("Simple Voice Chat proxy created");
      setSelectedServer(response.server.id);
    } else if (!isEditing && isServiceProxy && response?.server) {
      showToast(`${getRuntimeLabel(response.server)} created`);
      openServerOnboarding(response.server);
    } else if (!isEditing && response?.server) {
      openServerOnboarding(response.server);
    }
  } catch (error) {
    formError.textContent = error.message;
  }
}

async function runAction(id, action) {
  try {
    // If starting server, check EULA acceptance first
    const targetServer = servers.find((server) => server.id === id);
    if (action === "start" && !SERVICE_PROXY_LOADERS.has(String(targetServer?.loader || "").toLowerCase())) {
      const accepted = isEulaAccepted(id);
      if (!accepted) {
        // Show EULA modal and wait for acceptance
        await showEulaModal(id);
        return;
      }
    }

    await api(`/api/servers/${id}/action`, {
      method: "POST",
      body: JSON.stringify({ action })
    });
    await fetchServers();
  } catch (error) {
    window.alert(error.message);
  }
}

function isEulaAccepted(serverId) {
  const accepted = localStorage.getItem(`eula-accepted-${serverId}`);
  return accepted === "true";
}

function setEulaAccepted(serverId) {
  localStorage.setItem(`eula-accepted-${serverId}`, "true");
}

async function showEulaModal(serverId) {
  return new Promise((resolve) => {
    eulaAcceptanceCallback = () => resolve();
    eulaModal.showModal();
    
    // Store the server ID for when they click accept/decline
    eulaModal.dataset.serverId = serverId;
  });
}

async function saveRuntimeSettings(server) {
  const portInput = detailContentEl.querySelector('[data-field="runtime-port"]');
  const ramInput = detailContentEl.querySelector('[data-field="runtime-ram"]');
  const autoStartInput = detailContentEl.querySelector('[data-field="runtime-autostart"]');
  const customCmdInput = detailContentEl.querySelector('[data-field="runtime-custom-cmd"]');

  const port = Number(portInput?.value || 0);
  const ramGb = Number(ramInput?.value || 0);
  const autoStart = Boolean(autoStartInput?.checked);
  const customStartCmd = String(customCmdInput?.value || "").trim();

  // Validate inputs
  if (port < 1 || port > 65535) {
    throw new Error("Port must be between 1 and 65535.");
  }
  if (ramGb < 1 || ramGb > 64) {
    throw new Error("RAM must be between 1 and 64 GB.");
  }

  try {
    await api(`/api/servers/${server.id}`, {
      method: "PATCH",
      body: JSON.stringify({ port, ramGb, autoStart, customStartCmd })
    });
  } catch (error) {
    console.error("Failed to save runtime settings:", error);
    throw error;
  }
}

function getDetailFieldValue(name) {
  const input = detailContentEl.querySelector(`[data-field="${name}"]`);
  return String(input?.value || "").trim();
}

function setDetailFieldValue(name, value) {
  const input = detailContentEl.querySelector(`[data-field="${name}"]`);
  if (input) {
    input.value = value;
  }
}

async function installAddonFromUrl(server) {
  const url = getDetailFieldValue("addon-url");
  if (!url) {
    throw new Error("Please enter an addon URL first.");
  }

  await api(`/api/servers/${server.id}/addons/install-url`, {
    method: "POST",
    body: JSON.stringify({ url })
  });

  setDetailFieldValue("addon-url", "");
}

function loadStoreLikes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORE_LIKES_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map((item) => String(item)) : []);
  } catch {
    return new Set();
  }
}

function saveStoreLikes() {
  try {
    localStorage.setItem(STORE_LIKES_KEY, JSON.stringify(Array.from(storeLikedProjects)));
  } catch {}
}

function setStoreVersions(versions) {
  storeState.versions = Array.isArray(versions) ? versions : [];
  const loaderSet = new Set();
  storeState.versions.forEach((version) => {
    (version.loaders || []).forEach((loader) => loaderSet.add(String(loader).toLowerCase()));
  });
  const loaders = Array.from(loaderSet);
  storeState.selectedLoader = loaders.includes(storeState.selectedLoader)
    ? storeState.selectedLoader
    : (loaders[0] || "");
  const filtered = getStoreVersionsForSelectedLoader();
  storeState.selectedVersionId = filtered[0]?.id || "";
}

function formatStoreVersionDate(value) {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function renderStoreVersionList(projectId, displayType) {
  const versions = Array.isArray(storeState.versions) ? storeState.versions : [];
  if (!versions.length) {
    return '<div class="store-detail-empty">No downloadable versions are available for this project.</div>';
  }

  return `<div class="store-version-list">
    ${versions.map((version) => {
      const versionId = String(version.id || "");
      const versionName = version.versionNumber || version.name || versionId;
      const gameVersions = Array.isArray(version.gameVersions) ? version.gameVersions : [];
      const loaders = Array.isArray(version.loaders) ? version.loaders : [];
      const isInstalling = storeState.installingVersionId === versionId;
      return `<article class="store-version-row">
        <div class="store-version-main">
          <div class="store-version-title-line">
            <strong>${escapeHtml(versionName)}</strong>
            <span class="store-version-channel ${escapeAttr(String(version.versionType || "release").toLowerCase())}">${escapeHtml(version.versionType || "release")}</span>
            ${version.featured ? '<span class="store-version-featured">Featured</span>' : ""}
          </div>
          <span>${escapeHtml(formatStoreVersionDate(version.datePublished))} &bull; ${Number(version.downloads || 0).toLocaleString()} downloads${version.fileSize ? ` &bull; ${escapeHtml(formatBytes(version.fileSize))}` : ""}</span>
          ${version.fileName ? `<small>${escapeHtml(version.fileName)}</small>` : ""}
        </div>
        <div class="store-version-compat">
          <div><span>Minecraft</span><p>${gameVersions.length ? gameVersions.map(escapeHtml).join(", ") : "Any"}</p></div>
          <div><span>Loaders</span><p>${loaders.length ? loaders.map(escapeHtml).join(", ") : "Any"}</p></div>
        </div>
        <button class="btn tiny quick-install-btn" data-action="store-detail-install-version" data-project-id="${escapeAttr(projectId)}" data-project-type="${escapeAttr(displayType)}" data-version-id="${escapeAttr(versionId)}" type="button" ${!versionId || storeState.installingVersionId ? "disabled" : ""}>${isInstalling ? "Installing..." : "Install"}</button>
      </article>`;
    }).join("")}
  </div>`;
}

function renderStoreProjectDetail() {
  if (!storeProjectDetailEl || storeProjectDetailEl.classList.contains("hidden")) {
    return;
  }

  if (storeState.detailLoading) {
    storeProjectDetailContent.innerHTML = '<div class="store-detail-loading">Loading project details...</div>';
    storeProjectDetailActions.innerHTML = "";
    return;
  }

  const project = storeState.projectDetail;
  if (!project) {
    storeProjectDetailContent.innerHTML = `<div class="store-detail-loading">${escapeHtml(storeState.error || "Project details are unavailable.")}</div>`;
    storeProjectDetailActions.innerHTML = "";
    return;
  }

  const projectId = String(project.projectId || storeState.selectedProjectId || "");
  const displayType = storeState.selectedProjectType || project.projectType || "addon";
  const liked = storeLikedProjects.has(projectId);
  const icon = project.iconUrl
    ? `<img class="store-detail-icon" src="${escapeAttr(project.iconUrl)}" alt="${escapeAttr(project.title || "Project")} icon" />`
    : '<div class="store-detail-icon"></div>';
  const categories = Array.isArray(project.categories) ? project.categories : [];
  const gallery = Array.isArray(project.gallery) ? project.gallery.slice(0, 6) : [];
  const body = String(project.body || project.description || "No description provided.");
  const detailTab = storeState.detailTab === "versions" ? "versions" : "overview";

  storeProjectDetailActions.innerHTML = `
    <button class="btn ghost" data-action="store-toggle-like" data-project-id="${escapeAttr(projectId)}" type="button">${liked ? "Liked" : "Like"}</button>
    <button class="btn quick-install-btn" data-action="store-detail-quick-install" data-project-id="${escapeAttr(projectId)}" data-project-type="${escapeAttr(displayType)}" type="button">Quick Install</button>`;

  storeProjectDetailContent.innerHTML = `
    <div class="store-detail-hero">
      ${icon}
      <div class="store-detail-title-wrap">
        <span class="store-pill">${escapeHtml(displayType)}</span>
        <h3>${escapeHtml(project.title || project.slug || projectId)}</h3>
        <p>${escapeHtml(project.description || "")}</p>
      </div>
    </div>
    <div class="store-detail-tabs" role="tablist" aria-label="Project information">
      <button class="store-detail-tab ${detailTab === "overview" ? "active" : ""}" data-action="store-detail-tab" data-detail-tab="overview" type="button" role="tab" aria-selected="${detailTab === "overview"}">Overview</button>
      <button class="store-detail-tab ${detailTab === "versions" ? "active" : ""}" data-action="store-detail-tab" data-detail-tab="versions" type="button" role="tab" aria-selected="${detailTab === "versions"}">Versions <span>${storeState.versions.length.toLocaleString()}</span></button>
    </div>
    ${detailTab === "versions"
      ? renderStoreVersionList(projectId, displayType)
      : `<div class="store-detail-metrics">
          <div><strong>${Number(project.downloads || 0).toLocaleString()}</strong><span>Downloads</span></div>
          <div><strong>${Number(project.followers || 0).toLocaleString()}</strong><span>Followers</span></div>
          <div><strong>${escapeHtml(project.serverSide || "unknown")}</strong><span>Server side</span></div>
          <div><strong>${escapeHtml(project.clientSide || "unknown")}</strong><span>Client side</span></div>
        </div>
        ${categories.length ? `<div class="store-detail-tags">${categories.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
        ${gallery.length ? `<div class="store-detail-gallery">${gallery.map((item) => `<img src="${escapeAttr(item.url || "")}" alt="${escapeAttr(item.title || project.title || "Project image")}" loading="lazy" />`).join("")}</div>` : ""}
        <div class="store-detail-description">${escapeHtml(body)}</div>`}`;
}

async function openStoreProjectDetail(server, projectId, projectType) {
  storeState.selectedProjectId = projectId;
  storeState.selectedProjectType = projectType || storeState.type;
  storeState.projectDetail = null;
  storeState.detailLoading = true;
  storeState.detailTab = "overview";
  storeState.installingVersionId = "";
  storeState.error = "";
  storeProjectDetailEl?.classList.remove("hidden");
  renderStoreProjectDetail();

  try {
    const [projectData, versionData] = await Promise.all([
      api(`/api/store/modrinth/project/${encodeURIComponent(projectId)}`),
      api(`/api/store/modrinth/project/${encodeURIComponent(projectId)}/versions`)
    ]);
    storeState.projectDetail = projectData.project || null;
    setStoreVersions(versionData.versions);
  } catch (error) {
    storeState.error = error.message || "Could not load project details.";
  } finally {
    storeState.detailLoading = false;
    renderStorePopup();
    renderStoreProjectDetail();
  }
}

function closeStoreProjectDetail() {
  storeProjectDetailEl?.classList.add("hidden");
}

function toggleStoreProjectLike(projectId) {
  if (!projectId) {
    return;
  }
  if (storeLikedProjects.has(projectId)) {
    storeLikedProjects.delete(projectId);
  } else {
    storeLikedProjects.add(projectId);
  }
  saveStoreLikes();
  renderStoreProjectDetail();
}

async function searchStore(server, requestedPage = 1) {
  const query = String(storeQueryInput ? storeQueryInput.value : (storeState.query || "")).trim();
  const type = String(storeState.type || "all").trim().toLowerCase();
  const sort = String(storeSortSelect?.value || storeState.sort || "downloads").trim().toLowerCase();
  const pageSize = 100;
  const page = Math.max(1, Math.floor(Number(requestedPage) || 1));
  const offset = (page - 1) * pageSize;

  storeState.query = query;
  storeState.type = type;
  storeState.sort = sort;
  storeState.error = "";
  closeStoreProjectDetail();

  storeState.loading = true;
  renderStorePopup();

  try {
    const data = await api(
      `/api/store/modrinth/search?query=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}&index=${encodeURIComponent(sort)}&limit=${pageSize}&offset=${offset}`
    );
    storeState.results = Array.isArray(data.hits) ? data.hits : [];
    storeState.pageSize = Math.max(1, Number(data.limit) || pageSize);
    storeState.totalHits = Math.max(0, Number(data.totalHits) || 0);
    storeState.offset = Math.max(0, Number(data.offset) || offset);
    storeState.page = Math.floor(storeState.offset / storeState.pageSize) + 1;
    storeState.selectedProjectId = "";
    storeState.selectedProjectType = "";
    storeState.versions = [];
    storeState.selectedLoader = "";
    storeState.selectedVersionId = "";
    storeState.error = "";
  } catch (error) {
    storeState.results = [];
    storeState.totalHits = 0;
    storeState.offset = 0;
    storeState.page = page;
    storeState.selectedProjectId = "";
    storeState.versions = [];
    storeState.error = error.message || "Store search failed.";
  } finally {
    storeState.loading = false;
    renderStorePopup();
  }
}

function getStoreDisplayItems() {
  return Array.isArray(storeState.results) ? storeState.results : [];
}

function getStoreVersionsForSelectedLoader() {
  const loader = String(storeState.selectedLoader || "").toLowerCase();
  const versions = Array.isArray(storeState.versions) ? storeState.versions : [];
  if (!loader) {
    return versions;
  }

  return versions.filter((version) => {
    const loaders = Array.isArray(version.loaders)
      ? version.loaders.map((item) => String(item).toLowerCase())
      : [];
    return loaders.includes(loader);
  });
}

function renderStorePopup() {
  if (!storeOverlayEl || storeOverlayEl.classList.contains("hidden")) {
    return;
  }

  if (storeQueryInput) {
    storeQueryInput.value = storeState.query || "";
  }
  if (storeQueryInput) {
    storeQueryInput.placeholder = "Search all Modrinth projects...";
  }
  if (storeSortSelect) {
    storeSortSelect.value = storeState.sort || "downloads";
  }
  if (storeTabBar) {
    Array.from(storeTabBar.querySelectorAll(".store-tab")).forEach((button) => {
      const tab = String(button.dataset.storeTab || "").toLowerCase();
      button.classList.toggle("active", tab === storeState.tab);
    });
  }

  const loaderOptions = Array.from(
    new Set(
      (storeState.versions || []).flatMap((version) =>
        Array.isArray(version.loaders) ? version.loaders.map((loader) => String(loader).toLowerCase()) : []
      )
    )
  );

  if (storeLoaderSelect) {
    if (!loaderOptions.length) {
      storeLoaderSelect.innerHTML = '<option value="">No loader</option>';
      storeLoaderSelect.value = "";
      storeState.selectedLoader = "";
    } else {
      storeLoaderSelect.innerHTML = loaderOptions
        .map((loader) => `<option value="${escapeAttr(loader)}">${escapeHtml(loader)}</option>`)
        .join("");
      storeState.selectedLoader = loaderOptions.includes(storeState.selectedLoader)
        ? storeState.selectedLoader
        : loaderOptions[0];
      storeLoaderSelect.value = storeState.selectedLoader;
    }
  }

  const filteredVersions = getStoreVersionsForSelectedLoader();
  const totalHits = Math.max(0, Number(storeState.totalHits) || 0);
  const pageSize = Math.max(1, Number(storeState.pageSize) || 100);
  const pageCount = Math.max(1, Math.ceil(totalHits / pageSize));
  const currentPage = Math.min(pageCount, Math.max(1, Number(storeState.page) || 1));
  const rangeStart = totalHits ? Number(storeState.offset || 0) + 1 : 0;
  const rangeEnd = totalHits ? Math.min(Number(storeState.offset || 0) + storeState.results.length, totalHits) : 0;
  if (storeVersionSelect) {
    if (!filteredVersions.length) {
      storeVersionSelect.innerHTML = '<option value="">No versions</option>';
      storeVersionSelect.value = "";
      storeState.selectedVersionId = "";
    } else {
      storeVersionSelect.innerHTML = filteredVersions
        .map((version) => {
          const gameVersions = Array.isArray(version.gameVersions) ? version.gameVersions.join(", ") : "";
          const label = `${version.versionNumber || version.name || version.id}${gameVersions ? ` - ${gameVersions}` : ""}`;
          return `<option value="${escapeAttr(version.id || "")}">${escapeHtml(label)}</option>`;
        })
        .join("");

      const selected = filteredVersions.some((version) => version.id === storeState.selectedVersionId)
        ? storeState.selectedVersionId
        : (filteredVersions[0]?.id || "");
      storeState.selectedVersionId = selected;
      storeVersionSelect.value = selected;
    }
  }

  if (storeStatusText) {
    if (storeState.loading) {
      storeStatusText.textContent = "Loading store data...";
    } else if (storeState.error) {
      storeStatusText.textContent = storeState.error;
    } else if (storeState.selectedProjectId) {
      const currentVersion = filteredVersions.find((version) => version.id === storeState.selectedVersionId);
      const loaderText = storeState.selectedLoader || "none";
      const versionText = currentVersion?.versionNumber || currentVersion?.name || "none";
      storeStatusText.textContent = `Selected loader: ${loaderText} • Selected version: ${versionText}`;
    } else {
      const sortLabels = {
        downloads: "downloads",
        updated: "recent updates",
        newest: "newest",
        relevance: "relevance"
      };
      storeStatusText.textContent = `${totalHits.toLocaleString()} projects sorted by ${sortLabels[storeState.sort] || "downloads"}. Select one for versions or use Quick Install.`;
    }
  }

  if (storePagination) {
    storePagination.classList.toggle("hidden", Boolean(storeState.selectedProjectId));
  }
  if (storeResultRange) {
    storeResultRange.textContent = totalHits
      ? `${rangeStart.toLocaleString()}-${rangeEnd.toLocaleString()} of ${totalHits.toLocaleString()}`
      : "0 projects";
  }
  if (storePageInput) {
    storePageInput.value = String(currentPage);
    storePageInput.max = String(pageCount);
    storePageInput.disabled = storeState.loading || totalHits === 0;
  }
  if (storePageCount) {
    storePageCount.textContent = `of ${pageCount.toLocaleString()}`;
  }
  if (storePrevPageBtn) {
    storePrevPageBtn.disabled = storeState.loading || currentPage <= 1;
  }
  if (storeNextPageBtn) {
    storeNextPageBtn.disabled = storeState.loading || currentPage >= pageCount || totalHits === 0;
  }

  if (storeResultsGrid) {
    const displayItems = getStoreDisplayItems();
    if (!displayItems.length) {
      storeResultsGrid.innerHTML = '<div class="store-empty">No addons found. Try another search term.</div>';
    } else {
      storeResultsGrid.innerHTML = displayItems
        .map((item) => {
          const activeClass = item.projectId === storeState.selectedProjectId ? "store-market-card active" : "store-market-card";
          const icon = item.iconUrl
            ? `<img class="store-card-icon" src="${escapeAttr(item.iconUrl)}" alt="${escapeAttr(item.title || "Addon")} icon" loading="lazy" decoding="async" />`
            : '<div class="store-card-icon"></div>';
          const title = escapeHtml(item.title || item.slug || item.projectId || "Unknown");
          const desc = escapeHtml(item.description || "No description");
          const downloads = Number(item.downloads || 0).toLocaleString();
          const author = escapeHtml(item.author || "unknown");
          const projectType = String(item.projectType || storeState.type || "addon").toLowerCase();
          const badge = escapeHtml(projectType);
          return `<article class="${activeClass}">
            <div class="store-card-head">
              ${icon}
              <div>
                <p class="store-card-name">${title}</p>
                <span class="store-pill">${badge}</span>
              </div>
            </div>
            <p class="store-card-desc">${desc}</p>
            <div class="store-card-stats">
              <span>${downloads} downloads</span>
              <span>${author}</span>
            </div>
            <div class="store-card-actions">
              <button class="btn tiny" data-action="store-select-project" data-project-id="${escapeAttr(item.projectId || "")}" data-project-type="${escapeAttr(projectType)}">View</button>
              <button class="btn tiny quick-install-btn" data-action="store-quick-install" data-project-id="${escapeAttr(item.projectId || "")}" data-project-type="${escapeAttr(projectType)}">Quick Install</button>
            </div>
          </article>`;
        })
        .join("");
    }
  }
}

function openStorePopup() {
  if (!storeOverlayEl) {
    return;
  }
  storeState.tab = "all";
  storeState.type = "all";
  storeState.sort = "downloads";
  storeState.query = "";
  storeState.page = 1;
  storeState.totalHits = 0;
  storeState.offset = 0;
  storeOverlayEl.classList.remove("hidden");
  document.body.classList.add("editor-open");
  renderStorePopup();
  const server = getSelectedServer();
  if (server) {
    searchStore(server, 1).catch((error) => {
      storeState.error = error.message || "Store search failed.";
      renderStorePopup();
    });
  }
}

function closeStorePopup() {
  if (!storeOverlayEl) {
    return;
  }
  storeOverlayEl.classList.add("hidden");
  closeStoreProjectDetail();
  if (!isEditorPopupOpen() && !isPlayerPopupOpen()) {
    document.body.classList.remove("editor-open");
  }
}

function openDonatePopup() {
  if (!donateOverlayPanel) {
    return;
  }

  if (panelDonateFrameEl) {
    const targetSrc = String(panelDonateFrameEl.dataset.src || "").trim();
    const currentSrc = String(panelDonateFrameEl.getAttribute("src") || "").trim();
    if (targetSrc && currentSrc !== targetSrc) {
      panelDonateFrameEl.setAttribute("src", targetSrc);
    }
  }

  donateOverlayPanel.classList.remove("hidden");
  document.body.classList.add("editor-open");
}

function closeDonatePopup() {
  if (!donateOverlayPanel) {
    return;
  }

  if (panelDonateFrameEl) {
    panelDonateFrameEl.removeAttribute("src");
  }

  donateOverlayPanel.classList.add("hidden");
  const storeHidden = !storeOverlayEl || storeOverlayEl.classList.contains("hidden");
  if (!isEditorPopupOpen() && !isPlayerPopupOpen() && storeHidden) {
    document.body.classList.remove("editor-open");
  }
}

function formatGameMode(value) {
  const mapping = {
    0: "Survival",
    1: "Creative",
    2: "Adventure",
    3: "Spectator"
  };
  const num = Number(value);
  return mapping[num] || `Mode ${num}`;
}

function prettifyEffectName(effectId) {
  const id = String(effectId || "");
  const normalized = id.replace(/^minecraft:/i, "").replace(/^id:/i, "ID ");
  return normalized
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatPlayerPing(pingMs, online) {
  if (Number.isFinite(Number(pingMs))) {
    return `${Math.max(0, Math.round(Number(pingMs)))} ms`;
  }
  return online ? "Unavailable" : "Offline";
}

function ensurePlayerEffectsDropdown() {
  if (!playerEffectSelect) {
    return;
  }
  if (playerEffectSelect.options.length) {
    return;
  }
  playerEffectSelect.innerHTML = PLAYER_EFFECTS
    .map((effect) => `<option value="${escapeAttr(effect)}">${escapeHtml(prettifyEffectName(effect))}</option>`)
    .join("");
}

function renderPlayerPopup() {
  if (!isPlayerPopupOpen()) {
    return;
  }

  ensurePlayerEffectsDropdown();

  if (playerPopupTitle) {
    playerPopupTitle.textContent = playerPopupState.player?.name || selectedPlayerName || "Player Details";
  }

  if (playerPopupMeta) {
    if (playerPopupState.loading) {
      playerPopupMeta.textContent = "Loading player data from playerdata...";
    } else if (playerPopupState.error) {
      playerPopupMeta.textContent = playerPopupState.error;
    } else {
      const p = playerPopupState.player;
      if (!p) {
        playerPopupMeta.textContent = "No player selected.";
      } else {
        playerPopupMeta.textContent = `${p.online ? "online" : "offline"} • ping ${formatPlayerPing(p.pingMs, p.online)} • ${p.isOp ? "operator" : "member"}${p.isBanned ? " • banned" : ""}`;
      }
    }
  }

  if (playerInventorySource) {
    playerInventorySource.textContent = playerPopupState.sourceFile
      ? `Source: ${playerPopupState.sourceFile}`
      : "No playerdata source file found yet.";
  }

  if (playerStatsGrid) {
    const stats = playerPopupState.stats;
    if (!stats) {
      playerStatsGrid.innerHTML = '<div class="player-stat-card"><p class="player-stat-label">Status</p><p class="player-stat-value">No stat data</p></div>';
    } else {
      playerStatsGrid.innerHTML = [
        ["Health", `${Number(stats.health || 0).toFixed(1)} / ${stats.maxHealth || 20}`],
        ["Hunger", String(stats.foodLevel ?? 0)],
        ["Saturation", Number(stats.foodSaturation || 0).toFixed(1)],
        ["XP Level", String(stats.xpLevel ?? 0)],
        ["Ping", formatPlayerPing(playerPopupState.player?.pingMs, playerPopupState.player?.online)],
        ["Game Mode", formatGameMode(stats.gameMode)],
        ["Dimension", String(stats.dimension || "minecraft:overworld").replace(/^minecraft:/, "")],
        ["Position", `${Math.round(stats.position?.x || 0)}, ${Math.round(stats.position?.y || 0)}, ${Math.round(stats.position?.z || 0)}`],
        ["Selected Slot", String((stats.selectedSlot ?? 0) + 1)]
      ]
        .map(
          ([label, value]) =>
            `<div class="player-stat-card"><p class="player-stat-label">${escapeHtml(label)}</p><p class="player-stat-value">${escapeHtml(value)}</p></div>`
        )
        .join("");
    }
  }

  if (playerEffectsList) {
    const effects = Array.isArray(playerPopupState.effects) ? playerPopupState.effects : [];
    playerEffectsList.innerHTML = effects.length
      ? effects
          .map((effect) => `<li>${escapeHtml(prettifyEffectName(effect.id))} • Amplifier ${Number(effect.amplifier || 0)} • ${Number(effect.durationSeconds || 0)}s</li>`)
          .join("")
      : "<li>No active effects.</li>";
  }

  if (playerInventoryGrid) {
    const itemMap = new Map((playerPopupState.inventory || []).map((item) => [Number(item.slot), item]));
    const selectedSlot = Number(playerPopupState.stats?.selectedSlot ?? -1);
    const renderSlot = (slotInfo, kind = "") => {
      const slot = Number(slotInfo.slot);
      const item = itemMap.get(slot);
      const kindClass = kind ? ` ${kind}` : "";
      const selectedClass = slot === selectedSlot ? " selected" : "";
      if (!item) {
        return `<article class="player-slot empty${kindClass}${selectedClass}" title="${escapeAttr(slotInfo.label)}"><p class="player-slot-label">${escapeHtml(slotInfo.label)}</p><p class="player-slot-item">Empty</p></article>`;
      }

      const shortName = String(item.displayName || item.id || "Item").trim();
      const iconText = escapeHtml(shortName.slice(0, 2).toUpperCase());
      const count = Number(item.count || 1);
      const countText = count > 1 ? `x${count}` : "";
      return `<article class="player-slot${kindClass}${selectedClass}" title="${escapeAttr(shortName)}">
        <p class="player-slot-label">${escapeHtml(slotInfo.label)}</p>
        <div class="player-slot-icon">${iconText}</div>
        <p class="player-slot-item">${escapeHtml(shortName)}</p>
        <p class="player-slot-count">${escapeHtml(countText)}</p>
      </article>`;
    };

    const armorMarkup = PLAYER_ARMOR_SLOTS.map((slotInfo) => renderSlot(slotInfo, "armor")).join("");
    const offhandMarkup = renderSlot(PLAYER_OFFHAND_SLOT, "offhand");
    const mainMarkup = PLAYER_MAIN_SLOTS.map((slotInfo) => renderSlot(slotInfo, "main")).join("");
    const hotbarMarkup = PLAYER_HOTBAR_SLOTS.map((slotInfo) => renderSlot(slotInfo, "hotbar")).join("");

    playerInventoryGrid.innerHTML = `
      <div class="player-inventory-layout">
        <aside class="player-side-column">
          <p class="player-section-label">Armor</p>
          <div class="player-armor-grid">${armorMarkup}</div>
          <p class="player-section-label">Offhand</p>
          <div class="player-offhand-wrap">${offhandMarkup}</div>
        </aside>
        <section class="player-main-column">
          <p class="player-section-label">Main Inventory</p>
          <div class="player-main-grid">${mainMarkup}</div>
          <p class="player-section-label">Hotbar</p>
          <div class="player-hotbar-grid">${hotbarMarkup}</div>
        </section>
      </div>
    `;
  }
}

async function loadPlayerPopupData(server, playerName) {
  if (!server || !playerName) {
    return;
  }

  playerPopupState.loading = true;
  playerPopupState.error = "";
  renderPlayerPopup();

  try {
    const data = await api(`/api/servers/${server.id}/players/${encodeURIComponent(playerName)}/detail`);
    playerPopupState.player = data.player || null;
    playerPopupState.stats = data.stats || null;
    playerPopupState.inventory = Array.isArray(data.inventory) ? data.inventory : [];
    playerPopupState.effects = Array.isArray(data.effects) ? data.effects : [];
    playerPopupState.sourceFile = data.sourceFile || "";
    playerPopupState.error = "";
  } catch (error) {
    playerPopupState.player = { name: playerName };
    playerPopupState.stats = null;
    playerPopupState.inventory = [];
    playerPopupState.effects = [];
    playerPopupState.sourceFile = "";
    playerPopupState.error = error.message || "Failed to load player data.";
  } finally {
    playerPopupState.loading = false;
    renderPlayerPopup();
  }
}

function openPlayerPopup() {
  if (!playerOverlayEl) {
    return;
  }
  playerOverlayEl.classList.remove("hidden");
  document.body.classList.add("editor-open");
  renderPlayerPopup();
}

function closePlayerPopup() {
  if (!playerOverlayEl) {
    return;
  }
  playerOverlayEl.classList.add("hidden");
  const storeHidden = !storeOverlayEl || storeOverlayEl.classList.contains("hidden");
  if (!isEditorPopupOpen() && storeHidden) {
    document.body.classList.remove("editor-open");
  }
}

async function installFromStore(server) {
  if (!storeState.selectedProjectId) {
    throw new Error("Select a store project first.");
  }
  if (!storeState.selectedLoader) {
    throw new Error("Select a loader first.");
  }
  if (!storeState.selectedVersionId) {
    throw new Error("Select a version first.");
  }

  await api(`/api/servers/${server.id}/addons/install-modrinth`, {
    method: "POST",
    body: JSON.stringify({
      projectId: storeState.selectedProjectId,
      versionId: storeState.selectedVersionId,
      loader: storeState.selectedLoader,
      type: storeState.selectedProjectType || storeState.type
    })
  });
}

async function installStoreVersion(server, projectId, versionId, projectType) {
  if (!projectId || !versionId) {
    throw new Error("Missing project or version id.");
  }

  await api(`/api/servers/${server.id}/addons/install-modrinth`, {
    method: "POST",
    body: JSON.stringify({
      projectId,
      versionId,
      type: projectType || storeState.selectedProjectType || storeState.type
    })
  });
}

async function quickInstallStoreProject(server, projectId, projectType) {
  if (!projectId) {
    throw new Error("Missing project id.");
  }
  await api(`/api/servers/${server.id}/addons/install-modrinth`, {
    method: "POST",
    body: JSON.stringify({
      projectId,
      type: projectType || storeState.type,
      quick: true
    })
  });
}

async function uploadAddonFromFile(server) {
  const input = detailContentEl.querySelector('[data-field="addon-file"]');
  const file = input?.files?.[0];
  if (!file) {
    throw new Error("Choose a .jar file first.");
  }
  if (!file.name.toLowerCase().endsWith(".jar")) {
    throw new Error("Only .jar addon files are supported.");
  }

  const bytes = await file.arrayBuffer();
  const b64 = arrayBufferToBase64(bytes);
  await api(`/api/servers/${server.id}/addons/upload`, {
    method: "POST",
    body: JSON.stringify({ fileName: file.name, contentBase64: b64 })
  });

  if (input) {
    input.value = "";
  }
}

async function saveConfig(server) {
  const existing = { ...(configState.properties || {}) };
  const properties = {
    ...existing,
    "motd": getDetailFieldValue("cfg-motd") || existing["motd"] || "Managed by Vyron",
    "max-players": getDetailFieldValue("cfg-max-players") || existing["max-players"] || "20",
    "difficulty": getDetailFieldValue("cfg-difficulty") || existing["difficulty"] || "normal",
    "gamemode": getDetailFieldValue("cfg-gamemode") || existing["gamemode"] || "survival",
    "view-distance": getDetailFieldValue("cfg-view-distance") || existing["view-distance"] || "10",
    "simulation-distance": getDetailFieldValue("cfg-simulation-distance") || existing["simulation-distance"] || "6",
    "pvp": getDetailFieldValue("cfg-pvp") || existing["pvp"] || "true",
    "online-mode": getDetailFieldValue("cfg-online-mode") || existing["online-mode"] || "true"
  };

  await api(`/api/servers/${server.id}/config`, {
    method: "PUT",
    body: JSON.stringify({ properties })
  });
}

async function uploadServerResourcePack(server) {
  const fileInput = detailContentEl.querySelector('[data-field="resource-pack-file"]');
  const promptInput = detailContentEl.querySelector('[data-field="resource-pack-prompt"]');
  const file = fileInput?.files?.[0];
  if (!file) {
    throw new Error("Choose a resource pack ZIP first.");
  }
  if (!String(file.name || "").toLowerCase().endsWith(".zip")) {
    throw new Error("The resource pack must be a .zip file.");
  }
  if (file.size > 512 * 1024 * 1024) {
    throw new Error("The resource pack cannot be larger than 512 MB.");
  }

  const form = new FormData();
  form.append("resourcePack", file);
  form.append("prompt", String(promptInput?.value || "").trim());
  const response = await fetch(`/api/servers/${encodeURIComponent(server.id)}/resource-pack`, {
    method: "POST",
    body: form,
    credentials: "same-origin"
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Resource pack upload failed.");
  }
  return payload;
}

async function removeServerResourcePack(server) {
  return api(`/api/servers/${server.id}/resource-pack`, { method: "DELETE" });
}

async function createBackup(server) {
  const note = getDetailFieldValue("backup-note") || "manual backup";
  await api(`/api/servers/${server.id}/backups/create`, {
    method: "POST",
    body: JSON.stringify({ note })
  });
}

async function restoreBackup(server, backupName) {
  if (!window.confirm(`Restore ${backupName}? Current server files will be replaced. The server must be stopped.`)) return false;
  await api(`/api/servers/${server.id}/backups/restore`, {
    method: "POST",
    body: JSON.stringify({ name: backupName })
  });
}

async function openFileContent(server, relativePath) {
  const data = await api(`/api/servers/${server.id}/files/content?path=${encodeURIComponent(relativePath)}`);
  const resolvedPath = data.path || relativePath;
  upsertFileEditorTab(resolvedPath, data.content || "");
}

async function saveFileContent(server) {
  saveActiveEditorDraftToState();
  const activeTab = getActiveEditorTab();
  const pathValue = activeTab?.path || "";
  const fallback = String(detailContentEl.querySelector('[data-field="file-content-fallback"]')?.value || "");
  const content = activeTab ? activeTab.content : fallback;
  if (!pathValue) {
    throw new Error("Open a file first.");
  }

  await api(`/api/servers/${server.id}/files/content`, {
    method: "PUT",
    body: JSON.stringify({ path: pathValue, content })
  });

  if (activeTab) {
    activeTab.dirty = false;
  }
}

async function uploadFileToDir(server, file, dirPath) {
  const bytes = await file.arrayBuffer();
  const b64 = arrayBufferToBase64(bytes);
  await api(`/api/servers/${server.id}/files/upload`, {
    method: "POST",
    body: JSON.stringify({
      dirPath: dirPath || "",
      fileName: file.name,
      contentBase64: b64
    })
  });
  showToast("Backup restored");
  return true;
}

function renderUploadQueue() {
  if (!uploadQueuePanelEl || !uploadQueueListEl) {
    return;
  }
  uploadQueuePanelEl.classList.toggle("hidden", uploadQueue.length === 0);
  uploadQueueListEl.innerHTML = uploadQueue
    .map((item) => `<div class="upload-queue-item ${escapeAttr(item.status)}">
      <div><strong>${escapeHtml(item.file.name)}</strong><span>/${escapeHtml(item.dirPath || "")} - ${formatBytes(item.file.size)}</span></div>
      <span class="upload-queue-state">${escapeHtml(item.status === "failed" ? item.error : item.status)}</span>
    </div>`)
    .join("");
}

async function processUploadQueue() {
  if (uploadQueueRunning) {
    return;
  }
  uploadQueueRunning = true;
  let completed = 0;
  while (true) {
    const item = uploadQueue.find((entry) => entry.status === "queued");
    if (!item) {
      break;
    }
    item.status = "uploading";
    renderUploadQueue();
    try {
      await uploadFileToDir({ id: item.serverId }, item.file, item.dirPath);
      item.status = "done";
      completed += 1;
    } catch (error) {
      item.status = "failed";
      item.error = error.message || "Upload failed";
      showToast(`${item.file.name}: ${item.error}`, "error");
    }
    renderUploadQueue();
  }
  uploadQueueRunning = false;
  if (completed) {
    showToast(`${completed} file${completed === 1 ? "" : "s"} uploaded`);
    const server = getSelectedServer();
    if (server) {
      await loadFiles(server.id, fileManagerState.path || "").catch(() => {});
      renderDetail();
    }
  }
}

function enqueueUploadFiles(server, files, dirPath) {
  const accepted = Array.from(files || []).filter((file) => file instanceof File && file.size > 0);
  if (!accepted.length) {
    showToast("No files found in this drop", "error");
    return;
  }
  accepted.forEach((file) => {
    uploadQueue.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      serverId: server.id,
      file,
      dirPath: dirPath || "",
      status: "queued",
      error: ""
    });
  });
  renderUploadQueue();
  processUploadQueue().catch((error) => showToast(error.message || "Upload queue failed", "error"));
}

async function uploadFileToCurrentDir(server) {
  const input = editorUploadInput || detailContentEl.querySelector('[data-field="file-upload"]');
  const files = Array.from(input?.files || []);
  if (!files.length) {
    throw new Error("Choose one or more files first.");
  }
  enqueueUploadFiles(server, files, fileManagerState.path || "");
  if (input) {
    input.value = "";
  }
}

function hideFileContextMenu() {
  fileContextMenuEl?.classList.add("hidden");
  fileContextState = { path: "", kind: "file" };
}

function hideAddonContextMenu() {
  addonContextMenuEl?.classList.add("hidden");
  addonContextState = { id: "", name: "" };
}

function hideWorldContextMenu() {
  worldContextMenuEl?.classList.add("hidden");
  worldContextState = { name: "", seed: "" };
}

function hideServerContextMenu() {
  serverContextMenuEl?.classList.add("hidden");
  serverContextState = { id: "", name: "" };
}

function showFileContextMenu(event, pathValue, kind) {
  if (!fileContextMenuEl || !pathValue) {
    return;
  }
  hideAddonContextMenu();
  hideWorldContextMenu();
  fileContextState = { path: pathValue, kind: kind || "file" };
  const downloadButton = fileContextMenuEl.querySelector('[data-file-context-action="download"]');
  if (downloadButton) {
    downloadButton.disabled = fileContextState.kind !== "file";
  }
  fileContextMenuEl.classList.remove("hidden");
  fileContextMenuEl.style.left = "0px";
  fileContextMenuEl.style.top = "0px";
  const rect = fileContextMenuEl.getBoundingClientRect();
  const left = Math.max(8, Math.min(event.clientX, window.innerWidth - rect.width - 8));
  const top = Math.max(8, Math.min(event.clientY, window.innerHeight - rect.height - 8));
  fileContextMenuEl.style.left = `${left}px`;
  fileContextMenuEl.style.top = `${top}px`;
  fileContextMenuEl.querySelector("button:not(:disabled)")?.focus();
}

function showAddonContextMenu(event, addonId, addonName) {
  if (!addonContextMenuEl || !addonId) {
    return;
  }
  hideFileContextMenu();
  hideWorldContextMenu();
  addonContextState = { id: addonId, name: addonName || "Addon" };
  addonContextMenuEl.classList.remove("hidden");
  addonContextMenuEl.style.left = "0px";
  addonContextMenuEl.style.top = "0px";
  const rect = addonContextMenuEl.getBoundingClientRect();
  addonContextMenuEl.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - rect.width - 8))}px`;
  addonContextMenuEl.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - rect.height - 8))}px`;
  addonContextMenuEl.querySelector("button")?.focus();
}

function showWorldContextMenu(event, worldName, worldSeed = "") {
  if (!worldContextMenuEl || !worldName) return;
  hideFileContextMenu();
  hideAddonContextMenu();
  hideServerContextMenu();
  worldContextState = { name: worldName, seed: worldSeed };
  worldContextMenuEl.classList.remove("hidden");
  worldContextMenuEl.style.left = "0px";
  worldContextMenuEl.style.top = "0px";
  const rect = worldContextMenuEl.getBoundingClientRect();
  worldContextMenuEl.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - rect.width - 8))}px`;
  worldContextMenuEl.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - rect.height - 8))}px`;
  worldContextMenuEl.querySelector("button")?.focus();
}

function showServerContextMenu(event, server) {
  if (!serverContextMenuEl || !server) return;
  hideFileContextMenu();
  hideAddonContextMenu();
  hideWorldContextMenu();
  serverContextState = { id: server.id, name: server.name };
  serverContextMenuEl.classList.remove("hidden");
  serverContextMenuEl.style.left = "0px";
  serverContextMenuEl.style.top = "0px";
  const rect = serverContextMenuEl.getBoundingClientRect();
  serverContextMenuEl.style.left = `${Math.max(8, Math.min(event.clientX, window.innerWidth - rect.width - 8))}px`;
  serverContextMenuEl.style.top = `${Math.max(8, Math.min(event.clientY, window.innerHeight - rect.height - 8))}px`;
  serverContextMenuEl.querySelector("button")?.focus();
}

async function importServerArchive(file) {
  if (!file || !file.name.toLowerCase().endsWith(".zip")) throw new Error("Choose a .zip server export.");
  const form = new FormData();
  form.append("archive", file);
  const response = await fetch("/api/servers/import", { method: "POST", body: form, credentials: "same-origin" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Server import failed.");
  selectedServerId = payload.server?.id || selectedServerId;
  await fetchServers();
  showToast("Server imported");
}

function remapOpenFilePaths(previousPath, nextPath) {
  fileEditorTabs.forEach((tab) => {
    if (tab.path === previousPath || tab.path.startsWith(`${previousPath}/`)) {
      tab.path = `${nextPath}${tab.path.slice(previousPath.length)}`;
    }
  });
  if (activeFileEditorPath === previousPath || activeFileEditorPath.startsWith(`${previousPath}/`)) {
    activeFileEditorPath = `${nextPath}${activeFileEditorPath.slice(previousPath.length)}`;
  }
}

function closeOpenFilesUnderPath(pathValue) {
  fileEditorTabs = fileEditorTabs.filter((tab) => tab.path !== pathValue && !tab.path.startsWith(`${pathValue}/`));
  if (activeFileEditorPath === pathValue || activeFileEditorPath.startsWith(`${pathValue}/`)) {
    activeFileEditorPath = fileEditorTabs[0]?.path || "";
  }
}

async function downloadServerFile(server, pathValue) {
  const response = await fetch(`/api/servers/${encodeURIComponent(server.id)}/files/download?path=${encodeURIComponent(pathValue)}`, {
    credentials: "same-origin"
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `Download failed (${response.status}).`);
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = pathValue.replace(/\\/g, "/").split("/").pop() || "download";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  showToast("Download started");
}

async function renameServerFile(server, pathValue) {
  const currentName = pathValue.replace(/\\/g, "/").split("/").pop() || pathValue;
  const newName = String(window.prompt("New name", currentName) || "").trim();
  if (!newName || newName === currentName) {
    return;
  }
  const result = await api(`/api/servers/${server.id}/files`, {
    method: "PATCH",
    body: JSON.stringify({ path: pathValue, newName })
  });
  remapOpenFilePaths(pathValue, result.path || newName);
  await loadFiles(server.id, fileManagerState.path || "");
  renderDetail();
  renderEditorPopup();
  showToast("Renamed successfully");
}

async function deleteServerFileFromContext(server, pathValue, kind) {
  const label = kind === "dir" ? "folder" : "file";
  if (!window.confirm(`Delete this ${label}?\n${pathValue}`)) {
    return;
  }
  await api(`/api/servers/${server.id}/files?path=${encodeURIComponent(pathValue)}`, { method: "DELETE" });
  closeOpenFilesUnderPath(pathValue);
  await loadFiles(server.id, fileManagerState.path || "");
  await fetchServers();
  renderEditorPopup();
  showToast(`${label === "folder" ? "Folder" : "File"} deleted`);
}

async function deleteAddonFromContext(server, addonId, addonName) {
  if (!window.confirm(`Delete plugin/addon?\n${addonName}`)) {
    return;
  }
  await api(`/api/servers/${server.id}/addons/${encodeURIComponent(addonId)}`, { method: "DELETE" });
  await fetchServers();
  showToast("Plugin/addon deleted");
}

async function sendPlayerActionDirect(server, action, player, value = "") {
  await api(`/api/servers/${server.id}/players/action`, {
    method: "POST",
    body: JSON.stringify({ action, player, value })
  });
}

async function sendPlayerAction(server, action) {
  const player = selectedPlayerName;
  const value = getDetailFieldValue("player-value");
  if (!player) {
    throw new Error("Select a player first.");
  }
  await sendPlayerActionDirect(server, action, player, value);
}

async function createSchedule(server) {
  const name = getDetailFieldValue("schedule-name");
  const cron = getDetailFieldValue("schedule-cron");
  const action = getDetailFieldValue("schedule-action");

  if (!name || !cron || !action) {
    throw new Error("Please fill schedule name, cron and action.");
  }

  await api(`/api/servers/${server.id}/schedules`, {
    method: "POST",
    body: JSON.stringify({ name, cron, action })
  });

  setDetailFieldValue("schedule-name", "");
  setDetailFieldValue("schedule-cron", "");
  setDetailFieldValue("schedule-action", "");
}

async function addWebhook(server) {
  const name = getDetailFieldValue("webhook-name");
  const url = getDetailFieldValue("webhook-url");
  const event = getDetailFieldValue("webhook-event");

  if (!name || !url || !event) {
    throw new Error("Please fill webhook name, URL and event.");
  }

  await api(`/api/servers/${server.id}/webhooks`, {
    method: "POST",
    body: JSON.stringify({ name, url, event })
  });

  setDetailFieldValue("webhook-name", "");
  setDetailFieldValue("webhook-url", "");
  setDetailFieldValue("webhook-event", "");
}

async function handleDetailAction(actionName, buttonEl = null) {
  if (actionName === "send-multi-console-command") {
    const targetId = String(buttonEl?.dataset?.serverId || "");
    const input = detailContentEl.querySelector(`[data-multi-command="${CSS.escape(targetId)}"]`);
    const command = String(input?.value || "").trim();
    if (!targetId || !command) throw new Error("Enter a command first.");
    await api(`/api/servers/${targetId}/console/command`, {
      method: "POST",
      body: JSON.stringify({ command })
    });
    input.value = "";
    showToast("Command sent");
    return;
  }

  if (actionName === "premium-login") {
    const login = getDetailFieldValue("premium-login");
    const password = getDetailFieldValue("premium-password");
    if (!login || !password) throw new Error("Enter your Vyron login and password.");
    premiumState.loading = true;
    premiumState.error = "";
    renderDetail();
    try {
      const payload = await linkPanelToVyronAccount(login, password);
      applyPremiumAccountSession(payload);
      premiumState.account = payload.account || premiumState.account || { login };
      showToast("Panel linked to your Vyron account");
    } catch (error) {
      premiumState.error = error.message || "Login failed.";
    } finally {
      premiumState.loading = false;
      renderDetail();
    }
    return;
  }

  if (actionName === "premium-logout") {
    await logoutPremiumAccountSession();
    showToast("Vyron account logged out");
    return;
  }

  const server = getSelectedServer();
  if (!server) {
    return;
  }

  if (actionName === "jump-detail-tab") {
    const targetTab = String(buttonEl?.dataset?.targetTab || "");
    if (targetTab) setSelectedTab(targetTab);
    return;
  }

  if (actionName === "open-proxy-config") {
    const configFile = String(server.loader || "").toLowerCase() === "velocity" ? "velocity.toml" : "config.yml";
    setSelectedTab("files");
    await loadFiles(server.id, "");
    await openFileContent(server, configFile);
    return;
  }

  if (actionName === "add-proxy-route") {
    const routes = readProxyRouteDrafts();
    const usedNames = new Set(routes.map((route) => route.name.toLowerCase()));
    let suffix = 1;
    let name = "backend";
    while (usedNames.has(name.toLowerCase())) name = `backend${++suffix}`;
    proxyRoutesState = {
      ...proxyRoutesState,
      serverId: server.id,
      routes: [...routes, { originalName: "", name, host: "127.0.0.1", port: 25565 }],
      error: ""
    };
    renderDetail();
    detailContentEl.querySelector('[data-proxy-route-row]:last-child [data-route-field="name"]')?.focus();
    return;
  }

  if (actionName === "delete-proxy-route") {
    const routes = readProxyRouteDrafts();
    const index = Number(buttonEl?.dataset?.routeIndex);
    if (Number.isInteger(index) && index >= 0 && index < routes.length) routes.splice(index, 1);
    proxyRoutesState = { ...proxyRoutesState, serverId: server.id, routes, error: "" };
    renderDetail();
    return;
  }

  if (actionName === "refresh-proxy-routes") {
    await loadProxyRoutes(server.id);
    renderDetail();
    showToast("Proxy routes reloaded");
    return;
  }

  if (actionName === "save-proxy-routes") {
    const routes = readProxyRouteDrafts();
    const data = await api(`/api/servers/${server.id}/proxy/routes`, {
      method: "PUT",
      body: JSON.stringify({ routes })
    });
    proxyRoutesState = {
      serverId: server.id,
      routes: Array.isArray(data.routes) ? data.routes : routes,
      configFile: String(data.configFile || proxyRoutesState.configFile || ""),
      generated: true,
      error: ""
    };
    renderDetail();
    showToast(data.restartRequired ? "Routes saved. Restart the proxy to apply them." : "Proxy routes saved");
    return;
  }

  if (actionName === "install-addon-url") {
    await installAddonFromUrl(server);
    selectedTab = "addons";
    await fetchServers();
    return;
  }

  if (actionName === "upload-addon-jar") {
    await uploadAddonFromFile(server);
    selectedTab = "addons";
    await fetchServers();
    return;
  }

  if (actionName === "store-search") {
    await searchStore(server, 1);
    return;
  }

  if (actionName === "store-page-prev") {
    await searchStore(server, Math.max(1, storeState.page - 1));
    storeResultsGrid?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (actionName === "store-page-next") {
    await searchStore(server, storeState.page + 1);
    storeResultsGrid?.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (actionName === "store-open") {
    openStorePopup();
    return;
  }

  if (actionName === "store-select-project") {
    const projectId = buttonEl?.dataset?.projectId;
    const projectType = buttonEl?.dataset?.projectType;
    if (!projectId) {
      throw new Error("Missing project id.");
    }
    await openStoreProjectDetail(server, projectId, projectType);
    return;
  }

  if (actionName === "store-detail-close") {
    closeStoreProjectDetail();
    return;
  }

  if (actionName === "store-detail-tab") {
    storeState.detailTab = buttonEl?.dataset?.detailTab === "versions" ? "versions" : "overview";
    renderStoreProjectDetail();
    return;
  }

  if (actionName === "store-detail-install-version") {
    const projectId = String(buttonEl?.dataset?.projectId || "");
    const versionId = String(buttonEl?.dataset?.versionId || "");
    const projectType = String(buttonEl?.dataset?.projectType || "");
    storeState.installingVersionId = versionId;
    renderStoreProjectDetail();
    try {
      await installStoreVersion(server, projectId, versionId, projectType);
      showToast("Version installed");
      selectedTab = "addons";
      await fetchServers();
    } finally {
      storeState.installingVersionId = "";
      renderStoreProjectDetail();
    }
    return;
  }

  if (actionName === "store-toggle-like") {
    toggleStoreProjectLike(buttonEl?.dataset?.projectId || "");
    return;
  }

  if (actionName === "store-detail-quick-install") {
    const projectId = buttonEl?.dataset?.projectId;
    const projectType = buttonEl?.dataset?.projectType;
    await quickInstallStoreProject(server, projectId, projectType);
    selectedTab = "addons";
    closeStorePopup();
    await fetchServers();
    return;
  }

  if (actionName === "store-install-selected") {
    await installFromStore(server);
    selectedTab = "addons";
    closeStorePopup();
    await fetchServers();
    return;
  }

  if (actionName === "store-quick-install") {
    const projectId = buttonEl?.dataset?.projectId;
    const projectType = buttonEl?.dataset?.projectType;
    await quickInstallStoreProject(server, projectId, projectType);
    selectedTab = "addons";
    closeStorePopup();
    await fetchServers();
    return;
  }

  if (actionName === "ai-refresh-status") {
    await loadAiStatus(server.id);
    renderDetail();
    return;
  }

  if (actionName === "ai-send") {
    await sendAiMessage(server);
    renderDetail();
    return;
  }

  if (actionName === "select-player") {
    const picked = buttonEl?.dataset?.player || "";
    if (!picked) {
      return;
    }
    selectedPlayerName = picked;
    renderDetail();
    openPlayerPopup();
    await loadPlayerPopupData(server, picked);
    return;
  }

  if (actionName === "player-open-popup") {
    if (!selectedPlayerName) {
      throw new Error("Select a player first.");
    }
    openPlayerPopup();
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-refresh") {
    if (!selectedPlayerName) {
      throw new Error("Select a player first.");
    }
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-op") {
    await sendPlayerActionDirect(server, "op", selectedPlayerName, "");
    await fetchServers();
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-deop") {
    await sendPlayerActionDirect(server, "deop", selectedPlayerName, "");
    await fetchServers();
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-ban") {
    await sendPlayerActionDirect(server, "ban", selectedPlayerName, String(playerActionReason?.value || "").trim());
    await fetchServers();
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-unban") {
    await sendPlayerActionDirect(server, "unban", selectedPlayerName, "");
    await fetchServers();
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-kick") {
    await sendPlayerActionDirect(server, "kick", selectedPlayerName, String(playerActionReason?.value || "").trim());
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-effect") {
    const effect = String(playerEffectSelect?.value || "speed").trim();
    const duration = Math.max(1, Number(playerEffectDuration?.value || 60));
    const amplifier = Math.max(0, Number(playerEffectAmplifier?.value || 1));
    await sendPlayerActionDirect(server, "effect", selectedPlayerName, `${effect} ${duration} ${amplifier}`);
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "player-popup-clear-effects") {
    await sendPlayerActionDirect(server, "effect-clear", selectedPlayerName, "");
    await loadPlayerPopupData(server, selectedPlayerName);
    return;
  }

  if (actionName === "create-schedule") {
    await createSchedule(server);
    selectedTab = "schedules";
    await fetchServers();
    return;
  }

  if (actionName === "add-webhook") {
    await addWebhook(server);
    selectedTab = "schedules";
    await fetchServers();
    return;
  }

  if (actionName === "simulate-start") {
    await runAction(server.id, "start");
    return;
  }

  if (actionName === "simulate-crash") {
    await runAction(server.id, "crash");
    return;
  }

  if (actionName === "simulate-restart") {
    await runAction(server.id, "restart");
    return;
  }

  if (actionName === "console-start") {
    await runAction(server.id, "start");
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "console-stop") {
    await runAction(server.id, "stop");
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "console-restart") {
    await runAction(server.id, "restart");
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "refresh-console") {
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "copy-internal-address") {
    const rawAddress = buttonEl?.dataset?.address || "";
    await copyTextToClipboard(rawAddress);
    if (buttonEl) {
      const original = buttonEl.textContent;
      buttonEl.textContent = "Copied";
      setTimeout(() => {
        buttonEl.textContent = original;
      }, 1100);
    }
    showToast("Address copied");
    return;
  }

  if (actionName === "reload-config") {
    await loadConfig(server.id);
    renderDetail();
    return;
  }

  if (actionName === "upload-resource-pack") {
    const originalText = buttonEl?.textContent || "Upload Pack";
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = "Uploading...";
    }
    try {
      const result = await uploadServerResourcePack(server);
      await loadConfig(server.id);
      await fetchServers();
      showToast(result.restartRequired ? "Resource pack uploaded - restart the server to apply it" : "Required resource pack uploaded");
    } finally {
      if (buttonEl?.isConnected) {
        buttonEl.disabled = false;
        buttonEl.textContent = originalText;
      }
    }
    return;
  }

  if (actionName === "copy-resource-pack-url") {
    await copyTextToClipboard(buttonEl?.dataset?.url || "");
    showToast("Resource pack URL copied");
    return;
  }

  if (actionName === "remove-resource-pack") {
    if (!window.confirm("Remove the required resource pack from this server?")) {
      return;
    }
    const result = await removeServerResourcePack(server);
    await loadConfig(server.id);
    await fetchServers();
    showToast(result.restartRequired ? "Resource pack removed - restart the server to apply it" : "Resource pack removed");
    return;
  }

  if (actionName === "save-config") {
    await saveConfig(server);
    await loadConfig(server.id);
    await fetchServers();
    showToast("Configuration saved");
    return;
  }

  if (actionName === "copy-default-cmd") {
    const defaultCmd = "$JAVA -Xms$RAMg -Xmx$RAMg -jar $JAR nogui";
    await copyTextToClipboard(defaultCmd);
    showToast("Startup command copied");
    return;
  }

  if (actionName === "save-runtime-settings") {
    await saveRuntimeSettings(server);
    await fetchServers();
    showToast("Runtime settings saved");
    return;
  }

  if (actionName === "world-add") {
    await createWorld(server);
    await loadWorlds(server.id);
    renderDetail();
    return;
  }

  if (actionName === "world-import") {
    worldImportInput?.click();
    return;
  }

  if (actionName === "world-menu") {
    const worldName = String(buttonEl?.dataset?.worldName || "").trim();
    const worldSeed = String(buttonEl?.dataset?.worldSeed || "").trim();
    const rect = buttonEl.getBoundingClientRect();
    showWorldContextMenu({ clientX: rect.right, clientY: rect.bottom }, worldName, worldSeed);
    return;
  }

  if (actionName === "world-edit") {
    const currentName = String(buttonEl?.dataset?.worldName || "").trim();
    const currentSeed = String(buttonEl?.dataset?.worldSeed || "").trim();
    if (!currentName) {
      throw new Error("Missing world name.");
    }

    await editWorldInteractive(server, currentName, currentSeed);
    return;
  }

  if (actionName === "world-delete") {
    const worldName = String(buttonEl?.dataset?.worldName || "").trim();
    if (!worldName) {
      throw new Error("Missing world name.");
    }

    const ok = window.confirm(`Delete world "${worldName}"? This cannot be undone.`);
    if (!ok) {
      return;
    }

    await removeWorld(server, worldName);
    await loadWorlds(server.id);
    renderDetail();
    return;
  }

  if (actionName === "refresh-worlds") {
    await loadWorlds(server.id);
    renderDetail();
    return;
  }

  if (actionName === "refresh-backups") {
    await loadBackups(server.id);
    renderDetail();
    return;
  }

  if (actionName === "create-backup") {
    await createBackup(server);
    await loadBackups(server.id);
    await fetchServers();
    return;
  }

  if (actionName === "restore-backup") {
    const backupName = buttonEl?.dataset?.backup;
    if (!backupName) {
      throw new Error("Missing backup name.");
    }
    await restoreBackup(server, backupName);
    await fetchServers();
    return;
  }

  if (actionName === "file-refresh") {
    await loadFiles(server.id, fileManagerState.path || "");
    renderDetail();
    return;
  }

  if (actionName === "file-up") {
    const current = (fileManagerState.path || "").replace(/\\/g, "/");
    const next = current.includes("/") ? current.split("/").slice(0, -1).join("/") : "";
    await loadFiles(server.id, next);
    renderDetail();
    return;
  }

  if (actionName === "select-file-entry") {
    const nextPath = buttonEl?.dataset?.path || "";
    const kind = buttonEl?.dataset?.kind || "file";
    if (!nextPath) {
      return;
    }

    if (kind === "dir") {
      await loadFiles(server.id, nextPath);
      renderDetail();
      return;
    }

    await openFileContent(server, nextPath);
    openEditorPopup();
    renderDetail();
    return;
  }

  if (actionName === "open-file-path") {
    const nextPath = buttonEl?.dataset?.path || "";
    await loadFiles(server.id, nextPath);
    renderDetail();
    return;
  }

  if (actionName === "open-file-content") {
    const filePath = buttonEl?.dataset?.path || "";
    await openFileContent(server, filePath);
    renderDetail();
    return;
  }

  if (actionName === "select-editor-tab") {
    const filePath = buttonEl?.dataset?.path || "";
    if (!filePath) {
      return;
    }
    saveActiveEditorDraftToState();
    setActiveFileTab(filePath);
    renderEditorPopup();
    return;
  }

  if (actionName === "close-editor-tab") {
    const filePath = buttonEl?.dataset?.path || "";
    if (!filePath) {
      return;
    }
    saveActiveEditorDraftToState();
    closeFileEditorTab(filePath);
    renderEditorPopup();
    return;
  }

  if (actionName === "delete-file") {
    const filePath = buttonEl?.dataset?.path || "";
    if (!filePath) {
      throw new Error("Missing file path.");
    }
    await api(`/api/servers/${server.id}/files?path=${encodeURIComponent(filePath)}`, {
      method: "DELETE"
    });
    await loadFiles(server.id, fileManagerState.path || "");
    await fetchServers();
    showToast("File deleted");
    return;
  }

  if (actionName === "file-save") {
    await saveFileContent(server);
    await loadFiles(server.id, fileManagerState.path || "");
    renderDetail();
    renderEditorPopup();
    showToast("File saved");
    return;
  }

  if (actionName === "file-download") {
    saveActiveEditorDraftToState();
    const activeTab = getActiveEditorTab();
    if (!activeTab) {
      throw new Error("Open a file first.");
    }
    downloadTextFile(activeTab.path, activeTab.content || "");
    showToast("Download started");
    return;
  }

  if (actionName === "file-upload") {
    await uploadFileToCurrentDir(server);
    return;
  }

  if (actionName === "player-op") {
    await sendPlayerAction(server, "op");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "player-deop") {
    await sendPlayerAction(server, "deop");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "player-invsee") {
    await sendPlayerAction(server, "invsee");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "player-ban") {
    await sendPlayerAction(server, "ban");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "player-unban") {
    await sendPlayerAction(server, "unban");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "player-kick") {
    await sendPlayerAction(server, "kick");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "player-effect") {
    await sendPlayerAction(server, "effect");
    await loadPlayers(server.id);
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "send-console-command") {
    const command = getDetailFieldValue("console-command");
    if (!command) {
      throw new Error("Enter a command first.");
    }

    await api(`/api/servers/${server.id}/console/command`, {
      method: "POST",
      body: JSON.stringify({ command })
    });
    setDetailFieldValue("console-command", "");
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "send-chat-message") {
    const message = getDetailFieldValue("chat-message");
    if (!message) {
      throw new Error("Enter a chat message first.");
    }

    await api(`/api/servers/${server.id}/console/command`, {
      method: "POST",
      body: JSON.stringify({ command: `say ${message}` })
    });

    setDetailFieldValue("chat-message", "");
    await refreshConsole(server.id);
    return;
  }

  if (actionName === "open-cron-builder") {
    setDetailFieldValue("schedule-cron", "0 5 * * *");
    setDetailFieldValue("schedule-action", "restart");
    return;
  }

  if (actionName === "upload-addon-jar") {
    window.alert("Addon action failed.");
  }
}

async function removeServer(id, name) {
  const shouldDelete = window.confirm(`Delete ${name}? This cannot be undone.`);
  if (!shouldDelete) {
    return;
  }

  try {
    await api(`/api/servers/${id}`, {
      method: "DELETE"
    });
    await fetchServers();
  } catch (error) {
    window.alert(error.message);
  }
}

async function seedDemoServers() {
  const demo = [
    { name: "Survival Prime", loader: "paper", mcVersion: "1.21.11", port: 25565, ramGb: 8 },
    { name: "SkyBlock Nova", loader: "purpur", mcVersion: "1.20.6", port: 25576, ramGb: 6 },
    { name: "Forge Arena", loader: "forge", mcVersion: "1.21.1", port: 25588, ramGb: 4 }
  ];

  const createCalls = demo.map((item) => api("/api/servers", { method: "POST", body: JSON.stringify(item) }));

  try {
    await Promise.all(createCalls);
    await fetchServers();
  } catch (error) {
    window.alert(error.message);
  }
}

async function startStopAll(targetAction) {
  if (!servers.length) {
    return;
  }

  for (const server of servers) {
    await runAction(server.id, targetAction);
  }
}

openCreateBtn.addEventListener("click", openModalForCreate);
creationKindStep?.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-creation-kind]");
  if (!choice) return;
  showServerConfigStep(choice.dataset.creationKind);
});
creationBackBtn?.addEventListener("click", showCreationKindStep);
authPasswordToggle?.addEventListener("click", () => {
  const passwordInput = authForm.password;
  const showing = passwordInput.type === "text";
  passwordInput.type = showing ? "password" : "text";
  authPasswordToggle.textContent = showing ? "Show" : "Hide";
  authPasswordToggle.setAttribute("aria-label", showing ? "Show password" : "Hide password");
  authPasswordToggle.setAttribute("aria-pressed", String(!showing));
  passwordInput.focus();
});
authForm.password?.addEventListener("keyup", (event) => {
  authCapsLock?.classList.toggle("hidden", !event.getModifierState("CapsLock"));
});
authForm.password?.addEventListener("keydown", (event) => {
  authCapsLock?.classList.toggle("hidden", !event.getModifierState("CapsLock"));
});
authForm.password?.addEventListener("blur", () => authCapsLock?.classList.add("hidden"));
authForm.addEventListener("submit", handleAuthSubmit);
serverForm.addEventListener("submit", saveServer);
serverForm.loader?.addEventListener("change", () => {
  updateCustomJarFormState();
});
serverOnboardingForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = String(serverOnboardingUsername?.value || "").trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    serverOnboardingFormError.textContent = "Use 3-16 letters, numbers, or underscores.";
    return;
  }
  if (!serverOnboardingEula?.checked) {
    serverOnboardingFormError.textContent = "Accept the Minecraft EULA to start the server.";
    return;
  }
  serverOnboardingFormError.textContent = "";
  serverOnboardingState.username = username;
  if (serverOnboardingState.server?.id) {
    setEulaAccepted(serverOnboardingState.server.id);
  }
  serverOnboardingUsernameStep?.classList.add("hidden");
  serverOnboardingProgressStep?.classList.remove("hidden");
  renderServerOnboarding();
  await startCreatedServerOnboarding();
});
serverOnboardingSkipBtn?.addEventListener("click", () => {
  const serverId = serverOnboardingState.server?.id;
  closeServerOnboarding();
  if (serverId) {
    setSelectedServer(serverId);
  }
});
serverOnboardingRetryBtn?.addEventListener("click", () => {
  startCreatedServerOnboarding();
});
serverOnboardingContinueBtn?.addEventListener("click", () => {
  const serverId = serverOnboardingState.server?.id;
  closeServerOnboarding();
  if (serverId) {
    setSelectedServer(serverId);
  }
});
serverOnboardingCopyBtn?.addEventListener("click", async () => {
  const server = serverOnboardingState.server;
  if (!server) {
    return;
  }

  try {
    await copyTextToClipboard(getInternalServerAddress(server));
    showToast("Server address copied");
  } catch (error) {
    showToast(error.message || "Could not copy address", "error");
  }
});
serverOnboardingSnakeBtn?.addEventListener("click", startOnboardingSnake);
serverOnboardingSnakeCloseBtn?.addEventListener("click", closeOnboardingSnake);
serverOnboardingSnakeRestartBtn?.addEventListener("click", startOnboardingSnake);
document.querySelectorAll("[data-snake-direction]").forEach((button) => {
  button.addEventListener("click", () => {
    setOnboardingSnakeDirection(button.dataset.snakeDirection);
    serverOnboardingSnakeCanvas?.focus();
  });
});
window.addEventListener("keydown", (event) => {
  if (!serverOnboardingSnakePanel || serverOnboardingSnakePanel.classList.contains("hidden")) return;
  const directionByKey = {
    ArrowUp: "up",
    w: "up",
    W: "up",
    ArrowDown: "down",
    s: "down",
    S: "down",
    ArrowLeft: "left",
    a: "left",
    A: "left",
    ArrowRight: "right",
    d: "right",
    D: "right"
  };
  const direction = directionByKey[event.key];
  if (!direction) return;
  event.preventDefault();
  setOnboardingSnakeDirection(direction);
});

eulaAcceptBtn?.addEventListener("click", async () => {
  const serverId = eulaModal.dataset.serverId;
  if (serverId) {
    setEulaAccepted(serverId);
    eulaModal.close();
    // Now start the server
    try {
      await api(`/api/servers/${serverId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: "start" })
      });
      await fetchServers();
    } catch (error) {
      window.alert(error.message);
    }
  }
});

eulaDeclineBtn?.addEventListener("click", () => {
  eulaModal.close();
});

refreshJavaBtn?.addEventListener("click", () => {
  fetchJavaStatus().catch(() => {});
});
installJavaBtn?.addEventListener("click", () => {
  installJavaFromUi().catch(() => {});
});
panelUpdateBtn?.addEventListener("click", () => {
  triggerPanelUpdateFromUi().catch(() => {});
});
logoutBtn.addEventListener("click", async () => {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin"
    });
  } finally {
    showAuth("login", "Logged out.");
  }
});
startAllBtn.addEventListener("click", () => startStopAll("start"));
stopAllBtn.addEventListener("click", () => startStopAll("stop"));
seedBtn.addEventListener("click", seedDemoServers);
donateOpenBtn?.addEventListener("click", () => {
  openDonatePopup();
});
donateCloseBtn?.addEventListener("click", () => {
  closeDonatePopup();
});
donateOverlayPanel?.addEventListener("click", (event) => {
  if (event.target === donateOverlayPanel) {
    closeDonatePopup();
  }
});
backToOverviewBtn.addEventListener("click", () => {
  window.location.assign("/");
});
sidebarNavItems.forEach((button) => {
  button.addEventListener("click", () => {
    setSelectedTab(button.dataset.tab);
  });
});
sidebarToggleBtn?.addEventListener("click", () => {
  setSidebarCollapsed(!appShell?.classList.contains("sidebar-collapsed"));
});
try {
  setSidebarCollapsed(localStorage.getItem("vyron_sidebar_collapsed") === "1", false);
} catch {
  setSidebarCollapsed(false, false);
}
window.addEventListener("resize", () => {
  let collapsed = false;
  try {
    collapsed = localStorage.getItem("vyron_sidebar_collapsed") === "1";
  } catch {
    // Keep the expanded default when storage is unavailable.
  }
  setSidebarCollapsed(collapsed, false);
});
detailTabsEl.addEventListener("click", (event) => {
  const button = event.target.closest(".detail-tab");
  if (!button) {
    return;
  }
  setSelectedTab(button.dataset.tab);
});
detailContentEl.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  try {
    await handleDetailAction(button.dataset.action, button);
  } catch (error) {
    window.alert(error.message || "Action failed");
  }
});
editorCloseBtn?.addEventListener("click", () => {
  closeEditorPopup();
});
playerCloseBtn?.addEventListener("click", () => {
  closePlayerPopup();
});
storeCloseBtn?.addEventListener("click", () => {
  closeStorePopup();
});
editorOverlayEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  try {
    await handleDetailAction(button.dataset.action, button);
  } catch (error) {
    window.alert(error.message || "Action failed");
  }
});
storeOverlayEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  try {
    await handleDetailAction(button.dataset.action, button);
  } catch (error) {
    window.alert(error.message || "Action failed");
  }
});
playerOverlayEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  try {
    await handleDetailAction(button.dataset.action, button);
  } catch (error) {
    window.alert(error.message || "Action failed");
  }
});
storeSearchBtn?.addEventListener("click", async () => {
  const server = getSelectedServer();
  if (!server) {
    return;
  }
  try {
    await searchStore(server, 1);
  } catch (error) {
    window.alert(error.message || "Store search failed");
  }
});
storeSortSelect?.addEventListener("change", async () => {
  storeState.sort = String(storeSortSelect.value || "downloads");
  const server = getSelectedServer();
  if (server) {
    try {
      await searchStore(server, 1);
    } catch (error) {
      window.alert(error.message || "Store search failed");
    }
  }
});
detailContentEl.addEventListener("contextmenu", (event) => {
  const worldEntry = event.target.closest('.world-entry-row[data-world-name]');
  if (worldEntry) {
    event.preventDefault();
    showWorldContextMenu(event, worldEntry.dataset.worldName || "", worldEntry.dataset.worldSeed || "");
    return;
  }
  const fileEntry = event.target.closest('.file-entry-row[data-path]');
  if (fileEntry) {
    event.preventDefault();
    showFileContextMenu(event, fileEntry.dataset.path || "", fileEntry.dataset.kind || "file");
    return;
  }
  const addonEntry = event.target.closest('.addon-entry-row[data-addon-id]');
  if (addonEntry) {
    event.preventDefault();
    showAddonContextMenu(event, addonEntry.dataset.addonId || "", addonEntry.dataset.addonName || "Addon");
    return;
  }
  hideFileContextMenu();
  hideAddonContextMenu();
  hideWorldContextMenu();
});
detailContentEl.addEventListener("dragover", (event) => {
  if (!Array.from(event.dataTransfer?.types || []).includes("Files")) {
    return;
  }
  const folder = event.target.closest('.file-entry-row[data-kind="dir"]');
  const dropZone = event.target.closest(".file-drop-zone");
  const target = folder || dropZone;
  if (!target) {
    return;
  }
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
  if (activeFileDropTarget !== target) {
    activeFileDropTarget?.classList.remove("drop-target");
    activeFileDropTarget = target;
    activeFileDropTarget.classList.add("drop-target");
  }
});
detailContentEl.addEventListener("dragleave", (event) => {
  if (activeFileDropTarget && !activeFileDropTarget.contains(event.relatedTarget)) {
    activeFileDropTarget.classList.remove("drop-target");
    activeFileDropTarget = null;
  }
});
detailContentEl.addEventListener("drop", (event) => {
  const folder = event.target.closest('.file-entry-row[data-kind="dir"]');
  const dropZone = event.target.closest(".file-drop-zone");
  const target = folder || dropZone;
  if (!target) {
    return;
  }
  event.preventDefault();
  const server = getSelectedServer();
  const targetDir = folder?.dataset.path || dropZone?.dataset.dropDir || fileManagerState.path || "";
  activeFileDropTarget?.classList.remove("drop-target");
  activeFileDropTarget = null;
  if (server) {
    enqueueUploadFiles(server, event.dataTransfer?.files || [], targetDir);
  }
});
fileContextMenuEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-file-context-action]");
  if (!button || button.disabled) {
    return;
  }
  const action = String(button.dataset.fileContextAction || "");
  const target = { ...fileContextState };
  const server = getSelectedServer();
  hideFileContextMenu();
  if (!server || !target.path) {
    return;
  }
  try {
    if (action === "download") {
      await downloadServerFile(server, target.path);
    } else if (action === "rename") {
      await renameServerFile(server, target.path);
    } else if (action === "delete") {
      await deleteServerFileFromContext(server, target.path, target.kind);
    }
  } catch (error) {
    window.alert(error.message || "File action failed.");
  }
});
addonContextMenuEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-addon-context-action]");
  if (!button) {
    return;
  }
  const action = String(button.dataset.addonContextAction || "");
  const target = { ...addonContextState };
  const server = getSelectedServer();
  hideAddonContextMenu();
  if (!server || !target.id) {
    return;
  }
  try {
    if (action === "delete") {
      await deleteAddonFromContext(server, target.id, target.name);
    }
  } catch (error) {
    window.alert(error.message || "Plugin action failed.");
  }
});
worldContextMenuEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-world-context-action]");
  if (!button) return;
  const action = String(button.dataset.worldContextAction || "");
  const target = { ...worldContextState };
  const server = getSelectedServer();
  hideWorldContextMenu();
  if (!server || !target.name) return;

  try {
    if (action === "open") {
      fileManagerState.path = target.name;
      setSelectedTab("files");
    } else if (action === "edit") {
      await editWorldInteractive(server, target.name, target.seed);
    } else if (action === "duplicate") {
      await duplicateWorld(server, target.name);
    } else if (action === "export") {
      exportWorld(server, target.name);
    } else if (action === "delete") {
      if (!window.confirm(`Delete world "${target.name}"? This cannot be undone.`)) return;
      await removeWorld(server, target.name);
      await loadWorlds(server.id);
      renderDetail();
      showToast("World deleted");
    }
  } catch (error) {
    window.alert(error.message || "World action failed.");
  }
});
serverContextMenuEl?.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-server-context-action]");
  if (!button) return;
  const action = String(button.dataset.serverContextAction || "");
  const target = { ...serverContextState };
  hideServerContextMenu();
  try {
    if (action === "duplicate") {
      if (!window.confirm(`Duplicate ${target.name}?`)) return;
      const result = await api(`/api/servers/${target.id}/duplicate`, { method: "POST" });
      selectedServerId = result.server?.id || selectedServerId;
      await fetchServers();
      showToast("Server duplicated");
    } else if (action === "export") {
      const server = servers.find((item) => item.id === target.id);
      if (server?.running) throw new Error("Stop the server before exporting it.");
      const link = document.createElement("a");
      link.href = `/api/servers/${encodeURIComponent(target.id)}/export`;
      link.download = `${target.name || "vyron-server"}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast("Server export started");
    } else if (action === "import") {
      serverImportInput?.click();
    }
  } catch (error) {
    window.alert(error.message || "Server action failed.");
  }
});
serverImportInput?.addEventListener("change", async () => {
  const file = serverImportInput.files?.[0];
  serverImportInput.value = "";
  if (!file) return;
  try { await importServerArchive(file); }
  catch (error) { window.alert(error.message || "Server import failed."); }
});
worldImportInput?.addEventListener("change", async () => {
  const file = worldImportInput.files?.[0];
  worldImportInput.value = "";
  const server = getSelectedServer();
  if (!file || !server) return;
  try { await importWorldArchive(server, file); }
  catch (error) { window.alert(error.message || "World import failed."); }
});
uploadQueueClearBtn?.addEventListener("click", () => {
  uploadQueue = uploadQueue.filter((item) => item.status === "queued" || item.status === "uploading");
  renderUploadQueue();
});
document.addEventListener("pointerdown", (event) => {
  if (fileContextMenuEl && !fileContextMenuEl.classList.contains("hidden") && !fileContextMenuEl.contains(event.target)) {
    hideFileContextMenu();
  }
  if (addonContextMenuEl && !addonContextMenuEl.classList.contains("hidden") && !addonContextMenuEl.contains(event.target)) {
    hideAddonContextMenu();
  }
  if (worldContextMenuEl && !worldContextMenuEl.classList.contains("hidden") && !worldContextMenuEl.contains(event.target)) {
    hideWorldContextMenu();
  }
  if (serverContextMenuEl && !serverContextMenuEl.classList.contains("hidden") && !serverContextMenuEl.contains(event.target)) {
    hideServerContextMenu();
  }
});
window.addEventListener("resize", () => {
  hideFileContextMenu();
  hideAddonContextMenu();
  hideWorldContextMenu();
  hideServerContextMenu();
});
window.addEventListener("blur", () => {
  hideFileContextMenu();
  hideAddonContextMenu();
  hideWorldContextMenu();
  hideServerContextMenu();
});
storeLoaderSelect?.addEventListener("change", () => {
  storeState.selectedLoader = String(storeLoaderSelect.value || "").toLowerCase();
  const filtered = getStoreVersionsForSelectedLoader();
  storeState.selectedVersionId = filtered[0]?.id || "";
  renderStorePopup();
});
storeVersionSelect?.addEventListener("change", () => {
  storeState.selectedVersionId = String(storeVersionSelect.value || "");
  renderStorePopup();
});
storeTabBar?.addEventListener("click", async (event) => {
  const tabButton = event.target.closest("[data-store-tab]");
  if (!tabButton) {
    return;
  }

  const nextTab = String(tabButton.dataset.storeTab || "").toLowerCase();
  storeState.tab = nextTab;
  storeState.error = "";

  if (STORE_SUPPORTED_TYPES.has(nextTab)) {
    storeState.type = nextTab;
  }

  const server = getSelectedServer();
  if (!server) {
    renderStorePopup();
    return;
  }

  try {
    await searchStore(server, 1);
  } catch (error) {
    window.alert(error.message || "Store search failed");
  }
});
storeQueryInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  const server = getSelectedServer();
  if (!server) {
    return;
  }
  try {
    await searchStore(server, 1);
  } catch (error) {
    window.alert(error.message || "Store search failed");
  }
});
storePageInput?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  const server = getSelectedServer();
  if (!server) {
    return;
  }
  const pageCount = Math.max(1, Math.ceil(storeState.totalHits / Math.max(1, storeState.pageSize)));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(storePageInput.value) || 1)));
  try {
    await searchStore(server, page);
    storeResultsGrid?.scrollTo({ top: 0, behavior: "smooth" });
  } catch (error) {
    window.alert(error.message || "Store search failed");
  }
});
aiFabBtn?.addEventListener("click", () => {
  if (!aiWidgetEl || aiWidgetEl.classList.contains("hidden")) {
    openAiWidget();
  } else {
    closeAiWidget();
  }
});
aiWidgetCloseBtn?.addEventListener("click", () => {
  closeAiWidget();
});
aiNewThreadBtn?.addEventListener("click", () => {
  createNewAiThread();
  if (aiWidgetInputEl) {
    aiWidgetInputEl.focus();
  }
});
aiThreadListEl?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-ai-delete-thread]");
  if (deleteButton) {
    const threadId = String(deleteButton.dataset.aiDeleteThread || "").trim();
    if (!threadId) {
      return;
    }
    const shouldDelete = window.confirm("Delete this chat?");
    if (!shouldDelete) {
      return;
    }
    deleteAiThread(threadId);
    return;
  }

  const button = event.target.closest("[data-ai-thread-id]");
  if (!button) {
    return;
  }
  const threadId = String(button.dataset.aiThreadId || "").trim();
  if (!threadId) {
    return;
  }
  setActiveAiThread(threadId);
});
aiWidgetSendBtn?.addEventListener("click", async () => {
  const server = getSelectedServer();
  if (!server) {
    window.alert("Select a server first.");
    return;
  }
  try {
    await sendAiMessage(server, String(aiWidgetInputEl?.value || ""));
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
aiConfirmAcceptBtn?.addEventListener("click", async () => {
  const server = getSelectedServer();
  const activeThread = getActiveAiThread();
  if (!server || aiState.loading || !activeThread?.pendingActions?.length) {
    return;
  }
  try {
    await sendAiMessage(server, "confirm");
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
aiConfirmDeclineBtn?.addEventListener("click", async () => {
  const server = getSelectedServer();
  const activeThread = getActiveAiThread();
  if (!server || aiState.loading || !activeThread?.pendingActions?.length) {
    return;
  }
  try {
    await sendAiMessage(server, "cancel");
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
aiQuestionAnswerBtn?.addEventListener("click", () => {
  if (!aiQuestionInputEl) {
    return;
  }
  aiQuestionInputEl.focus();
});
aiQuestionSendBtn?.addEventListener("click", async () => {
  const server = getSelectedServer();
  const activeThread = getActiveAiThread();
  const answer = String(aiQuestionInputEl?.value || "").trim();
  if (!server || aiState.loading || !activeThread?.pendingQuestion?.text || !answer) {
    return;
  }
  try {
    await sendAiMessage(server, answer);
    if (aiQuestionInputEl) {
      aiQuestionInputEl.value = "";
    }
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
aiQuestionInputEl?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter") {
    return;
  }
  event.preventDefault();
  const server = getSelectedServer();
  const activeThread = getActiveAiThread();
  const answer = String(aiQuestionInputEl.value || "").trim();
  if (!server || aiState.loading || !activeThread?.pendingQuestion?.text || !answer) {
    return;
  }
  try {
    await sendAiMessage(server, answer);
    aiQuestionInputEl.value = "";
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
aiQuestionDismissBtn?.addEventListener("click", async () => {
  const server = getSelectedServer();
  const activeThread = getActiveAiThread();
  if (!server || aiState.loading || !activeThread?.pendingQuestion?.text) {
    return;
  }
  try {
    await sendAiMessage(server, "cancel");
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
aiWidgetInputEl?.addEventListener("keydown", async (event) => {
  if (event.key !== "Enter" || event.shiftKey) {
    return;
  }
  event.preventDefault();
  const server = getSelectedServer();
  if (!server) {
    return;
  }
  try {
    await sendAiMessage(server, String(aiWidgetInputEl.value || ""));
  } catch (error) {
    window.alert(error.message || "Chat failed");
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && addonContextMenuEl && !addonContextMenuEl.classList.contains("hidden")) {
    hideAddonContextMenu();
    return;
  }
  if (event.key === "Escape" && fileContextMenuEl && !fileContextMenuEl.classList.contains("hidden")) {
    hideFileContextMenu();
    return;
  }
  if (event.key === "Escape" && worldContextMenuEl && !worldContextMenuEl.classList.contains("hidden")) {
    hideWorldContextMenu();
    return;
  }
  if (event.key === "Escape" && isEditorPopupOpen()) {
    closeEditorPopup();
    return;
  }
  if (event.key === "Escape" && isPlayerPopupOpen()) {
    closePlayerPopup();
    return;
  }
  if (event.key === "Escape" && storeOverlayEl && !storeOverlayEl.classList.contains("hidden")) {
    closeStorePopup();
    return;
  }
  if (event.key === "Escape" && aiWidgetEl && !aiWidgetEl.classList.contains("hidden")) {
    closeAiWidget();
    return;
  }
  if (event.key === "Escape" && donateOverlayPanel && !donateOverlayPanel.classList.contains("hidden")) {
    closeDonatePopup();
  }
});

cookieNecessaryBtn?.addEventListener("click", () => setCookieConsent("necessary"));
cookieAcceptBtn?.addEventListener("click", () => setCookieConsent("all"));
initializeCookieConsent();

bootstrap().catch((error) => {
  showAuth("login", `Failed to initialize panel: ${error.message}`);
});
