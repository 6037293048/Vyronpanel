require("dotenv").config();

const express = require("express");
const path = require("path");
const fsSync = require("fs");
const fs = require("fs/promises");
const crypto = require("crypto");
const os = require("os");
const { spawn, spawnSync } = require("child_process");
const { pipeline } = require("stream/promises");
const archiver = require("archiver");
const multer = require("multer");
const unzipper = require("unzipper");
const { parse: parseNbt, simplify: simplifyNbt } = require("prismarine-nbt");

const app = express();
const PORT = process.env.PORT || 4170;
const DATA_FILE = path.join(__dirname, "data", "servers.json");
const LEGACY_DOWNLOAD_DIR = path.join(__dirname, "..", "download");
const LOCAL_DOWNLOAD_DIR = path.join(__dirname, "download");
const DOWNLOAD_DIR = fsSync.existsSync(LEGACY_DOWNLOAD_DIR) ? LEGACY_DOWNLOAD_DIR : LOCAL_DOWNLOAD_DIR;
const INSTALLER_FILE = fsSync.existsSync(path.join(DOWNLOAD_DIR, "installer.sh"))
  ? path.join(DOWNLOAD_DIR, "installer.sh")
  : path.join(__dirname, "installer.sh");
const AGENTS_FILE = path.join(__dirname, "data", "agents.json");
const AUTH_FILE = path.join(__dirname, "data", "auth.json");
const SESSIONS_FILE = path.join(__dirname, "data", "sessions.json");
const AI_PERMS_FILE = path.join(__dirname, "data", "ai-permissions.json");
const INSTANCES_DIR = path.join(__dirname, "instances");
const IMPORTS_DIR = path.join(__dirname, ".imports");
const PANEL_PACKAGE_FILE = path.join(__dirname, "package.json");
const UPDATE_API_BASE = String(process.env.VYRON_UPDATE_API_BASE || "https://api.vyronpanel.com").replace(/\/+$/, "");
const SESSION_COOKIE = "vyron_sid";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const MAX_CONSOLE_LINES = 400;
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const MAX_RESOURCE_PACK_BYTES = 512 * 1024 * 1024;
const MODRINTH_API_BASE = "https://api.modrinth.com/v2";
const GROQ_API_BASE = "https://api.groq.com/openai/v1";
const SERVICE_PROXY_LOADERS = new Set(["velocity", "bungeecord", "custom-proxy"]);
const SUPPORTED_LOADERS = new Set(["vanilla", "paper", "purpur", "fabric", "forge", "quilt", "neoforge", "folia", "custom", ...SERVICE_PROXY_LOADERS]);
const AI_PERMISSION_KEYS = [
  "viewConsole",
  "viewPlayers",
  "viewFiles",
  "viewConfig",
  "manageLifecycle",
  "sendConsoleCommands",
  "managePlayers"
];
const DEFAULT_AI_PERMISSIONS = {
  viewConsole: true,
  viewPlayers: true,
  viewFiles: true,
  viewConfig: true,
  manageLifecycle: false,
  sendConsoleCommands: false,
  managePlayers: false
};
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
const COMMAND_MODE = "stdin-only";
const BUILD_STAMP = `${Date.now()}-${process.pid}`;

function parsePropertiesText(content) {
  const props = {};
  const lines = String(content || "").split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const eq = line.indexOf("=");
    if (eq < 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1);
    if (key) {
      props[key] = value;
    }
  }
  return props;
}

function buildPropertiesText(props) {
  const lines = [];
  for (const [key, value] of Object.entries(props)) {
    lines.push(`${key}=${value}`);
  }
  return `${lines.join("\n")}\n`;
}

async function readServerProperties(server) {
  const filePath = path.join(getInstanceDir(server), "server.properties");
  try {
    const content = await fs.readFile(filePath, "utf8");
    return parsePropertiesText(content);
  } catch {
    return {};
  }
}

const runtimeProcesses = new Map();
const runtimeLogs = new Map();
const runtimePlayerState = new Map();
const runtimeStopFlags = new Set();
const runtimeReadyAnnounced = new Set();
const runtimeAiPendingActions = new Map();
const runtimeAiPendingQuestions = new Map();
const runtimeAiMemory = new Map();
const runtimeTpsState = new Map();
const runtimeConsoleSubscribers = new Map();
let lastCpuSample = null;

fsSync.mkdirSync(IMPORTS_DIR, { recursive: true });
const importUpload = multer({
  dest: IMPORTS_DIR,
  limits: { fileSize: 8 * 1024 * 1024 * 1024, files: 1 }
});
const resourcePackUpload = multer({
  dest: IMPORTS_DIR,
  limits: { fileSize: MAX_RESOURCE_PACK_BYTES, files: 1 }
});

function receiveResourcePack(req, res, next) {
  resourcePackUpload.single("resourcePack")(req, res, (error) => {
    if (!error) {
      return next();
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "The resource pack cannot be larger than 512 MB." });
    }
    return res.status(400).json({ error: error.message || "Could not receive the resource pack upload." });
  });
}

function receiveWorldArchive(req, res, next) {
  importUpload.single("world")(req, res, (error) => {
    if (!error) {
      return next();
    }
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "The world archive cannot be larger than 8 GB." });
    }
    return res.status(400).json({ error: error.message || "Could not receive the world archive." });
  });
}

function getAiMemory(pendingKey) {
  const existing = runtimeAiMemory.get(pendingKey);
  if (existing) {
    return existing;
  }

  const created = {
    history: [],
    lastDiagnosis: "",
    lastUserMessage: "",
    lastAssistantReply: ""
  };
  runtimeAiMemory.set(pendingKey, created);
  return created;
}

function pushAiMemoryTurn(memory, role, text) {
  if (!memory) {
    return;
  }
  memory.history = Array.isArray(memory.history) ? memory.history : [];
  memory.history.push({
    at: new Date().toISOString(),
    role: role === "assistant" ? "assistant" : "user",
    text: compactText(String(text || ""), 320)
  });
  if (memory.history.length > 24) {
    memory.history = memory.history.slice(-24);
  }
}

function sampleSystemCpuPercent() {
  const cores = os.cpus() || [];
  if (!cores.length) {
    return 0;
  }

  let total = 0;
  let idle = 0;
  for (const core of cores) {
    const times = core?.times || {};
    const coreTotal = Number(times.user || 0)
      + Number(times.nice || 0)
      + Number(times.sys || 0)
      + Number(times.idle || 0)
      + Number(times.irq || 0);
    total += coreTotal;
    idle += Number(times.idle || 0);
  }

  const now = Date.now();
  if (!lastCpuSample) {
    lastCpuSample = { total, idle, at: now };
    return 0;
  }

  const deltaTotal = total - lastCpuSample.total;
  const deltaIdle = idle - lastCpuSample.idle;
  lastCpuSample = { total, idle, at: now };

  if (deltaTotal <= 0) {
    return 0;
  }

  const usedFraction = 1 - Math.max(0, Math.min(1, deltaIdle / deltaTotal));
  return Math.max(0, Math.min(100, Math.round(usedFraction * 100)));
}
let javaCommandCache = null;
let javaInstallPromise = null;
const panelUpdateState = {
  running: false,
  lastStartedAt: null,
  lastFinishedAt: null,
  lastExitCode: null,
  lastError: ""
};

function readPanelVersion() {
  try {
    const raw = fsSync.readFileSync(PANEL_PACKAGE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return String(parsed?.version || "0.0.0").trim() || "0.0.0";
  } catch {
    return "0.0.0";
  }
}

function parseSemverParts(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/^v/i, "")
    .split("-")[0];
  const parts = cleaned.split(".").map((part) => Number(part));
  if (!parts.length || parts.some((part) => !Number.isFinite(part) || part < 0)) {
    return [0, 0, 0];
  }
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function compareSemver(a, b) {
  const left = parseSemverParts(a);
  const right = parseSemverParts(b);
  for (let i = 0; i < 3; i += 1) {
    if (left[i] > right[i]) {
      return 1;
    }
    if (left[i] < right[i]) {
      return -1;
    }
  }
  return 0;
}

async function fetchLatestPanelVersion() {
  // Try UPDATE_API_BASE first
  const primaryEndpoint = `${UPDATE_API_BASE}/version`;
  
  try {
    const response = await fetch(primaryEndpoint, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      const latestVersion = String(payload?.latestVersion || payload?.version || "").trim();
      if (latestVersion) {
        return {
          latestVersion,
          source: primaryEndpoint
        };
      }
    }
  } catch {
    // Primary endpoint failed, try localhost fallback
  }

  // Fallback: try local API server on port 4180
  const localApiEndpoint = "http://localhost:4180/version";
  try {
    const response = await fetch(localApiEndpoint, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const payload = await response.json().catch(() => ({}));
      const latestVersion = String(payload?.latestVersion || payload?.version || "").trim();
      if (latestVersion) {
        return {
          latestVersion,
          source: localApiEndpoint
        };
      }
    }
  } catch {
    // Local fallback also failed
  }

  // If both fail, return current version from package.json as fallback
  const currentVersion = readPanelVersion();
  return {
    latestVersion: currentVersion,
    source: "local-fallback"
  };
}

function buildPanelInstallerUrl() {
  const machineTag = `panel-${String(os.hostname() || "unknown-host").replace(/[^a-zA-Z0-9._:-]+/g, "-")}`;
  const url = new URL("/download/installer", `${UPDATE_API_BASE}/`);
  url.searchParams.set("machine", machineTag);
  return url.toString();
}

function buildPanelUpdateMachineTag() {
  return `panel-${String(os.hostname() || "unknown-host").replace(/[^a-zA-Z0-9._:-]+/g, "-")}`;
}

function buildPanelDownloadUrl(relativePath) {
  const normalized = normalizePosixRelativePath(relativePath);
  const encodedPath = normalized
    .split("/")
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join("/");
  const url = new URL(`/download/webpanel/file/${encodedPath}`, `${UPDATE_API_BASE}/`);
  url.searchParams.set("machine", buildPanelUpdateMachineTag());
  return url.toString();
}

function buildPanelManifestUrl() {
  const url = new URL("/download/webpanel-files.txt", `${UPDATE_API_BASE}/`);
  url.searchParams.set("machine", buildPanelUpdateMachineTag());
  return url.toString();
}

function runCommandForUpdate(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: __dirname,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += String(chunk || "");
    });
    child.stderr.on("data", (chunk) => {
      output += String(chunk || "");
    });
    child.on("error", (error) => {
      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`Command failed (${command} ${args.join(" ")}): exit code ${code}. ${compactText(output, 220)}`));
    });
  });
}

async function runPanelDependencyInstall() {
  const hasLock = fsSync.existsSync(path.join(__dirname, "package-lock.json"));
  const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";

  if (hasLock) {
    try {
      await runCommandForUpdate(npmBin, ["ci", "--omit=dev"]);
      return;
    } catch {
      await runCommandForUpdate(npmBin, ["install", "--omit=dev"]);
      return;
    }
  }

  await runCommandForUpdate(npmBin, ["install", "--omit=dev"]);
}

async function performInlinePanelUpdate() {
  const manifestResponse = await fetch(buildPanelManifestUrl(), {
    method: "GET",
    headers: {
      "cache-control": "no-cache",
      pragma: "no-cache"
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!manifestResponse.ok) {
    throw new Error(`Update manifest request failed (${manifestResponse.status}).`);
  }

  const manifestText = await manifestResponse.text();
  const files = String(manifestText || "")
    .split(/\r?\n/)
    .map((line) => normalizePosixRelativePath(line))
    .filter(Boolean);

  if (!files.length) {
    throw new Error("Update manifest is empty.");
  }

  for (const rel of files) {
    const response = await fetch(buildPanelDownloadUrl(rel), {
      method: "GET",
      headers: {
        "cache-control": "no-cache",
        pragma: "no-cache"
      },
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${rel} (${response.status}).`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const targetPath = safeJoin(__dirname, rel);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, buffer);
  }

  await runPanelDependencyInstall();
}

function restartPanelAfterUpdate() {
  const runningUnderSystemd = process.platform === "linux"
    && Boolean(process.env.INVOCATION_ID || process.env.JOURNAL_STREAM);

  if (!runningUnderSystemd) {
    console.warn("Panel update installed. Restart the panel process to load the new backend.");
    return;
  }

  console.log("Panel update installed. Restarting the systemd-managed process...");
  const timer = setTimeout(() => process.exit(0), 1500);
  timer.unref();
}

function triggerPanelUpdate() {
  if (panelUpdateState.running) {
    throw new Error("Update is already running.");
  }

  const installerUrl = buildPanelInstallerUrl();

  panelUpdateState.running = true;
  panelUpdateState.lastStartedAt = new Date().toISOString();
  panelUpdateState.lastFinishedAt = null;
  panelUpdateState.lastExitCode = null;
  panelUpdateState.lastError = "";

  Promise.resolve()
    .then(() => performInlinePanelUpdate())
    .then(() => {
      panelUpdateState.running = false;
      panelUpdateState.lastFinishedAt = new Date().toISOString();
      panelUpdateState.lastExitCode = 0;
      panelUpdateState.lastError = "";
      restartPanelAfterUpdate();
    })
    .catch((error) => {
      panelUpdateState.running = false;
      panelUpdateState.lastFinishedAt = new Date().toISOString();
      panelUpdateState.lastExitCode = 1;
      panelUpdateState.lastError = error?.message || "Update failed.";
    });

  return {
    installerUrl,
    startedAt: panelUpdateState.lastStartedAt
  };
}

app.use(express.json({ limit: "32mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Vyron-Command-Mode", COMMAND_MODE);
  res.setHeader("X-Vyron-Build", BUILD_STAMP);
  next();
});
app.use(express.static(path.join(__dirname, "public")));
app.use("/download", express.static(DOWNLOAD_DIR));
app.get("/install", (_req, res) => {
  return res.sendFile(path.join(__dirname, "public", "install.html"));
});

app.get("/resourcepacks/:serverId/:token", async (req, res) => {
  try {
    const servers = await readServers();
    const server = servers.find((item) => item.id === String(req.params.serverId || ""));
    const expectedToken = String(server?.resourcePack?.token || "");
    const suppliedToken = String(req.params.token || "");
    if (!server || !expectedToken || expectedToken.length !== suppliedToken.length) {
      return res.status(404).send("Resource pack not found.");
    }

    const expectedBuffer = Buffer.from(expectedToken);
    const suppliedBuffer = Buffer.from(suppliedToken);
    if (!crypto.timingSafeEqual(expectedBuffer, suppliedBuffer)) {
      return res.status(404).send("Resource pack not found.");
    }

    const filePath = getServerResourcePackPath(server);
    await fs.access(filePath);
    const fileName = sanitizeFileName(server.resourcePack.fileName || "server-resource-pack.zip") || "server-resource-pack.zip";
    return res.sendFile(filePath, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName.replaceAll('"', "")}"`,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return res.status(404).send("Resource pack not found.");
  }
});

function getInstanceDir(server) {
  return path.join(INSTANCES_DIR, server.id);
}

function getServerJarPath(server) {
  return path.join(getInstanceDir(server), "server.jar");
}

function getPluginsDir(server) {
  return path.join(getInstanceDir(server), "plugins");
}

function getModsDir(server) {
  return path.join(getInstanceDir(server), "mods");
}

function getDatapacksDir(server) {
  return path.join(getInstanceDir(server), "datapacks");
}

function getModpacksDir(server) {
  return path.join(getInstanceDir(server), "modpacks");
}

function getResourcePacksDir(server) {
  return path.join(getInstanceDir(server), "resourcepacks");
}

function getServerResourcePackPath(server) {
  return path.join(getResourcePacksDir(server), "server-resource-pack.zip");
}

function getRequestPublicOrigin(req) {
  const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim().toLowerCase();
  const protocol = ["http", "https"].includes(forwardedProtocol) ? forwardedProtocol : req.protocol;
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").split(",")[0].trim();
  const host = forwardedHost || String(req.get("host") || "").trim();
  const validHost = /^(?:\[[0-9a-f:]+\]|[a-z0-9.-]+)(?::\d{1,5})?$/i.test(host);
  if (!validHost) {
    throw new Error("Could not determine a valid public panel address.");
  }
  return `${protocol}://${host}`;
}

async function calculateFileSha1(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha1");
    const stream = fsSync.createReadStream(filePath);
    stream.on("error", reject);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

function getShaderPacksDir(server) {
  return path.join(getInstanceDir(server), "shaderpacks");
}

function getWorldsRoot(server) {
  return getInstanceDir(server);
}

function getBackupsDir(server) {
  return path.join(getInstanceDir(server), "backups");
}

function getWorldMetaFile(worldDir) {
  return path.join(worldDir, ".vyron-world.json");
}

function sanitizeWorldName(input) {
  return String(input || "")
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .trim()
    .slice(0, 64);
}

function isReservedWorldDirName(name) {
  return new Set([
    "plugins",
    "mods",
    "datapacks",
    "modpacks",
    "resourcepacks",
    "shaderpacks",
    "versions",
    "backups",
    "logs",
    "crash-reports",
    "config",
    "libraries",
    "cache",
    "assets",
    "runtime",
    "server"
  ]).has(String(name || "").toLowerCase());
}

async function isMinecraftWorldDirectory(worldDir) {
  for (const marker of ["level.dat", ".vyron-world.json"]) {
    try {
      const stat = await fs.stat(path.join(worldDir, marker));
      if (stat.isFile()) return true;
    } catch {
      // Try the next world marker.
    }
  }
  return false;
}

async function worldDirectoryExists(worldDir) {
  try {
    const stat = await fs.stat(worldDir);
    return stat.isDirectory();
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

function parseTpsFromLogLine(line) {
  const text = String(line || "");
  if (!text) {
    return null;
  }

  const explicitMatch = text.match(/\bTPS\b[^\d]*([0-9]+(?:\.[0-9]+)?)/i) || text.match(/\b([0-9]+(?:\.[0-9]+)?)\s*tps\b/i);
  if (explicitMatch) {
    const parsed = Number(explicitMatch[1]);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.min(20, parsed));
    }
  }

  const behindMatch = text.match(/Running\s+(\d+)ms\s+or\s+(\d+)\s+ticks\s+behind/i);
  if (behindMatch) {
    const ticksBehind = Number(behindMatch[2]);
    if (Number.isFinite(ticksBehind)) {
      const approx = 20 - ticksBehind / 20;
      return Math.max(5, Math.min(20, Number(approx.toFixed(2))));
    }
  }

  return null;
}

function getApproximateTps(serverId, running) {
  if (!running) {
    return 0;
  }

  const state = runtimeTpsState.get(serverId);
  if (state?.value && state?.updatedAt) {
    const ageMs = Date.now() - Date.parse(state.updatedAt);
    if (Number.isFinite(ageMs) && ageMs <= 120000) {
      return Math.max(0, Math.min(20, Number(state.value)));
    }
  }

  return 20;
}

function normalizePosixRelativePath(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

async function listFilesRecursive(baseDir, relativeDir = "") {
  const currentDir = path.join(baseDir, relativeDir);
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const rel = normalizePosixRelativePath(path.posix.join(relativeDir.replaceAll("\\", "/"), entry.name));
    if (entry.isDirectory()) {
      if (["node_modules", ".git", "instances", "data"].includes(entry.name)) {
        continue;
      }
      const nested = await listFilesRecursive(baseDir, rel);
      files.push(...nested);
      continue;
    }

    files.push(rel);
  }

  return files;
}

async function buildWebpanelDownloadManifest() {
  const fixed = ["server.js", "package.json", "package-lock.json", "README.md", "installer.sh"];
  const fixedFiles = [];
  for (const rel of fixed) {
    const abs = path.join(__dirname, rel);
    try {
      const stat = await fs.stat(abs);
      if (stat.isFile()) {
        fixedFiles.push(rel);
      }
    } catch {
      // ignore missing optional files
    }
  }

  const publicFiles = await listFilesRecursive(__dirname, "public");
  const merged = Array.from(new Set([...fixedFiles, ...publicFiles]));
  merged.sort((a, b) => a.localeCompare(b));
  return merged;
}

function getMonitoringSnapshot(server) {
  const memTotal = os.totalmem();
  const memFree = os.freemem();
  const memUsedPct = memTotal > 0 ? Math.round(((memTotal - memFree) / memTotal) * 100) : 0;
  const cpuPct = sampleSystemCpuPercent();

  let processMemMb = 0;
  let uptimeSec = 0;
  if (runtimeProcesses.has(server.id)) {
    processMemMb = Math.round(process.memoryUsage().rss / 1024 / 1024);
    uptimeSec = Math.max(0, Math.round(process.uptime()));
  }

  const running = runtimeProcesses.has(server.id);
  const tps = getApproximateTps(server.id, running);
  const baselineIn = running ? 0.35 : 0;
  const baselineOut = running ? 0.18 : 0;
  const dynamicIn = running ? Number(((cpuPct / 100) * 4.2 + (Number(server.playersOnline || 0) * 0.28)).toFixed(2)) : 0;
  const dynamicOut = running ? Number(((cpuPct / 100) * 2.9 + (Number(server.playersOnline || 0) * 0.19)).toFixed(2)) : 0;
  const inboundMbps = Number((baselineIn + dynamicIn).toFixed(2));
  const outboundMbps = Number((baselineOut + dynamicOut).toFixed(2));
  const peakSockets = running ? Math.max(8, Number(server.playersOnline || 0) * 12 + Math.round(cpuPct / 2)) : 0;

  const seed = String(server?.id || server?.name || "vyron");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 253;
  }
  const internalIpOctet = Math.max(2, hash + 2);

  return {
    cpuPercent: cpuPct,
    ramPercent: memUsedPct,
    tps,
    processMemoryMb: processMemMb,
    uptimeSec,
    inboundMbps,
    outboundMbps,
    peakSockets,
    internalIpOctet,
    playersPerDay: Object.entries(server.playerAnalytics || {})
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-30)
      .map(([date, entry]) => ({
        date,
        players: Array.isArray(entry?.players) ? entry.players.length : Number(entry?.count || 0)
      })),
    updatedAt: new Date().toISOString()
  };
}

function findAvailablePort(servers, preferred = 25565) {
  const used = new Set(servers.map((item) => Number(item.port)).filter(Number.isInteger));
  let port = Math.max(1024, Math.min(65535, Number(preferred) || 25565));
  while (used.has(port) && port < 65535) port += 1;
  if (used.has(port)) {
    port = 1024;
    while (used.has(port) && port < 65535) port += 1;
  }
  if (used.has(port)) throw new Error("No free server port is available.");
  return port;
}

function createServerArchive(sourceDir, output, manifest = null, excludeBackups = true) {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } });
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("warning", (error) => error.code === "ENOENT" ? null : reject(error));
    archive.on("error", reject);
    archive.pipe(output);
    if (manifest) archive.append(`${JSON.stringify(manifest, null, 2)}\n`, { name: ".vyron-export.json" });
    archive.glob("**/*", {
      cwd: sourceDir,
      dot: true,
      ignore: excludeBackups ? ["backups", "backups/**", ".vyron-export.json"] : [".vyron-export.json"]
    });
    archive.finalize();
  });
}

async function extractZipSafely(zipPath, destination) {
  const directory = await unzipper.Open.file(zipPath);
  let totalSize = 0;
  if (directory.files.length > 100000) throw new Error("Archive contains too many entries.");
  await fs.mkdir(destination, { recursive: true });
  for (const entry of directory.files) {
    const normalized = String(entry.path || "").replaceAll("\\", "/").replace(/^\/+/, "");
    if (!normalized || normalized === ".vyron-export.json") continue;
    const target = safeJoin(destination, normalized);
    if (entry.type === "Directory") {
      await fs.mkdir(target, { recursive: true });
      continue;
    }
    if (entry.type !== "File") throw new Error("Archive contains an unsupported entry type.");
    totalSize += Number(entry.vars?.uncompressedSize || 0);
    if (totalSize > 16 * 1024 * 1024 * 1024) throw new Error("Archive expands beyond the 16 GB limit.");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await pipeline(entry.stream(), fsSync.createWriteStream(target, { flags: "wx" }));
  }
}

async function readExportManifest(zipPath) {
  const directory = await unzipper.Open.file(zipPath);
  const entry = directory.files.find((item) => String(item.path).replaceAll("\\", "/") === ".vyron-export.json");
  if (!entry) return null;
  const raw = await entry.buffer();
  if (raw.length > 256 * 1024) throw new Error("Export metadata is too large.");
  return JSON.parse(raw.toString("utf8"));
}

function sanitizeFileName(name) {
  return String(name || "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function safeJoin(baseDir, inputPath = "") {
  const candidate = path.resolve(baseDir, String(inputPath || ""));
  const normalizedBase = path.resolve(baseDir);
  if (candidate !== normalizedBase && !candidate.startsWith(`${normalizedBase}${path.sep}`)) {
    throw new Error("Invalid path.");
  }
  return candidate;
}

async function findServerById(id) {
  const servers = await readServers();
  const server = servers.find((item) => item.id === id);
  return { servers, server };
}

function parseServerProperties(text) {
  const map = {};
  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const idx = line.indexOf("=");
    if (idx === -1) {
      continue;
    }
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    map[key] = value;
  }
  return map;
}

function normalizeAiPermissions(input) {
  const source = input && typeof input === "object" ? input : {};
  const output = {};
  for (const key of AI_PERMISSION_KEYS) {
    output[key] = Boolean(source[key]);
  }
  return output;
}

function resolveAiPermissions(config, username) {
  const mergedDefault = {
    ...DEFAULT_AI_PERMISSIONS,
    ...normalizeAiPermissions(config?.default || {})
  };
  const userOverrides = normalizeAiPermissions(config?.users?.[username] || {});
  return {
    ...mergedDefault,
    ...userOverrides
  };
}

async function readAiPermissionsConfig() {
  try {
    const raw = await fs.readFile(AI_PERMS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return { default: { ...DEFAULT_AI_PERMISSIONS }, users: {} };
    }
    return {
      default: { ...DEFAULT_AI_PERMISSIONS, ...normalizeAiPermissions(parsed.default || {}) },
      users: parsed.users && typeof parsed.users === "object" ? parsed.users : {}
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      const fallback = { default: { ...DEFAULT_AI_PERMISSIONS }, users: {} };
      await fs.writeFile(AI_PERMS_FILE, `${JSON.stringify(fallback, null, 2)}\n`, "utf8");
      return fallback;
    }
    throw error;
  }
}

async function writeAiPermissionsConfig(config) {
  const normalized = {
    default: { ...DEFAULT_AI_PERMISSIONS, ...normalizeAiPermissions(config?.default || {}) },
    users: config?.users && typeof config.users === "object" ? config.users : {}
  };
  await fs.writeFile(AI_PERMS_FILE, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
}

function compactText(value, maxLength = 320) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
}

