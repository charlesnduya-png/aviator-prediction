/**
 * Aviator Pro Predictor — Janta.ke + Betika (Room 1, 2, 3)
 * Betika linked to official Aviator: https://www.betika.com/en-ke/aviator
 */

/** Official Betika Aviator (Kenya) */
const BETIKA_AVIATOR_URL = "https://www.betika.com/en-ke/aviator";

/** Official Janta.ke Aviator — top-rated platform in this app */
const JANTA_AVIATOR_URL = "https://janta.ke/home/game/aviator";
const SPORTPESA_AVIATOR_URL = "https://www.sportpesa.co.ke";
const MOZZART_AVIATOR_URL = "https://www.mozzartbet.co.ke";
const ODIBETS_AVIATOR_URL = "https://odibets.com";

const TICK_MS = 3000;
const ROUND_MS = 5000;
const LIVE_SESSION_HOURS = [9, 14, 21];
const LIVE_SESSION_DURATION_MIN = 60;
const PRELIVE_CODE_WINDOW_MIN = 20;

const PLATFORMS = {
  janta: {
    name: "Janta.ke",
    winBias: 1.18,
    confidenceBase: 72,
    crashRange: [1.45, 4.8],
    lowCrashWeight: 0.22,
  },
};

const EXTRA_BOOKS = {
  sportpesa: {
    name: "SportPesa",
    url: SPORTPESA_AVIATOR_URL,
    winBias: 1.01,
    confidenceBase: 59,
    crashRange: [1.18, 3.7],
    lowCrashWeight: 0.33,
  },
  mozzart: {
    name: "Mozzart",
    url: MOZZART_AVIATOR_URL,
    winBias: 1.03,
    confidenceBase: 60,
    crashRange: [1.2, 3.9],
    lowCrashWeight: 0.31,
  },
  odibets: {
    name: "Odibets",
    url: ODIBETS_AVIATOR_URL,
    winBias: 0.99,
    confidenceBase: 57,
    crashRange: [1.12, 3.6],
    lowCrashWeight: 0.35,
  },
};

const EXTRA_IDS = ["sportpesa", "mozzart", "odibets"];

const BETIKA_ROOMS = {
  room1: {
    name: "Room 1",
    server: "Server A",
    inGameServer: "Server 1",
    winBias: 1.05,
    confidenceBase: 62,
    crashRange: [1.2, 3.8],
    lowCrashWeight: 0.3,
  },
  room2: {
    name: "Room 2",
    server: "Server B",
    inGameServer: "Server 2",
    winBias: 1.0,
    confidenceBase: 58,
    crashRange: [1.12, 3.5],
    lowCrashWeight: 0.34,
  },
  room3: {
    name: "Room 3",
    server: "Server C",
    inGameServer: "Server 3",
    winBias: 0.97,
    confidenceBase: 55,
    crashRange: [1.08, 3.4],
    lowCrashWeight: 0.38,
  },
};

const ROOM_IDS = ["room1", "room2", "room3"];

const state = {
  janta: { history: [] },
  betika: {
    activeRoom: "room1",
    rooms: {
      room1: { history: [], last: null },
      room2: { history: [], last: null },
      room3: { history: [], last: null },
    },
  },
  extra: {
    sportpesa: { history: [], last: null },
    mozzart: { history: [], last: null },
    odibets: { history: [], last: null },
  },
};

let tickTimer = null;
let roundTimer = null;
let lastJantaResult = null;
let clockTimer = null;
let scheduleTimer = null;
let loopsRunning = false;
let activeAccessCode = "";
let isUnlocked = false;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getRoomConfig(roomId) {
  return BETIKA_ROOMS[roomId];
}

function generateCrashMultiplier(cfg) {
  const [minR, maxR] = cfg.crashRange;
  const roll = Math.random();
  if (roll < cfg.lowCrashWeight) return parseFloat(rand(1.01, 1.65).toFixed(2));
  if (roll < 0.75) return parseFloat(rand(minR, (minR + maxR) / 2).toFixed(2));
  return parseFloat(rand((minR + maxR) / 2, maxR).toFixed(2));
}

function generateHistory(cfg, count = 12) {
  return Array.from({ length: count }, () => generateCrashMultiplier(cfg));
}

