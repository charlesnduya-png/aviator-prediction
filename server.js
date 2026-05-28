const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PORT = Number(process.env.PORT || 8080);
const ROOT = __dirname;
const NO_BROWSER =
  process.env.NO_BROWSER === "1" ||
  process.argv.includes("--no-browser");
const LIVE_SESSION_HOURS = [9, 14, 21];
const LIVE_SESSION_DURATION_MIN = 60;
const PRELIVE_CODE_WINDOW_MIN = 20;
const WHATSAPP_PUSH_WEBHOOK = process.env.WHATSAPP_PUSH_WEBHOOK || "";
const PUBLIC_SITE_URL = process.env.PUBLIC_SITE_URL || "";
const WHATSAPP_PUSH_AUTH_HEADER = process.env.WHATSAPP_PUSH_AUTH_HEADER || "Authorization";
const WHATSAPP_PUSH_AUTH_TOKEN = process.env.WHATSAPP_PUSH_AUTH_TOKEN || "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
};

function getLanIp() {
  const nets = require("os").networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

function writeUrlFile() {
  const ip = getLanIp();
  const url = `http://${ip}:${PORT}`;
  fs.writeFileSync(
    path.join(ROOT, "lan-url.json"),
    JSON.stringify({ url, ip, port: PORT }, null, 2)
  );
  return url;
}

function dateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function buildSessionCode(dayKey, slotHour) {
  const seed = `${dayKey}:${slotHour}:aviator-pro`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return `AV-${(hash % 0xffffff).toString(36).toUpperCase().padStart(5, "0")}`;
}

function getSessionWindows(now = new Date()) {
  return LIVE_SESSION_HOURS.map((hour) => {
    const start = new Date(now);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start.getTime() + LIVE_SESSION_DURATION_MIN * 60 * 1000);
    const preliveStart = new Date(start.getTime() - PRELIVE_CODE_WINDOW_MIN * 60 * 1000);
    return {
      hour,
      start,
      end,
      preliveStart,
      code: buildSessionCode(dateKey(start), hour),
    };
  });
}

function getSessionState(now = new Date()) {
  const windows = getSessionWindows(now);
  const active = windows.find((slot) => now >= slot.start && now < slot.end);
  if (active) return { phase: "live", slot: active };
  const prelive = windows.find((slot) => now >= slot.preliveStart && now < slot.start);
  if (prelive) return { phase: "prelive", slot: prelive };
  return { phase: "offline", slot: windows.find((slot) => now < slot.preliveStart) || windows[0] };
}