function buildPlayerCommand(action, player, value = "") {
  const commandAction = String(action || "").trim().toLowerCase();
  const commandPlayer = String(player || "").trim();
  const commandValue = String(value || "").trim();

  if (!commandPlayer) {
    throw new Error("Player is required.");
  }

  if (commandAction === "op") return `op ${commandPlayer}`;
  if (commandAction === "deop") return `deop ${commandPlayer}`;
  if (commandAction === "ban") return `ban ${commandPlayer}${commandValue ? ` ${commandValue}` : ""}`;
  if (commandAction === "pardon" || commandAction === "unban") return `pardon ${commandPlayer}`;
  if (commandAction === "kick") return `kick ${commandPlayer}${commandValue ? ` ${commandValue}` : ""}`;
  if (commandAction === "effect") return `effect give ${commandPlayer} ${commandValue || "speed 60 1"}`;
  if (commandAction === "effect-clear") return `effect clear ${commandPlayer}`;
  if (commandAction === "invsee") return `invsee ${commandPlayer}`;

  throw new Error("Unsupported player action.");
}

async function buildAiContextSnapshot(server, permissions) {
  const context = {
    server: {
      id: server.id,
      name: server.name,
      status: server.status,
      running: runtimeProcesses.has(server.id),
      mcVersion: server.mcVersion,
      loader: server.loader,
      port: server.port,
      ramGb: server.ramGb,
      updatedAt: server.updatedAt
    }
  };

  if (permissions.viewConsole) {
    context.console = getRuntimeLines(server.id, 80).slice(-40).map((line) => compactText(line, 260));
  }

  if (permissions.viewPlayers) {
    const runtimeState = getOrCreateRuntimePlayerState(server.id);
    const onlinePlayers = Array.from(runtimeState.online.values());
    const recent = Array.from(runtimeState.history.values())
      .sort((a, b) => String(b.lastSeenAt || "").localeCompare(String(a.lastSeenAt || "")))
      .slice(0, 12)
      .map((entry) => ({
        name: entry.name,
        online: Boolean(entry.online),
        seenCount: Number(entry.seenCount || 0),
        lastSeenAt: entry.lastSeenAt || null
      }));
    context.players = {
      online: onlinePlayers,
      recent
    };
  }

  if (permissions.viewConfig) {
    try {
      const propertiesPath = path.join(getInstanceDir(server), "server.properties");
      const raw = await fs.readFile(propertiesPath, "utf8");
      context.config = parseServerProperties(raw);
    } catch {
      context.config = {};
    }
  }

  if (permissions.viewFiles) {
    try {
      const entries = await listDirEntries(getInstanceDir(server), "");
      context.files = entries.slice(0, 60).map((entry) => ({
        name: entry.name,
        type: entry.type
      }));
    } catch {
      context.files = [];
    }
  }

  return context;
}

async function callGroqChat(messages) {
  const apiKey = String(process.env.GROQ_API_KEY || "").trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.25,
      messages
    }),
    signal: AbortSignal.timeout(25000)
  });

  if (!response.ok) {
    const failText = await response.text().catch(() => "");
    throw new Error(`Groq request failed (${response.status}): ${compactText(failText, 220)}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned no content.");
  }

  return String(content);
}

function parseAiAssistantPayload(text) {
  const content = String(text || "").trim();
  if (!content) {
    return { reply: "", actions: [] };
  }

  const candidateBlocks = [content];
  const codeFence = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeFence?.[1]) {
    candidateBlocks.unshift(codeFence[1].trim());
  }

  for (const block of candidateBlocks) {
    try {
      const parsed = JSON.parse(block);
      if (parsed && typeof parsed === "object") {
        return {
          reply: String(parsed.reply || ""),
          actions: Array.isArray(parsed.actions) ? parsed.actions : []
        };
      }
    } catch {
      // try next candidate
    }
  }

  return { reply: content, actions: [] };
}

async function executeAiActions(server, permissions, actions = []) {
  const outcomes = [];
  for (const rawAction of actions.slice(0, 4)) {
    const action = rawAction && typeof rawAction === "object" ? rawAction : {};
    const type = String(action.type || "").trim().toLowerCase();

    try {
      if (type === "lifecycle") {
        if (!permissions.manageLifecycle) {
          outcomes.push({ type, ok: false, error: "Denied by permissions." });
          continue;
        }

        const op = String(action.action || "").trim().toLowerCase();
        if (!new Set(["start", "stop", "restart"]).has(op)) {
          outcomes.push({ type, ok: false, error: "Invalid lifecycle action." });
          continue;
        }

        if (op === "start") {
          await updateServerById(server.id, async (entry) => {
            entry.status = "starting";
            entry.badge = mapStatusToBadge("starting");
            entry.lastActionAt = new Date().toISOString();
            appendTimeline(entry, "AI action: start");
          });
          const latest = (await findServerById(server.id)).server;
          await startServer(latest);
        } else if (op === "stop") {
          await updateServerById(server.id, async (entry) => {
            entry.status = "stopping";
            entry.badge = mapStatusToBadge("stopping");
            entry.lastActionAt = new Date().toISOString();
            appendTimeline(entry, "AI action: stop");
          });
          await stopServer(server);
        } else {
          await updateServerById(server.id, async (entry) => {
            entry.status = "restarting";
            entry.badge = mapStatusToBadge("restarting");
            entry.lastActionAt = new Date().toISOString();
            appendTimeline(entry, "AI action: restart");
          });
          await stopServer(server);
          setTimeout(() => {
            readServers()
              .then((list) => list.find((item) => item.id === server.id))
              .then((latestServer) => {
                if (!latestServer) {
                  return;
                }
                return startServer(latestServer);
              })
              .catch((error) => appendRuntimeLine(server.id, `AI restart failed: ${error.message}`));
          }, 1600);
        }

        outcomes.push({ type, ok: true, action: op });
        continue;
      }

      if (type === "console_command") {
        if (!permissions.sendConsoleCommands) {
          outcomes.push({ type, ok: false, error: "Denied by permissions." });
          continue;
        }

        const command = String(action.command || "").trim();
        if (!command || command.includes("\n") || command.length > 180) {
          outcomes.push({ type, ok: false, error: "Invalid command." });
          continue;
        }

        const child = runtimeProcesses.get(server.id);
        if (!child) {
          outcomes.push({ type, ok: false, error: "Server is not running." });
          continue;
        }

        child.stdin.write(`${command}\n`);
        appendRuntimeLine(server.id, `> ${command}`);
        outcomes.push({ type, ok: true, command });
        continue;
      }

      if (type === "player_action") {
        if (!permissions.managePlayers) {
          outcomes.push({ type, ok: false, error: "Denied by permissions." });
          continue;
        }

        const child = runtimeProcesses.get(server.id);
        if (!child) {
          outcomes.push({ type, ok: false, error: "Server is not running." });
          continue;
        }

        const player = String(action.player || "").trim();
        const playerAction = String(action.action || "").trim().toLowerCase();
        const value = String(action.value || "").trim();
        const command = buildPlayerCommand(playerAction, player, value);
        child.stdin.write(`${command}\n`);
        appendRuntimeLine(server.id, `> ${command}`);
        outcomes.push({ type, ok: true, action: playerAction, player });
        continue;
      }

      outcomes.push({ type: type || "unknown", ok: false, error: "Unsupported action type." });
    } catch (error) {
      outcomes.push({ type: type || "unknown", ok: false, error: error.message || "Action failed." });
    }
  }

  return outcomes;
}

function getAiPendingKey(username, serverId) {
  return `${String(username || "").toLowerCase()}::${String(serverId || "")}`;
}

function parseClockToHourMinute(rawHour, rawMinute = "0", ampm = "") {
  const hourNum = Number(rawHour);
  const minuteNum = Number(rawMinute);
  if (!Number.isInteger(hourNum) || hourNum < 0 || hourNum > 23) {
    return null;
  }
  if (!Number.isInteger(minuteNum) || minuteNum < 0 || minuteNum > 59) {
    return null;
  }

  const suffix = String(ampm || "").toLowerCase();
  let hour = hourNum;
  if (suffix === "am" || suffix === "pm") {
    if (hour < 1 || hour > 12) {
      return null;
    }
    if (suffix === "am") {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
  }

  return { hour, minute: minuteNum };
}

function parseScheduleIntentFromText(input, seed = {}) {
  const text = String(input || "").trim();
  if (!text) {
    return {
      intent: null,
      missing: ["action", "time"],
      prompt: "Tell me what schedule to create, like: restart daily at 5am",
      partial: {
        action: String(seed?.action || "").trim().toLowerCase(),
        cron: String(seed?.cron || "").trim(),
        name: String(seed?.name || "").trim()
      }
    };
  }

  const pipeMatch = text.match(/^([^|]+)\|([^|]+)\|(start|stop|restart|backup)$/i);
  if (pipeMatch) {
    return {
      intent: {
        type: "create_schedule",
        name: pipeMatch[1].trim(),
        cron: pipeMatch[2].trim(),
        action: pipeMatch[3].trim().toLowerCase(),
        description: `create schedule ${pipeMatch[1].trim()}`
      },
      missing: [],
      prompt: "",
      partial: {
        action: pipeMatch[3].trim().toLowerCase(),
        cron: pipeMatch[2].trim(),
        name: pipeMatch[1].trim()
      }
    };
  }

  const actionMatch = text.match(/\b(start|stop|restart|backup)\b/i);
  const action = actionMatch
    ? actionMatch[1].toLowerCase()
    : String(seed?.action || "").trim().toLowerCase();

  let cron = String(seed?.cron || "").trim();
  const cronMatch = text.match(/((?:\*|[0-9\/,\-]+)\s+(?:\*|[0-9\/,\-]+)\s+(?:\*|[0-9\/,\-]+)\s+(?:\*|[0-9\/,\-]+)\s+(?:\*|[0-9\/,\-]+))/);
  if (cronMatch) {
    cron = cronMatch[1].trim();
  }

  if (!cron) {
    const everyMinutes = text.match(/every\s+(\d{1,2})\s+minutes?/i);
    if (everyMinutes) {
      const amount = Math.max(1, Math.min(59, Number(everyMinutes[1])));
      cron = `*/${amount} * * * *`;
    }
  }

  if (!cron && /\b(hourly|every\s+hour)\b/i.test(text)) {
    cron = "0 * * * *";
  }

  const timeMatch =
    text.match(/(?:\bat\b|@)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i) ||
    text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
    text.match(/\b(?:daily|every\s+day|each\s+day)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  const parsedClock = timeMatch ? parseClockToHourMinute(timeMatch[1], timeMatch[2] || "0", timeMatch[3] || "") : null;

  if (!cron && parsedClock) {
    if (/\b(daily|every\s+day|each\s+day)\b/i.test(text)) {
      cron = `${parsedClock.minute} ${parsedClock.hour} * * *`;
    } else {
      const dayMap = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6
      };
      const weeklyMatch = text.match(/\b(?:every|on)\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
      if (weeklyMatch) {
        const day = dayMap[String(weeklyMatch[1] || "").toLowerCase()];
        cron = `${parsedClock.minute} ${parsedClock.hour} * * ${day}`;
      }
    }
  }

  const nameMatch = text.match(/\b(?:named|called|name)\s+["']?([^"']{2,60})["']?/i) || text.match(/["']([^"']{2,60})["']/);
  const explicitName = nameMatch ? String(nameMatch[1] || "").trim() : String(seed?.name || "").trim();
  const name = explicitName || `${action ? action[0].toUpperCase() + action.slice(1) : "Task"} Schedule`;

  const missing = [];
  if (!action) {
    missing.push("action");
  }
  if (!cron) {
    missing.push("time");
  }

  if (missing.length) {
    const prompt = missing.includes("action") && missing.includes("time")
      ? "Tell me what action (start/stop/restart/backup) and when to run it. Example: restart daily at 5am"
      : (missing.includes("action")
        ? "Which action should this schedule run: start, stop, restart, or backup?"
        : "When should it run? Example: daily at 5am, every 30 minutes, or Monday at 18:00");

    return {
      intent: null,
      missing,
      prompt,
      partial: {
        action,
        cron,
        name
      }
    };
  }

  return {
    intent: {
      type: "create_schedule",
      name,
      cron,
      action,
      description: `create schedule ${name}`
    },
    missing: [],
    prompt: "",
    partial: {
      action,
      cron,
      name
    }
  };
}

function parseWebhookIntentFromText(input, seed = {}) {
  const text = String(input || "").trim();
  const urlMatch = text.match(/https?:\/\/\S+/i);
  const url = urlMatch ? urlMatch[0].trim() : String(seed?.url || "").trim();
  const eventMatch = text.match(/\b(start|stop|restart|crash)\b/i);
  const event = eventMatch ? eventMatch[1].toLowerCase() : String(seed?.event || "restart").trim().toLowerCase();
  const nameMatch = text.match(/\b(?:named|called|name)\s+["']?([^"']{2,60})["']?/i) || text.match(/["']([^"']{2,60})["']/);
  const name = (nameMatch ? String(nameMatch[1] || "") : String(seed?.name || "")).trim() || `${event[0].toUpperCase()}${event.slice(1)} Webhook`;

  if (!url) {
    return {
      intent: null,
      prompt: "Please send the webhook URL (http:// or https://).",
      partial: { url: "", event, name }
    };
  }

  if (!/^https?:\/\//i.test(url)) {
    return {
      intent: null,
      prompt: "Webhook URL must start with http:// or https://",
      partial: { url: "", event, name }
    };
  }

  if (!["start", "stop", "restart", "crash"].includes(event)) {
    return {
      intent: null,
      prompt: "Webhook event must be start, stop, restart, or crash.",
      partial: { url, event: "restart", name }
    };
  }

  return {
    intent: {
      type: "create_webhook",
      name,
      url,
      event,
      description: `add webhook ${name} (${event})`
    },
    prompt: "",
    partial: { url, event, name }
  };
}

function tryEvaluateMathQuestion(message) {
  const text = String(message || "").trim();
  if (!text) {
    return null;
  }

  const directMath = text.match(/^\s*(?:what(?:\s+is|'s|s)?\s+)?([0-9+\-*/().\s]+)\??\s*$/i);
  if (!directMath) {
    return null;
  }

  const expr = String(directMath[1] || "").trim();
  if (!/[+\-*/]/.test(expr)) {
    return null;
  }
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    return null;
  }

  try {
    const value = Function(`"use strict"; return (${expr});`)();
    if (!Number.isFinite(value)) {
      return "I could not compute that safely.";
    }
    return `${expr} = ${value}`;
  } catch {
    return "I could not parse that math expression.";
  }
}

function extractAiIntentSingle(message, memory = null) {
  const text = String(message || "").trim();
  if (!text) {
    return { type: "none" };
  }

  const explicitPortMatch = text.match(/\b(?:change|set|switch|move|use)\b[^\n\r]*\bport\b[^\d]*(\d{2,5})\b/i)
    || text.match(/\bport\s*(?:to|=)\s*(\d{2,5})\b/i);
  if (explicitPortMatch) {
    const parsedPort = Number(explicitPortMatch[1]);
    if (Number.isInteger(parsedPort) && parsedPort >= 1 && parsedPort <= 65535) {
      return {
        type: "update_port",
        port: parsedPort,
        description: `change server port to ${parsedPort}`
      };
    }
  }

  const asksForPortChange = /\b(?:change|set|switch|move|use)\b[^\n\r]*\bport\b/i.test(text)
    || (/\b(change|fix|set)\b\s+\b(it|that)\b/i.test(text) && /\bport\b/i.test(String(memory?.lastDiagnosis || "")));
  if (asksForPortChange) {
    return {
      type: "question",
      questionType: "change_port_details",
      prompt: "Sure. Which port should I set? Example: 25566"
    };
  }

  const looksLikeTroubleshooting = /\b(why|what happened|how|problem|issue|error|errors|crash|crashing|crashed|failed|failing|doesn'?t|doesnt|won'?t|wont|not working|broken|help)\b/i.test(text)
    || (/\?\s*$/.test(text) && /\b(start|restart|server|paper|forge|fabric|vanilla)\b/i.test(text));
  if (looksLikeTroubleshooting) {
    return { type: "read" };
  }

  const schedulePrefixMatch = text.match(/^(?:create|add|make)\s+(?:a\s+)?schedule\b\s*(.*)$/i);
  if (schedulePrefixMatch) {
    const details = String(schedulePrefixMatch[1] || "").trim();
    if (!details) {
      return {
        type: "question",
        questionType: "create_schedule_details",
        prompt: "Sure. Tell me the action and time, like: restart daily at 5am"
      };
    }

    const parsedSchedule = parseScheduleIntentFromText(details);
    if (parsedSchedule.intent) {
      return parsedSchedule.intent;
    }

    return {
      type: "question",
      questionType: "create_schedule_details",
      prompt: parsedSchedule.prompt || "Tell me the action and time for the schedule."
    };
  }

  const webhookPrefixMatch = text.match(/^(?:create|add|make)\s+(?:a\s+)?webhook\b\s*(.*)$/i);
  if (webhookPrefixMatch) {
    const details = String(webhookPrefixMatch[1] || "").trim();
    const parsedWebhook = parseWebhookIntentFromText(details);
    if (parsedWebhook.intent) {
      return parsedWebhook.intent;
    }
    return {
      type: "question",
      questionType: "create_webhook_details",
      prompt: parsedWebhook.prompt || "Please provide the webhook URL."
    };
  }

  if (/^(?:run|send)\s+command\s*$/i.test(text) || /^\/cmd\s*$/i.test(text)) {
    return {
      type: "question",
      questionType: "command_details",
      prompt: "What command should I run? Example: run command say hello"
    };
  }

  if (/^player\b/i.test(text) && !/^player\s+(op|deop|kick|ban|unban|effect|effect-clear|invsee)\s+([A-Za-z0-9_]{3,16})(?:\s+(.+))?$/i.test(text)) {
    return {
      type: "question",
      questionType: "player_action_details",
      prompt: "What player action do you want? Example: player kick DerCooleO_O spamming"
    };
  }

  const lifecycleMatch = text.match(/\b(start|stop|restart)\b(?:\s+the)?(?:\s+server)?\b/i);
  if (lifecycleMatch) {
    return {
      type: "lifecycle",
      action: lifecycleMatch[1].toLowerCase(),
      description: `${lifecycleMatch[1].toLowerCase()} server`
    };
  }

  const commandMatch = text.match(/^(?:run|send)\s+command\s+(.+)$/i) || text.match(/^\/cmd\s+(.+)$/i);
  if (commandMatch) {
    return {
      type: "console_command",
      command: commandMatch[1].trim(),
      description: `run command: ${compactText(commandMatch[1].trim(), 90)}`
    };
  }

  const playerMatch = text.match(/^player\s+(op|deop|kick|ban|unban|effect|effect-clear|invsee)\s+([A-Za-z0-9_]{3,16})(?:\s+(.+))?$/i);
  if (playerMatch) {
    return {
      type: "player_action",
      action: playerMatch[1].toLowerCase(),
      player: playerMatch[2],
      value: String(playerMatch[3] || "").trim(),
      description: `player ${playerMatch[1].toLowerCase()} ${playerMatch[2]}`
    };
  }

  const parsedSchedule = parseScheduleIntentFromText(text);
  if (parsedSchedule.intent) {
    return parsedSchedule.intent;
  }

  return { type: "read" };
}

function splitAiClauses(message) {
  const raw = String(message || "").trim();
  if (!raw) {
    return [];
  }

  return raw
    .replace(/\bthen\b/gi, " and ")
    .split(/\s*(?:\band\b|,|;)\s*/i)
    .map((part) => String(part || "").trim())
    .filter(Boolean);
}

function extractAiRequest(message, memory = null) {
  const text = String(message || "").trim();
  if (!text) {
    return { type: "none", intents: [] };
  }

  const lower = text.toLowerCase();
  const hasActionCue = /\b(start|stop|restart|run\s+command|send\s+command|\/cmd|player\s+|create\s+schedule|add\s+schedule|make\s+(?:a\s+)?schedule|create\s+webhook|add\s+webhook|make\s+(?:a\s+)?webhook)\b/i.test(text);
  const greetingOnly = /^(?:hi|hey|hello|yo|sup|hola|servus|moin)(?:\s+[a-z0-9_!?.,-]+)?$/i.test(text);
  if (greetingOnly && !hasActionCue) {
    return { type: "greeting", intents: [] };
  }

  const clauses = splitAiClauses(text);
  const intents = [];

  for (const clause of clauses.length ? clauses : [text]) {
    const parsed = extractAiIntentSingle(clause, memory);
    if (parsed.type === "question") {
      return { type: "question", question: parsed, intents: [] };
    }
    if (["lifecycle", "console_command", "player_action", "create_schedule", "create_webhook", "update_port"].includes(parsed.type)) {
      intents.push(parsed);
    }
  }

  if (intents.length) {
    return { type: "actions", intents };
  }

  if (/\b(hi|hello|hey)\b/i.test(lower)) {
    return { type: "greeting", intents: [] };
  }

  return { type: "read", intents: [] };
}

function getAiHelpText() {
  return "Tell me what you want next. I can restart, run commands, handle player actions, and create schedules.";
}

function diagnoseMinecraftStartupIssue(server, context) {
  const consoleLines = Array.isArray(context?.console) ? context.console.slice(-80) : [];
  const combined = consoleLines.join("\n");
  const port = Number(server?.port || context?.config?.["server-port"] || 0) || null;

  const crashReportPathMatch = combined.match(/crash report has been saved to:\s*([^\r\n]+)/i);
  const crashReportPath = crashReportPathMatch ? String(crashReportPathMatch[1] || "").trim() : "";
  let crashReportText = "";
  if (crashReportPath) {
    try {
      if (fsSync.existsSync(crashReportPath)) {
        crashReportText = String(fsSync.readFileSync(crashReportPath, "utf8") || "").slice(0, 500000);
      }
    } catch {
      crashReportText = "";
    }
  }

  const crashCombined = `${combined}\n${crashReportText}`;

  const findings = [];

  if (/failed to bind to port|address already in use|bind\(\)|java\.net\.bindexception|perhaps a server is already running/i.test(crashCombined)) {
    findings.push({
      cause: `Port ${port || "(configured port)"} is already in use.`,
      fix: `Change the server port or stop the other process using ${port || "that port"}.`
    });
  }

  if (/you need to agree to the eula|eula\.txt/i.test(crashCombined)) {
    findings.push({
      cause: "EULA not accepted.",
      fix: "Set eula=true in eula.txt and start the server again."
    });
  }

  if (/unsupportedclassversionerror|class file version|has been compiled by a more recent version of the java runtime|requires java/i.test(crashCombined)) {
    findings.push({
      cause: "Java version mismatch.",
      fix: "Install/select the Java version required by this Minecraft/Paper build (often Java 17 or 21)."
    });
  }

  if (/outofmemoryerror|java heap space|gc overhead limit exceeded|could not reserve enough space/i.test(crashCombined)) {
    findings.push({
      cause: "Server ran out of memory.",
      fix: "Increase RAM limit or reduce plugins/mods/world load."
    });
  }

  if (/unable to access jarfile|could not find or load main class|no such file or directory.*server\.jar|missing.*server\.jar/i.test(crashCombined)) {
    findings.push({
      cause: "Server jar is missing or invalid.",
      fix: "Re-provision the server jar (or upload a valid custom .jar) and restart."
    });
  }

  if (/failed to load properties from file|invalid server\.properties|malformed/i.test(crashCombined)) {
    findings.push({
      cause: "server.properties appears invalid.",
      fix: "Fix malformed values in server.properties, especially server-port and boolean flags."
    });
  }

  if (/overworld\(\).*null|getDataStorage\(\).*overworld\(\) is null/i.test(crashCombined)) {
    findings.push({
      cause: "The server world failed during early initialization (overworld is null), often due to corrupted world data or an incompatible plugin/mod.",
      fix: "Temporarily remove recent plugins/mods, test with a clean world, and restore from backup if world data is corrupted."
    });
  }

  const causedByMatch = crashCombined.match(/Caused by:\s*([^\r\n]+)/i);
  const descriptionMatch = crashReportText.match(/Description:\s*([^\r\n]+)/i);
  const exceptionLineMatch = crashCombined.match(/\b([A-Za-z0-9_$.]*Exception[^\r\n]*)/i);

  if (!findings.length) {
    if (!consoleLines.length) {
      return "I do not see startup logs yet. Start the server once, then ask again and I will diagnose from the console output.";
    }

    if (causedByMatch || descriptionMatch || exceptionLineMatch) {
      const causeText = String(causedByMatch?.[1] || exceptionLineMatch?.[1] || "Unknown exception").trim();
      const descriptionText = String(descriptionMatch?.[1] || "").trim();
      const crashSource = crashReportPath ? `Crash report: ${crashReportPath}` : "Crash report detected in logs.";
      const descPart = descriptionText ? ` Description: ${descriptionText}.` : "";
      return `The server is crashing with ${causeText}.${descPart} ${crashSource} This is usually plugin/mod/world-data related. Try disabling recent plugins/mods and starting with a clean world to isolate it.`;
    }

    const suspects = consoleLines.filter((line) => /error|exception|failed|fatal|warn/i.test(String(line || ""))).slice(-4);
    if (suspects.length) {
      return `I could not identify a single known root cause yet. Suspicious lines:\n- ${suspects.join("\n- ")}`;
    }

    return "I do not see a clear startup failure signature in the recent logs. Ask me to show recent errors and I will inspect more lines.";
  }

  const summary = findings.slice(0, 3).map((item, index) => `${index + 1}. Cause: ${item.cause} Fix: ${item.fix}`).join("\n");
  const evidence = consoleLines.filter((line) => /error|exception|failed|bind|eula|outofmemory|unsupported|nullpointer|crash report/i.test(String(line || ""))).slice(-3);
  const evidenceText = evidence.length ? `\nRecent evidence:\n- ${evidence.join("\n- ")}` : "";
  const crashInfo = crashReportPath ? `\nCrash report: ${crashReportPath}` : "";
  const causedByText = causedByMatch ? `\nCause from crash report: ${String(causedByMatch[1] || "").trim()}` : "";
  return `Most likely startup issue(s):\n${summary}${causedByText}${crashInfo}${evidenceText}`;
}

function buildAiReadReply(server, context, message) {
  const prompt = String(message || "").trim();
  const lower = prompt.toLowerCase();
  const online = Array.isArray(context.players?.online) ? context.players.online : [];
  const consoleLines = Array.isArray(context.console) ? context.console : [];
  const consoleTail = consoleLines.slice(-8);
  const consoleCombined = consoleLines.join("\n");
  const serverStatus = `${server.name} is ${server.status}${server.running ? " (running)" : ""}.`;
  const hasKnownStartupFailure = /failed to bind to port|address already in use|java\.net\.bindexception|perhaps a server is already running|you need to agree to the eula|unsupportedclassversionerror|outofmemoryerror|unable to access jarfile|could not find or load main class|failed to load properties/i.test(consoleCombined);
  const hasErrorSignals = /error|exception|failed|fatal|warn/i.test(consoleCombined);
  const recentTimeline = Array.isArray(server.timeline) ? server.timeline.slice(0, 14) : [];
  const recentStartAttempt = recentTimeline.some((entry) => /\b(start|starting|restart|restarting|process exited|crash|failed)\b/i.test(String(entry || "")));
  const shouldAutoTroubleshoot = !server.running && (hasKnownStartupFailure || (recentStartAttempt && hasErrorSignals));

  if (shouldAutoTroubleshoot) {
    return diagnoseMinecraftStartupIssue(server, context);
  }

  if (/\b(schedule|cron)\b/i.test(lower)) {
    return "Sure. Send the schedule as Name|cron|action. Example: Daily Restart|0 5 * * *|restart";
  }

  if (/\b(player|online)\b/i.test(lower)) {
    return online.length
      ? `Online players (${online.length}): ${online.join(", ")}`
      : "No players are online right now.";
  }

  if (/\b(console|log|error|warn|test)\b/i.test(lower)) {
    if (!consoleTail.length) {
      return "No console lines yet.";
    }
    const filtered = consoleTail.filter((line) => {
      if (/\berror\b/i.test(lower)) {
        return /\b(error|exception|failed|fatal)\b/i.test(line);
      }
      if (/\bwarn\b/i.test(lower)) {
        return /\bwarn(ing)?\b/i.test(line);
      }
      if (/\btest\b/i.test(lower)) {
        return /\btest\b/i.test(line);
      }
      return true;
    });
    const lines = (filtered.length ? filtered : consoleTail).slice(-5);
    return `Recent console lines:\n- ${lines.join("\n- ")}`;
  }

  if (/\b(status|running|offline|uptime|alive|start)\b/i.test(lower)) {
    return `${serverStatus} Online players: ${online.length}.`;
  }

  const mathReply = tryEvaluateMathQuestion(prompt);
  if (mathReply) {
    return mathReply;
  }

  if (/\b(what can you do|help|abilities)\b/i.test(lower)) {
    return "I can chat, answer simple questions, and control your server: lifecycle, commands, players, schedules, webhooks, addons, files, and logs.";
  }

  if (/\b(hi|hello|hey)\b/i.test(lower)) {
    return "Hey. I can chat and also perform server actions. Tell me what you want.";
  }

  if (!server.running) {
    return `${serverStatus} I do not see a confirmed startup failure signature yet. Ask me to start the server and I will analyze crash causes directly from the logs.`;
  }

  return `${serverStatus} Tell me what you want to do next and I will either do it or troubleshoot it from live logs.`;
}

function buildAiGreetingReply(server, context) {
  return "Hey. What do you want to do?";
}

async function executeAiIntent(server, intent) {
  if (intent.type === "lifecycle") {
    if (intent.action === "start") {
      await updateServerById(server.id, async (entry) => {
        entry.status = "starting";
        entry.badge = mapStatusToBadge("starting");
        entry.lastActionAt = new Date().toISOString();
        appendTimeline(entry, "AI confirmed action: start");
      });
      const latest = (await findServerById(server.id)).server;
      await startServer(latest);
      return { ok: true, type: intent.type, action: intent.action };
    }

    if (intent.action === "stop") {
      await updateServerById(server.id, async (entry) => {
        entry.status = "stopping";
        entry.badge = mapStatusToBadge("stopping");
        entry.lastActionAt = new Date().toISOString();
        appendTimeline(entry, "AI confirmed action: stop");
      });
      await stopServer(server);
      return { ok: true, type: intent.type, action: intent.action };
    }

    await updateServerById(server.id, async (entry) => {
      entry.status = "restarting";
      entry.badge = mapStatusToBadge("restarting");
      entry.lastActionAt = new Date().toISOString();
      appendTimeline(entry, "AI confirmed action: restart");
    });
    await stopServer(server);
    setTimeout(() => {
      readServers()
        .then((list) => list.find((item) => item.id === server.id))
        .then((latestServer) => {
          if (!latestServer) {
            return;
          }
          return startServer(latestServer);
        })
        .catch((error) => appendRuntimeLine(server.id, `AI restart failed: ${error.message}`));
    }, 1600);
    return { ok: true, type: intent.type, action: intent.action };
  }

  if (intent.type === "console_command") {
    const child = runtimeProcesses.get(server.id);
    if (!child) {
      throw new Error("Server is not running.");
    }
    const command = String(intent.command || "").trim();
    if (!command || command.includes("\n") || command.length > 180) {
      throw new Error("Invalid command.");
    }
    child.stdin.write(`${command}\n`);
    appendRuntimeLine(server.id, `> ${command}`);
    return { ok: true, type: intent.type, command };
  }

  if (intent.type === "update_port") {
    const nextPort = Number(intent.port);
    if (!Number.isInteger(nextPort) || nextPort < 1 || nextPort > 65535) {
      throw new Error("Port must be a valid number from 1 to 65535.");
    }

    await updateServerById(server.id, async (entry) => {
      const previousPort = Number(entry.port || 0);
      entry.port = nextPort;
      entry.version = `${entry.mcVersion} ${entry.loader}`;
      entry.lastActionAt = new Date().toISOString();
      appendTimeline(entry, `AI confirmed action: change port ${previousPort} -> ${nextPort}`);
    });

    return { ok: true, type: intent.type, port: nextPort };
  }

  if (intent.type === "player_action") {
    const child = runtimeProcesses.get(server.id);
    if (!child) {
      throw new Error("Server is not running.");
    }
    const command = buildPlayerCommand(intent.action, intent.player, intent.value || "");
    child.stdin.write(`${command}\n`);
    appendRuntimeLine(server.id, `> ${command}`);
    return { ok: true, type: intent.type, action: intent.action, player: intent.player };
  }

  if (intent.type === "create_schedule") {
    const servers = await readServers();
    const target = servers.find((item) => item.id === server.id);
    if (!target) {
      throw new Error("Server not found.");
    }

    const now = new Date().toISOString();
    const schedule = {
      id: createId(),
      name: intent.name,
      cron: intent.cron,
      action: intent.action,
      createdAt: now
    };

    target.schedules = Array.isArray(target.schedules) ? target.schedules : [];
    target.schedules.unshift(schedule);
    target.updatedAt = now;
    appendTimeline(target, `AI confirmed schedule: ${intent.name} (${intent.action})`);
    await writeServers(servers);
    return { ok: true, type: intent.type, schedule };
  }

  if (intent.type === "create_webhook") {
    const servers = await readServers();
    const target = servers.find((item) => item.id === server.id);
    if (!target) {
      throw new Error("Server not found.");
    }

    if (!/^https?:\/\//i.test(String(intent.url || ""))) {
      throw new Error("Webhook URL must start with http:// or https://");
    }

    const event = String(intent.event || "restart").toLowerCase();
    if (!["start", "stop", "restart", "crash"].includes(event)) {
      throw new Error("Webhook event must be start, stop, restart or crash.");
    }

    const now = new Date().toISOString();
    const webhook = {
      id: createId(),
      name: String(intent.name || `${event[0].toUpperCase()}${event.slice(1)} Webhook`).trim(),
      url: String(intent.url || "").trim(),
      event,
      createdAt: now
    };

    target.webhooks = Array.isArray(target.webhooks) ? target.webhooks : [];
    target.webhooks.unshift(webhook);
    target.updatedAt = now;
    appendTimeline(target, `AI confirmed webhook: ${webhook.name} on ${event}`);
    await writeServers(servers);
    return { ok: true, type: intent.type, webhook };
  }

  throw new Error("Unsupported action.");
}

function stringifyServerProperties(obj) {
  const entries = Object.entries(obj || {}).sort(([a], [b]) => a.localeCompare(b));
  return entries.map(([k, v]) => `${k}=${v}`).join("\n") + "\n";
}

async function listDirEntries(baseDir, relative = "") {
  const target = safeJoin(baseDir, relative);
  const entries = await fs.readdir(target, { withFileTypes: true });
  return entries
    .map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? "dir" : "file"
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeStoreType(value) {
  const text = String(value || "plugin").trim().toLowerCase();
  if (["plugin", "mod", "modpack", "datapack", "resourcepack", "shader"].includes(text)) {
    return text;
  }
  return "plugin";
}

function inferStoreTargetDir(server, type) {
  if (type === "plugin") {
    return getPluginsDir(server);
  }
  if (type === "mod") {
    return getModsDir(server);
  }
  if (type === "datapack") {
    return getDatapacksDir(server);
  }
  if (type === "modpack") {
    return getModpacksDir(server);
  }
  if (type === "resourcepack") {
    return getResourcePacksDir(server);
  }
  if (type === "shader") {
    return getShaderPacksDir(server);
  }
  return getPluginsDir(server);
}

function inferInstalledStoreType(requestedType, version) {
  const loaders = Array.isArray(version?.loaders)
    ? version.loaders.map((loader) => String(loader).toLowerCase())
    : [];
  const pluginLoaders = new Set(["paper", "purpur", "spigot", "bukkit", "folia", "velocity", "waterfall", "bungeecord"]);
  const modLoaders = new Set(["fabric", "forge", "neoforge", "quilt", "liteloader", "rift"]);

  if (loaders.some((loader) => pluginLoaders.has(loader))) {
    return "plugin";
  }
  if (loaders.some((loader) => modLoaders.has(loader))) {
    return "mod";
  }
  return normalizeStoreType(requestedType);
}

function getLoaderPreferenceForStoreType(server, type) {
  if (type === "plugin") {
    const serverLoader = String(server?.loader || "").toLowerCase();
    return Array.from(new Set([serverLoader, "paper", "purpur", "spigot", "bukkit", "folia"].filter(Boolean)));
  }

  const serverLoader = String(server?.loader || "").toLowerCase();
  if (type === "mod" && serverLoader) {
    return [serverLoader];
  }

  if (type === "mod") {
    return ["fabric", "forge", "quilt", "neoforge"];
  }

  if (type === "datapack") {
    return ["datapack"];
  }

  return [];
}

async function fetchModrinthJson(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: {
      "User-Agent": "vyron-panel/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Modrinth request failed (${response.status})`);
  }

  return response.json();
}