function analyzePattern(history) {
  if (history.length < 3) return rand(55, 75);
  const recent = history.slice(-5);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((s, v) => s + (v - avg) ** 2, 0) / recent.length;
  return clamp((1 / (1 + variance)) * 85 + rand(-8, 12), 42, 96);
}

function computeWinIndex(cfg, confidence, pattern) {
  return clamp((confidence * 0.55 + pattern * 0.45) * cfg.winBias, 48, 92).toFixed(1);
}

function predictNextCrash(cfg, history, isJanta = false) {
  const pattern = analyzePattern(history);
  const momentum = history.length
    ? history.slice(-3).reduce((a, b) => a + b, 0) / 3
    : 2;
  let predicted =
    momentum * 0.4 +
    (history[history.length - 1] || 2) * 0.25 +
    rand(cfg.crashRange[0], cfg.crashRange[1]) * 0.35;
  if (isJanta) predicted *= rand(1.02, 1.12);
  predicted = clamp(predicted, 1.15, cfg.crashRange[1]);
  return {
    crash: parseFloat(predicted.toFixed(2)),
    pattern,
    momentum: clamp((momentum / cfg.crashRange[1]) * 100, 20, 95),
    volatility: clamp(rand(18, 55) + (isJanta ? 0 : 12), 15, 78),
  };
}

function getConfidence(cfg, pattern, volatility, isJanta = false) {
  const adj = pattern * 0.22 - volatility * 0.15 + rand(-4, 8);
  const max = isJanta ? 92 : 82;
  return clamp(cfg.confidenceBase + adj, 52, max);
}

function safeCashout(crash, confidence) {
  return parseFloat((crash * (0.55 + (confidence / 100) * 0.25)).toFixed(2));
}

function riskLabel(confidence, isJanta) {
  if (isJanta && confidence >= 70) return { text: "Low", cls: "stat__value--low" };
  if (confidence >= 65) return { text: "Low–Med", cls: "stat__value--medium" };
  if (confidence >= 55) return { text: "Medium", cls: "stat__value--medium" };
  return { text: "Elevated", cls: "" };
}

function signalText(confidence, isJanta) {
  if (isJanta) {
    if (confidence >= 78) return { text: "STRONG BUY SIGNAL", cls: "action-signal--strong" };
    if (confidence >= 68) return { text: "BUY SIGNAL", cls: "action-signal--strong" };
    return { text: "HOLD — FAVORABLE", cls: "action-signal--strong" };
  }
  if (confidence >= 70) return { text: "ROOM SIGNAL — GOOD", cls: "action-signal--moderate" };
  if (confidence >= 60) return { text: "MODERATE SIGNAL", cls: "action-signal--moderate" };
  return { text: "CAUTIOUS — WAIT", cls: "action-signal--moderate" };
}

function historyClass(value) {
  if (value < 1.5) return "low";
  if (value < 2.5) return "mid";
  return "high";
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setBar(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = `${clamp(pct, 0, 100)}%`;
}

function formatTime(date) {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
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

  const next = windows.find((slot) => now < slot.preliveStart) || windows[0];
  return { phase: "offline", slot: next };
}

function stopLoops() {
  clearInterval(tickTimer);
  clearInterval(roundTimer);
  tickTimer = null;
  roundTimer = null;
  loopsRunning = false;
}

function setAccessLock(locked) {
  const gate = document.getElementById("accessGate");
  if (!gate) return;
  gate.hidden = !locked;
  document.body.classList.toggle("is-locked", locked);
}

function syncAccessGate(phase, slot, now) {
  activeAccessCode = slot.code;
  const hint = document.getElementById("accessCodeHint");
  const text = document.getElementById("accessGateText");
  const errorEl = document.getElementById("accessCodeError");
  const input = document.getElementById("accessCodeInput");

  const remember = sessionStorage.getItem("aviator_access_code");
  if (remember !== activeAccessCode) {
    isUnlocked = false;
    setAccessLock(true);
  }

  if (hint) hint.textContent = `Current code: ${activeAccessCode}`;
  if (text) {
    if (phase === "live") {
      text.textContent = "Session is live. Enter code to open now.";
    } else {
      text.textContent = `Website closed. Opens at ${formatTime(slot.start)}. Enter current code to open.`;
    }
  }
  if (!isUnlocked && input) {
    input.setAttribute("placeholder", `Enter code (${activeAccessCode})`);
  }
  if (errorEl && isUnlocked) errorEl.textContent = "";
  if (phase !== "live" && !isUnlocked) stopLoops();
  if (!isUnlocked && input && document.activeElement !== input) input.focus();
  const nextEl = document.getElementById("nextOpenTimer");
  if (nextEl) nextEl.textContent = `Opens in ${formatCountdown(slot.start.getTime() - now.getTime())}`;
}

function initAccessGate() {
  const form = document.getElementById("accessGateForm");
  const input = document.getElementById("accessCodeInput");
  const errorEl = document.getElementById("accessCodeError");
  if (!form || !input) return;
  setAccessLock(true);
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const submitted = input.value.trim().toUpperCase();
    if (submitted && submitted === activeAccessCode) {
      isUnlocked = true;
      sessionStorage.setItem("aviator_access_code", submitted);
      setAccessLock(false);
      if (errorEl) errorEl.textContent = "";
      syncLiveSchedule();
      return;
    }
    if (errorEl) errorEl.textContent = "Invalid code. Please enter the current code.";
  });
}

