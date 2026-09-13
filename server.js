const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "127.0.0.1";
const ADMIN_TOKEN = process.env.SUGGESTIONS_ADMIN_TOKEN || "";
const PUBLIC_DIR = __dirname;
const DATA_DIR = path.join(__dirname, "data");
const SUGGESTIONS_FILE = path.join(DATA_DIR, "suggestions.jsonl");
const MAX_BODY_BYTES = 4096;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 8;
const rateLimitBuckets = new Map();

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; img-src 'self' data:; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; connect-src 'self'; form-action 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};

const send = (res, status, body, headers = {}) => {
  res.writeHead(status, { ...securityHeaders, ...headers });
  res.end(body);
};

const sendJson = (res, status, payload) => {
  send(res, status, JSON.stringify(payload), { "Content-Type": "application/json; charset=utf-8" });
};

const readRequestBody = (req) => new Promise((resolve, reject) => {
  let body = "";
  let size = 0;

  req.on("data", (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      reject(new Error("Request body too large."));
      req.destroy();
      return;
    }
    body += chunk;
  });

  req.on("end", () => resolve(body));
  req.on("error", reject);
});

const validateIdea = (value) => {
  if (typeof value !== "string") {
    return { error: "Idea must be text." };
  }

  const normalized = value.replace(/\s+/g, " ").trim();
  const blockedPattern = /<|>|&lt;|&gt;|javascript\s*:|data\s*:|on\w+\s*=/i;

  if (normalized.length < 20) {
    return { error: "Please add a little more detail." };
  }

  if (normalized.length > 700) {
    return { error: "Please keep the idea under 700 characters." };
  }

  if (blockedPattern.test(normalized)) {
    return { error: "Please remove HTML, scripts, or event-handler syntax." };
  }

  return { value: normalized };
};

const getClientIpHash = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwarded) ? forwarded[0] : (forwarded || req.socket.remoteAddress || "unknown");
  return crypto.createHash("sha256").update(ip.split(",")[0].trim()).digest("hex").slice(0, 16);
};

const isAllowedOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;

  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
};

const isRateLimited = (key) => {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key)?.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS) || [];

  if (bucket.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(key, bucket);
    return true;
  }

  bucket.push(now);
  rateLimitBuckets.set(key, bucket);
  return false;
};

const timingSafeTokenMatches = (token) => {
  if (!ADMIN_TOKEN || !token) return false;
  const expected = Buffer.from(ADMIN_TOKEN);
  const actual = Buffer.from(token);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
};

const handleCreateSuggestion = async (req, res) => {
  if (!isAllowedOrigin(req)) {
    sendJson(res, 403, { error: "Forbidden origin." });
    return;
  }

  if (!/^application\/json\b/i.test(req.headers["content-type"] || "")) {
    sendJson(res, 415, { error: "Content-Type must be application/json." });
    return;
  }

  try {
    const ipHash = getClientIpHash(req);

    if (isRateLimited(ipHash)) {
      sendJson(res, 429, { error: "Too many suggestions. Please try again later." });
      return;
    }

    const rawBody = await readRequestBody(req);
    const payload = JSON.parse(rawBody);

    if (payload.website) {
      sendJson(res, 400, { error: "Submission blocked." });
      return;
    }

    const validation = validateIdea(payload.idea);
    if (validation.error) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    fs.mkdirSync(DATA_DIR, { recursive: true });
    const record = {
      id: crypto.randomUUID(),
      idea: validation.value,
      createdAt: new Date().toISOString(),
      source: "projects-page",
      ipHash
    };

    fs.appendFileSync(SUGGESTIONS_FILE, `${JSON.stringify(record)}\n`, { mode: 0o600 });
    sendJson(res, 201, { ok: true, id: record.id });
  } catch (error) {
    sendJson(res, 400, { error: "Invalid suggestion payload." });
  }
};

const handleListSuggestions = (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!timingSafeTokenMatches(token)) {
    sendJson(res, 401, { error: "Unauthorized." });
    return;
  }

  if (!fs.existsSync(SUGGESTIONS_FILE)) {
    sendJson(res, 200, { suggestions: [] });
    return;
  }

  const suggestions = fs.readFileSync(SUGGESTIONS_FILE, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .reverse();

  sendJson(res, 200, { suggestions });
};

const serveStaticFile = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR) || filePath.includes(`${path.sep}.git${path.sep}`) || filePath.includes(`${path.sep}data${path.sep}`)) {
    send(res, 403, "Forbidden", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      send(res, 404, "Not found", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    send(res, 200, fs.readFileSync(filePath), {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
  });
};

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/suggestions") {
    handleCreateSuggestion(req, res);
    return;
  }

  if (req.method === "GET" && req.url === "/api/suggestions") {
    handleListSuggestions(req, res);
    return;
  }

  if (req.method === "GET" || req.method === "HEAD") {
    serveStaticFile(req, res);
    return;
  }

  sendJson(res, 405, { error: "Method not allowed." });
});

server.listen(PORT, HOST, () => {
  console.log(`Portfolio server running at http://${HOST}:${PORT}`);
  if (!ADMIN_TOKEN) {
    console.log("Set SUGGESTIONS_ADMIN_TOKEN before viewing admin suggestions.");
  }
});