function pickBestVersionFile(version) {
  const files = Array.isArray(version?.files) ? version.files : [];
  if (!files.length) {
    return null;
  }

  return files.find((file) => file?.primary) || files[0];
}

async function selectModrinthVersion(projectId, options) {
  const mcVersion = String(options?.mcVersion || "").trim();
  const type = normalizeStoreType(options?.type);
  const preferredLoaders = Array.isArray(options?.preferredLoaders) ? options.preferredLoaders : [];
  const versions = await fetchModrinthJson(`${MODRINTH_API_BASE}/project/${encodeURIComponent(projectId)}/version`);

  if (!Array.isArray(versions) || !versions.length) {
    throw new Error("No Modrinth versions found for this project.");
  }

  const filteredByVersion = mcVersion
    ? versions.filter((item) => Array.isArray(item?.game_versions) && item.game_versions.includes(mcVersion))
    : versions;

  if (mcVersion && !filteredByVersion.length) {
    throw new Error(`No version supports Minecraft ${mcVersion}.`);
  }

  const candidates = filteredByVersion.length ? filteredByVersion : versions;
  const loaderMatched = candidates.filter((item) => {
    if (type === "modpack") {
      return true;
    }
    if (!preferredLoaders.length) {
      return true;
    }
    const loaders = Array.isArray(item?.loaders) ? item.loaders.map((loader) => String(loader).toLowerCase()) : [];
    return preferredLoaders.some((loader) => loaders.includes(loader));
  });

  if (preferredLoaders.length && type !== "modpack" && !loaderMatched.length) {
    throw new Error(`No version supports the server loader (${preferredLoaders.join(", ")}).`);
  }

  const selected = (loaderMatched.length ? loaderMatched : candidates)[0];
  if (!selected) {
    throw new Error("No compatible Modrinth version found.");
  }

  const file = pickBestVersionFile(selected);
  if (!file?.url) {
    throw new Error("Selected Modrinth version has no downloadable file.");
  }

  return { version: selected, file };
}

async function readJsonFileSafe(filePath, fallbackValue) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

function normalizeUuid(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) {
    return "";
  }
  return text.replace(/[^a-f0-9-]/g, "");
}

function formatMinecraftUuid(value) {
  const compact = normalizeUuid(value).replace(/-/g, "");
  if (!/^[a-f0-9]{32}$/.test(compact)) {
    return "";
  }
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}

async function resolveMinecraftProfile(username) {
  const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(username)}`, {
    signal: AbortSignal.timeout(10000)
  });
  if (response.status === 204 || response.status === 404) {
    throw new Error(`Minecraft player "${username}" was not found.`);
  }
  if (!response.ok) {
    throw new Error(`Could not verify Minecraft player (${response.status}).`);
  }
  const profile = await response.json();
  const uuid = formatMinecraftUuid(profile?.id);
  const name = String(profile?.name || username).trim();
  if (!uuid || !name) {
    throw new Error("Mojang returned an invalid player profile.");
  }
  return { uuid, name };
}

function stripAnsiCodes(value) {
  return String(value || "").replace(/\x1b\[[0-9;]*m/g, "").trim();
}

function canonicalizePlayerName(rawName, knownNames = []) {
  const cleaned = stripAnsiCodes(rawName).replace(/^[^A-Za-z0-9_]+/, "").trim();
  if (!cleaned) {
    return "";
  }

  const exact = knownNames.find((name) => name.toLowerCase() === cleaned.toLowerCase());
  if (exact) {
    return exact;
  }

  const suffixMatch = knownNames.find((name) => cleaned.toLowerCase().endsWith(name.toLowerCase()));
  if (suffixMatch) {
    return suffixMatch;
  }

  const embeddedMatch = knownNames.find((name) => cleaned.toLowerCase().includes(name.toLowerCase()));
  if (embeddedMatch) {
    return embeddedMatch;
  }

  const bare = cleaned.match(/([A-Za-z0-9_]{3,16})$/)?.[1] || cleaned;
  return bare;
}

function stripUuidDashes(value) {
  return String(value || "").replace(/-/g, "");
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function getPlayerDataDirs(server) {
  const instanceDir = getInstanceDir(server);
  const candidate = new Set([
    path.join(instanceDir, "playerdata"),
    path.join(instanceDir, "world", "playerdata")
  ]);

  try {
    const entries = await fs.readdir(instanceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      if (entry.name.toLowerCase().startsWith("world")) {
        candidate.add(path.join(instanceDir, entry.name, "playerdata"));
      }
      if (entry.name.toLowerCase().includes("playerdata")) {
        candidate.add(path.join(instanceDir, entry.name));
      }
    }
  } catch {
    return [];
  }

  const dirs = [];
  for (const dirPath of candidate) {
    if (await pathExists(dirPath)) {
      dirs.push(dirPath);
    }
  }
  return dirs;
}

async function resolvePlayerDataFile(server, uuid) {
  const cleanUuid = normalizeUuid(uuid);
  if (!cleanUuid) {
    return null;
  }

  const dashed = cleanUuid;
  const stripped = stripUuidDashes(cleanUuid);
  const dirs = await getPlayerDataDirs(server);

  for (const dirPath of dirs) {
    const dashedPath = path.join(dirPath, `${dashed}.dat`);
    if (await pathExists(dashedPath)) {
      return dashedPath;
    }

    const strippedPath = path.join(dirPath, `${stripped}.dat`);
    if (await pathExists(strippedPath)) {
      return strippedPath;
    }
  }

  return null;
}

async function parsePlayerDataNbt(filePath) {
  const compressed = await fs.readFile(filePath);
  const parsed = await new Promise((resolve, reject) => {
    parseNbt(compressed, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(data);
    });
  });

  return simplifyNbt(parsed);
}

function slotLabel(slot) {
  const n = Number(slot);
  if (n >= 0 && n <= 8) return `Hotbar ${n + 1}`;
  if (n >= 9 && n <= 35) return `Inventory ${n - 8}`;
  if (n >= 36 && n <= 39) return `Armor ${n - 35}`;
  if (n === 40 || n === -106) return "Offhand";
  if (n === 100) return "Boots";
  if (n === 101) return "Leggings";
  if (n === 102) return "Chestplate";
  if (n === 103) return "Helmet";
  return `Slot ${Number.isFinite(n) ? n : "?"}`;
}

function prettifyItemId(itemId) {
  const id = String(itemId || "minecraft:air");
  const short = id.includes(":") ? id.split(":").slice(1).join(":") : id;
  return short
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function parsePlayerInventory(playerNbt) {
  const raw = Array.isArray(playerNbt?.Inventory) ? playerNbt.Inventory : [];
  return raw
    .map((item) => {
      const slot = Number(item?.Slot ?? item?.slot ?? -1);
      const id = String(item?.id || item?.Name || "minecraft:air");
      const count = Number(item?.Count ?? item?.count ?? 0) || 0;

      return {
        slot,
        slotLabel: slotLabel(slot),
        id,
        displayName: prettifyItemId(id),
        count: Math.max(1, count)
      };
    })
    .sort((a, b) => a.slot - b.slot);
}

function effectNameFromId(value) {
  const text = String(value || "").trim();
  if (!text) {
    return "unknown";
  }
  if (text.startsWith("minecraft:")) {
    return text;
  }
  if (/^\d+$/.test(text)) {
    return `id:${text}`;
  }
  return `minecraft:${text}`;
}

function parsePlayerEffects(playerNbt) {
  const legacy = Array.isArray(playerNbt?.ActiveEffects) ? playerNbt.ActiveEffects : [];
  const modern = Array.isArray(playerNbt?.active_effects) ? playerNbt.active_effects : [];
  const list = modern.length ? modern : legacy;

  return list.map((effect) => {
    const id = effect?.id ?? effect?.Id ?? effect?.effect;
    const amp = Number(effect?.amplifier ?? effect?.Amplifier ?? 0) || 0;
    const durationTicks = Number(effect?.duration ?? effect?.Duration ?? 0) || 0;
    return {
      id: effectNameFromId(id),
      amplifier: amp,
      durationSeconds: Math.max(0, Math.floor(durationTicks / 20))
    };
  });
}

function parsePlayerStats(playerNbt) {
  const pos = Array.isArray(playerNbt?.Pos) ? playerNbt.Pos : [];
  return {
    health: Number(playerNbt?.Health ?? 20) || 20,
    maxHealth: 20,
    foodLevel: Number(playerNbt?.foodLevel ?? 20) || 20,
    foodSaturation: Number(playerNbt?.foodSaturationLevel ?? 0) || 0,
    xpLevel: Number(playerNbt?.XpLevel ?? 0) || 0,
    xpProgress: Number(playerNbt?.XpP ?? 0) || 0,
    gameMode: Number(playerNbt?.playerGameType ?? 0) || 0,
    selectedSlot: Number(playerNbt?.SelectedItemSlot ?? 0) || 0,
    dimension: String(playerNbt?.Dimension || playerNbt?.dimension || "minecraft:overworld"),
    position: {
      x: Number(pos[0] ?? 0) || 0,
      y: Number(pos[1] ?? 0) || 0,
      z: Number(pos[2] ?? 0) || 0
    }
  };
}

function getOrCreateRuntimePlayerState(serverId) {
  const existing = runtimePlayerState.get(serverId);
  if (existing) {
    return existing;
  }

  const fresh = {
    online: new Set(),
    history: new Map()
  };
  runtimePlayerState.set(serverId, fresh);
  return fresh;
}

function updatePlayerHistory(state, name, updates = {}) {
  const key = String(name || "").trim();
  if (!key) {
    return;
  }

  const current = state.history.get(key) || {
    name: key,
    seenCount: 0,
    lastSeenAt: null,
    lastJoinAt: null,
    lastLeaveAt: null,
    online: false
  };

  const next = {
    ...current,
    ...updates,
    name: key
  };
  state.history.set(key, next);
}

function appendRuntimeLine(serverId, line) {
  const text = String(line || "").trim();
  if (!text) {
    return;
  }

  const nowIso = new Date().toISOString();
  const playerState = getOrCreateRuntimePlayerState(serverId);
  const joinMatch = text.match(/\b([A-Za-z0-9_]{3,16})\s+joined the game\b/i);
  const leaveMatch = text.match(/\b([A-Za-z0-9_]{3,16})\s+left the game\b/i);

  if (joinMatch) {
    const playerName = joinMatch[1];
    playerState.online.add(playerName);
    const previous = playerState.history.get(playerName);
    updatePlayerHistory(playerState, playerName, {
      online: true,
      lastSeenAt: nowIso,
      lastJoinAt: nowIso,
      seenCount: (previous?.seenCount || 0) + 1
    });
    const day = nowIso.slice(0, 10);
    void updateServerById(serverId, async (entry) => {
      entry.playerAnalytics = entry.playerAnalytics && typeof entry.playerAnalytics === "object" ? entry.playerAnalytics : {};
      const names = new Set(Array.isArray(entry.playerAnalytics[day]?.players) ? entry.playerAnalytics[day].players : []);
      names.add(playerName);
      entry.playerAnalytics[day] = { players: Array.from(names).sort(), updatedAt: nowIso };
      for (const key of Object.keys(entry.playerAnalytics).sort().slice(0, -90)) delete entry.playerAnalytics[key];
    }).catch(() => {});
  }

  if (leaveMatch) {
    const playerName = leaveMatch[1];
    playerState.online.delete(playerName);
    updatePlayerHistory(playerState, playerName, {
      online: false,
      lastSeenAt: nowIso,
      lastLeaveAt: nowIso
    });
  }

  const parsedTps = parseTpsFromLogLine(text);
  if (parsedTps !== null) {
    runtimeTpsState.set(serverId, {
      value: parsedTps,
      updatedAt: nowIso
    });
  }

  const lines = runtimeLogs.get(serverId) || [];
  lines.push(`[${nowIso}] ${text}`);
  if (lines.length > MAX_CONSOLE_LINES) {
    lines.splice(0, lines.length - MAX_CONSOLE_LINES);
  }
  runtimeLogs.set(serverId, lines);
  const subscribers = runtimeConsoleSubscribers.get(serverId);
  if (subscribers?.size) {
    const payload = `data: ${JSON.stringify({ line: lines[lines.length - 1] })}\n\n`;
    for (const response of subscribers) response.write(payload);
  }
}

async function markServerRunning(serverId, reason = "Server entered running state") {
  if (runtimeReadyAnnounced.has(serverId)) {
    return;
  }

  runtimeReadyAnnounced.add(serverId);
  await updateServerById(serverId, async (entry) => {
    entry.status = "running";
    entry.badge = mapStatusToBadge("running");
    entry.lastActionAt = new Date().toISOString();
    appendTimeline(entry, reason);
  });
}

function maybeMarkServerReadyFromLog(serverId, line) {
  const text = String(line || "");
  if (!text) {
    return;
  }

  const isReady = /Done \([\d.]+s\)!/i.test(text) || /For help, type "help"/i.test(text);
  if (!isReady) {
    return;
  }

  markServerRunning(serverId, "Server reported ready in console log").catch(() => {});
}

function getRuntimeLines(serverId, limit = 120) {
  const lines = runtimeLogs.get(serverId) || [];
  return lines.slice(Math.max(0, lines.length - limit));
}

function canWriteToProcessStdin(child) {
  return Boolean(
    child?.stdin &&
    !child.stdin.destroyed &&
    !child.stdin.writableDestroyed &&
    !child.stdin.writableEnded
  );
}

function sendRuntimeCommand(serverId, child, command) {
  if (!canWriteToProcessStdin(child)) {
    const error = new Error("Server console is not accepting input (stdin unavailable).");
    error.statusCode = 400;
    throw error;
  }

  const flushed = child.stdin.write(`${command}\n`);
  appendRuntimeLine(serverId, `> ${command}`);

  if (!flushed) {
    appendRuntimeLine(serverId, "[WARN] stdin buffer is busy; command queued for delivery.");
    child.stdin.once("drain", () => {
      appendRuntimeLine(serverId, "[INFO] stdin buffer drained.");
    });
  }

  return { flushed };
}

function isJavaAvailable() {
  return Boolean(findJavaExecutable(17));
}

function probeJava(executable) {
  try {
    const result = spawnSync(executable, ["-version"], { shell: false });
    return result.status === 0;
  } catch {
    return false;
  }
}

function getJavaMajorVersion(executable) {
  try {
    const result = spawnSync(executable, ["-version"], {
      shell: false,
      encoding: "utf8"
    });
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    const match = output.match(/version\s+"(?:1\.)?(\d+)/i);
    if (!match) {
      return null;
    }
    return Number(match[1]);
  } catch {
    return null;
  }
}

function findJavaInDirectory(baseDir, minimumMajorVersion) {
  if (!baseDir || !fsSync.existsSync(baseDir)) {
    return null;
  }

  try {
    const entries = fsSync
      .readdirSync(baseDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => b.localeCompare(a));

    for (const entry of entries) {
      const javaPath = path.join(baseDir, entry, "bin", process.platform === "win32" ? "java.exe" : "java");
      if (fsSync.existsSync(javaPath) && probeJava(javaPath)) {
        const major = getJavaMajorVersion(javaPath);
        if (major && major >= minimumMajorVersion) {
          return { command: javaPath, major };
        }
      }
    }
  } catch {
    return null;
  }

  return null;
}

function findJavaExecutable(minimumMajorVersion = 17) {
  if (javaCommandCache && javaCommandCache.major >= minimumMajorVersion) {
    return javaCommandCache.command;
  }

  const javaHomeCandidate = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, "bin", process.platform === "win32" ? "java.exe" : "java")
    : null;

  if (javaHomeCandidate && fsSync.existsSync(javaHomeCandidate) && probeJava(javaHomeCandidate)) {
    const major = getJavaMajorVersion(javaHomeCandidate);
    if (major && major >= minimumMajorVersion) {
      javaCommandCache = { command: javaHomeCandidate, major };
      return javaCommandCache.command;
    }
  }

  if (probeJava("java")) {
    const major = getJavaMajorVersion("java");
    if (major && major >= minimumMajorVersion) {
      javaCommandCache = { command: "java", major };
      return javaCommandCache.command;
    }
  }

  if (process.platform === "win32") {
    const commonPaths = [
      path.join("C:\\", "Program Files", "Eclipse Adoptium"),
      path.join("C:\\", "Program Files", "Java")
    ];

    for (const baseDir of commonPaths) {
      const resolved = findJavaInDirectory(baseDir, minimumMajorVersion);
      if (resolved) {
        javaCommandCache = resolved;
        return javaCommandCache.command;
      }
    }
  }

  if (process.platform === "linux") {
    const commonPaths = [
      path.join("/", "usr", "lib", "jvm"),
      path.join("/", "usr", "lib64", "jvm"),
      path.join("/", "usr", "java"),
      path.join("/", "opt", "java")
    ];

    for (const baseDir of commonPaths) {
      const resolved = findJavaInDirectory(baseDir, minimumMajorVersion);
      if (resolved) {
        javaCommandCache = resolved;
        return javaCommandCache.command;
      }
    }
  }

  return null;
}

function runInstallerCommand(command, args) {
  try {
    const result = spawnSync(command, args, { shell: true, stdio: "pipe" });
    return {
      ok: result.status === 0,
      output: `${result.stdout?.toString() || ""}${result.stderr?.toString() || ""}`
    };
  } catch (error) {
    return { ok: false, output: error.message || "Installer command failed." };
  }
}

function commandExists(command) {
  const probe = process.platform === "win32"
    ? runInstallerCommand("where", [command])
    : runInstallerCommand("which", [command]);
  return probe.ok;
}

function getJavaStatusPayload() {
  const executable = findJavaExecutable(17);
  return {
    installed: Boolean(executable),
    executable: executable || null,
    majorVersion: executable ? getJavaMajorVersion(executable) : null,
    installing: Boolean(javaInstallPromise),
    platform: process.platform
  };
}

async function installJavaAutomatically(minimumMajorVersion = 17) {
  const targetMajor = Math.max(17, Number(minimumMajorVersion) || 17);

  if (process.platform === "win32") {
    if (commandExists("winget")) {
      const result = runInstallerCommand("winget", [
        "install",
        "-e",
        "--id",
        `EclipseAdoptium.Temurin.${targetMajor}.JDK`,
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--silent"
      ]);
      if (result.ok) {
        return;
      }
      throw new Error(`winget install failed: ${result.output}`);
    }

    if (commandExists("choco")) {
      const result = runInstallerCommand("choco", ["install", `temurin${targetMajor}jdk`, "-y"]);
      if (result.ok) {
        return;
      }
      throw new Error(`choco install failed: ${result.output}`);
    }

    throw new Error("No supported package manager found (winget/choco). Install Java 17+ manually.");
  }

  if (process.platform === "linux") {
    const runWithOptionalSudo = (cmd, args) => {
      const isRoot = typeof process.getuid === "function" && process.getuid() === 0;
      if (isRoot) {
        return runInstallerCommand(cmd, args);
      }
      return runInstallerCommand("sudo", [cmd, ...args]);
    };

    if (commandExists("apt-get")) {
      runWithOptionalSudo("apt-get", ["update"]);

      const aptPackages = [
        `openjdk-${targetMajor}-jre-headless`,
        `openjdk-${targetMajor}-jdk-headless`,
        `openjdk-${targetMajor}-jdk`
      ];

      for (const pkg of aptPackages) {
        const result = runWithOptionalSudo("apt-get", ["install", "-y", pkg]);
        if (!result.ok) {
          continue;
        }

        javaCommandCache = null;
        if (findJavaExecutable(targetMajor)) {
          return;
        }
      }

      throw new Error("apt-get installed a package but Java 17+ is still not detectable.");
    }

    if (commandExists("dnf")) {
      const result = runWithOptionalSudo("dnf", ["install", "-y", `java-${targetMajor}-openjdk`]);
      if (result.ok) {
        javaCommandCache = null;
        if (findJavaExecutable(targetMajor)) {
          return;
        }
      }
      throw new Error(`dnf install failed: ${result.output}`);
    }

    if (commandExists("yum")) {
      const result = runWithOptionalSudo("yum", ["install", "-y", `java-${targetMajor}-openjdk`]);
      if (result.ok) {
        javaCommandCache = null;
        if (findJavaExecutable(targetMajor)) {
          return;
        }
      }
      throw new Error(`yum install failed: ${result.output}`);
    }

    throw new Error("Automatic Java install failed on Linux. Install Java 17+ manually.");
  }

  throw new Error("Automatic Java installation is not implemented for this OS.");
}

async function ensureJavaAvailable(minimumMajorVersion = 17) {
  if (findJavaExecutable(minimumMajorVersion)) {
    return findJavaExecutable(minimumMajorVersion);
  }

  if (!javaInstallPromise) {
    javaInstallPromise = installJavaAutomatically(minimumMajorVersion).finally(() => {
      javaInstallPromise = null;
    });
  }

  await javaInstallPromise;
  javaCommandCache = null;

  const javaExecutable = findJavaExecutable(minimumMajorVersion);
  if (!javaExecutable) {
    throw new Error(
      `Java installation completed but Java ${minimumMajorVersion}+ is still not found. Restart panel or install Java ${minimumMajorVersion}+ manually.`
    );
  }

  return javaExecutable;
}

async function ensureXvfbAvailable(server) {
  // Check if xvfb-run is already available
  const hasXvfb = spawnSync("which", ["xvfb-run"], { stdio: "ignore" }).status === 0;
  if (hasXvfb) {
    return;
  }

  // Try to install xvfb
  appendRuntimeLine(server.id, `Installing xvfb for headless X11 support...`);
  
  try {
    // Detect package manager
    const { status: aptStatus } = spawnSync("which", ["apt-get"], { stdio: "ignore" });
    const { status: dnfStatus } = spawnSync("which", ["dnf"], { stdio: "ignore" });
    const { status: yumStatus } = spawnSync("which", ["yum"], { stdio: "ignore" });
    
    let cmd = "";
    if (aptStatus === 0) {
      cmd = "apt-get update && apt-get install -y xvfb";
    } else if (dnfStatus === 0) {
      cmd = "dnf install -y xvfb";
    } else if (yumStatus === 0) {
      cmd = "yum install -y xvfb";
    } else {
      appendRuntimeLine(server.id, `⚠ Could not auto-install xvfb: No supported package manager found`);
      return;
    }

    // Run install command with sudo if needed
    const result = spawnSync("sh", ["-c", `sudo ${cmd}`], { 
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000
    });
    
    if (result.status === 0) {
      appendRuntimeLine(server.id, `✓ xvfb installed successfully`);
    } else {
      const error = result.stderr?.toString() || "";
      appendRuntimeLine(server.id, `⚠ xvfb installation may have failed: ${error.split('\n')[0]}`);
    }
  } catch (error) {
    appendRuntimeLine(server.id, `⚠ Error installing xvfb: ${error.message}`);
  }
}

function getMinimumJavaVersionForMinecraftVersion(mcVersion) {
  const parsed = parseMinecraftVersion(mcVersion);
  if (!parsed) {
    return 17;
  }

  const java21Threshold = { major: 1, minor: 20, patch: 5 };
  const java17Threshold = { major: 1, minor: 17, patch: 0 };

  if (compareMinecraftVersions(parsed, java21Threshold) >= 0) {
    return 21;
  }

  if (compareMinecraftVersions(parsed, java17Threshold) >= 0) {
    return 17;
  }

  return 8;
}

async function downloadFile(url, filePath) {
  const response = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(60000) });
  if (!response.ok || !response.body) {
    throw new Error(`Download failed (${response.status}) from ${url}`);
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const arrayBuffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));
}

function extractVersionsFromMavenMetadata(xmlText) {
  const matches = [...String(xmlText || "").matchAll(/<version>([^<]+)<\/version>/g)];
  return matches.map((match) => match[1]).filter(Boolean);
}

function parseMcVersionFromPaperMavenVersion(versionText) {
  const base = String(versionText || "").split("-")[0];
  return parseMinecraftVersion(base);
}

async function getStablePaperBuildUrl(version) {
  const buildsRes = await fetch(`https://fill.papermc.io/v3/projects/paper/versions/${version}/builds`, {
    signal: AbortSignal.timeout(10000)
  });

  if (!buildsRes.ok) {
    return null;
  }

  const builds = await buildsRes.json();
  if (!Array.isArray(builds)) {
    return null;
  }

  // Prefer the newest stable build that has a direct server artifact URL.
  const stableBuild = [...builds].reverse().find((item) => {
    return item?.channel === "STABLE" && item?.downloads?.["server:default"]?.url;
  });

  return stableBuild?.downloads?.["server:default"]?.url || null;
}