function syncScheduleUI(now = new Date()) {
  const statusEl = document.getElementById("liveStatus");
  const codeEl = document.getElementById("sessionCode");
  const nextEl = document.getElementById("nextOpenTimer");
  const { phase, slot } = getSessionState(now);
  syncAccessGate(phase, slot, now);

  if (phase === "live") {
    if (statusEl) statusEl.textContent = `Live now (${formatTime(slot.start)}-${formatTime(slot.end)})`;
    if (codeEl) codeEl.textContent = `Code ${slot.code}`;
    if (nextEl) nextEl.textContent = `Open window ends at ${formatTime(slot.end)}`;
    return true;
  }

  if (phase === "prelive") {
    if (statusEl) statusEl.textContent = `Going live at ${formatTime(slot.start)}`;
    if (codeEl) codeEl.textContent = `Upcoming code ${slot.code}`;
    if (nextEl) nextEl.textContent = `Opens in ${formatCountdown(slot.start.getTime() - now.getTime())}`;
    return false;
  }

  if (statusEl) statusEl.textContent = `Offline · Next ${formatTime(slot.start)}`;
  if (codeEl) codeEl.textContent = `Next code ${slot.code}`;
  if (nextEl) nextEl.textContent = `Opens in ${formatCountdown(slot.start.getTime() - now.getTime())}`;
  return false;
}

function renderHistory(listId, history) {
  const ul = document.getElementById(listId);
  if (!ul) return;
  ul.innerHTML = history
    .slice(-8)
    .reverse()
    .map((v) => `<li class="${historyClass(v)}">${v.toFixed(2)}×</li>`)
    .join("");
}

function computeRoomPrediction(roomId) {
  const cfg = getRoomConfig(roomId);
  const roomState = state.betika.rooms[roomId];
  if (!roomState.history.length) {
    roomState.history = generateHistory(cfg);
  }
  const { crash, pattern, momentum, volatility } = predictNextCrash(
    cfg,
    roomState.history
  );
  const confidence = getConfidence(cfg, pattern, volatility);
  const result = {
    roomId,
    name: cfg.name,
    server: cfg.server,
    crash,
    pattern,
    momentum,
    volatility,
    confidence,
    cashout: safeCashout(crash, confidence),
    winIndex: parseFloat(computeWinIndex(cfg, confidence, pattern)),
    risk: riskLabel(confidence, false),
    signal: signalText(confidence, false),
  };
  roomState.last = result;
  return result;
}

