const CONFIG = {
  cols: 20,
  rows: 20,
  cellSize: 24,
  initialIntervalMs: 140,
  minIntervalMs: 70,
  speedupEveryPoints: 5,
  speedupDeltaMs: 10,
  walls: true,
};

const STORAGE_KEY_HIGH_SCORE = "snake_high_score_v1";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const highScoreEl = document.getElementById("highScore");

const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");

const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayTextEl = document.getElementById("overlayText");

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
  W: { x: 0, y: -1 },
  S: { x: 0, y: 1 },
  A: { x: -1, y: 0 },
  D: { x: 1, y: 0 },
};

const state = {
  status: "ready",
  intervalMs: CONFIG.initialIntervalMs,
  timerId: null,
  score: 0,
  level: 1,
  highScore: 0,
  snake: [],
  dir: { x: 1, y: 0 },
  dirQueue: [],
  food: { x: 0, y: 0 },
};

function posKey(p) {
  return `${p.x},${p.y}`;
}

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

function clampInterval(ms) {
  return Math.max(CONFIG.minIntervalMs, ms);
}

function setOverlay(visible, title, text) {
  overlayEl.style.display = visible ? "grid" : "none";
  if (title != null) overlayTitleEl.textContent = title;
  if (text != null) overlayTextEl.textContent = text;
}

function setStatus(nextStatus) {
  state.status = nextStatus;

  if (nextStatus === "ready") {
    setOverlay(true, "Snake", "Pressione Iniciar ou Enter");
    pauseBtn.disabled = true;
    startBtn.textContent = "Iniciar";
  }

  if (nextStatus === "running") {
    setOverlay(false);
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Pausar";
    startBtn.textContent = "Reiniciar";
  }

  if (nextStatus === "paused") {
    setOverlay(true, "Pausado", "Pressione Espaço para continuar");
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Continuar";
    startBtn.textContent = "Reiniciar";
  }

  if (nextStatus === "gameover") {
    setOverlay(true, "Game Over", "Pressione Enter ou Reiniciar");
    pauseBtn.disabled = true;
    startBtn.textContent = "Reiniciar";
  }

  if (nextStatus === "win") {
    setOverlay(true, "Você venceu!", "Tabuleiro completo. Pressione Enter ou Reiniciar");
    pauseBtn.disabled = true;
    startBtn.textContent = "Reiniciar";
  }
}

function updateHud() {
  scoreEl.textContent = String(state.score);
  levelEl.textContent = String(state.level);
  highScoreEl.textContent = String(state.highScore);
}

function loadHighScore() {
  const raw = localStorage.getItem(STORAGE_KEY_HIGH_SCORE);
  const n = Number(raw);
  state.highScore = Number.isFinite(n) ? n : 0;
}

function saveHighScore() {
  localStorage.setItem(STORAGE_KEY_HIGH_SCORE, String(state.highScore));
}

function resetGame() {
  state.score = 0;
  state.level = 1;
  state.intervalMs = CONFIG.initialIntervalMs;

  const startX = Math.floor(CONFIG.cols / 2);
  const startY = Math.floor(CONFIG.rows / 2);

  state.snake = [
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
    { x: startX - 2, y: startY },
  ];

  state.dir = { x: 1, y: 0 };
  state.dirQueue = [];

  placeFood();
  updateHud();
  render();
}

function startLoop() {
  stopLoop();
  state.timerId = window.setInterval(tick, state.intervalMs);
}