async function resolvePaperJarUrl(mcVersion) {
  const requested = parseMinecraftVersion(mcVersion);
  const requestedMinJava = getMinimumJavaVersionForMinecraftVersion(mcVersion);
  const directStable = await getStablePaperBuildUrl(mcVersion);
  if (directStable) {
    return { url: directStable, minJava: requestedMinJava };
  }

  const projectRes = await fetch("https://fill.papermc.io/v3/projects/paper", {
    signal: AbortSignal.timeout(10000)
  });

  if (projectRes.ok) {
    const projectPayload = await projectRes.json();
    const versionGroups = projectPayload?.versions || {};
    const allVersions = Object.values(versionGroups)
      .flatMap((items) => (Array.isArray(items) ? items : []))
      .filter((version) => !String(version).includes("-"))
      .map((version) => ({ version, parsed: parseMinecraftVersion(version) }))
      .filter((item) => item.parsed)
      .sort((a, b) => compareMinecraftVersions(b.parsed, a.parsed));

    const sameMinor = requested
      ? allVersions.filter(
          (item) => item.parsed.major === requested.major && item.parsed.minor === requested.minor && item.version !== mcVersion
        )
      : [];

    for (const candidate of sameMinor) {
      const stableUrl = await getStablePaperBuildUrl(candidate.version);
      if (stableUrl) {
        return {
          url: stableUrl,
          minJava: getMinimumJavaVersionForMinecraftVersion(candidate.version)
        };
      }
    }

    // If nothing in the same minor line is stable, search globally for the latest stable build.
    for (const candidate of allVersions) {
      if (candidate.version === mcVersion) {
        continue;
      }
      const stableUrl = await getStablePaperBuildUrl(candidate.version);
      if (stableUrl) {
        return {
          url: stableUrl,
          minJava: getMinimumJavaVersionForMinecraftVersion(candidate.version)
        };
      }
    }
  }

  const metadataRes = await fetch(
    "https://repo.papermc.io/repository/maven-public/io/papermc/paper/paperclip/maven-metadata.xml",
    { signal: AbortSignal.timeout(10000) }
  );

  if (!metadataRes.ok) {
    throw new Error(`No Paper build available for ${mcVersion}`);
  }

  const metadataXml = await metadataRes.text();
  const allPaperclipVersions = extractVersionsFromMavenMetadata(metadataXml);
  const requestedForMaven = parseMinecraftVersion(mcVersion);

  if (!requestedForMaven || !allPaperclipVersions.length) {
    throw new Error(`No Paper build available for ${mcVersion}`);
  }

  const candidates = allPaperclipVersions
    .map((version) => ({ version, parsed: parseMcVersionFromPaperMavenVersion(version) }))
    .filter(
      (item) =>
        item.parsed &&
        item.parsed.major === requestedForMaven.major &&
        item.parsed.minor === requestedForMaven.minor
    )
    .sort((a, b) => compareMinecraftVersions(b.parsed, a.parsed));

  const fallback =
    candidates.find((item) => compareMinecraftVersions(item.parsed, requestedForMaven) <= 0) ||
    candidates[0];

  if (!fallback?.version) {
    throw new Error(`No Paper build available for ${mcVersion}`);
  }

  return {
    url: `https://repo.papermc.io/repository/maven-public/io/papermc/paper/paperclip/${fallback.version}/paperclip-${fallback.version}.jar`,
    minJava: getMinimumJavaVersionForMinecraftVersion(fallback.version)
  };
}

async function resolvePurpurJarUrl(mcVersion) {
  const versionsRes = await fetch("https://api.purpurmc.org/v2/purpur/", {
    signal: AbortSignal.timeout(10000)
  });

  if (!versionsRes.ok) {
    throw new Error("Could not fetch Purpur versions list.");
  }

  const versionsPayload = await versionsRes.json();
  const versions = Array.isArray(versionsPayload?.versions) ? versionsPayload.versions : [];
  if (!versions.includes(mcVersion)) {
    throw new Error(`Purpur does not provide Minecraft ${mcVersion}`);
  }

  const buildsRes = await fetch(`https://api.purpurmc.org/v2/purpur/${encodeURIComponent(mcVersion)}`, {
    signal: AbortSignal.timeout(10000)
  });
  if (!buildsRes.ok) {
    throw new Error(`Could not fetch Purpur builds for ${mcVersion}`);
  }

  const buildsPayload = await buildsRes.json();
  const builds = Array.isArray(buildsPayload?.builds?.all) ? buildsPayload.builds.all : [];
  if (!builds.length) {
    throw new Error(`No Purpur builds found for ${mcVersion}`);
  }

  const latest = Number(builds[builds.length - 1]);
  if (!Number.isFinite(latest)) {
    throw new Error(`Could not resolve latest Purpur build for ${mcVersion}`);
  }

  return {
    url: `https://api.purpurmc.org/v2/purpur/${mcVersion}/${latest}/download`,
    minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion)
  };
}

async function resolveFoliaJarUrl(mcVersion) {
  const response = await fetch(`https://fill.papermc.io/v3/projects/folia/versions/${encodeURIComponent(mcVersion)}/builds`, {
    headers: { "User-Agent": "VyronPanel/1.3.5 (https://vyronpanel.com)" },
    signal: AbortSignal.timeout(10000)
  });
  if (!response.ok) {
    throw new Error(`Folia does not provide Minecraft ${mcVersion}`);
  }

  const builds = await response.json();
  const stableBuild = Array.isArray(builds)
    ? [...builds].reverse().find((item) => item?.channel === "STABLE" && item?.downloads?.["server:default"]?.url)
    : null;
  if (!stableBuild) {
    throw new Error(`No stable Folia build found for Minecraft ${mcVersion}`);
  }

  return {
    url: stableBuild.downloads["server:default"].url,
    minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion)
  };
}

async function resolveFabricJarUrl(mcVersion) {
  const preferredRes = await fetch(`https://meta.fabricmc.net/v2/versions/loader/${encodeURIComponent(mcVersion)}`, {
    signal: AbortSignal.timeout(10000)
  });

  if (preferredRes.ok) {
    const preferredPayload = await preferredRes.json();
    const preferred = Array.isArray(preferredPayload)
      ? preferredPayload.find((item) => item?.loader?.version && item?.installer?.version)
      : null;

    if (preferred?.loader?.version && preferred?.installer?.version) {
      return {
        url: `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${preferred.loader.version}/${preferred.installer.version}/server/jar`,
        minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion)
      };
    }
  }

  const [gameRes, loaderRes, installerRes] = await Promise.all([
    fetch("https://meta.fabricmc.net/v2/versions/game", { signal: AbortSignal.timeout(10000) }),
    fetch("https://meta.fabricmc.net/v2/versions/loader", { signal: AbortSignal.timeout(10000) }),
    fetch("https://meta.fabricmc.net/v2/versions/installer", { signal: AbortSignal.timeout(10000) })
  ]);

  if (!gameRes.ok || !loaderRes.ok || !installerRes.ok) {
    throw new Error(`Fabric metadata request failed for ${mcVersion}`);
  }

  const gameVersions = await gameRes.json();
  const hasGameVersion = Array.isArray(gameVersions)
    ? gameVersions.some((item) => item?.version === mcVersion)
    : false;

  if (!hasGameVersion) {
    throw new Error(`Fabric does not support Minecraft ${mcVersion}`);
  }

  const loaders = await loaderRes.json();
  const installers = await installerRes.json();

  const chosenLoader = Array.isArray(loaders)
    ? loaders.find((item) => item?.version && item?.stable !== false) || loaders.find((item) => item?.version)
    : null;
  const chosenInstaller = Array.isArray(installers)
    ? installers.find((item) => item?.version && item?.stable !== false) || installers.find((item) => item?.version)
    : null;

  if (!chosenLoader?.version || !chosenInstaller?.version) {
    throw new Error(`No Fabric installer found for ${mcVersion}`);
  }

  return {
    url: `https://meta.fabricmc.net/v2/versions/loader/${mcVersion}/${chosenLoader.version}/${chosenInstaller.version}/server/jar`,
    minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion)
  };
}

async function resolveQuiltInstallerInfo(mcVersion) {
  const [gameRes, installerRes] = await Promise.all([
    fetch("https://meta.quiltmc.org/v3/versions/game", { signal: AbortSignal.timeout(10000) }),
    fetch("https://meta.quiltmc.org/v3/versions/installer", { signal: AbortSignal.timeout(10000) })
  ]);
  if (!gameRes.ok || !installerRes.ok) {
    throw new Error(`Quilt metadata request failed for ${mcVersion}`);
  }

  const gameVersions = await gameRes.json();
  const supportsVersion = Array.isArray(gameVersions)
    && gameVersions.some((item) => item?.version === mcVersion);
  if (!supportsVersion) {
    throw new Error(`Quilt does not support Minecraft ${mcVersion}`);
  }

  const installers = await installerRes.json();
  const installer = Array.isArray(installers)
    ? installers.find((item) => item?.url && item?.version)
    : null;
  if (!installer) {
    throw new Error(`No Quilt installer found for Minecraft ${mcVersion}`);
  }

  return {
    url: installer.url,
    installerVersion: installer.version,
    mcVersion,
    minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion),
    kind: "quilt-installer"
  };
}

async function resolveNeoForgeInstallerInfo(mcVersion) {
  const parsed = parseMinecraftVersion(mcVersion);
  if (!parsed || parsed.major !== 1 || parsed.minor < 20) {
    throw new Error(`NeoForge does not support Minecraft ${mcVersion}`);
  }

  const metadataRes = await fetch(
    "https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml",
    { signal: AbortSignal.timeout(10000) }
  );
  if (!metadataRes.ok) {
    throw new Error("Could not fetch NeoForge versions.");
  }

  const versions = extractVersionsFromMavenMetadata(await metadataRes.text());
  const prefix = `${parsed.minor}.${parsed.patch}.`;
  const candidates = versions.filter((version) => String(version).startsWith(prefix));
  const stable = candidates.filter((version) => !/(?:alpha|beta|rc)/i.test(version));
  const neoForgeVersion = stable[stable.length - 1] || candidates[candidates.length - 1];
  if (!neoForgeVersion) {
    throw new Error(`No NeoForge build found for Minecraft ${mcVersion}`);
  }

  return {
    url: `https://maven.neoforged.net/releases/net/neoforged/neoforge/${neoForgeVersion}/neoforge-${neoForgeVersion}-installer.jar`,
    neoForgeVersion,
    mcVersion,
    minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion),
    kind: "neoforge-installer"
  };
}

async function resolveForgeInstallerInfo(mcVersion) {
  const promosRes = await fetch("https://files.minecraftforge.net/maven/net/minecraftforge/forge/promotions_slim.json", {
    signal: AbortSignal.timeout(10000)
  });

  if (!promosRes.ok) {
    throw new Error("Could not fetch Forge promotions.");
  }

  const promosPayload = await promosRes.json();
  const promos = promosPayload?.promos && typeof promosPayload.promos === "object" ? promosPayload.promos : {};
  const resolvedForgeVersion = promos[`${mcVersion}-recommended`] || promos[`${mcVersion}-latest`];
  if (!resolvedForgeVersion) {
    throw new Error(`No Forge promo build found for Minecraft ${mcVersion}`);
  }

  const combo = `${mcVersion}-${resolvedForgeVersion}`;
  return {
    url: `https://maven.minecraftforge.net/net/minecraftforge/forge/${combo}/forge-${combo}-installer.jar`,
    mcVersion,
    forgeVersion: resolvedForgeVersion,
    minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion)
  };
}

async function provisionForgeServer(server, jarPath, info) {
  const serverDir = getInstanceDir(server);
  const javaExecutable = await ensureJavaAvailable(info.minJava || 17);
  const installerJar = path.join(serverDir, `forge-${info.mcVersion}-${info.forgeVersion}-installer.jar`);
  const runShPath = path.join(serverDir, "run.sh");
  const markerPath = path.join(serverDir, ".forge-provisioned");

  // Check if already provisioned with run.sh
  try {
    await fs.access(markerPath);
    await fs.access(runShPath);
    appendRuntimeLine(server.id, `Forge already provisioned, using run.sh`);
    return;
  } catch {
    // continue with provisioning
  }

  appendRuntimeLine(server.id, `Downloading Forge installer...`);
  await downloadFile(info.url, installerJar);

  // Step 1: Run installer to generate run.sh
  appendRuntimeLine(server.id, `Running Forge installer with --installServer flag...`);
  const installResult = await new Promise((resolve) => {
    const forgeEnv = {
      ...process.env,
      TERM: "dumb",
      DISPLAY: "",
      JAVA_TOOL_OPTIONS: "-Djava.awt.headless=true"
    };
    
    const args = [
      "-Djava.awt.headless=true",
      "-Dapple.awt.UIElement=true",
      "-jar",
      installerJar,
      "--installServer"
    ];
    
    const child = spawn(javaExecutable, args, {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: forgeEnv
    });
    
    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.on("close", (code) => {
      resolve({ code, output });
    });
  });

  if (installResult.code !== 0) {
    throw new Error(`Forge installer failed: ${compactText(installResult.output, 300)}`);
  }

  appendRuntimeLine(server.id, `Forge installer completed, checking for run.sh...`);

  // Verify run.sh was generated
  try {
    await fs.access(runShPath);
  } catch {
    throw new Error("Forge installer completed but run.sh was not generated");
  }

  // Make run.sh executable
  await fs.chmod(runShPath, 0o755);
  appendRuntimeLine(server.id, `Made run.sh executable`);

  // Step 2: Run run.sh to complete library setup (with timeout)
  appendRuntimeLine(server.id, `Running ./run.sh to complete Forge setup...`);
  const runResult = await new Promise((resolve) => {
    const timeoutHandle = setTimeout(() => {
      child.kill('SIGTERM');
      resolve({ code: 0, timedOut: true });
    }, 30000); // 30 second timeout

    const forgeEnv = {
      ...process.env,
      TERM: "dumb",
      DISPLAY: ""
    };

    const child = spawn("bash", [runShPath], {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: forgeEnv
    });

    let output = "";
    child.stdout.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      output += chunk.toString("utf8");
    });
    child.on("close", (code) => {
      clearTimeout(timeoutHandle);
      resolve({ code, output });
    });
  });

  // run.sh completing or timing out is normal - it just sets up libraries
  appendRuntimeLine(server.id, `Forge setup completed${runResult.timedOut ? " (timeout - normal)" : ""}`);

  // Mark as provisioned
  await fs.writeFile(markerPath, `${new Date().toISOString()}\n`, "utf8");
  appendRuntimeLine(server.id, `Forge server ready to start with ./run.sh`);
}

async function provisionQuiltServer(server, info) {
  const serverDir = getInstanceDir(server);
  const javaExecutable = await ensureJavaAvailable(info.minJava || 17);
  const installerJar = path.join(serverDir, `quilt-installer-${info.installerVersion}.jar`);
  const launcherJar = path.join(serverDir, "quilt-server-launch.jar");
  const markerPath = path.join(serverDir, ".quilt-provisioned");

  try {
    await fs.access(markerPath);
    await fs.access(launcherJar);
    return;
  } catch {}

  appendRuntimeLine(server.id, `Downloading Quilt installer ${info.installerVersion}...`);
  await downloadFile(info.url, installerJar);
  appendRuntimeLine(server.id, `Installing Quilt for Minecraft ${info.mcVersion}...`);

  const result = await new Promise((resolve) => {
    const child = spawn(javaExecutable, [
      "-Djava.awt.headless=true",
      "-jar",
      installerJar,
      "install",
      "server",
      info.mcVersion,
      "--download-server",
      "--install-dir=."
    ], {
      cwd: serverDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, JAVA_TOOL_OPTIONS: "-Djava.awt.headless=true" }
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { output += chunk.toString("utf8"); });
    child.on("close", (code) => resolve({ code, output }));
  });

  if (result.code !== 0) {
    throw new Error(`Quilt installer failed: ${compactText(result.output, 300)}`);
  }
  await fs.access(launcherJar);
  await fs.rm(installerJar, { force: true });
  await fs.writeFile(markerPath, `${new Date().toISOString()}\n`, "utf8");
  appendRuntimeLine(server.id, "Quilt server launcher is ready.");
}

async function provisionNeoForgeServer(server, info) {
  const serverDir = getInstanceDir(server);
  const javaExecutable = await ensureJavaAvailable(info.minJava || 17);
  const installerJar = path.join(serverDir, `neoforge-${info.neoForgeVersion}-installer.jar`);
  const runShPath = path.join(serverDir, "run.sh");
  const markerPath = path.join(serverDir, ".neoforge-provisioned");

  try {
    await fs.access(markerPath);
    await fs.access(runShPath);
    return;
  } catch {}

  appendRuntimeLine(server.id, `Downloading NeoForge ${info.neoForgeVersion}...`);
  await downloadFile(info.url, installerJar);
  appendRuntimeLine(server.id, "Running NeoForge server installer...");

  const result = await new Promise((resolve) => {
    const child = spawn(javaExecutable, [
      "-Djava.awt.headless=true",
      "-jar",
      installerJar,
      "--installServer"
    ], {
      cwd: serverDir,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, JAVA_TOOL_OPTIONS: "-Djava.awt.headless=true" }
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk.toString("utf8"); });
    child.stderr.on("data", (chunk) => { output += chunk.toString("utf8"); });
    child.on("close", (code) => resolve({ code, output }));
  });

  if (result.code !== 0) {
    throw new Error(`NeoForge installer failed: ${compactText(result.output, 300)}`);
  }
  await fs.access(runShPath);
  await fs.chmod(runShPath, 0o755);
  await fs.rm(installerJar, { force: true });
  await fs.writeFile(markerPath, `${new Date().toISOString()}\n`, "utf8");
  appendRuntimeLine(server.id, "NeoForge server launcher is ready.");
}

async function resolveVelocityJarUrl() {
  const projectRes = await fetch("https://fill.papermc.io/v3/projects/velocity", {
    headers: { "User-Agent": "VyronPanel/1.3.5 (https://vyronpanel.com)" },
    signal: AbortSignal.timeout(10000)
  });
  if (!projectRes.ok) {
    throw new Error("Could not fetch Velocity versions.");
  }
  const project = await projectRes.json();
  const versions = Object.values(project?.versions || {})
    .flat()
    .map((version) => String(version))
    .filter((version) => version && !/snapshot|alpha|beta|rc/i.test(version))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));

  for (const version of versions.slice(0, 6)) {
    const buildsRes = await fetch(`https://fill.papermc.io/v3/projects/velocity/versions/${encodeURIComponent(version)}/builds`, {
      headers: { "User-Agent": "VyronPanel/1.3.5 (https://vyronpanel.com)" },
      signal: AbortSignal.timeout(10000)
    });
    if (!buildsRes.ok) continue;
    const builds = await buildsRes.json();
    const candidates = Array.isArray(builds) ? [...builds].reverse() : [];
    const build = candidates.find((item) => item?.channel === "STABLE" && item?.downloads?.["server:default"]?.url)
      || candidates.find((item) => item?.downloads?.["server:default"]?.url);
    if (build) {
      return {
        url: build.downloads["server:default"].url,
        minJava: 21,
        kind: "service-proxy",
        proxyVersion: version
      };
    }
  }
  throw new Error("No stable Velocity build is currently available.");
}