function updateExtraBook(id) {
  const cfg = EXTRA_BOOKS[id];
  const box = state.extra[id];
  if (!box.history.length) box.history = generateHistory(cfg);
  const { crash, pattern, momentum, volatility } = predictNextCrash(cfg, box.history);
  const confidence = getConfidence(cfg, pattern, volatility);
  const winIndex = parseFloat(computeWinIndex(cfg, confidence, pattern));
  const cashout = safeCashout(crash, confidence);
  const risk = riskLabel(confidence, false);
  const signal = signalText(confidence, false);
  const result = { id, crash, confidence, winIndex, cashout, risk, signal, pattern, momentum, volatility };
  box.last = result;

  setText(`${id}Crash`, crash.toFixed(2));
  setText(`${id}Confidence`, `${confidence.toFixed(0)}%`);
  setText(`${id}Cashout`, `${cashout.toFixed(2)}×`);
  setText(`${id}WinIndex`, `${winIndex.toFixed(1)}%`);
  const riskEl = document.getElementById(`${id}Risk`);
  if (riskEl) {
    riskEl.textContent = risk.text;
    riskEl.className = `stat__value ${risk.cls}`.trim();
  }
  const sigEl = document.getElementById(`${id}Signal`);
  if (sigEl) {
    sigEl.textContent = signal.text;
    sigEl.className = `action-signal ${signal.cls}`;
  }
  setBar(`${id}Pattern`, pattern);
  setText(`${id}PatternVal`, `${pattern.toFixed(0)}%`);
  setBar(`${id}Momentum`, momentum);
  setText(`${id}MomentumVal`, `${momentum.toFixed(0)}%`);
  setBar(`${id}Volatility`, volatility);
  setText(`${id}VolatilityVal`, `${volatility.toFixed(0)}%`);
  renderHistory(`${id}History`, box.history);

  const playBtn = document.getElementById(`${id}PlayBtn`);
  if (playBtn) playBtn.href = cfg.url;

  return result;
}

function updateAllExtraBooks() {
  const results = EXTRA_IDS.map((id) => updateExtraBook(id));
  const avgCrash = results.reduce((s, r) => s + r.crash, 0) / results.length;
  const avgConf = results.reduce((s, r) => s + r.confidence, 0) / results.length;
  const avgWin = results.reduce((s, r) => s + r.winIndex, 0) / results.length;
  return { results, avgCrash, avgConf, avgWin };
}

function buildJantaTip(result) {
  return (
    `🔥 JANTA.KE AVIATOR — #1 PICK\n` +
    `Cash out near: ${result.cashout.toFixed(2)}x\n` +
    `Predicted crash: ${result.crash.toFixed(2)}x\n` +
    `Confidence: ${result.confidence.toFixed(0)}% · Win index: ${result.winIndex}%\n` +
    `Signal: ${result.signal.text}\n` +
    `Play: ${JANTA_AVIATOR_URL}`
  );
}

function syncJantaConnect(result) {
  setText("jantaPlayCashout", `${result.cashout.toFixed(2)}×`);
  setText("jantaPlayCrash", `${result.crash.toFixed(2)}×`);

  const playBtn = document.getElementById("jantaPlayBtn");
  const roomBtn = document.getElementById("jantaRoomPlayBtn");
  [playBtn, roomBtn].forEach((el) => {
    if (el) el.href = JANTA_AVIATOR_URL;
  });

  const hype = document.getElementById("jantaHypeText");
  if (hype) {
    const line =
      result.confidence >= 75
        ? `Live signal is <strong>on fire</strong> — ${result.confidence.toFixed(0)}% confidence. Janta.ke beats Betika on every metric right now.`
        : `Engine rated <strong>Janta.ke #1</strong> — ${result.winIndex}% win index, safer cash-out than Betika rooms.`;
    hype.innerHTML = line;
  }

  const status = document.getElementById("jantaLinkStatus");
  if (status) {
    const opened = sessionStorage.getItem("janta_last_open");
    status.innerHTML = opened
      ? `<span class="janta-connect__dot janta-connect__dot--synced"></span> Janta opened — <strong>use ${result.cashout.toFixed(2)}× cash-out</strong>`
      : `<span class="janta-connect__dot"></span> Linked to <a href="${JANTA_AVIATOR_URL}" target="_blank" rel="noopener noreferrer">Janta Aviator</a>`;
  }
}

function openJantaAviator(result) {
  sessionStorage.setItem("janta_last_open", String(Date.now()));
  sessionStorage.setItem("janta_last_tip", buildJantaTip(result));
  window.open(JANTA_AVIATOR_URL, "_blank", "noopener,noreferrer");
  syncJantaConnect(result);
  if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
}

async function copyJantaTip(result) {
  const text = buildJantaTip(result);
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("jantaCopyBtn");
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Copied! 🔥";
      setTimeout(() => { btn.textContent = prev; }, 1500);
    }
    if (navigator.vibrate) navigator.vibrate(8);
  } catch {
    window.prompt("Copy this hot tip:", text);
  }
}