function stopLoop() {
  if (state.timerId != null) {
    window.clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startGame() {
  resetGame();
  setStatus("running");
  startLoop();
}

function pauseGame(auto = false) {
  if (state.status !== "running") return;
  stopLoop();
  state.dirQueue = [];
  setStatus("paused");
  if (auto) {
    overlayTextEl.textContent = "Jogo pausado por perda de foco";
  }
}

function resumeGame() {
  if (state.status !== "paused") return;
  setStatus("running");
  startLoop();
}

function endGame(status) {
  stopLoop();
  setStatus(status);
}

function computeLevelFromScore(score) {
  return 1 + Math.floor(score / CONFIG.speedupEveryPoints);
}

function maybeUpdateSpeed() {
  const nextLevel = computeLevelFromScore(state.score);
  if (nextLevel === state.level) return;

  state.level = nextLevel;
  const steps = nextLevel - 1;
  state.intervalMs = clampInterval(CONFIG.initialIntervalMs - steps * CONFIG.speedupDeltaMs);

  if (state.status === "running") {
    startLoop();
  }
}

function placeFood() {
  const occupied = new Set(state.snake.map(posKey));
  const free = [];

  for (let y = 0; y < CONFIG.rows; y += 1) {
    for (let x = 0; x < CONFIG.cols; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) free.push({ x, y });
    }
  }

  if (free.length === 0) {
    state.food = { x: -1, y: -1 };
    endGame("win");
    return;
  }

  state.food = free[Math.floor(Math.random() * free.length)];
}

function tick() {
  if (state.status !== "running") return;

  if (state.dirQueue.length > 0) {
    state.dir = state.dirQueue.shift();
  }

  const head = state.snake[0];
  let newHead = { x: head.x + state.dir.x, y: head.y + state.dir.y };

  if (CONFIG.walls) {
    if (newHead.x < 0 || newHead.x >= CONFIG.cols || newHead.y < 0 || newHead.y >= CONFIG.rows) {
      endGame("gameover");
      return;
    }
  } else {
    newHead = {
      x: (newHead.x + CONFIG.cols) % CONFIG.cols,
      y: (newHead.y + CONFIG.rows) % CONFIG.rows,
    };
  }

  const grow = newHead.x === state.food.x && newHead.y === state.food.y;
  const tail = state.snake[state.snake.length - 1];

  const occupied = new Set(state.snake.map(posKey));
  if (!grow) {
    occupied.delete(posKey(tail));
  }

  if (occupied.has(posKey(newHead))) {
    endGame("gameover");
    return;
  }

  state.snake.unshift(newHead);

  if (!grow) {
    state.snake.pop();
  } else {
    state.score += 1;
    if (state.score > state.highScore) {
      state.highScore = state.score;
      saveHighScore();
    }
    maybeUpdateSpeed();
    placeFood();
  }

  updateHud();
  render();
}

function render() {
  const w = canvas.width;
  const h = canvas.height;
  const s = CONFIG.cellSize;

  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = "rgba(8, 12, 24, 0.95)";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= CONFIG.cols; x += 1) {
    ctx.beginPath();
    ctx.moveTo(x * s + 0.5, 0);
    ctx.lineTo(x * s + 0.5, h);
    ctx.stroke();
  }
  for (let y = 0; y <= CONFIG.rows; y += 1) {
    ctx.beginPath();
    ctx.moveTo(0, y * s + 0.5);
    ctx.lineTo(w, y * s + 0.5);
    ctx.stroke();
  }

  if (state.food.x >= 0) {
    const fx = state.food.x * s;
    const fy = state.food.y * s;

    ctx.fillStyle = "#ff5a7a";
    ctx.beginPath();
    ctx.arc(fx + s / 2, fy + s / 2, Math.max(4, s * 0.32), 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = state.snake.length - 1; i >= 0; i -= 1) {
    const p = state.snake[i];
    const x = p.x * s;
    const y = p.y * s;

    ctx.fillStyle = i === 0 ? "#36d17b" : "#7cf7a1";
    const pad = i === 0 ? 3 : 4;
    ctx.fillRect(x + pad, y + pad, s - pad * 2, s - pad * 2);
  }
}

function initCanvas() {
  canvas.width = CONFIG.cols * CONFIG.cellSize;
  canvas.height = CONFIG.rows * CONFIG.cellSize;
}

function handleKeyDown(e) {
  const key = e.key;

  const isArrowOrWasd = DIRS[key] != null;
  const isSpace = key === " " || key === "Spacebar";
  const isEnter = key === "Enter";

  if (isArrowOrWasd || isSpace || isEnter) {
    if (state.status === "running" || state.status === "paused" || state.status === "ready") {
      e.preventDefault();
    }
  }

  if (isEnter) {
    if (state.status === "ready" || state.status === "gameover" || state.status === "win") {
      startGame();
      return;
    }
  }

  if (isSpace) {
    if (state.status === "running") {
      pauseGame(false);
      return;
    }
    if (state.status === "paused") {
      resumeGame();
      return;
    }
  }

  if (isArrowOrWasd && state.status === "running") {
    const next = DIRS[key];
    if (!next) return;

    const last = state.dirQueue.length > 0 ? state.dirQueue[state.dirQueue.length - 1] : state.dir;
    if (isOpposite(next, last)) return;

    if (state.dirQueue.length === 0) {
      state.dirQueue.push(next);
      return;
    }

    if (state.dirQueue.length === 1) {
      state.dirQueue.push(next);
      return;
    }

    state.dirQueue[1] = next;
  }
}

function onStartClick() {
  if (state.status === "running" || state.status === "paused") {
    startGame();
    return;
  }

  if (state.status === "ready" || state.status === "gameover" || state.status === "win") {
    startGame();
  }
}

function onPauseClick() {
  if (state.status === "running") {
    pauseGame(false);
    return;
  }

  if (state.status === "paused") {
    resumeGame();
  }
}

function init() {
  initCanvas();
  loadHighScore();
  updateHud();

  document.addEventListener("keydown", handleKeyDown, { passive: false });
  window.addEventListener("blur", () => pauseGame(true));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseGame(true);
  });

  startBtn.addEventListener("click", onStartClick);
  pauseBtn.addEventListener("click", onPauseClick);

  resetGame();
  setStatus("ready");
}

init();