async function resolveServerJarInfo(loader, mcVersion) {
  const normalizedLoader = String(loader || "").toLowerCase();

  if (normalizedLoader === "custom" || normalizedLoader === "custom-proxy") {
    return {
      url: null,
      minJava: normalizedLoader === "custom-proxy" ? 17 : 8,
      kind: "custom-upload",
      serviceProxy: normalizedLoader === "custom-proxy"
    };
  }

  if (normalizedLoader === "velocity") {
    return resolveVelocityJarUrl();
  }

  if (normalizedLoader === "bungeecord") {
    return {
      url: "https://ci.md-5.net/job/BungeeCord/lastSuccessfulBuild/artifact/bootstrap/target/BungeeCord.jar",
      minJava: 17,
      kind: "service-proxy"
    };
  }

  if (normalizedLoader === "vanilla") {
    const manifestRes = await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json", {
      signal: AbortSignal.timeout(10000)
    });
    if (!manifestRes.ok) {
      throw new Error("Could not fetch Mojang version manifest");
    }

    const manifest = await manifestRes.json();
    const selectedVersion = Array.isArray(manifest.versions)
      ? manifest.versions.find((item) => item.id === mcVersion)
      : null;

    if (!selectedVersion?.url) {
      throw new Error(`No vanilla version found for ${mcVersion}`);
    }

    const versionMetaRes = await fetch(selectedVersion.url, {
      signal: AbortSignal.timeout(10000)
    });
    if (!versionMetaRes.ok) {
      throw new Error(`Could not fetch Mojang metadata for ${mcVersion}`);
    }

    const versionMeta = await versionMetaRes.json();
    const serverDownload = versionMeta?.downloads?.server?.url;
    if (!serverDownload) {
      throw new Error(`Mojang does not provide a server jar for ${mcVersion}`);
    }

    return {
      url: serverDownload,
      minJava: getMinimumJavaVersionForMinecraftVersion(mcVersion)
    };
  }

  if (normalizedLoader === "paper") {
    return resolvePaperJarUrl(mcVersion);
  }

  if (normalizedLoader === "purpur") {
    return resolvePurpurJarUrl(mcVersion);
  }

  if (normalizedLoader === "fabric") {
    return resolveFabricJarUrl(mcVersion);
  }

  if (normalizedLoader === "quilt") {
    return resolveQuiltInstallerInfo(mcVersion);
  }

  if (normalizedLoader === "neoforge") {
    return resolveNeoForgeInstallerInfo(mcVersion);
  }

  if (normalizedLoader === "folia") {
    return resolveFoliaJarUrl(mcVersion);
  }

  if (normalizedLoader === "forge") {
    const forgeInfo = await resolveForgeInstallerInfo(mcVersion);
    return {
      ...forgeInfo,
      loader: "forge",
      kind: "forge-installer"
    };
  }

  throw new Error(`${loader} is not supported for automatic install yet. Use a Minecraft loader, Velocity, BungeeCord, or custom JAR.`);
}

async function writeServerProperties(server) {
  const filePath = path.join(getInstanceDir(server), "server.properties");

  // If the file already exists, never overwrite it — the user owns it.
  try {
    await fs.access(filePath);
    return; // file exists, leave it alone
  } catch {
    // file does not exist, create it with defaults
  }

  const props = {
    "server-port": String(server.port),
    "max-players": String(server.maxPlayers || 20),
    "motd": "Managed by Vyron",
    "online-mode": "true",
    "enable-query": "true",
    "level-name": "world",
    "difficulty": "easy",
    "gamemode": "survival",
    "max-tick-time": "60000",
    "spawn-protection": "16"
  };

  await fs.writeFile(filePath, buildPropertiesText(props), "utf8");
}

async function configureServiceProxyPort(server, jarInfo) {
  if (!new Set(["velocity", "bungeecord"]).has(server.loader)) return;
  const serverDir = getInstanceDir(server);
  const configName = server.loader === "velocity" ? "velocity.toml" : "config.yml";
  const configPath = path.join(serverDir, configName);
  let configText = "";

  try {
    configText = await fs.readFile(configPath, "utf8");
  } catch {
    const javaExecutable = await ensureJavaAvailable(Math.max(17, Number(jarInfo?.minJava || 17)));
    appendRuntimeLine(server.id, `Generating default ${configName}...`);
    const bootstrap = spawn(javaExecutable, ["-Xms256M", "-Xmx512M", "-jar", "server.jar"], {
      cwd: serverDir,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false
    });
    bootstrap.stdout.on("data", () => {});
    bootstrap.stderr.on("data", () => {});
    const exited = new Promise((resolve) => bootstrap.once("exit", resolve));
    const startedAt = Date.now();
    while (Date.now() - startedAt < 15000) {
      try {
        configText = await fs.readFile(configPath, "utf8");
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
    if (bootstrap.stdin && !bootstrap.stdin.destroyed) {
      bootstrap.stdin.write("end\n");
    }
    await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 3000))]);
    if (bootstrap.exitCode === null) bootstrap.kill("SIGTERM");
    if (!configText) throw new Error(`${server.loader} did not generate ${configName}.`);
  }

  const address = `0.0.0.0:${server.port}`;
  if (server.loader === "velocity") {
    configText = /^bind\s*=.*$/m.test(configText)
      ? configText.replace(/^bind\s*=.*$/m, `bind = "${address}"`)
      : `bind = "${address}"\n${configText}`;
  } else {
    configText = /^\s*host:\s*.*$/m.test(configText)
      ? configText.replace(/^(\s*)host:\s*.*$/m, `$1host: ${address}`)
      : configText;
  }
  await fs.writeFile(configPath, configText, "utf8");
  appendRuntimeLine(server.id, `${configName} configured for ${address}.`);
}

function splitProxyRouteAddress(value) {
  const address = String(value || "").trim().replace(/^['"]|['"]$/g, "");
  const ipv6 = address.match(/^\[([^\]]+)]:(\d{1,5})$/);
  if (ipv6) return { host: ipv6[1], port: Number(ipv6[2]) };
  const separator = address.lastIndexOf(":");
  if (separator <= 0) return { host: address, port: 25565 };
  return { host: address.slice(0, separator), port: Number(address.slice(separator + 1)) || 25565 };
}

function formatProxyRouteAddress(route) {
  const host = String(route.host || "").trim();
  return `${host.includes(":") && !host.startsWith("[") ? `[${host}]` : host}:${route.port}`;
}

function validateProxyRoutes(routes) {
  if (!Array.isArray(routes)) throw new Error("routes array is required.");
  if (routes.length > 100) throw new Error("A proxy can have at most 100 backend routes.");
  const names = new Set();
  return routes.map((route) => {
    const name = String(route?.name || "").trim();
    const originalName = String(route?.originalName || name).trim();
    const host = String(route?.host || "").trim();
    const port = Number(route?.port);
    if (!/^[A-Za-z0-9_-]{1,32}$/.test(name)) throw new Error(`Invalid route name: ${name || "empty"}.`);
    if (!host || host.length > 253 || /[\s"'\\/]/.test(host)) throw new Error(`Invalid host for ${name}.`);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port for ${name}.`);
    const key = name.toLowerCase();
    if (names.has(key)) throw new Error(`Duplicate route name: ${name}.`);
    names.add(key);
    return { name, originalName, host, port };
  });
}

function findConfigSection(lines, matcher) {
  const start = lines.findIndex((line) => matcher.test(line));
  if (start < 0) return { start: -1, end: -1 };
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\S/.test(lines[index]) && !/^\s*#/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function parseVelocityRoutes(content) {
  const lines = String(content || "").split(/\r?\n/);
  const start = lines.findIndex((line) => /^\s*\[servers]\s*$/.test(line));
  if (start < 0) return [];
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*\[[^\]]+]\s*$/.test(lines[index])) { end = index; break; }
  }
  return lines.slice(start + 1, end).flatMap((line) => {
    const match = line.match(/^\s*([A-Za-z0-9_-]+)\s*=\s*"([^"]+)"/);
    if (!match || match[1] === "try") return [];
    const address = splitProxyRouteAddress(match[2]);
    return [{ name: match[1], originalName: match[1], ...address }];
  });
}

function updateVelocityRoutes(content, routes) {
  const lines = String(content || "").split(/\r?\n/);
  let start = lines.findIndex((line) => /^\s*\[servers]\s*$/.test(line));
  if (start < 0) {
    if (lines.at(-1) !== "") lines.push("");
    lines.push("[servers]");
    start = lines.length - 1;
  }
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^\s*\[[^\]]+]\s*$/.test(lines[index])) { end = index; break; }
  }

  const incomingByOriginal = new Map(routes.map((route) => [route.originalName.toLowerCase(), route]));
  const written = new Set();
  const renameMap = new Map();
  const body = [];
  for (const line of lines.slice(start + 1, end)) {
    const match = line.match(/^(\s*)([A-Za-z0-9_-]+)\s*=\s*"([^"]+)"(\s*(?:#.*)?)$/);
    if (match && match[2] !== "try") {
      const route = incomingByOriginal.get(match[2].toLowerCase());
      if (!route) continue;
      body.push(`${match[1]}${route.name} = "${formatProxyRouteAddress(route)}"${match[4] || ""}`);
      written.add(route.name.toLowerCase());
      if (route.originalName !== route.name) renameMap.set(route.originalName, route.name);
      continue;
    }
    body.push(line);
  }
  for (let index = 0; index < body.length; index += 1) {
    for (const [oldName, newName] of renameMap) {
      body[index] = body[index].replace(new RegExp(`"${oldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`, "g"), `"${newName}"`);
    }
  }
  const additions = routes.filter((route) => !written.has(route.name.toLowerCase()))
    .map((route) => `${route.name} = "${formatProxyRouteAddress(route)}"`);
  const tryIndex = body.findIndex((line) => /^\s*try\s*=/.test(line));
  body.splice(tryIndex >= 0 ? tryIndex : body.length, 0, ...additions);
  lines.splice(start + 1, end - start - 1, ...body);
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