function initJantaConnect() {
  document.getElementById("jantaPlayBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (lastJantaResult) openJantaAviator(lastJantaResult);
    else window.open(JANTA_AVIATOR_URL, "_blank", "noopener,noreferrer");
  });

  document.getElementById("jantaRoomPlayBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (lastJantaResult) openJantaAviator(lastJantaResult);
  });

  document.getElementById("jantaCopyBtn")?.addEventListener("click", () => {
    if (lastJantaResult) copyJantaTip(lastJantaResult);
  });
}

function updateJanta() {
  const cfg = PLATFORMS.janta;
  if (!state.janta.history.length) state.janta.history = generateHistory(cfg);

  const { crash, pattern, momentum, volatility } = predictNextCrash(
    cfg,
    state.janta.history,
    true
  );
  const confidence = getConfidence(cfg, pattern, volatility, true);
  const cashout = safeCashout(crash, confidence);
  const winIndex = computeWinIndex(cfg, confidence, pattern);
  const risk = riskLabel(confidence, true);
  const signal = signalText(confidence, true);

  const result = {
    crash,
    confidence,
    cashout,
    winIndex: parseFloat(winIndex),
    signal,
  };
  lastJantaResult = result;
  syncJantaConnect(result);

  setText("jantaCrash", crash.toFixed(2));
  setText("jantaConfidence", `${confidence.toFixed(0)}%`);
  setText("jantaCashout", `${cashout.toFixed(2)}×`);
  setText("jantaWinIndex", `${winIndex}%`);

  const riskEl = document.getElementById("jantaRisk");
  if (riskEl) {
    riskEl.textContent = risk.text;
    riskEl.className = `stat__value ${risk.cls}`.trim();
  }

  setBar("jantaPattern", pattern);
  setText("jantaPatternVal", `${pattern.toFixed(0)}%`);
  setBar("jantaMomentum", momentum);
  setText("jantaMomentumVal", `${momentum.toFixed(0)}%`);
  setBar("jantaVolatility", volatility);
  setText("jantaVolatilityVal", `${volatility.toFixed(0)}%`);

  const sigEl = document.getElementById("jantaSignal");
  if (sigEl) {
    sigEl.textContent = signal.text;
    sigEl.className = `action-signal ${signal.cls}`;
  }

  renderHistory("jantaHistory", state.janta.history);

  return result;
}

function renderRoomsOverview(roomResults) {
  const container = document.getElementById("roomsOverview");
  if (!container) return;

  container.innerHTML = roomResults
    .map((r) => {
      const active = r.roomId === state.betika.activeRoom ? " room-chip--active" : "";
      const hot = r.confidence >= 65 ? " room-chip--hot" : "";
      return `
        <button type="button" class="room-chip${active}${hot}" data-room="${r.roomId}" aria-label="${r.name} ${r.crash}x">
          <span class="room-chip__name">${r.name}</span>
          <span class="room-chip__crash">${r.crash.toFixed(2)}×</span>
          <span class="room-chip__conf">${r.confidence.toFixed(0)}%</span>
        </button>`;
    })
    .join("");

  container.querySelectorAll(".room-chip").forEach((btn) => {
    btn.addEventListener("click", () => selectBetikaRoom(btn.dataset.room));
  });
}

function buildBetikaTip(roomResult) {
  const cfg = getRoomConfig(roomResult.roomId);
  return (
    `Aviator Pro · ${cfg.name} (${cfg.inGameServer})\n` +
    `Cash out near: ${roomResult.cashout.toFixed(2)}x\n` +
    `Predicted crash: ${roomResult.crash.toFixed(2)}x\n` +
    `Confidence: ${roomResult.confidence.toFixed(0)}%\n` +
    `Play: ${BETIKA_AVIATOR_URL}`
  );
}

function syncBetikaConnect(roomResult) {
  const cfg = getRoomConfig(roomResult.roomId);
  const playBtn = document.getElementById("betikaPlayBtn");
  const roomPlayBtn = document.getElementById("betikaRoomPlayBtn");

  [playBtn, roomPlayBtn].forEach((el) => {
    if (el) el.href = BETIKA_AVIATOR_URL;
  });

  setText(
    "betikaRoomHint",
    `${cfg.name} → In Betika Aviator, select ${cfg.inGameServer} (same as our ${cfg.server}).`
  );
  setText("betikaPlayCashout", `${roomResult.cashout.toFixed(2)}×`);
  setText("betikaPlayCrash", `${roomResult.crash.toFixed(2)}×`);

  const status = document.getElementById("betikaLinkStatus");
  if (status) {
    const opened = sessionStorage.getItem("betika_last_open");
    status.innerHTML = opened
      ? `<span class="betika-connect__dot betika-connect__dot--synced"></span> Betika opened · predictions active`
      : `<span class="betika-connect__dot"></span> Linked to <a href="${BETIKA_AVIATOR_URL}" target="_blank" rel="noopener noreferrer">Betika Aviator</a>`;
  }
}