function toIsoLocal(date) {
  const tzo = -date.getTimezoneOffset();
  const sign = tzo >= 0 ? "+" : "-";
  const hh = String(Math.floor(Math.abs(tzo) / 60)).padStart(2, "0");
  const mm = String(Math.abs(tzo) % 60).padStart(2, "0");
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}T${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}${sign}${hh}:${mm}`;
}

let incomingCode = null;
const sentWhatsappKeys = new Set();
let sentSiteLinkForDay = "";

function readJsonBody(req, maxBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > maxBytes) reject(new Error("Payload too large"));
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function postJson(urlString, payload) {
  return new Promise((resolve, reject) => {
    let target;
    try {
      target = new URL(urlString);
    } catch {
      reject(new Error("Invalid WHATSAPP_PUSH_WEBHOOK URL"));
      return;
    }
    const body = JSON.stringify(payload);
    const isHttps = target.protocol === "https:";
    const client = isHttps ? https : http;
    const req = client.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (isHttps ? 443 : 80),
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...(WHATSAPP_PUSH_AUTH_TOKEN
            ? { [WHATSAPP_PUSH_AUTH_HEADER]: WHATSAPP_PUSH_AUTH_TOKEN }
            : {}),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode || 0, body: raw });
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function maybeShareNextCodeToWhatsapp(now = new Date()) {
  if (!WHATSAPP_PUSH_WEBHOOK) return;
  const { phase, slot } = getSessionState(now);
  if (phase !== "prelive") return;

  const key = `${dateKey(slot.start)}:${slot.hour}`;
  if (sentWhatsappKeys.has(key)) return;

  const payload = {
    code: slot.code,
    phase: "prelive",
    source: "aviator-server",
    sessionHour: slot.hour,
    start: toIsoLocal(slot.start),
    siteUrl: PUBLIC_SITE_URL || phoneUrl,
    localUrl: phoneUrl,
    message: `Aviator next code: ${slot.code}. Session opens at ${toIsoLocal(
      slot.start
    )}. Site: ${PUBLIC_SITE_URL || phoneUrl}`,
  };

  postJson(WHATSAPP_PUSH_WEBHOOK, payload)
    .then((res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        sentWhatsappKeys.add(key);
        console.log(`  WhatsApp push sent for next code ${slot.code}`);
      } else {
        console.log(`  WhatsApp push failed (${res.statusCode})`);
      }
    })
    .catch((err) => {
      console.log(`  WhatsApp push error: ${err.message}`);
    });
}

function maybeShareSiteLinkToWhatsapp(now = new Date()) {
  if (!WHATSAPP_PUSH_WEBHOOK) return;
  const todayKey = dateKey(now);
  if (sentSiteLinkForDay === todayKey) return;

  const payload = {
    type: "site-link",
    source: "aviator-server",
    siteUrl: PUBLIC_SITE_URL || phoneUrl,
    localUrl: phoneUrl,
    now: toIsoLocal(now),
    message: `Aviator site link: ${PUBLIC_SITE_URL || phoneUrl}`,
  };

  postJson(WHATSAPP_PUSH_WEBHOOK, payload)
    .then((res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        sentSiteLinkForDay = todayKey;
        console.log(`  WhatsApp push sent for site link ${PUBLIC_SITE_URL || phoneUrl}`);
      } else {
        console.log(`  WhatsApp site-link push failed (${res.statusCode})`);
      }
    })
    .catch((err) => {
      console.log(`  WhatsApp site-link push error: ${err.message}`);
    });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
    return res.end();
  }

  if (req.method === "POST" && urlPath === "/incoming-sme-code") {
    readJsonBody(req)
      .then((body) => {
        const code = String(body.code || "").trim();
        if (!code) {
          res.writeHead(400, { "Content-Type": "application/json; charset=utf-8" });
          res.end(JSON.stringify({ ok: false, error: "Missing 'code' in request body" }));
          return;
        }
        incomingCode = {
          code,
          phase: String(body.phase || "live"),
          source: String(body.source || "whatsapp-bot"),
          message: String(body.message || ""),
          updatedAt: new Date(),
        };
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            ok: true,
            endpoint: "/incoming-sme-code",
            receivedCode: incomingCode.code,
            phase: incomingCode.phase,
            updatedAt: toIsoLocal(incomingCode.updatedAt),
          })
        );
      })
      .catch((err) => {
        const isPayload = err && /Payload too large/.test(String(err.message || ""));
        res.writeHead(isPayload ? 413 : 400, {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ ok: false, error: err.message || "Invalid request" }));
      });
    return;
  }

  if (urlPath === "/api/next-code") {
    const now = new Date();
    const windows = getSessionWindows(now);
    const next = windows.find((slot) => now < slot.start) || windows[0];
    const payload = {
      phase: "next",
      code: next.code,
      now: toIsoLocal(now),
      nextSession: {
        hour: next.hour,
        start: toIsoLocal(next.start),
        preliveStart: toIsoLocal(next.preliveStart),
      },
      message: `NEXT CODE: ${next.code} (opens at ${toIsoLocal(next.start)})`,
    };
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    return res.end(JSON.stringify(payload, null, 2));
  }

  if (urlPath === "/api/session-code") {
    const now = new Date();
    const { phase, slot } = getSessionState(now);
    const activeCode = incomingCode
      ? {
          phase: incomingCode.phase || phase,
          code: incomingCode.code || slot.code,
          message:
            incomingCode.message ||
            `BOT CODE (${incomingCode.source || "whatsapp-bot"}): ${incomingCode.code}`,
        }
      : null;
    const payload = {
      phase: activeCode ? activeCode.phase : phase,
      code: activeCode ? activeCode.code : slot.code,
      now: toIsoLocal(now),
      session: {
        hour: slot.hour,
        start: toIsoLocal(slot.start),
        end: toIsoLocal(slot.end),
        preliveStart: toIsoLocal(slot.preliveStart),
      },
      incomingCode: incomingCode
        ? {
            code: incomingCode.code,
            phase: incomingCode.phase,
            source: incomingCode.source,
            updatedAt: toIsoLocal(incomingCode.updatedAt),
          }
        : null,
      scheduleHours: LIVE_SESSION_HOURS,
      message: activeCode
        ? activeCode.message
        : phase === "live"
          ? `LIVE NOW. Code: ${slot.code}`
          : phase === "prelive"
            ? `GOING LIVE SOON. Upcoming code: ${slot.code}`
            : `OFFLINE. Next code: ${slot.code}`,
    };
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    });
    return res.end(JSON.stringify(payload, null, 2));
  }

  let filePath = path.join(ROOT, urlPath);
  if (filePath.endsWith(path.sep)) filePath += "index.html";
  if (path.dirname(filePath).indexOf(ROOT) !== 0) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end("Not found");
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

const phoneUrl = writeUrlFile();
server.listen(PORT, "0.0.0.0", () => {
  console.log();
  console.log("  Aviator Pro Predictor - Phone Server");
  console.log("  =====================================");
  console.log();
  console.log(`  Phone link:  ${phoneUrl}`);
  console.log(`  QR page:     http://localhost:${PORT}/scan.html`);
  console.log();
  console.log("  Scan the QR with your phone (same Wi-Fi).");
  console.log("  Press Ctrl+C to stop");
  console.log();
  if (!NO_BROWSER) {
    exec(`start http://localhost:${PORT}/scan.html`);
  }
  maybeShareSiteLinkToWhatsapp(new Date());
});

setInterval(() => {
  maybeShareSiteLinkToWhatsapp(new Date());
  maybeShareNextCodeToWhatsapp(new Date());
}, 30000);