function parseBungeeRoutes(content) {
  const lines = String(content || "").split(/\r?\n/);
  const section = findConfigSection(lines, /^servers:\s*(?:#.*)?$/);
  if (section.start < 0) return [];
  const routes = [];
  for (let index = section.start + 1; index < section.end; index += 1) {
    const header = lines[index].match(/^ {2}([A-Za-z0-9_-]+):\s*(?:#.*)?$/);
    if (!header) continue;
    let blockEnd = section.end;
    for (let next = index + 1; next < section.end; next += 1) {
      if (/^ {2}[A-Za-z0-9_-]+:\s*(?:#.*)?$/.test(lines[next])) { blockEnd = next; break; }
    }
    const addressLine = lines.slice(index + 1, blockEnd).find((line) => /^ {4}address:\s*/.test(line));
    if (addressLine) {
      const address = splitProxyRouteAddress(addressLine.replace(/^ {4}address:\s*/, ""));
      routes.push({ name: header[1], originalName: header[1], ...address });
    }
    index = blockEnd - 1;
  }
  return routes;
}

function updateBungeeRoutes(content, routes) {
  const lines = String(content || "").split(/\r?\n/);
  let section = findConfigSection(lines, /^servers:\s*(?:#.*)?$/);
  if (section.start < 0) {
    if (lines.at(-1) !== "") lines.push("");
    lines.push("servers:");
    section = { start: lines.length - 1, end: lines.length };
  }
  const existing = new Map();
  for (let index = section.start + 1; index < section.end; index += 1) {
    const header = lines[index].match(/^ {2}([A-Za-z0-9_-]+):\s*(?:#.*)?$/);
    if (!header) continue;
    let blockEnd = section.end;
    for (let next = index + 1; next < section.end; next += 1) {
      if (/^ {2}[A-Za-z0-9_-]+:\s*(?:#.*)?$/.test(lines[next])) { blockEnd = next; break; }
    }
    existing.set(header[1].toLowerCase(), lines.slice(index, blockEnd));
    index = blockEnd - 1;
  }
  const body = [];
  for (const route of routes) {
    const block = existing.get(route.originalName.toLowerCase()) || existing.get(route.name.toLowerCase());
    if (!block) {
      body.push(`  ${route.name}:`, "    motd: '&1A Minecraft Proxy'", `    address: ${formatProxyRouteAddress(route)}`, "    restricted: false");
      continue;
    }
    const updated = [...block];
    updated[0] = `  ${route.name}:`;
    const addressIndex = updated.findIndex((line) => /^ {4}address:\s*/.test(line));
    if (addressIndex >= 0) updated[addressIndex] = `    address: ${formatProxyRouteAddress(route)}`;
    else updated.splice(1, 0, `    address: ${formatProxyRouteAddress(route)}`);
    body.push(...updated);
  }
  lines.splice(section.start + 1, section.end - section.start - 1, ...body);
  return `${lines.join("\n").replace(/\n+$/, "")}\n`;
}

async function ensureProvisioned(server) {
  const serverDir = getInstanceDir(server);
  const jarPath = getServerJarPath(server);
  
  appendRuntimeLine(server.id, `Provisioning ${server.loader} server...`);
  
  const jarInfo = await resolveServerJarInfo(server.loader, server.mcVersion);
  
  appendRuntimeLine(server.id, `Creating server directories...`);
  await fs.mkdir(serverDir, { recursive: true });

  if (!SERVICE_PROXY_LOADERS.has(server.loader)) {
    appendRuntimeLine(server.id, `Accepting EULA...`);
    await fs.writeFile(path.join(serverDir, "eula.txt"), "eula=true\n", "utf8");

    appendRuntimeLine(server.id, `Generating server.properties...`);
    await writeServerProperties(server);
  } else {
    appendRuntimeLine(server.id, `Preparing ${server.loader} proxy files...`);
  }

  try {
    appendRuntimeLine(server.id, `Checking for existing jar...`);
    
    // Installer-based loaders use their generated launcher instead of server.jar.
    if (["forge", "neoforge"].includes(server.loader) || ["forge-installer", "neoforge-installer"].includes(jarInfo.kind)) {
      const runShPath = path.join(serverDir, "run.sh");
      await fs.access(runShPath);
      appendRuntimeLine(server.id, `${server.loader} run.sh already exists, skipping provisioning.`);
      return jarInfo;
    }
    if (server.loader === "quilt" || jarInfo.kind === "quilt-installer") {
      await fs.access(path.join(serverDir, "quilt-server-launch.jar"));
      appendRuntimeLine(server.id, "Quilt launcher already exists, skipping provisioning.");
      return jarInfo;
    }
    
    // For other loaders, check for server.jar
    await fs.access(jarPath);
    await configureServiceProxyPort(server, jarInfo);
    appendRuntimeLine(server.id, `Server jar already exists, skipping download.`);
    return jarInfo;
  } catch {
    // continue with download
  }

  if (["custom", "custom-proxy"].includes(server.loader) || jarInfo.kind === "custom-upload") {
    throw new Error("Custom loader selected but server.jar is missing. Upload a custom JAR first.");
  }

  const tmpPath = `${jarPath}.tmp`;
  if (server.loader === "forge" || jarInfo.kind === "forge-installer") {
    appendRuntimeLine(server.id, `Downloading and installing Forge ${server.mcVersion}...`);
    await provisionForgeServer(server, jarPath, jarInfo);
    appendRuntimeLine(server.id, `Forge installation complete!`);
  } else if (server.loader === "neoforge" || jarInfo.kind === "neoforge-installer") {
    await provisionNeoForgeServer(server, jarInfo);
  } else if (server.loader === "quilt" || jarInfo.kind === "quilt-installer") {
    await provisionQuiltServer(server, jarInfo);
  } else {
    appendRuntimeLine(server.id, `Downloading ${server.loader} server jar...`);
    await downloadFile(jarInfo.url, tmpPath);
    appendRuntimeLine(server.id, `Download complete, finalizing...`);
    await fs.rename(tmpPath, jarPath);
  }

  await configureServiceProxyPort(server, jarInfo);
  
  appendRuntimeLine(server.id, `Server fully provisioned and ready to start!`);
  return jarInfo;
}

function resolveRamLimitGb(server) {
  const requested = Math.max(1, Math.min(64, Number(server?.ramGb || 1)));
  const systemTotalGb = Math.max(1, Math.floor(os.totalmem() / (1024 * 1024 * 1024)));
  const safeMaxGb = Math.max(1, systemTotalGb - 1);
  return Math.max(1, Math.min(requested, safeMaxGb));
}

function captureProcessLogs(serverId, stream) {
  let buffer = "";
  stream.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    for (const line of lines) {
      appendRuntimeLine(serverId, line);
      maybeMarkServerReadyFromLog(serverId, line);
    }
  });
}

async function updateServerById(id, updater) {
  const servers = await readServers();
  const server = servers.find((item) => item.id === id);
  if (!server) {
    return null;
  }
  await updater(server);
  server.updatedAt = new Date().toISOString();
  await writeServers(servers);
  return server;
}

function killProcessTree(child, signal = "SIGTERM") {
  if (!child || !child.pid) {
    return;
  }

  const pid = Number(child.pid);
  if (!Number.isInteger(pid) || pid <= 0) {
    return;
  }

  if (process.platform === "win32") {
    // /T ensures child processes are also terminated.
    spawnSync("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore" });
    return;
  }

  const pkillSig = signal === "SIGKILL" ? "-KILL" : "-TERM";
  // Kill direct children first (e.g. run.sh -> java).
  spawnSync("pkill", [pkillSig, "-P", String(pid)], { stdio: "ignore" });

  try {
    process.kill(pid, signal);
  } catch {}

  // If process was started as a group leader, this catches the whole group.
  try {
    process.kill(-pid, signal);
  } catch {}
}

async function waitForRuntimeStop(serverId, timeoutMs) {
  const started = Date.now();
  while (runtimeProcesses.has(serverId) && (Date.now() - started) < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return !runtimeProcesses.has(serverId);
}

async function startServer(server) {
  if (runtimeProcesses.has(server.id)) {
    return;
  }

  runtimeReadyAnnounced.delete(server.id);

  const jarInfo = await ensureProvisioned(server);
  const minimumJava = Math.max(8, Number(jarInfo?.minJava || 17));
  const javaExecutable = await ensureJavaAvailable(minimumJava);
  const ramLimitGb = resolveRamLimitGb(server);
  appendRuntimeLine(server.id, `Starting ${server.name} with ${server.loader} ${server.mcVersion}...`);
  appendRuntimeLine(server.id, `RAM limit: ${ramLimitGb} GB`);
  const defaultJarArgs = [
    `-Xms${ramLimitGb}G`,
    `-Xmx${ramLimitGb}G`,
    "-jar",
    "server.jar",
    ...(SERVICE_PROXY_LOADERS.has(server.loader) ? [] : ["nogui"])
  ];

  let child;
  
  // Forge and NeoForge use the generated run.sh launcher.
  if (["forge", "neoforge"].includes(server.loader)) {
    const runShPath = path.join(getInstanceDir(server), "run.sh");
    try {
      await fs.access(runShPath);
      appendRuntimeLine(server.id, `Using ${server.loader} launcher...`);
      
      // Read run.sh to extract the Java command
      const runShContent = await fs.readFile(runShPath, "utf8");
      
      // Try to extract Java command from run.sh
      // Look for: java -Dfoo=bar -jar ... or java -cp ...
      let javaArgs = null;
      
      // Pattern 1: java followed by arguments ending at -jar
      const match1 = runShContent.match(/java\s+(.+?)\s+-jar\s+([^\s]+)(.*?)$/m);
      if (match1) {
        const allArgs = `${match1[1]} -jar ${match1[2]} ${match1[3]}`.trim();
        javaArgs = allArgs.split(/\s+(?=-)/);  // Split on spaces followed by dash
        // More careful parsing for quoted arguments
        javaArgs = allArgs.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
      }
      
      if (javaArgs && javaArgs.length > 0) {
        appendRuntimeLine(server.id, `Extracted Java command with ${javaArgs.length} arguments`);
        
        // Run Java directly instead of through bash to get proper stdin/stdout
        child = spawn(javaExecutable, javaArgs, {
          cwd: getInstanceDir(server),
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false
        });
      } else {
        // Fallback: run run.sh
        appendRuntimeLine(server.id, `Running ${server.loader} run.sh script (command parsing failed, stdin may be limited)...`);
        
        child = spawn("bash", [runShPath], {
          cwd: getInstanceDir(server),
          stdio: ['pipe', 'pipe', 'pipe'],
          detached: false
        });
      }
    } catch (error) {
      // run.sh not found, fall back to default command
      appendRuntimeLine(server.id, `run.sh not found or error reading it: ${error.message}, using default command...`);
      child = spawn(
        javaExecutable,
        defaultJarArgs,
        { cwd: getInstanceDir(server), stdio: ['pipe', 'pipe', 'pipe'], shell: false }
      );
    }
  }
  else if (server.loader === "quilt") {
    child = spawn(
      javaExecutable,
      [`-Xms${ramLimitGb}G`, `-Xmx${ramLimitGb}G`, "-jar", "quilt-server-launch.jar", "nogui"],
      { cwd: getInstanceDir(server), stdio: ["pipe", "pipe", "pipe"], shell: false }
    );
  }
  // Use custom start command if provided (but block installer JAR commands)
  else if (server.customStartCmd && String(server.customStartCmd).trim() && !String(server.customStartCmd).includes("installer.jar")) {
    const customCmd = String(server.customStartCmd).trim();
    appendRuntimeLine(server.id, `Using custom start command: ${customCmd}`);
    
    // Replace placeholders in custom command
    const cmd = customCmd
      .replace(/\$JAVA/g, javaExecutable)
      .replace(/\$RAM/g, ramLimitGb)
      .replace(/\$JAR/g, "server.jar");
    
    // Execute custom command with shell
    child = spawn("sh", ["-c", cmd], {
      cwd: getInstanceDir(server),
      stdio: ['pipe', 'pipe', 'pipe']  // Enable stdin for console commands
    });
  } else {
    // Default start command
    child = spawn(
      javaExecutable,
      defaultJarArgs,
      { cwd: getInstanceDir(server), stdio: ['pipe', 'pipe', 'pipe'], shell: false }
    );
  }

  runtimeProcesses.set(server.id, child);
  captureProcessLogs(server.id, child.stdout);
  captureProcessLogs(server.id, child.stderr);

  // Add error handlers for stdin to help with debugging
  if (child.stdin) {
    child.stdin.on('error', (err) => {
      appendRuntimeLine(server.id, `[WARN] stdin error: ${err.message}`);
    });
    child.stdin.on('close', () => {
      appendRuntimeLine(server.id, `[WARN] stdin closed`);
    });
  }

  // Fallback: if server keeps running but no readiness line appears, promote to running.
  setTimeout(() => {
    if (runtimeProcesses.has(server.id)) {
      markServerRunning(server.id, "Server process is alive").catch(() => {});
    }
  }, 5000);

  child.on("exit", async (code, signal) => {
    runtimeProcesses.delete(server.id);
    runtimeReadyAnnounced.delete(server.id);
    const playerState = runtimePlayerState.get(server.id);
    if (playerState) {
      playerState.online.clear();
      for (const [name, snapshot] of playerState.history.entries()) {
        playerState.history.set(name, {
          ...snapshot,
          online: false
        });
      }
    }
    const expectedStop = runtimeStopFlags.has(server.id);
    runtimeStopFlags.delete(server.id);
    appendRuntimeLine(server.id, `Process exited (code=${code ?? "null"}, signal=${signal ?? "none"}).`);

    await updateServerById(server.id, async (entry) => {
      entry.status = "stopped";
      entry.badge = mapStatusToBadge("stopped");
      entry.playersOnline = 0;
      entry.lastActionAt = new Date().toISOString();
      appendTimeline(entry, expectedStop ? "Server stopped" : "Server process exited unexpectedly");
      await dispatchWebhooks(entry, expectedStop ? "stop" : "crash");
    });
  });
}

async function stopServer(server, force = false) {
  const child = runtimeProcesses.get(server.id);
  if (!child) {
    return;
  }

  runtimeStopFlags.add(server.id);
  
  if (force) {
    killProcessTree(child, "SIGKILL");
    await waitForRuntimeStop(server.id, 5000);
    return;
  }

  // Send graceful stop via stdin first.
  try {
    if (child.stdin && !child.stdin.destroyed) {
      const stopCommand = new Set(["velocity", "bungeecord"]).has(server.loader) ? "end" : "stop";
      child.stdin.write(`${stopCommand}\n`);
      appendRuntimeLine(server.id, `${stopCommand} command sent via stdin`);

      const stopped = await waitForRuntimeStop(server.id, 12000);
      if (stopped) {
        return;
      }
      appendRuntimeLine(server.id, "stdin stop timed out, escalating to SIGTERM...");
    } else {
      appendRuntimeLine(server.id, "stdin unavailable, escalating directly to process termination...");
    }
  } catch (error) {
    appendRuntimeLine(server.id, `[ERROR] Error writing to stdin: ${error.message}`);
  }

  // Escalation path: TERM first, then KILL if needed.
  appendRuntimeLine(server.id, "Escalating stop: SIGTERM process tree");
  killProcessTree(child, "SIGTERM");
  if (await waitForRuntimeStop(server.id, 4000)) {
    return;
  }

  appendRuntimeLine(server.id, "Escalating stop: SIGKILL process tree");
  killProcessTree(child, "SIGKILL");
  if (await waitForRuntimeStop(server.id, 6000)) {
    return;
  }

  appendRuntimeLine(server.id, "[ERROR] Process still alive after SIGKILL escalation");
}

function withRuntime(server) {
  const running = runtimeProcesses.has(server.id);
  const status = getEffectiveStatus(server, running);
  const playerState = runtimePlayerState.get(server.id);
  return {
    ...server,
    status,
    badge: mapStatusToBadge(status),
    running,
    playersOnline: playerState ? playerState.online.size : server.playersOnline,
    consoleTail: getRuntimeLines(server.id, 80)
  };
}

function normalizeRuntimeFields(server) {
  const fallbackVersion = String(server.version || "").trim();
  let mcVersion = String(server.mcVersion || "").trim();
  let loader = String(server.loader || "").trim().toLowerCase();

  if ((!mcVersion || !loader) && fallbackVersion) {
    const parts = fallbackVersion.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      mcVersion = mcVersion || parts[0];
      loader = loader || parts.slice(1).join(" ").toLowerCase();
    }
  }

  if (!mcVersion) {
    mcVersion = "1.21.11";
  }

  if (!loader) {
    loader = "paper";
  }

  return {
    ...server,
    mcVersion,
    loader,
    version: `${mcVersion} ${loader}`
  };
}

async function readServers() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map(({ location, ...server }) => {
          const normalized = normalizeRuntimeFields(server);
          return {
            ...normalized,
          autoStart: parseBooleanInput(server.autoStart, true),
          addons: Array.isArray(server.addons) ? server.addons : [],
          schedules: Array.isArray(server.schedules) ? server.schedules : [],
          webhooks: Array.isArray(server.webhooks) ? server.webhooks : [],
          timeline: Array.isArray(server.timeline) ? server.timeline : []
          };
        })
      : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(DATA_FILE, "[]\n", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeServers(servers) {
  await fs.writeFile(DATA_FILE, `${JSON.stringify(servers, null, 2)}\n`, "utf8");
}

async function readAgents() {
  try {
    const raw = await fs.readFile(AGENTS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(AGENTS_FILE, "[]\n", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeAgents(agents) {
  await fs.writeFile(AGENTS_FILE, `${JSON.stringify(agents, null, 2)}\n`, "utf8");
}

async function writeJsonAtomic(filePath, value) {
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await fs.rename(temporaryPath, filePath);
  } finally {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
  }
}

async function readAuth() {
  try {
    const raw = await fs.readFile(AUTH_FILE, "utf8");
    if (!raw.trim()) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeAuth(auth) {
  await writeJsonAtomic(AUTH_FILE, auth);
}

async function readSessions() {
  try {
    const raw = await fs.readFile(SESSIONS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(SESSIONS_FILE, "[]\n", "utf8");
      return [];
    }
    throw error;
  }
}

async function writeSessions(sessions) {
  await writeJsonAtomic(SESSIONS_FILE, sessions);
}

function parseCookies(headerValue) {
  if (!headerValue) {
    return {};
  }

  return headerValue.split(";").reduce((acc, part) => {
    const idx = part.indexOf("=");
    if (idx === -1) {
      return acc;
    }
    const key = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    acc[key] = value;
    return acc;
  }, {});
}

function makeCookie(name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`
  ];
  return parts.join("; ");
}

function clearCookie(name) {
  return `${name}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function constantTimeEquals(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

async function resolveSession(req) {
  const auth = await readAuth();
  if (!auth) {
    return { auth: null, session: null, sessions: [] };
  }

  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE];
  if (!token) {
    return { auth, session: null, sessions: await readSessions() };
  }

  const sessions = await readSessions();
  const now = Date.now();
  const validSessions = sessions.filter((item) => Number(item.expiresAt) > now);
  if (validSessions.length !== sessions.length) {
    await writeSessions(validSessions);
  }

  const session = validSessions.find((item) => item.token === token && item.username === auth.username) || null;
  return { auth, session, sessions: validSessions };
}

app.use("/api", async (req, res, next) => {
  if (req.path.startsWith("/auth")) {
    return next();
  }

  if (req.path === "/agent/ping") {
    return next();
  }

  const { auth, session } = await resolveSession(req);

  if (!auth) {
    return res.status(401).json({ error: "No admin user configured yet.", requiresSetup: true });
  }

  if (!session) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  req.authUser = auth.username;
  return next();
});

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendTimeline(server, message) {
  const entry = `${new Date().toISOString()} - ${message}`;
  server.timeline = Array.isArray(server.timeline) ? server.timeline : [];
  server.timeline.unshift(entry);
  server.timeline = server.timeline.slice(0, 80);
}

async function dispatchWebhooks(server, eventName) {
  const hooks = Array.isArray(server.webhooks)
    ? server.webhooks.filter((item) => item.event === eventName)
    : [];

  if (!hooks.length) {
    return;
  }

  const payload = {
    serverId: server.id,
    serverName: server.name,
    event: eventName,
    status: server.status,
    occurredAt: new Date().toISOString()
  };

  const tasks = hooks.map(async (hook) => {
    try {
      const response = await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000)
      });

      appendTimeline(server, `Webhook ${hook.name} delivered (${response.status})`);
    } catch {
      appendTimeline(server, `Webhook ${hook.name} failed to deliver`);
    }
  });

  await Promise.all(tasks);
}

function mapStatusToBadge(status) {
  switch (status) {
    case "running":
      return "online";
    case "stopped":
      return "offline";
    case "starting":
    case "stopping":
    case "restarting":
      return "transition";
    default:
      return "offline";
  }
}

function getEffectiveStatus(server, running) {
  const current = String(server?.status || "stopped").toLowerCase();
  if (running && current === "stopped") {
    return "running";
  }

  if (!running && current === "running") {
    return "stopped";
  }

  return current;
}

function parseBooleanInput(value, defaultValue = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
      return true;
    }
    if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
      return false;
    }
  }
  return defaultValue;
}

function parseMinecraftVersion(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d+)\.(\d+)(?:\.(\d+))?$/);
  if (!match) {
    return null;
  }

  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3] || 0);
  if (!Number.isInteger(major) || !Number.isInteger(minor) || !Number.isInteger(patch)) {
    return null;
  }

  return { major, minor, patch, normalized: `${major}.${minor}.${patch}` };
}

function compareMinecraftVersions(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}

function isSupportedMinecraftVersion(value) {
  const parsed = parseMinecraftVersion(value);
  if (!parsed) {
    return false;
  }

  const min = { major: 1, minor: 12, patch: 0 };
  const max = { major: 1, minor: 21, patch: 11 };

  return compareMinecraftVersions(parsed, min) >= 0 && compareMinecraftVersions(parsed, max) <= 0;
}

app.get("/api/auth/status", async (req, res) => {
  const { auth, session } = await resolveSession(req);
  if (!auth) {
    return res.json({ requiresSetup: true, authenticated: false });
  }

  return res.json({
    requiresSetup: false,
    authenticated: Boolean(session),
    username: session ? auth.username : null
  });
});

app.get("/api/system/java-status", async (_req, res) => {
  return res.json(getJavaStatusPayload());
});

app.get("/api/system/version", async (_req, res) => {
  const currentVersion = readPanelVersion();
  let latestVersion = currentVersion;
  let checkError = "";
  let source = "local";

  try {
    const remote = await fetchLatestPanelVersion();
    latestVersion = remote.latestVersion;
    source = remote.source;
  } catch (error) {
    checkError = error?.message || "Could not check latest version.";
  }

  const outdated = compareSemver(currentVersion, latestVersion) < 0;
  return res.json({
    currentVersion,
    latestVersion,
    outdated,
    source,
    checkError,
    update: {
      running: panelUpdateState.running,
      lastStartedAt: panelUpdateState.lastStartedAt,
      lastFinishedAt: panelUpdateState.lastFinishedAt,
      lastExitCode: panelUpdateState.lastExitCode,
      lastError: panelUpdateState.lastError
    }
  });
});

app.post("/api/system/update", async (_req, res) => {
  try {
    const result = triggerPanelUpdate();
    return res.json({
      ok: true,
      message: "Update started.",
      startedAt: result.startedAt,
      installerUrl: result.installerUrl
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: error?.message || "Failed to start updater."
    });
  }
});

app.post("/api/system/java-install", async (_req, res) => {
  try {
    const executable = await ensureJavaAvailable();
    return res.json({
      ok: true,
      installed: true,
      executable
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Java installation failed.",
      ...getJavaStatusPayload()
    });
  }
});

app.get("/api/ai/status", async (req, res) => {
  return res.status(410).json({
    configured: false,
    mode: "disabled",
    error: "AI is disabled for this panel."
  });
});

app.put("/api/ai/permissions", async (req, res) => {
  return res.status(410).json({
    ok: false,
    error: "AI is disabled for this panel."
  });
});

app.post("/api/ai/chat", async (req, res) => {
  return res.status(410).json({
    error: "AI is disabled for this panel.",
    actionResults: [],
    requiresConfirmation: false,
    pendingAction: null,
    pendingActions: [],
    pendingQuestion: null
  });
});

app.post("/api/auth/setup", async (req, res) => {
  const existing = await readAuth();
  if (existing) {
    return res.status(409).json({ error: "Admin account already exists. Please log in." });
  }

  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (username.length < 3) {
    return res.status(400).json({ error: "Username must be at least 3 characters." });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }

  const now = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);

  await writeAuth({
    username,
    salt,
    passwordHash,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  });

  const token = createSessionToken();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  await writeSessions([{ token, username, createdAt: now, expiresAt }]);

  res.setHeader("Set-Cookie", makeCookie(SESSION_COOKIE, token, SESSION_MAX_AGE_SECONDS));
  return res.status(201).json({ username });
});

app.post("/api/auth/login", async (req, res) => {
  const auth = await readAuth();
  if (!auth) {
    return res.status(400).json({ error: "No admin user configured yet.", requiresSetup: true });
  }

  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");

  if (!constantTimeEquals(username, auth.username)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const inputHash = hashPassword(password, auth.salt);
  if (!constantTimeEquals(inputHash, auth.passwordHash)) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const sessions = await readSessions();
  const now = new Date().toISOString();
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const token = createSessionToken();

  const nextSessions = sessions
    .filter((item) => item.username !== auth.username && Number(item.expiresAt) > Date.now())
    .concat([{ token, username: auth.username, createdAt: now, expiresAt }]);

  await writeSessions(nextSessions);
  auth.lastLoginAt = now;
  auth.updatedAt = now;
  await writeAuth(auth);

  res.setHeader("Set-Cookie", makeCookie(SESSION_COOKIE, token, SESSION_MAX_AGE_SECONDS));
  return res.json({ username: auth.username });
});

app.post("/api/auth/logout", async (req, res) => {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[SESSION_COOKIE];

  if (token) {
    const sessions = await readSessions();
    const nextSessions = sessions.filter((item) => item.token !== token);
    if (nextSessions.length !== sessions.length) {
      await writeSessions(nextSessions);
    }
  }

  res.setHeader("Set-Cookie", clearCookie(SESSION_COOKIE));
  return res.json({ ok: true });
});

app.post("/api/account/link", async (req, res) => {
  const login = String(req.body?.login || "").trim();
  const password = String(req.body?.password || "");
  const panelUrl = String(req.body?.panel?.url || "").trim();
  if (!login || !password || !panelUrl) {
    return res.status(400).json({ error: "Login, password and panel URL are required." });
  }

  try {
    const response = await fetch(`${UPDATE_API_BASE}/account/panels/link-login`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        login,
        password,
        panel: {
          name: String(req.body?.panel?.name || "Vyron Panel").slice(0, 80),
          url: panelUrl
        }
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) return res.status(response.status).json(payload);

    const sessionResponse = await fetch(`${UPDATE_API_BASE}/account/login`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ login, password })
    });
    const sessionPayload = await sessionResponse.json().catch(() => ({}));
    if (!sessionResponse.ok) return res.status(sessionResponse.status).json(sessionPayload);
    return res.json({ ...payload, token: sessionPayload.token, account: sessionPayload.account || payload.account });
  } catch (error) {
    return res.status(error?.name === "TimeoutError" ? 504 : 502).json({
      error: error.message || "Could not reach the Vyron account service."
    });
  }
});

app.get("/api/account/me", async (req, res) => {
  const authorization = String(req.headers.authorization || "").trim();
  if (!authorization.startsWith("Bearer ")) return res.status(401).json({ error: "Vyron account login required." });
  try {
    const response = await fetch(`${UPDATE_API_BASE}/account/me`, {
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: authorization, Accept: "application/json" }
    });
    const payload = await response.json().catch(() => ({}));
    return res.status(response.status).json(payload);
  } catch (error) {
    return res.status(error?.name === "TimeoutError" ? 504 : 502).json({ error: error.message || "Could not restore the Vyron account session." });
  }
});

app.post("/api/account/logout", async (req, res) => {
  const authorization = String(req.headers.authorization || "").trim();
  if (!authorization.startsWith("Bearer ")) return res.json({ ok: true });
  try {
    const response = await fetch(`${UPDATE_API_BASE}/account/logout`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
      headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
      body: "{}"
    });
    const payload = await response.json().catch(() => ({ ok: response.ok }));
    return res.status(response.status).json(payload);
  } catch (error) {
    return res.status(error?.name === "TimeoutError" ? 504 : 502).json({ error: error.message || "Could not end the Vyron account session." });
  }
});

app.get("/api/servers", async (_req, res) => {
  const servers = await readServers();
  res.json({ servers: servers.map(withRuntime) });
});

app.post("/api/servers", async (req, res) => {
  const { name, loader, mcVersion, port, ramGb, autoStart } = req.body || {};

  if (!name || !loader || !mcVersion || !port || !ramGb) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const numericPort = Number(port);
  const numericRam = Number(ramGb);

  if (!Number.isInteger(numericPort) || numericPort < 1 || numericPort > 65535) {
    return res.status(400).json({ error: "Port must be a valid number from 1 to 65535." });
  }

  if (!Number.isInteger(numericRam) || numericRam < 1 || numericRam > 64) {
    return res.status(400).json({ error: "RAM must be an integer between 1 and 64 GB." });
  }

  const normalizedLoader = String(loader).trim().toLowerCase();
  const isServiceProxy = SERVICE_PROXY_LOADERS.has(normalizedLoader);
  if (!isServiceProxy && !isSupportedMinecraftVersion(mcVersion)) {
    return res.status(400).json({ error: "Minecraft version must be between 1.12 and 1.21.11." });
  }
  if (isServiceProxy && String(mcVersion).trim().toLowerCase() !== "latest") {
    return res.status(400).json({ error: "Proxy version must use the latest supported release." });
  }

  if (!SUPPORTED_LOADERS.has(normalizedLoader)) {
    return res.status(400).json({ error: "Select a supported Minecraft loader or server proxy." });
  }

  const now = new Date().toISOString();
  const newServer = {
    id: createId(),
    name: String(name).trim(),
    loader: normalizedLoader,
    mcVersion: String(mcVersion).trim(),
    version: `${String(mcVersion).trim()} ${normalizedLoader}`,
    port: numericPort,
    ramGb: numericRam,
    autoStart: parseBooleanInput(autoStart, true),
    status: "stopped",
    badge: mapStatusToBadge("stopped"),
    playersOnline: 0,
    maxPlayers: 20,
    addons: [],
    schedules: [],
    webhooks: [],
    timeline: [],
    lastActionAt: now,
    createdAt: now,
    updatedAt: now
  };

  appendTimeline(newServer, "Server created from panel");
  appendTimeline(newServer, "Provisioning will happen on first start");

  const servers = await readServers();
  servers.unshift(newServer);
  await writeServers(servers);

  res.status(201).json({ server: newServer });
});

app.post("/api/servers/import", importUpload.single("archive"), async (req, res) => {
  const uploadPath = req.file?.path;
  if (!uploadPath) return res.status(400).json({ error: "Choose a Vyron server ZIP to import." });
  let targetDir = "";
  try {
    const manifest = await readExportManifest(uploadPath);
    const servers = await readServers();
    const source = manifest?.server || {};
    const now = new Date().toISOString();
    const server = {
      ...source,
      id: createId(),
      name: String(source.name || req.file.originalname.replace(/\.zip$/i, "") || "Imported Server").slice(0, 80),
      port: findAvailablePort(servers, source.port),
      ramGb: Number.isInteger(Number(source.ramGb)) && Number(source.ramGb) >= 1 && Number(source.ramGb) <= 64 ? Number(source.ramGb) : 4,
      maxPlayers: Number.isInteger(Number(source.maxPlayers)) && Number(source.maxPlayers) >= 1 ? Number(source.maxPlayers) : 20,
      autoStart: false,
      addons: Array.isArray(source.addons) ? source.addons : [],
      schedules: Array.isArray(source.schedules) ? source.schedules : [],
      webhooks: Array.isArray(source.webhooks) ? source.webhooks : [],
      status: "stopped",
      badge: mapStatusToBadge("stopped"),
      playersOnline: 0,
      timeline: [],
      createdAt: now,
      updatedAt: now,
      lastActionAt: now
    };
    const normalized = normalizeRuntimeFields(server);
    server.loader = SUPPORTED_LOADERS.has(normalized.loader) ? normalized.loader : "custom";
    server.mcVersion = SERVICE_PROXY_LOADERS.has(server.loader)
      ? "latest"
      : (isSupportedMinecraftVersion(normalized.mcVersion) ? normalized.mcVersion : "1.21.11");
    server.version = `${server.mcVersion} ${server.loader}`;
    targetDir = getInstanceDir(server);
    await extractZipSafely(uploadPath, targetDir);
    appendTimeline(server, "Server imported from ZIP");
    servers.unshift(server);
    await writeServers(servers);
    return res.status(201).json({ server: withRuntime(server) });
  } catch (error) {
    if (targetDir) await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {});
    return res.status(400).json({ error: error.message || "Server import failed." });
  } finally {
    await fs.rm(uploadPath, { force: true }).catch(() => {});
  }
});

app.post("/api/servers/:id/duplicate", async (req, res) => {
  const { servers, server: source } = await findServerById(req.params.id);
  if (!source) return res.status(404).json({ error: "Server not found." });
  if (runtimeProcesses.has(source.id)) return res.status(409).json({ error: "Stop the server before duplicating it." });
  const now = new Date().toISOString();
  const duplicate = {
    ...JSON.parse(JSON.stringify(source)),
    id: createId(),
    name: `${source.name} Copy`.slice(0, 80),
    port: findAvailablePort(servers, Number(source.port) + 1),
    status: "stopped",
    badge: mapStatusToBadge("stopped"),
    playersOnline: 0,
    timeline: [],
    createdAt: now,
    updatedAt: now,
    lastActionAt: now
  };
  const targetDir = getInstanceDir(duplicate);
  try {
    await fs.mkdir(getInstanceDir(source), { recursive: true });
    await fs.cp(getInstanceDir(source), targetDir, {
      recursive: true,
      errorOnExist: true,
      filter: (entry) => !path.resolve(entry).startsWith(path.resolve(getBackupsDir(source)))
    });
    appendTimeline(duplicate, `Duplicated from ${source.name}`);
    servers.unshift(duplicate);
    await writeServers(servers);
    return res.status(201).json({ server: withRuntime(duplicate) });
  } catch (error) {
    await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {});
    return res.status(400).json({ error: error.message || "Server duplication failed." });
  }
});

app.get("/api/servers/:id/export", async (req, res) => {
  const { server } = await findServerById(req.params.id);
  if (!server) return res.status(404).json({ error: "Server not found." });
  if (runtimeProcesses.has(server.id)) return res.status(409).json({ error: "Stop the server before exporting it." });
  const instanceDir = getInstanceDir(server);
  await fs.mkdir(instanceDir, { recursive: true });
  res.attachment(`${sanitizeFileName(server.name) || "vyron-server"}.zip`);
  try {
    await createServerArchive(instanceDir, res, {
      format: "vyron-server-export",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      server
    });
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message || "Server export failed." });
    else res.destroy(error);
  }
});

app.patch("/api/servers/:id", async (req, res) => {
  const { id } = req.params;
  const allowedFields = ["name", "loader", "mcVersion", "port", "ramGb", "maxPlayers", "autoStart", "customStartCmd"];

  const servers = await readServers();
  const server = servers.find((item) => item.id === id);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  for (const [key, value] of Object.entries(req.body || {})) {
    if (!allowedFields.includes(key)) {
      continue;
    }

    if (key === "port") {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
        return res.status(400).json({ error: "Port must be a valid number from 1 to 65535." });
      }
      server.port = parsed;
      continue;
    }

    if (key === "ramGb") {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 64) {
        return res.status(400).json({ error: "RAM must be an integer between 1 and 64 GB." });
      }
      server.ramGb = parsed;
      continue;
    }

    if (key === "maxPlayers") {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 500) {
        return res.status(400).json({ error: "Max players must be an integer between 1 and 500." });
      }
      server.maxPlayers = parsed;
      continue;
    }

    if (key === "autoStart") {
      server.autoStart = parseBooleanInput(value, server.autoStart !== false);
      continue;
    }

    if (key === "customStartCmd") {
      const cmd = String(value || "").trim();
      if (cmd.length > 500) {
        return res.status(400).json({ error: "Custom start command must be 500 characters or less." });
      }
      // Reject installer JAR commands (they should never be run as server start commands)
      if (cmd && cmd.includes("installer.jar")) {
        return res.status(400).json({ error: "Cannot use Forge installer JAR as start command. Use the default command or specify a valid server JAR." });
      }
      server.customStartCmd = cmd || undefined;
      continue;
    }

    if (key === "loader") {
      const parsedLoader = String(value).trim().toLowerCase();
      if (!SUPPORTED_LOADERS.has(parsedLoader)) {
        return res.status(400).json({ error: "Select a supported Minecraft loader or server proxy." });
      }
      server.loader = parsedLoader;
      continue;
    }

    if (key === "mcVersion") {
      const parsedVersion = String(value).trim();
      if (SERVICE_PROXY_LOADERS.has(server.loader) && parsedVersion.toLowerCase() !== "latest") {
        return res.status(400).json({ error: "Proxy version must use the latest supported release." });
      }
      if (!SERVICE_PROXY_LOADERS.has(server.loader) && !isSupportedMinecraftVersion(parsedVersion)) {
        return res.status(400).json({ error: "Minecraft version must be between 1.12 and 1.21.11." });
      }
      server.mcVersion = parsedVersion;
      continue;
    }

    server[key] = String(value).trim();
  }

  const normalized = normalizeRuntimeFields(server);
  server.loader = normalized.loader;
  server.mcVersion = normalized.mcVersion;
  server.version = normalized.version;

  server.updatedAt = new Date().toISOString();

  await writeServers(servers);
  res.json({ server });
});

app.delete("/api/servers/:id", async (req, res) => {
  const { id } = req.params;
  const servers = await readServers();
  const index = servers.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Server not found." });
  }

  const [deleted] = servers.splice(index, 1);
  runtimeStopFlags.add(deleted.id);
  await stopServer(deleted, true);
  await fs.rm(getInstanceDir(deleted), { recursive: true, force: true });
  await writeServers(servers);
  res.json({ deleted });
});

app.post("/api/servers/:id/action", async (req, res) => {
  const { id } = req.params;
  const action = String(req.body?.action || "").toLowerCase();
  const allowedActions = ["start", "stop", "restart", "crash"];

  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: "Invalid action." });
  }

  const servers = await readServers();
  const server = servers.find((item) => item.id === id);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    if (action === "start") {
      server.status = "starting";
      server.badge = mapStatusToBadge("starting");
      server.playersOnline = 0;
      server.lastActionAt = new Date().toISOString();
      server.updatedAt = new Date().toISOString();
      appendTimeline(server, "Lifecycle action executed: start");
      await dispatchWebhooks(server, "start");
      await writeServers(servers);

      startServer(server).catch(async (error) => {
        appendRuntimeLine(server.id, `Start failed: ${error.message}`);
        await updateServerById(server.id, async (entry) => {
          entry.status = "stopped";
          entry.badge = mapStatusToBadge("stopped");
          entry.lastActionAt = new Date().toISOString();
          appendTimeline(entry, "Lifecycle action failed: start");
        });
      });

      return res.json({ server: withRuntime(server) });
    }

    if (action === "stop") {
      if (!runtimeProcesses.has(server.id)) {
        server.status = "stopped";
        server.badge = mapStatusToBadge("stopped");
        server.playersOnline = 0;
        server.lastActionAt = new Date().toISOString();
        server.updatedAt = new Date().toISOString();
        appendTimeline(server, "Stop requested while server already offline");
        await writeServers(servers);
        return res.json({ server: withRuntime(server) });
      }

      server.status = "stopping";
      server.badge = mapStatusToBadge("stopping");
      server.playersOnline = 0;
      server.lastActionAt = new Date().toISOString();
      server.updatedAt = new Date().toISOString();
      appendTimeline(server, "Lifecycle action executed: stop");
      await dispatchWebhooks(server, "stop");
      await writeServers(servers);

      await stopServer(server);
      return res.json({ server: withRuntime(server) });
    }

    if (action === "restart") {
      server.status = "restarting";
      server.badge = mapStatusToBadge("restarting");
      server.playersOnline = 0;
      server.lastActionAt = new Date().toISOString();
      server.updatedAt = new Date().toISOString();
      appendTimeline(server, "Lifecycle action executed: restart");
      await dispatchWebhooks(server, "restart");
      await writeServers(servers);

      await stopServer(server);
      setTimeout(() => {
        readServers()
          .then((latest) => latest.find((item) => item.id === server.id))
          .then((latestServer) => {
            if (!latestServer) {
              return;
            }
            return startServer(latestServer);
          })
          .catch((error) => appendRuntimeLine(server.id, `Restart failed: ${error.message}`));
      }, 1800);
      return res.json({ server: withRuntime(server) });
    }

    if (action === "crash") {
      server.status = "stopping";
      server.badge = mapStatusToBadge("stopping");
      server.playersOnline = 0;
      server.lastActionAt = new Date().toISOString();
      server.updatedAt = new Date().toISOString();
      appendTimeline(server, "Lifecycle action executed: crash");
      await dispatchWebhooks(server, "crash");
      await writeServers(servers);

      await stopServer(server, true);
      return res.json({ server: withRuntime(server) });
    }
  } catch (error) {
    server.status = "stopped";
    server.badge = mapStatusToBadge("stopped");
    server.updatedAt = new Date().toISOString();
    appendTimeline(server, `Lifecycle action failed: ${action}`);
    await writeServers(servers);
    return res.status(400).json({ error: error.message || "Action failed." });
  }

  return res.json({ server: withRuntime(server) });
});

app.get("/api/servers/:id/console", async (req, res) => {
  const { id } = req.params;
  const limit = Math.max(20, Math.min(400, Number(req.query.limit || 120)));
  const servers = await readServers();
  const server = servers.find((item) => item.id === id);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const running = runtimeProcesses.has(id);
  const status = getEffectiveStatus(server, running);

  return res.json({
    running,
    status,
    badge: mapStatusToBadge(status),
    lines: getRuntimeLines(id, limit)
  });
});