function openBetikaAviator(roomResult) {
  sessionStorage.setItem("betika_last_open", String(Date.now()));
  sessionStorage.setItem("betika_last_tip", buildBetikaTip(roomResult));
  sessionStorage.setItem("betika_active_room", roomResult.roomId);
  window.open(BETIKA_AVIATOR_URL, "_blank", "noopener,noreferrer");
  syncBetikaConnect(roomResult);
  if (navigator.vibrate) navigator.vibrate(10);
}

async function copyBetikaTip(roomResult) {
  const text = buildBetikaTip(roomResult);
  try {
    await navigator.clipboard.writeText(text);
    const btn = document.getElementById("betikaCopyBtn");
    if (btn) {
      const prev = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => { btn.textContent = prev; }, 1500);
    }
    if (navigator.vibrate) navigator.vibrate(8);
  } catch {
    window.prompt("Copy this tip:", text);
  }
}

function initBetikaConnect() {
  document.getElementById("betikaPlayBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const room = state.betika.rooms[state.betika.activeRoom]?.last;
    if (room) openBetikaAviator(room);
    else window.open(BETIKA_AVIATOR_URL, "_blank", "noopener,noreferrer");
  });

  document.getElementById("betikaRoomPlayBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    const room = state.betika.rooms[state.betika.activeRoom]?.last;
    if (room) openBetikaAviator(room);
  });

  document.getElementById("betikaCopyBtn")?.addEventListener("click", () => {
    const room = state.betika.rooms[state.betika.activeRoom]?.last;
    if (room) copyBetikaTip(room);
  });
}

function updateBetikaDetail(roomResult) {
  const cfg = getRoomConfig(roomResult.roomId);
  setText("betikaActiveServer", `${cfg.server} · ${cfg.name} · Betika Aviator`);
  syncBetikaConnect(roomResult);
  setText("betikaHistoryLabel", cfg.name);
  setText("betikaCrash", roomResult.crash.toFixed(2));
  setText("betikaConfidence", `${roomResult.confidence.toFixed(0)}%`);
  setText("betikaCashout", `${roomResult.cashout.toFixed(2)}×`);

  const riskEl = document.getElementById("betikaRisk");
  if (riskEl) {
    riskEl.textContent = roomResult.risk.text;
    riskEl.className = `stat__value ${roomResult.risk.cls}`.trim();
  }

  setBar("betikaPattern", roomResult.pattern);
  setText("betikaPatternVal", `${roomResult.pattern.toFixed(0)}%`);
  setBar("betikaMomentum", roomResult.momentum);
  setText("betikaMomentumVal", `${roomResult.momentum.toFixed(0)}%`);
  setBar("betikaVolatility", roomResult.volatility);
  setText("betikaVolatilityVal", `${roomResult.volatility.toFixed(0)}%`);

  const sigEl = document.getElementById("betikaSignal");
  if (sigEl) {
    sigEl.textContent = roomResult.signal.text;
    sigEl.className = `action-signal ${roomResult.signal.cls}`;
  }

  renderHistory("betikaHistory", state.betika.rooms[roomResult.roomId].history);

  document.querySelectorAll(".room-tab").forEach((tab) => {
    const on = tab.dataset.room === roomResult.roomId;
    tab.classList.toggle("room-tab--active", on);
    tab.setAttribute("aria-selected", on ? "true" : "false");
  });
}

function selectBetikaRoom(roomId) {
  if (!BETIKA_ROOMS[roomId]) return;
  state.betika.activeRoom = roomId;
  const result = state.betika.rooms[roomId].last || computeRoomPrediction(roomId);
  updateBetikaDetail(result);
  renderRoomsOverview(ROOM_IDS.map((id) => state.betika.rooms[id].last || computeRoomPrediction(id)));
  if (navigator.vibrate) navigator.vibrate(8);
}