app.get("/api/servers/:id/console/stream", async (req, res) => {
  const { server } = await findServerById(req.params.id);
  if (!server) return res.status(404).json({ error: "Server not found." });
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: snapshot\ndata: ${JSON.stringify({ lines: getRuntimeLines(server.id, 160) })}\n\n`);
  const subscribers = runtimeConsoleSubscribers.get(server.id) || new Set();
  subscribers.add(res);
  runtimeConsoleSubscribers.set(server.id, subscribers);
  const heartbeat = setInterval(() => res.write(": keepalive\n\n"), 20000);
  req.on("close", () => {
    clearInterval(heartbeat);
    subscribers.delete(res);
    if (!subscribers.size) runtimeConsoleSubscribers.delete(server.id);
  });
});

app.post("/api/servers/:id/operators", async (req, res) => {
  const { id } = req.params;
  const username = String(req.body?.username || "").trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(username)) {
    return res.status(400).json({ error: "Use a valid Minecraft username." });
  }

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }
  if (runtimeProcesses.has(id)) {
    return res.status(409).json({ error: "Stop the server before editing ops.json." });
  }

  try {
    const profile = await resolveMinecraftProfile(username);
    const instanceDir = getInstanceDir(server);
    const opsPath = path.join(instanceDir, "ops.json");
    await fs.mkdir(instanceDir, { recursive: true });
    const current = await readJsonFileSafe(opsPath, []);
    const operators = Array.isArray(current) ? current : [];
    const entry = {
      uuid: profile.uuid,
      name: profile.name,
      level: 4,
      bypassesPlayerLimit: false
    };
    const existingIndex = operators.findIndex((item) => {
      return normalizeUuid(item?.uuid) === normalizeUuid(profile.uuid)
        || String(item?.name || "").toLowerCase() === profile.name.toLowerCase();
    });
    if (existingIndex >= 0) {
      operators[existingIndex] = entry;
    } else {
      operators.push(entry);
    }
    await fs.writeFile(opsPath, `${JSON.stringify(operators, null, 2)}\n`, "utf8");
    appendRuntimeLine(id, `Added ${profile.name} to ops.json.`);
    return res.json({ ok: true, operator: entry, method: "ops.json" });
  } catch (error) {
    return res.status(error?.name === "TimeoutError" ? 504 : 400).json({
      error: error.message || "Failed to update ops.json."
    });
  }
});

app.post("/api/servers/:id/console/command", async (req, res) => {
  const { id } = req.params;
  const command = String(req.body?.command || "").trim();
  if (!command) {
    return res.status(400).json({ error: "Command is required." });
  }

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const child = runtimeProcesses.get(id);
  if (!child) {
    return res.status(400).json({ error: "Server is not running." });
  }

  try {
    const result = sendRuntimeCommand(id, child, command);
    return res.json({ ok: true, method: "stdin", queued: !result.flushed });
  } catch (error) {
    const stdinReady = canWriteToProcessStdin(child);
    const detail = `command dispatch failed: ${error.message || "unknown error"} | stdinReady=${stdinReady}`;
    appendRuntimeLine(id, `[ERROR] ${detail}`);
    return res.status(error.statusCode || 500).json({ error: detail });
  }
});

app.get("/api/servers/:id/players", async (req, res) => {
  const { id } = req.params;
  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const instanceDir = getInstanceDir(server);
  const [userCache, opsData, bansData] = await Promise.all([
    readJsonFileSafe(path.join(instanceDir, "usercache.json"), []),
    readJsonFileSafe(path.join(instanceDir, "ops.json"), []),
    readJsonFileSafe(path.join(instanceDir, "banned-players.json"), [])
  ]);

  const runtimeState = getOrCreateRuntimePlayerState(id);
  const playersByName = new Map();
  const knownNames = [];

  if (Array.isArray(userCache)) {
    for (const item of userCache) {
      const name = String(item?.name || "").trim();
      if (!name) {
        continue;
      }
      knownNames.push(name);
      playersByName.set(name, {
        name,
        online: runtimeState.online.has(name),
        lastSeenAt: item?.expiresOn || null,
        seenCount: 0,
        isOp: false,
        isBanned: false,
        pingMs: null
      });
    }
  }

  for (const [rawName, snapshot] of runtimeState.history.entries()) {
    const name = canonicalizePlayerName(rawName, knownNames);
    if (!name) {
      continue;
    }

    const existing = playersByName.get(name) || {
      name,
      online: false,
      lastSeenAt: null,
      seenCount: 0,
      isOp: false,
      isBanned: false,
      pingMs: null
    };

    playersByName.set(name, {
      ...existing,
      online: runtimeState.online.has(rawName) || runtimeState.online.has(name) || Boolean(snapshot.online),
      lastSeenAt: snapshot.lastSeenAt || existing.lastSeenAt,
      seenCount: snapshot.seenCount || existing.seenCount,
      pingMs: Number.isFinite(snapshot.pingMs) ? snapshot.pingMs : existing.pingMs
    });
  }

  const opSet = new Set(
    Array.isArray(opsData)
      ? opsData.map((item) => String(item?.name || "").trim()).filter(Boolean)
      : []
  );
  const banSet = new Set(
    Array.isArray(bansData)
      ? bansData.map((item) => String(item?.name || "").trim()).filter(Boolean)
      : []
  );

  for (const [name, item] of playersByName.entries()) {
    playersByName.set(name, {
      ...item,
      isOp: opSet.has(name),
      isBanned: banSet.has(name)
    });
  }

  const players = Array.from(playersByName.values()).sort((a, b) => {
    if (a.online !== b.online) {
      return a.online ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return res.json({
    players,
    onlineCount: players.filter((item) => item.online).length
  });
});

app.get("/api/servers/:id/players/:playerName/detail", async (req, res) => {
  const { id } = req.params;
  const playerName = String(req.params.playerName || "").trim();

  if (!playerName) {
    return res.status(400).json({ error: "Player name is required." });
  }

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const instanceDir = getInstanceDir(server);
  const [userCache, opsData, bansData] = await Promise.all([
    readJsonFileSafe(path.join(instanceDir, "usercache.json"), []),
    readJsonFileSafe(path.join(instanceDir, "ops.json"), []),
    readJsonFileSafe(path.join(instanceDir, "banned-players.json"), [])
  ]);

  const runtimeState = getOrCreateRuntimePlayerState(id);
  const userMatch = (Array.isArray(userCache) ? userCache : []).find(
    (item) => {
      const knownName = String(item?.name || "").trim();
      if (!knownName) {
        return false;
      }
      const canonical = canonicalizePlayerName(playerName, [knownName]);
      return knownName.toLowerCase() === playerName.toLowerCase() || knownName.toLowerCase() === canonical.toLowerCase();
    }
  );

  const resolvedName = String(userMatch?.name || playerName);
  const opSet = new Set(
    Array.isArray(opsData)
      ? opsData.map((item) => String(item?.name || "").trim()).filter(Boolean)
      : []
  );
  const banSet = new Set(
    Array.isArray(bansData)
      ? bansData.map((item) => String(item?.name || "").trim()).filter(Boolean)
      : []
  );
  const history = runtimeState.history.get(resolvedName);

  const basePlayer = {
    name: resolvedName,
    uuid: normalizeUuid(userMatch?.uuid || ""),
    online: runtimeState.online.has(resolvedName),
    isOp: opSet.has(resolvedName),
    isBanned: banSet.has(resolvedName),
    lastSeenAt: history?.lastSeenAt || userMatch?.expiresOn || null,
    seenCount: history?.seenCount || 0,
    pingMs: Number.isFinite(history?.pingMs) ? history.pingMs : null
  };

  if (!basePlayer.uuid) {
    return res.json({
      player: basePlayer,
      playerdataFound: false,
      inventory: [],
      effects: [],
      stats: null
    });
  }

  const playerDataFile = await resolvePlayerDataFile(server, basePlayer.uuid);
  if (!playerDataFile) {
    return res.json({
      player: basePlayer,
      playerdataFound: false,
      inventory: [],
      effects: [],
      stats: null
    });
  }

  try {
    const playerNbt = await parsePlayerDataNbt(playerDataFile);
    return res.json({
      player: basePlayer,
      playerdataFound: true,
      sourceFile: path.relative(getInstanceDir(server), playerDataFile).replace(/\\/g, "/"),
      inventory: parsePlayerInventory(playerNbt),
      effects: parsePlayerEffects(playerNbt),
      stats: parsePlayerStats(playerNbt)
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to parse player data." });
  }
});

app.post("/api/servers/:id/players/action", async (req, res) => {
  const { id } = req.params;
  const action = String(req.body?.action || "").trim().toLowerCase();
  const player = String(req.body?.player || "").trim();
  const value = String(req.body?.value || "").trim();

  if (!player) {
    return res.status(400).json({ error: "Player is required." });
  }

  const supported = new Set(["op", "deop", "ban", "pardon", "kick", "effect", "invsee", "unban", "effect-clear"]);
  if (!supported.has(action)) {
    return res.status(400).json({ error: "Unsupported player action." });
  }
  let command = "";
  try {
    command = buildPlayerCommand(action, player, value);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Unsupported player action." });
  }

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const child = runtimeProcesses.get(id);
  if (!child) {
    return res.status(400).json({ error: "Server is not running." });
  }

  const state = getOrCreateRuntimePlayerState(id);
  updatePlayerHistory(state, player, {
    lastSeenAt: new Date().toISOString(),
    online: state.online.has(player)
  });

  try {
    const result = sendRuntimeCommand(id, child, command);
    return res.json({ ok: true, command, method: "stdin", queued: !result.flushed });
  } catch (error) {
    const stdinReady = canWriteToProcessStdin(child);
    const detail = `player action dispatch failed: ${error.message || "unknown error"} | stdinReady=${stdinReady} command=${command}`;
    appendRuntimeLine(id, `[ERROR] ${detail}`);
    return res.status(error.statusCode || 500).json({ error: detail });
  }
});

app.post("/api/servers/:id/addons/install-url", async (req, res) => {
  const { id } = req.params;
  const url = String(req.body?.url || "").trim();

  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Addon URL must start with http:// or https://" });
  }

  const servers = await readServers();
  const server = servers.find((item) => item.id === id);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const now = new Date().toISOString();
  const fileName = url.split("/").pop() || "addon.jar";
  const addon = {
    id: createId(),
    name: fileName,
    sourceUrl: url,
    enabled: true,
    installedAt: now
  };

  server.addons = Array.isArray(server.addons) ? server.addons : [];
  server.addons.unshift(addon);
  server.updatedAt = now;
  appendTimeline(server, `Addon installed from URL: ${fileName}`);

  await writeServers(servers);
  res.status(201).json({ addon, server });
});

app.post("/api/servers/:id/addons/upload", async (req, res) => {
  const { id } = req.params;
  const fileName = sanitizeFileName(req.body?.fileName || "addon.jar");
  const base64Content = String(req.body?.contentBase64 || "");

  if (!fileName.toLowerCase().endsWith(".jar")) {
    return res.status(400).json({ error: "Only .jar addon files are supported." });
  }

  if (!base64Content) {
    return res.status(400).json({ error: "Missing file content." });
  }

  let buffer;
  try {
    buffer = Buffer.from(base64Content, "base64");
  } catch {
    return res.status(400).json({ error: "Invalid base64 content." });
  }

  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
    return res.status(400).json({ error: "Addon size must be between 1 byte and 20 MB." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  await fs.mkdir(getPluginsDir(server), { recursive: true });
  await fs.writeFile(path.join(getPluginsDir(server), fileName), buffer);

  const addon = {
    id: createId(),
    name: fileName,
    sourceUrl: null,
    enabled: true,
    installedAt: new Date().toISOString()
  };

  server.addons = Array.isArray(server.addons) ? server.addons : [];
  server.addons.unshift(addon);
  appendTimeline(server, `Addon uploaded: ${fileName}`);
  server.updatedAt = new Date().toISOString();

  await writeServers(servers);
  return res.status(201).json({ addon, server });
});

app.post("/api/servers/:id/custom-jar", express.raw({ type: "application/octet-stream", limit: "1024mb" }), async (req, res) => {
  const { id } = req.params;
  const fileName = sanitizeFileName(req.query.fileName || "server.jar") || "server.jar";

  if (!fileName.toLowerCase().endsWith(".jar")) {
    return res.status(400).json({ error: "Custom server file must be a .jar file." });
  }

  const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || []);
  if (!buffer.length) {
    return res.status(400).json({ error: "No file content received." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const instanceDir = getInstanceDir(server);
    const jarPath = getServerJarPath(server);
    await fs.mkdir(instanceDir, { recursive: true });
    await fs.writeFile(path.join(instanceDir, fileName), buffer);
    await fs.writeFile(jarPath, buffer);
    if (!SERVICE_PROXY_LOADERS.has(server.loader)) {
      await fs.writeFile(path.join(instanceDir, "eula.txt"), "eula=true\n", "utf8");
    }

    appendTimeline(server, `Custom jar uploaded: ${fileName}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);

    return res.json({ ok: true, fileName, server: withRuntime(server) });
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to upload custom jar." });
  }
});

app.delete("/api/servers/:id/addons/:addonId", async (req, res) => {
  const { id, addonId } = req.params;
  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  server.addons = Array.isArray(server.addons) ? server.addons : [];
  const addonIndex = server.addons.findIndex((item) => item.id === addonId);
  if (addonIndex < 0) {
    return res.status(404).json({ error: "Addon not found." });
  }

  const addon = server.addons[addonIndex];
  const fileName = path.basename(String(addon?.name || ""));
  let removedFile = false;
  if (fileName && fileName !== "." && fileName !== "..") {
    const targetDir = inferStoreTargetDir(server, normalizeStoreType(addon?.type || "plugin"));
    const targetPath = safeJoin(targetDir, fileName);
    try {
      const stat = await fs.stat(targetPath);
      if (stat.isFile()) {
        await fs.unlink(targetPath);
        removedFile = true;
      }
    } catch (error) {
      if (error.code !== "ENOENT") {
        return res.status(400).json({ error: error.message || "Could not delete addon file." });
      }
    }
  }

  server.addons.splice(addonIndex, 1);
  appendTimeline(server, `Addon deleted: ${addon.name}`);
  server.updatedAt = new Date().toISOString();
  await writeServers(servers);
  return res.json({ ok: true, addonId, removedFile });
});

app.get("/api/store/modrinth/search", async (req, res) => {
  const query = String(req.query.query || "").trim();
  const requestedType = String(req.query.type || "all").trim().toLowerCase();
  const supportedTypes = ["plugin", "mod", "modpack", "datapack", "resourcepack"];
  const type = supportedTypes.includes(requestedType) ? requestedType : "all";
  const mcVersion = String(req.query.mcVersion || "").trim();
  const limit = Math.max(1, Math.min(100, Math.floor(Number(req.query.limit || 100) || 100)));
  const offset = Math.max(0, Math.floor(Number(req.query.offset || 0) || 0));
  const requestedIndex = String(req.query.index || "downloads").trim().toLowerCase();
  const index = ["relevance", "downloads", "follows", "newest", "updated"].includes(requestedIndex)
    ? requestedIndex
    : "downloads";

  let facets;
  if (type === "plugin") {
    facets = [["all_project_types:plugin"]];
  } else if (type === "datapack") {
    facets = [["all_project_types:datapack"]];
  } else if (type === "all") {
    facets = [[
      "all_project_types:mod",
      "all_project_types:plugin",
      "all_project_types:datapack",
      "all_project_types:modpack",
      "all_project_types:resourcepack"
    ]];
  } else {
    facets = [[`all_project_types:${type}`]];
  }
  // Browse stays global; compatibility is checked when a version is selected or installed.

  try {
    const params = new URLSearchParams({
      query,
      limit: String(limit),
      offset: String(offset),
      index,
      facets: JSON.stringify(facets)
    });
    const url = `${MODRINTH_API_BASE}/search?${params.toString()}`;
    const payload = await fetchModrinthJson(url);
    const hits = Array.isArray(payload?.hits)
      ? payload.hits.map((item) => ({
          projectId: item?.project_id,
          slug: item?.slug,
          title: item?.title,
          description: item?.description,
          author: item?.author,
          iconUrl: item?.icon_url,
          downloads: item?.downloads,
          projectType: type === "all" ? item?.project_type : type,
          latestVersion: item?.latest_version,
          versions: Array.isArray(item?.versions) ? item.versions : []
        }))
      : [];

    return res.json({
      hits,
      totalHits: Number(payload?.total_hits || hits.length),
      offset: Number(payload?.offset || offset),
      limit: Number(payload?.limit || limit),
      index,
      type
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Modrinth search failed." });
  }
});

app.get("/api/store/modrinth/project/:projectId", async (req, res) => {
  const projectId = String(req.params.projectId || "").trim();
  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." });
  }

  try {
    const project = await fetchModrinthJson(`${MODRINTH_API_BASE}/project/${encodeURIComponent(projectId)}`);
    return res.json({
      project: {
        projectId: project?.id || projectId,
        slug: project?.slug || null,
        title: project?.title || project?.slug || projectId,
        description: project?.description || "",
        body: project?.body || "",
        iconUrl: project?.icon_url || null,
        projectType: project?.project_type || null,
        downloads: Number(project?.downloads || 0),
        followers: Number(project?.followers || 0),
        categories: Array.isArray(project?.categories) ? project.categories : [],
        additionalCategories: Array.isArray(project?.additional_categories) ? project.additional_categories : [],
        clientSide: project?.client_side || "unknown",
        serverSide: project?.server_side || "unknown",
        sourceUrl: project?.source_url || null,
        issuesUrl: project?.issues_url || null,
        wikiUrl: project?.wiki_url || null,
        gallery: Array.isArray(project?.gallery)
          ? project.gallery.map((item) => ({
              url: item?.url || null,
              title: item?.title || null,
              description: item?.description || null,
              featured: Boolean(item?.featured)
            })).filter((item) => item.url)
          : []
      }
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch project details." });
  }
});

app.get("/api/store/modrinth/project/:projectId/versions", async (req, res) => {
  const projectId = String(req.params.projectId || "").trim();
  const mcVersion = String(req.query.mcVersion || "").trim();
  const loader = String(req.query.loader || "").trim().toLowerCase();

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." });
  }

  try {
    const versions = await fetchModrinthJson(`${MODRINTH_API_BASE}/project/${encodeURIComponent(projectId)}/version`);
    const list = Array.isArray(versions) ? versions : [];

    const filtered = list.filter((version) => {
      const hasMc = !mcVersion || (Array.isArray(version?.game_versions) && version.game_versions.includes(mcVersion));
      const hasLoader = !loader || (Array.isArray(version?.loaders) && version.loaders.map((v) => String(v).toLowerCase()).includes(loader));
      return hasMc && hasLoader;
    });

    return res.json({
      versions: filtered.map((version) => {
        const file = pickBestVersionFile(version);
        return {
          id: version?.id,
          name: version?.name || version?.version_number || version?.id,
          versionNumber: version?.version_number || null,
          versionType: version?.version_type || "release",
          gameVersions: Array.isArray(version?.game_versions) ? version.game_versions : [],
          loaders: Array.isArray(version?.loaders) ? version.loaders : [],
          datePublished: version?.date_published || null,
          downloads: Number(version?.downloads || 0),
          featured: Boolean(version?.featured),
          fileName: file?.filename || null,
          fileSize: Number(file?.size || 0)
        };
      })
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to fetch project versions." });
  }
});

app.post("/api/servers/:id/addons/install-modrinth", async (req, res) => {
  const { id } = req.params;
  const projectId = String(req.body?.projectId || req.query.projectId || "").trim();
  const versionId = String(req.body?.versionId || req.query.versionId || "").trim();
  const type = normalizeStoreType(req.body?.type || req.query.type);
  const selectedLoader = String(req.body?.loader || req.query.loader || "").trim().toLowerCase();

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    let selectedVersion = null;
    let selectedFile = null;

    if (versionId) {
      const versions = await fetchModrinthJson(`${MODRINTH_API_BASE}/project/${encodeURIComponent(projectId)}/version`);
      const match = Array.isArray(versions) ? versions.find((item) => item?.id === versionId) : null;
      if (!match) {
        throw new Error("Requested Modrinth version was not found.");
      }

      const supportedLoaders = Array.isArray(match?.loaders)
        ? match.loaders.map((entry) => String(entry).toLowerCase())
        : [];

      if (selectedLoader && supportedLoaders.length && !supportedLoaders.includes(selectedLoader)) {
        throw new Error("Selected version does not support the chosen loader.");
      }

      selectedVersion = match;
      selectedFile = pickBestVersionFile(match);
    } else {
      const selection = await selectModrinthVersion(projectId, {
        mcVersion: server.mcVersion,
        type,
        preferredLoaders: selectedLoader
          ? [selectedLoader]
          : getLoaderPreferenceForStoreType(server, type)
      });
      selectedVersion = selection.version;
      selectedFile = selection.file;
    }

    if (!selectedFile?.url) {
      throw new Error("Selected version has no downloadable file.");
    }

    const installedType = inferInstalledStoreType(type, selectedVersion);
    const targetDir = inferStoreTargetDir(server, installedType);
    await fs.mkdir(targetDir, { recursive: true });

    const safeName = sanitizeFileName(selectedFile?.filename || `${projectId}.jar`) || `${projectId}.jar`;
    const targetPath = path.join(targetDir, safeName);
    const tmpPath = `${targetPath}.tmp`;
    await downloadFile(selectedFile.url, tmpPath);
    await fs.rename(tmpPath, targetPath);

    server.addons = Array.isArray(server.addons) ? server.addons : [];
    const addon = {
      id: createId(),
      name: safeName,
      sourceUrl: selectedFile.url,
      enabled: true,
      installedAt: new Date().toISOString(),
      source: "modrinth",
      sourceProjectId: projectId,
      sourceVersionId: selectedVersion?.id || null,
      sourceLoader: selectedLoader || (Array.isArray(selectedVersion?.loaders) ? selectedVersion.loaders[0] : null),
      type: installedType
    };
    server.addons.unshift(addon);
    server.updatedAt = new Date().toISOString();
    appendTimeline(server, `Installed from store: ${safeName}`);
    await writeServers(servers);

    return res.status(201).json({ addon, server: withRuntime(server) });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Store installation failed." });
  }
});

app.post("/api/servers/:id/resource-pack", receiveResourcePack, async (req, res) => {
  const uploadPath = req.file?.path;
  const originalName = sanitizeFileName(req.file?.originalname || "server-resource-pack.zip") || "server-resource-pack.zip";
  const prompt = String(req.body?.prompt || "").trim().slice(0, 180);
  if (!uploadPath) {
    return res.status(400).json({ error: "Choose a resource pack ZIP first." });
  }

  try {
    if (!originalName.toLowerCase().endsWith(".zip")) {
      throw new Error("The resource pack must be a .zip file.");
    }

    const archive = await unzipper.Open.file(uploadPath);
    const hasPackMetadata = archive.files.some((entry) => {
      const entryPath = String(entry?.path || "").replaceAll("\\", "/").replace(/^\.\//, "");
      return entry.type === "File" && entryPath === "pack.mcmeta";
    });
    if (!hasPackMetadata) {
      throw new Error("Invalid resource pack: pack.mcmeta must be at the root of the ZIP.");
    }

    const { servers, server } = await findServerById(req.params.id);
    if (!server) {
      return res.status(404).json({ error: "Server not found." });
    }

    const sha1 = await calculateFileSha1(uploadPath);
    const token = crypto.randomBytes(24).toString("hex");
    const packId = crypto.randomUUID();
    const downloadUrl = `${getRequestPublicOrigin(req)}/resourcepacks/${encodeURIComponent(server.id)}/${encodeURIComponent(token)}`;
    const packDir = getResourcePacksDir(server);
    const targetPath = getServerResourcePackPath(server);
    await fs.mkdir(packDir, { recursive: true });
    await fs.rm(targetPath, { force: true });
    await fs.rename(uploadPath, targetPath);

    const properties = await readServerProperties(server);
    properties["resource-pack"] = downloadUrl;
    properties["resource-pack-sha1"] = sha1;
    properties["resource-pack-id"] = packId;
    properties["require-resource-pack"] = "true";
    if (prompt) {
      properties["resource-pack-prompt"] = JSON.stringify({ text: prompt });
    } else {
      delete properties["resource-pack-prompt"];
    }
    await fs.mkdir(getInstanceDir(server), { recursive: true });
    await fs.writeFile(path.join(getInstanceDir(server), "server.properties"), stringifyServerProperties(properties), "utf8");

    server.resourcePack = {
      fileName: originalName,
      size: Number(req.file?.size || 0),
      sha1,
      token,
      packId,
      prompt,
      downloadUrl,
      uploadedAt: new Date().toISOString()
    };
    server.updatedAt = new Date().toISOString();
    appendTimeline(server, `Required resource pack uploaded: ${originalName}`);
    await writeServers(servers);

    return res.status(201).json({
      resourcePack: server.resourcePack,
      restartRequired: Boolean(runtimeProcesses.get(server.id)),
      server: withRuntime(server)
    });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Resource pack upload failed." });
  } finally {
    await fs.rm(uploadPath, { force: true }).catch(() => {});
  }
});

app.delete("/api/servers/:id/resource-pack", async (req, res) => {
  const { servers, server } = await findServerById(req.params.id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    await fs.rm(getServerResourcePackPath(server), { force: true });
    const properties = await readServerProperties(server);
    delete properties["resource-pack"];
    delete properties["resource-pack-sha1"];
    delete properties["resource-pack-id"];
    delete properties["resource-pack-prompt"];
    delete properties["require-resource-pack"];
    await fs.writeFile(path.join(getInstanceDir(server), "server.properties"), stringifyServerProperties(properties), "utf8");

    delete server.resourcePack;
    server.updatedAt = new Date().toISOString();
    appendTimeline(server, "Required resource pack removed");
    await writeServers(servers);
    return res.json({ ok: true, restartRequired: Boolean(runtimeProcesses.get(server.id)), server: withRuntime(server) });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Could not remove the resource pack." });
  }
});

app.get("/api/servers/:id/config", async (req, res) => {
  const { id } = req.params;
  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const propertiesPath = path.join(getInstanceDir(server), "server.properties");
  try {
    const raw = await fs.readFile(propertiesPath, "utf8");
    return res.json({ properties: parseServerProperties(raw), raw });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.json({ properties: {}, raw: "" });
    }
    return res.status(500).json({ error: "Failed to read config." });
  }
});

app.put("/api/servers/:id/config", async (req, res) => {
  const { id } = req.params;
  const properties = req.body?.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return res.status(400).json({ error: "properties object is required." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  await fs.mkdir(getInstanceDir(server), { recursive: true });
  const content = stringifyServerProperties(properties);
  await fs.writeFile(path.join(getInstanceDir(server), "server.properties"), content, "utf8");

  server.updatedAt = new Date().toISOString();
  appendTimeline(server, "Config updated from panel");
  await writeServers(servers);

  return res.json({ ok: true, raw: content, server });
});

app.get("/api/servers/:id/proxy/routes", async (req, res) => {
  const { server } = await findServerById(req.params.id);
  if (!server) return res.status(404).json({ error: "Server not found." });
  const loader = String(server.loader || "").toLowerCase();
  if (!new Set(["velocity", "bungeecord"]).has(loader)) {
    return res.status(400).json({ error: "The route editor supports Velocity and BungeeCord proxies." });
  }
  const configFile = loader === "velocity" ? "velocity.toml" : "config.yml";
  try {
    const content = await fs.readFile(path.join(getInstanceDir(server), configFile), "utf8");
    const routes = loader === "velocity" ? parseVelocityRoutes(content) : parseBungeeRoutes(content);
    return res.json({ loader, configFile, routes, running: Boolean(runtimeProcesses.get(server.id)) });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.json({ loader, configFile, routes: [], generated: false, running: false });
    }
    return res.status(500).json({ error: `Failed to read ${configFile}.` });
  }
});

app.put("/api/servers/:id/proxy/routes", async (req, res) => {
  const { servers, server } = await findServerById(req.params.id);
  if (!server) return res.status(404).json({ error: "Server not found." });
  const loader = String(server.loader || "").toLowerCase();
  if (!new Set(["velocity", "bungeecord"]).has(loader)) {
    return res.status(400).json({ error: "The route editor supports Velocity and BungeeCord proxies." });
  }

  let routes;
  try {
    routes = validateProxyRoutes(req.body?.routes);
  } catch (error) {
    return res.status(400).json({ error: error.message || "Invalid proxy routes." });
  }

  const configFile = loader === "velocity" ? "velocity.toml" : "config.yml";
  const configPath = path.join(getInstanceDir(server), configFile);
  try {
    const current = await fs.readFile(configPath, "utf8");
    const updated = loader === "velocity"
      ? updateVelocityRoutes(current, routes)
      : updateBungeeRoutes(current, routes);
    await fs.writeFile(configPath, updated, "utf8");
    server.updatedAt = new Date().toISOString();
    appendTimeline(server, `Updated ${routes.length} proxy route${routes.length === 1 ? "" : "s"} from panel`);
    await writeServers(servers);
    return res.json({
      ok: true,
      loader,
      configFile,
      routes: loader === "velocity" ? parseVelocityRoutes(updated) : parseBungeeRoutes(updated),
      restartRequired: Boolean(runtimeProcesses.get(server.id))
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(409).json({ error: `Start the proxy once so ${configFile} can be generated.` });
    }
    return res.status(500).json({ error: error.message || `Failed to update ${configFile}.` });
  }
});

app.get("/api/servers/:id/worlds", async (req, res) => {
  const { id } = req.params;
  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  await fs.mkdir(getWorldsRoot(server), { recursive: true });
  const entries = await fs.readdir(getWorldsRoot(server), { withFileTypes: true });
  const worlds = [];

  for (const entry of entries) {
    if (!entry.isDirectory() || isReservedWorldDirName(entry.name)) {
      continue;
    }

    const worldDir = path.join(getWorldsRoot(server), entry.name);
    if (!await isMinecraftWorldDirectory(worldDir)) {
      continue;
    }
    let seed = "";
    try {
      const rawMeta = await fs.readFile(getWorldMetaFile(worldDir), "utf8");
      const parsedMeta = JSON.parse(rawMeta);
      seed = String(parsedMeta?.seed || "").trim();
    } catch {
      seed = "";
    }

    worlds.push({ name: entry.name, seed });
  }

  worlds.sort((a, b) => a.name.localeCompare(b.name));

  return res.json({ worlds });
});

app.get("/api/servers/:id/worlds/export", async (req, res) => {
  const { server } = await findServerById(req.params.id);
  if (!server) return res.status(404).json({ error: "Server not found." });

  const name = sanitizeWorldName(req.query?.name || "");
  if (!name || isReservedWorldDirName(name)) {
    return res.status(400).json({ error: "Choose a valid world." });
  }

  const worldDir = safeJoin(getWorldsRoot(server), name);
  if (!await isMinecraftWorldDirectory(worldDir)) {
    return res.status(404).json({ error: "World not found." });
  }

  res.attachment(`${sanitizeFileName(name) || "minecraft-world"}.zip`);
  try {
    await createServerArchive(worldDir, res, null, false);
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ error: error.message || "World export failed." });
    else res.destroy(error);
  }
});

app.post("/api/servers/:id/worlds/import", receiveWorldArchive, async (req, res) => {
  const uploadPath = req.file?.path;
  if (!uploadPath) return res.status(400).json({ error: "Choose a Minecraft world ZIP to import." });

  const { servers, server } = await findServerById(req.params.id);
  if (!server) {
    await fs.rm(uploadPath, { force: true }).catch(() => {});
    return res.status(404).json({ error: "Server not found." });
  }

  let stagingDir = "";
  let destination = "";
  try {
    if (!String(req.file.originalname || "").toLowerCase().endsWith(".zip")) {
      throw new Error("The imported world must be a .zip file.");
    }

    stagingDir = await fs.mkdtemp(path.join(IMPORTS_DIR, "world-"));
    await extractZipSafely(uploadPath, stagingDir);

    let sourceDir = stagingDir;
    let suggestedName = String(req.file.originalname || "world.zip").replace(/\.zip$/i, "");
    if (!await isMinecraftWorldDirectory(sourceDir)) {
      const entries = await fs.readdir(stagingDir, { withFileTypes: true });
      const candidates = [];
      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name === "__MACOSX") continue;
        const candidate = path.join(stagingDir, entry.name);
        if (await isMinecraftWorldDirectory(candidate)) candidates.push({ name: entry.name, path: candidate });
      }
      if (candidates.length !== 1) {
        throw new Error(candidates.length
          ? "The ZIP contains multiple worlds. Import one world per archive."
          : "Invalid Minecraft world: level.dat was not found at the root or in a single top-level folder.");
      }
      sourceDir = candidates[0].path;
      suggestedName = candidates[0].name;
    }

    const name = sanitizeWorldName(req.body?.name || suggestedName);
    if (!name || isReservedWorldDirName(name)) {
      throw new Error("The imported world name is invalid or reserved.");
    }

    const root = getWorldsRoot(server);
    await fs.mkdir(root, { recursive: true });
    destination = safeJoin(root, name);
    if (await worldDirectoryExists(destination)) {
      throw new Error(`A world named "${name}" already exists.`);
    }

    await fs.cp(sourceDir, destination, { recursive: true, errorOnExist: true, force: false });
    appendTimeline(server, `World imported: ${name}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.status(201).json({ world: { name, seed: "" }, restartRequired: Boolean(runtimeProcesses.get(server.id)) });
  } catch (error) {
    if (destination) await fs.rm(destination, { recursive: true, force: true }).catch(() => {});
    return res.status(400).json({ error: error.message || "World import failed." });
  } finally {
    await fs.rm(uploadPath, { force: true }).catch(() => {});
    if (stagingDir) await fs.rm(stagingDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.post("/api/servers/:id/worlds/duplicate", async (req, res) => {
  const { servers, server } = await findServerById(req.params.id);
  if (!server) return res.status(404).json({ error: "Server not found." });

  const currentName = sanitizeWorldName(req.body?.name || "");
  const nextName = sanitizeWorldName(req.body?.newName || `${currentName}_copy`);
  if (!currentName || !nextName || isReservedWorldDirName(nextName)) {
    return res.status(400).json({ error: "Source and target world names are required." });
  }

  const root = getWorldsRoot(server);
  const sourceDir = safeJoin(root, currentName);
  const targetDir = safeJoin(root, nextName);
  if (!await isMinecraftWorldDirectory(sourceDir)) {
    return res.status(404).json({ error: "World not found." });
  }
  if (await worldDirectoryExists(targetDir)) {
    return res.status(409).json({ error: "Target world name already exists." });
  }

  try {
    await fs.cp(sourceDir, targetDir, { recursive: true, errorOnExist: true, force: false });
    appendTimeline(server, `World duplicated: ${currentName} -> ${nextName}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.status(201).json({ world: { name: nextName, seed: "" } });
  } catch (error) {
    await fs.rm(targetDir, { recursive: true, force: true }).catch(() => {});
    return res.status(400).json({ error: error.message || "World duplication failed." });
  }
});

app.post("/api/servers/:id/worlds", async (req, res) => {
  const { id } = req.params;
  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const name = sanitizeWorldName(req.body?.name || "");
  const seed = String(req.body?.seed || "").trim().slice(0, 128);
  if (!name) {
    return res.status(400).json({ error: "World name is required." });
  }
  if (isReservedWorldDirName(name)) {
    return res.status(400).json({ error: "This world name is reserved." });
  }

  const root = getWorldsRoot(server);
  await fs.mkdir(root, { recursive: true });
  const worldDir = safeJoin(root, name);

  try {
    await fs.stat(worldDir);
    return res.status(409).json({ error: "World already exists." });
  } catch {
    // expected when directory does not exist
  }

  await fs.mkdir(worldDir, { recursive: true });
  await fs.writeFile(getWorldMetaFile(worldDir), `${JSON.stringify({ seed, createdAt: new Date().toISOString() }, null, 2)}\n`, "utf8");

  appendTimeline(server, `World created: ${name}`);
  server.updatedAt = new Date().toISOString();
  await writeServers(servers);
  return res.status(201).json({ world: { name, seed } });
});

app.patch("/api/servers/:id/worlds", async (req, res) => {
  const { id } = req.params;
  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const currentName = sanitizeWorldName(req.body?.currentName || "");
  const nextName = sanitizeWorldName(req.body?.name || currentName);
  const seed = String(req.body?.seed || "").trim().slice(0, 128);
  if (!currentName || !nextName) {
    return res.status(400).json({ error: "Current and target world names are required." });
  }
  if (isReservedWorldDirName(currentName) || isReservedWorldDirName(nextName)) {
    return res.status(400).json({ error: "This world name is reserved." });
  }

  const root = getWorldsRoot(server);
  await fs.mkdir(root, { recursive: true });
  const currentDir = safeJoin(root, currentName);
  const nextDir = safeJoin(root, nextName);

  if (!await isMinecraftWorldDirectory(currentDir)) {
    return res.status(404).json({ error: "World not found." });
  }

  if (currentName !== nextName) {
    try {
      await fs.stat(nextDir);
      return res.status(409).json({ error: "Target world name already exists." });
    } catch {
      // expected when name does not exist
    }
    await fs.rename(currentDir, nextDir);
  }

  await fs.writeFile(getWorldMetaFile(nextDir), `${JSON.stringify({ seed, updatedAt: new Date().toISOString() }, null, 2)}\n`, "utf8");

  appendTimeline(server, `World updated: ${currentName}${currentName !== nextName ? ` -> ${nextName}` : ""}`);
  server.updatedAt = new Date().toISOString();
  await writeServers(servers);
  return res.json({ world: { name: nextName, seed } });
});

app.delete("/api/servers/:id/worlds", async (req, res) => {
  const { id } = req.params;
  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const name = sanitizeWorldName(req.body?.name || "");
  if (!name || isReservedWorldDirName(name)) {
    return res.status(400).json({ error: "World name is required." });
  }

  const worldDir = safeJoin(getWorldsRoot(server), name);
  if (!await isMinecraftWorldDirectory(worldDir)) {
    return res.status(404).json({ error: "World not found." });
  }

  await fs.rm(worldDir, { recursive: true, force: true });
  appendTimeline(server, `World deleted: ${name}`);
  server.updatedAt = new Date().toISOString();
  await writeServers(servers);
  return res.json({ ok: true, deleted: name });
});

app.get("/api/servers/:id/backups", async (req, res) => {
  const { id } = req.params;
  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  await fs.mkdir(getBackupsDir(server), { recursive: true });
  const entries = await listDirEntries(getBackupsDir(server), "");
  const backupEntries = entries
    .filter((item) => item.type === "file" && /\.(zip|json)$/i.test(item.name))
    .map((item) => ({ ...item, restorable: item.name.endsWith(".zip"), legacy: item.name.endsWith(".json") }));
  const backups = await Promise.all(backupEntries.map(async (item) => {
    const stat = await fs.stat(path.join(getBackupsDir(server), item.name));
    return { ...item, size: stat.size, modifiedAt: stat.mtime.toISOString() };
  }));
  return res.json({ backups });
});

app.post("/api/servers/:id/backups/create", async (req, res) => {
  const { id } = req.params;
  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  await fs.mkdir(getBackupsDir(server), { recursive: true });
  const now = new Date();
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  if (runtimeProcesses.has(server.id)) {
    return res.status(409).json({ error: "Stop the server before creating a consistent backup." });
  }
  const fileName = `backup-${stamp}.zip`;
  const target = path.join(getBackupsDir(server), fileName);
  try {
    await createServerArchive(getInstanceDir(server), fsSync.createWriteStream(target), {
      format: "vyron-backup",
      formatVersion: 1,
      createdAt: now.toISOString(),
      serverId: server.id,
      serverName: server.name,
      note: String(req.body?.note || "manual backup").slice(0, 200)
    });
  } catch (error) {
    await fs.rm(target, { force: true }).catch(() => {});
    return res.status(400).json({ error: error.message || "Backup creation failed." });
  }

  appendTimeline(server, `Backup created: ${fileName}`);
  server.updatedAt = new Date().toISOString();
  await writeServers(servers);

  return res.status(201).json({ backup: { name: fileName } });
});

app.post("/api/servers/:id/backups/restore", async (req, res) => {
  const { id } = req.params;
  const name = sanitizeFileName(req.body?.name || "");
  if (!name) {
    return res.status(400).json({ error: "Backup name is required." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const target = safeJoin(getBackupsDir(server), name);
  try {
    await fs.access(target);
  } catch {
    return res.status(404).json({ error: "Backup file not found." });
  }

  if (!name.endsWith(".zip")) return res.status(400).json({ error: "Legacy metadata backups cannot be restored." });
  if (runtimeProcesses.has(server.id)) return res.status(409).json({ error: "Stop the server before restoring a backup." });

  const instanceDir = getInstanceDir(server);
  const rollbackDir = path.join(IMPORTS_DIR, `restore-${server.id}-${Date.now()}`);
  try {
    await fs.cp(instanceDir, rollbackDir, {
      recursive: true,
      filter: (entry) => !path.resolve(entry).startsWith(path.resolve(getBackupsDir(server)))
    });
    const entries = await fs.readdir(instanceDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "backups") continue;
      await fs.rm(path.join(instanceDir, entry.name), { recursive: true, force: true });
    }
    await extractZipSafely(target, instanceDir);
    appendTimeline(server, `Backup restored: ${name}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.json({ ok: true, name });
  } catch (error) {
    const current = await fs.readdir(instanceDir, { withFileTypes: true }).catch(() => []);
    for (const entry of current) {
      if (entry.name === "backups") continue;
      await fs.rm(path.join(instanceDir, entry.name), { recursive: true, force: true }).catch(() => {});
    }
    await fs.cp(rollbackDir, instanceDir, { recursive: true, force: true }).catch(() => {});
    return res.status(400).json({ error: `Restore failed and was rolled back: ${error.message}` });
  } finally {
    await fs.rm(rollbackDir, { recursive: true, force: true }).catch(() => {});
  }
});

app.get("/api/servers/:id/files", async (req, res) => {
  const { id } = req.params;
  const relativePath = String(req.query.path || "");

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  await fs.mkdir(getInstanceDir(server), { recursive: true });

  try {
    const entries = await listDirEntries(getInstanceDir(server), relativePath);
    return res.json({ path: relativePath, entries });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Could not list files." });
  }
});

app.get("/api/servers/:id/files/download", async (req, res) => {
  const { id } = req.params;
  const relativePath = String(req.query.path || "");
  if (!relativePath) {
    return res.status(400).json({ error: "Path is required." });
  }

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const fullPath = safeJoin(getInstanceDir(server), relativePath);
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) {
      return res.status(400).json({ error: "Only files can be downloaded." });
    }
    return res.download(fullPath, path.basename(fullPath));
  } catch (error) {
    return res.status(400).json({ error: error.message || "Download failed." });
  }
});

app.get("/api/servers/:id/files/content", async (req, res) => {
  const { id } = req.params;
  const relativePath = String(req.query.path || "");

  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const fullPath = safeJoin(getInstanceDir(server), relativePath);
    const stat = await fs.stat(fullPath);
    if (!stat.isFile()) {
      return res.status(400).json({ error: "Path is not a file." });
    }
    if (stat.size > 512 * 1024) {
      return res.status(400).json({ error: "File too large to edit in panel (max 512KB)." });
    }

    const content = await fs.readFile(fullPath, "utf8");
    return res.json({ path: relativePath, content });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Could not read file." });
  }
});

app.put("/api/servers/:id/files/content", async (req, res) => {
  const { id } = req.params;
  const relativePath = String(req.body?.path || "");
  const content = String(req.body?.content || "");

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const fullPath = safeJoin(getInstanceDir(server), relativePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, content, "utf8");
    appendTimeline(server, `File saved: ${relativePath}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Could not save file." });
  }
});

app.post("/api/servers/:id/files/upload", async (req, res) => {
  const { id } = req.params;
  const dirPath = String(req.body?.dirPath || "");
  const fileName = sanitizeFileName(req.body?.fileName || "file.bin");
  const contentBase64 = String(req.body?.contentBase64 || "");

  if (!contentBase64) {
    return res.status(400).json({ error: "Missing upload content." });
  }

  let buffer;
  try {
    buffer = Buffer.from(contentBase64, "base64");
  } catch {
    return res.status(400).json({ error: "Invalid upload encoding." });
  }

  if (!buffer.length || buffer.length > MAX_UPLOAD_BYTES) {
    return res.status(400).json({ error: "Upload size must be between 1 byte and 20 MB." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const safeDir = safeJoin(getInstanceDir(server), dirPath);
    await fs.mkdir(safeDir, { recursive: true });
    await fs.writeFile(path.join(safeDir, fileName), buffer);
    appendTimeline(server, `File uploaded: ${path.posix.join(dirPath.replaceAll("\\", "/"), fileName)}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.status(201).json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Upload failed." });
  }
});

app.patch("/api/servers/:id/files", async (req, res) => {
  const { id } = req.params;
  const relativePath = String(req.body?.path || "");
  const newName = String(req.body?.newName || "").trim();
  if (!relativePath) {
    return res.status(400).json({ error: "Path is required." });
  }
  if (!newName || newName === "." || newName === ".." || /[\\/\x00-\x1f]/.test(newName) || newName.length > 120) {
    return res.status(400).json({ error: "The new name is invalid." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const fullPath = safeJoin(getInstanceDir(server), relativePath);
    await fs.stat(fullPath);
    const destination = safeJoin(getInstanceDir(server), path.join(path.dirname(relativePath), newName));
    try {
      await fs.access(destination);
      return res.status(409).json({ error: "A file or folder with that name already exists." });
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }
    }

    await fs.rename(fullPath, destination);
    const nextRelativePath = path.relative(getInstanceDir(server), destination).replaceAll("\\", "/");
    appendTimeline(server, `Renamed: ${relativePath} -> ${nextRelativePath}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.json({ ok: true, path: nextRelativePath });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Rename failed." });
  }
});

app.delete("/api/servers/:id/files", async (req, res) => {
  const { id } = req.params;
  const relativePath = String(req.query.path || "");
  if (!relativePath) {
    return res.status(400).json({ error: "Path is required." });
  }

  const { servers, server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  try {
    const fullPath = safeJoin(getInstanceDir(server), relativePath);
    const stat = await fs.stat(fullPath);
    if (stat.isDirectory()) {
      await fs.rm(fullPath, { recursive: true, force: true });
    } else {
      await fs.unlink(fullPath);
    }
    appendTimeline(server, `Deleted: ${relativePath}`);
    server.updatedAt = new Date().toISOString();
    await writeServers(servers);
    return res.json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Delete failed." });
  }
});

app.get("/api/servers/:id/monitoring", async (req, res) => {
  const { id } = req.params;
  const { server } = await findServerById(id);
  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }
  return res.json({ monitoring: getMonitoringSnapshot(server) });
});

app.post("/api/servers/:id/schedules", async (req, res) => {
  const { id } = req.params;
  const name = String(req.body?.name || "").trim();
  const cron = String(req.body?.cron || "").trim();
  const action = String(req.body?.action || "").trim().toLowerCase();

  if (!name || !cron || !action) {
    return res.status(400).json({ error: "Schedule name, cron and action are required." });
  }

  const allowedActions = ["restart", "backup", "stop", "start"];
  if (!allowedActions.includes(action)) {
    return res.status(400).json({ error: "Schedule action must be one of restart, backup, stop, start." });
  }

  const servers = await readServers();
  const server = servers.find((item) => item.id === id);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const now = new Date().toISOString();
  const schedule = {
    id: createId(),
    name,
    cron,
    action,
    createdAt: now
  };

  server.schedules = Array.isArray(server.schedules) ? server.schedules : [];
  server.schedules.unshift(schedule);
  server.updatedAt = now;
  appendTimeline(server, `Schedule created: ${name} (${action})`);

  await writeServers(servers);
  res.status(201).json({ schedule, server });
});

app.post("/api/servers/:id/webhooks", async (req, res) => {
  const { id } = req.params;
  const name = String(req.body?.name || "").trim();
  const url = String(req.body?.url || "").trim();
  const event = String(req.body?.event || "").trim().toLowerCase();

  if (!name || !url || !event) {
    return res.status(400).json({ error: "Webhook name, URL and event are required." });
  }

  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Webhook URL must start with http:// or https://" });
  }

  const allowedEvents = ["start", "stop", "restart", "crash"];
  if (!allowedEvents.includes(event)) {
    return res.status(400).json({ error: "Webhook event must be start, stop, restart or crash." });
  }

  const servers = await readServers();
  const server = servers.find((item) => item.id === id);

  if (!server) {
    return res.status(404).json({ error: "Server not found." });
  }

  const now = new Date().toISOString();
  const webhook = {
    id: createId(),
    name,
    url,
    event,
    createdAt: now
  };

  server.webhooks = Array.isArray(server.webhooks) ? server.webhooks : [];
  server.webhooks.unshift(webhook);
  server.updatedAt = now;
  appendTimeline(server, `Webhook added: ${name} on ${event}`);

  await writeServers(servers);
  res.status(201).json({ webhook, server });
});

app.post("/api/agent/ping", async (req, res) => {
  const agentName = String(req.body?.agentName || "unknown-agent").trim();
  const host = String(req.body?.host || "unknown-host").trim();
  const token = String(req.body?.token || "").trim();
  const version = String(req.body?.version || "1.0.0").trim();
  const now = new Date().toISOString();

  const agents = await readAgents();
  const key = `${agentName}::${host}`;
  const existing = agents.find((item) => item.key === key);

  if (existing) {
    existing.lastSeenAt = now;
    existing.version = version;
    existing.tokenPreview = token ? `${token.slice(0, 4)}...` : "";
  } else {
    agents.unshift({
      id: createId(),
      key,
      agentName,
      host,
      version,
      tokenPreview: token ? `${token.slice(0, 4)}...` : "",
      firstSeenAt: now,
      lastSeenAt: now
    });
  }

  await writeAgents(agents.slice(0, 200));
  res.json({ ok: true, receivedAt: now });
});

app.get("/installer.sh", async (_req, res) => {
  try {
    const raw = await fs.readFile(INSTALLER_FILE, "utf8");
    const hostUrl = `${_req.protocol}://${_req.get("host")}`;
    const script = raw.replace(/https:\/\/vyronpanel\.com/g, hostUrl);
    res.type("text/x-shellscript");
    res.send(script);
  } catch {
    res.status(404).type("text/plain").send("Installer not found");
  }
});

app.get("/download/installer.sh", async (req, res) => {
  try {
    const raw = await fs.readFile(INSTALLER_FILE, "utf8");
    const hostUrl = `${req.protocol}://${req.get("host")}`;
    const script = raw.replace(/https:\/\/vyronpanel\.com/g, hostUrl);
    res.type("text/x-shellscript");
    res.send(script);
  } catch {
    res.status(404).type("text/plain").send("Installer not found");
  }
});

app.get("/download/webpanel-files.txt", async (_req, res) => {
  try {
    const files = await buildWebpanelDownloadManifest();
    res.type("text/plain");
    return res.send(`${files.join("\n")}\n`);
  } catch (error) {
    return res.status(500).type("text/plain").send(error.message || "Failed to build webpanel manifest.");
  }
});

app.get("/download/webpanel/file/*", async (req, res) => {
  const rel = normalizePosixRelativePath(req.params[0] || "");
  if (!rel) {
    return res.status(400).json({ error: "File path is required." });
  }

  try {
    const manifest = await buildWebpanelDownloadManifest();
    if (!manifest.includes(rel)) {
      return res.status(404).json({ error: "File not found in distributable webpanel package." });
    }

    const fullPath = safeJoin(__dirname, rel);
    return res.sendFile(fullPath);
  } catch (error) {
    return res.status(500).json({ error: error.message || "Failed to read file." });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startAutoStartServersOnBoot() {
  const servers = await readServers();
  const targets = servers.filter((item) => item.autoStart !== false);
  if (!targets.length) {
    return;
  }

  const now = new Date().toISOString();
  for (const server of targets) {
    server.status = "starting";
    server.badge = mapStatusToBadge("starting");
    server.playersOnline = 0;
    server.lastActionAt = now;
    server.updatedAt = now;
    appendTimeline(server, "Auto-start on panel boot");
  }
  await writeServers(servers);

  for (const server of targets) {
    startServer(server).catch(async (error) => {
      appendRuntimeLine(server.id, `Auto-start failed: ${error.message}`);
      await updateServerById(server.id, async (entry) => {
        entry.status = "stopped";
        entry.badge = mapStatusToBadge("stopped");
        entry.lastActionAt = new Date().toISOString();
        entry.updatedAt = new Date().toISOString();
        appendTimeline(entry, "Auto-start failed on panel boot");
      });
    });
  }
}

async function cleanupCorruptedServers() {
  try {
    const servers = await readServers();
    let needsSave = false;

    for (const server of servers) {
      // For Forge servers, remove old corrupted custom start commands
      if (server.loader === "forge" && server.customStartCmd && String(server.customStartCmd).includes("installer.jar")) {
        console.log(`[CLEANUP] Removing corrupted custom start command from Forge server ${server.id} (${server.name})`);
        server.customStartCmd = undefined;
        needsSave = true;
      }
    }

    if (needsSave) {
      await writeServers(servers);
      console.log(`[CLEANUP] Fixed corrupted server configurations`);
    }
  } catch (error) {
    console.error(`[CLEANUP] Error during server cleanup: ${error.message}`);
  }
}

app.listen(PORT, async () => {
  console.log(`Vyron panel running on http://localhost:${PORT}`);
  
  // Clean up any corrupted servers on startup
  await cleanupCorruptedServers();
  
  startAutoStartServersOnBoot().catch((error) => {
    console.error(`Auto-start bootstrap failed: ${error.message}`);
  });
});