function updateAllBetikaRooms() {
  const results = ROOM_IDS.map((id) => computeRoomPrediction(id));
  const best = results.reduce((a, b) => (b.winIndex > a.winIndex ? b : a));

  setText("betikaBestWin", `${best.winIndex}% · ${best.name}`);
  renderRoomsOverview(results);

  const active = results.find((r) => r.roomId === state.betika.activeRoom) || results[0];
  updateBetikaDetail(active);

  setText("cmpRoom1", `${results[0].crash.toFixed(2)}× · ${results[0].confidence.toFixed(0)}%`);
  setText("cmpRoom2", `${results[1].crash.toFixed(2)}× · ${results[1].confidence.toFixed(0)}%`);
  setText("cmpRoom3", `${results[2].crash.toFixed(2)}× · ${results[2].confidence.toFixed(0)}%`);
  setText("cmpBestRoom", `${best.name} (${best.server}) — ${best.winIndex}% win index`);

  const avgCrash = results.reduce((s, r) => s + r.crash, 0) / results.length;
  const avgConf = results.reduce((s, r) => s + r.confidence, 0) / results.length;
  const avgWin = results.reduce((s, r) => s + r.winIndex, 0) / results.length;

  return { results, best, avgCrash, avgConf, avgWin };
}

function updateGlobal(janta, betika, extra) {
  const blendedCrash = (
    janta.crash * 0.4 +
    betika.avgCrash * 0.35 +
    extra.avgCrash * 0.25
  ).toFixed(2);
  const blendedConf = janta.confidence * 0.45 + betika.avgConf * 0.35 + extra.avgConf * 0.2;
  const blendedCash = (
    janta.cashout * 0.4 +
    betika.results[0].cashout * 0.15 +
    betika.results[1].cashout * 0.1 +
    betika.results[2].cashout * 0.1 +
    extra.results[0].cashout * 0.1 +
    extra.results[1].cashout * 0.08 +
    extra.results[2].cashout * 0.07
  ).toFixed(2);
  const signalStrength =
    blendedConf >= 75 ? "Strong" : blendedConf >= 65 ? "Moderate" : "Fair";

  const globalEl = document.getElementById("globalCrash");
  if (globalEl) globalEl.textContent = blendedCrash;

  setText("globalConfidence", `${blendedConf.toFixed(0)}%`);
  setText("globalCashout", `${blendedCash}×`);
  setText("globalSignal", signalStrength);
  setBar("globalBar", blendedConf);

  setText("cmpWinJanta", `${janta.winIndex}%`);
  setText("cmpWinBetika", `${betika.avgWin.toFixed(1)}% avg`);
  setText("cmpWinSportpesa", `${extra.results[0].winIndex.toFixed(1)}%`);
  setText("cmpWinMozzart", `${extra.results[1].winIndex.toFixed(1)}%`);
  setText("cmpWinOdibets", `${extra.results[2].winIndex.toFixed(1)}%`);
  setText("cmpCrashJanta", `${janta.crash.toFixed(2)}×`);
  setText("cmpCrashBetika", `${betika.best.crash.toFixed(2)}× best`);
  setText("cmpCrashSportpesa", `${extra.results[0].crash.toFixed(2)}×`);
  setText("cmpCrashMozzart", `${extra.results[1].crash.toFixed(2)}×`);
  setText("cmpCrashOdibets", `${extra.results[2].crash.toFixed(2)}×`);
}

function runPrediction(animate = true) {
  document.body.classList.toggle("is-updating", animate);
  const janta = updateJanta();
  const betika = updateAllBetikaRooms();
  const extra = updateAllExtraBooks();
  updateGlobal(janta, betika, extra);
  requestAnimationFrame(() => {
    document.body.classList.remove("is-updating");
  });
}

function simulateRoomRound(roomId) {
  const cfg = getRoomConfig(roomId);
  const next = generateCrashMultiplier(cfg);
  const room = state.betika.rooms[roomId];
  room.history.push(next);
  if (room.history.length > 20) room.history.shift();
}

function simulateRounds() {
  simulateRoomRound(ROOM_IDS[Math.floor(Math.random() * 3)]);
  if (Math.random() > 0.5) {
    const jantaNext = generateCrashMultiplier(PLATFORMS.janta);
    state.janta.history.push(jantaNext);
    if (state.janta.history.length > 20) state.janta.history.shift();
  }
  if (Math.random() > 0.5) {
    const pick = EXTRA_IDS[Math.floor(Math.random() * EXTRA_IDS.length)];
    const cfg = EXTRA_BOOKS[pick];
    state.extra[pick].history.push(generateCrashMultiplier(cfg));
    if (state.extra[pick].history.length > 20) state.extra[pick].history.shift();
  }
  runPrediction(true);
}

function refreshPredictions() {
  state.janta.history = generateHistory(PLATFORMS.janta);
  ROOM_IDS.forEach((id) => {
    state.betika.rooms[id].history = generateHistory(getRoomConfig(id));
    state.betika.rooms[id].last = null;
  });
  EXTRA_IDS.forEach((id) => {
    state.extra[id].history = generateHistory(EXTRA_BOOKS[id]);
    state.extra[id].last = null;
  });
  runPrediction(true);
  if (navigator.vibrate) navigator.vibrate(12);
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");
  setText("clock", `${h}:${m}:${s}`);
}

function initRoomTabs() {
  document.querySelectorAll(".room-tab").forEach((tab) => {
    tab.addEventListener("click", () => selectBetikaRoom(tab.dataset.room));
  });
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setActiveNav(targetId) {
  document.querySelectorAll(".bottom-nav__item[data-target]").forEach((btn) => {
    btn.classList.toggle("bottom-nav__item--active", btn.dataset.target === targetId);
  });
}

function initBottomNav() {
  document.querySelectorAll(".bottom-nav__item[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      scrollToSection(btn.dataset.target);
      setActiveNav(btn.dataset.target);
    });
  });
  document.getElementById("navRefresh")?.addEventListener("click", () => {
    refreshPredictions();
    scrollToSection("predict");
    setActiveNav("predict");
  });
}

let deferredInstallPrompt = null;

function initPWA() {
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (isStandalone) {
    document.body.classList.add("is-standalone");
    return;
  }
  const banner = document.getElementById("installBanner");
  const installBtn = document.getElementById("installBtn");
  const dismissBtn = document.getElementById("installDismiss");
  const iosHint = document.getElementById("iosHint");
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const dismissed = localStorage.getItem("aviator_install_dismissed") === "1";

  if (isIOS) {
    if (iosHint) iosHint.hidden = false;
    if (banner && !dismissed) banner.hidden = false;
    if (installBtn) {
      installBtn.textContent = "How to";
      installBtn.addEventListener("click", () => {
        scrollToSection("footer");
        iosHint?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    if (!dismissed && banner) banner.hidden = false;
  });

  installBtn?.addEventListener("click", async () => {
    if (!deferredInstallPrompt) {
      if (isIOS) scrollToSection("footer");
      return;
    }
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (banner) banner.hidden = true;
  });

  dismissBtn?.addEventListener("click", () => {
    if (banner) banner.hidden = true;
    localStorage.setItem("aviator_install_dismissed", "1");
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  });
}

function startLoops() {
  stopLoops();
  tickTimer = setInterval(() => runPrediction(false), TICK_MS);
  roundTimer = setInterval(simulateRounds, ROUND_MS);
  loopsRunning = true;
}

function syncLiveSchedule() {
  const shouldRun = syncScheduleUI(new Date());
  if (shouldRun && isUnlocked && !loopsRunning) {
    runPrediction(false);
    startLoops();
  } else if ((!shouldRun || !isUnlocked) && loopsRunning) {
    stopLoops();
  }
}

function init() {
  state.janta.history = generateHistory(PLATFORMS.janta);
  ROOM_IDS.forEach((id) => {
    state.betika.rooms[id].history = generateHistory(getRoomConfig(id));
  });
  EXTRA_IDS.forEach((id) => {
    state.extra[id].history = generateHistory(EXTRA_BOOKS[id]);
  });

  initRoomTabs();
  initAccessGate();
  initJantaConnect();
  initBetikaConnect();
  runPrediction(false);
  updateClock();
  initBottomNav();
  initPWA();
  registerServiceWorker();
  syncLiveSchedule();

  clockTimer = setInterval(updateClock, 1000);
  scheduleTimer = setInterval(syncLiveSchedule, 1000);
  document.getElementById("refreshBtn")?.addEventListener("click", refreshPredictions);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopLoops();
    } else {
      syncLiveSchedule();
    }
  });
}

document.addEventListener("DOMContentLoaded", init);
