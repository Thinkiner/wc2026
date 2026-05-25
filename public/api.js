// frontend/public/api.js
// Все запросы к серверу через этот модуль

const API = '/api'; // относительный путь — работает и локально, и на Render

// ── Токен ─────────────────────────────────────────
// Храним JWT в sessionStorage (живёт пока открыта вкладка)
// или localStorage (живёт 30 дней)
function getToken() {
  return localStorage.getItem('wc_token');
}
function setToken(token) {
  localStorage.setItem('wc_token', token);
}
function clearToken() {
  localStorage.removeItem('wc_token');
  localStorage.removeItem('wc_user');
}
function getUser() {
  try { return JSON.parse(localStorage.getItem('wc_user')); } catch { return null; }
}
function setUser(user) {
  localStorage.setItem('wc_user', JSON.stringify(user));
}

// ── Базовая функция запроса ───────────────────────
async function apiFetch(path, options = {}) {
  const token = getToken();

  const res = await fetch(API + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Ошибка сервера');
  }

  return data;
}

// ── Авторизация ───────────────────────────────────
async function apiLogin(email, password) {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  setToken(data.token);
  setUser(data.user);
  return data.user;
}

async function apiRegister(name, email, password) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  });
  setToken(data.token);
  setUser(data.user);
  return data.user;
}

function apiLogout() {
  clearToken();
}

// ── Прогнозы ─────────────────────────────────────
async function apiGetMyPredictions() {
  return apiFetch('/predictions/my');
}

async function apiSaveGroupPrediction(matchId, homeScore, awayScore) {
  return apiFetch('/predictions/group', {
    method: 'POST',
    body: { matchId, homeScore, awayScore },
  });
}

async function apiSavePlayoffPrediction(roundId, slotIdx, homeScore, awayScore) {
  return apiFetch('/predictions/playoff', {
    method: 'POST',
    body: { roundId, slotIdx, homeScore, awayScore },
  });
}

async function apiGetAllPredictions() {
  return apiFetch('/predictions/all');
}

// ── Результаты матчей ─────────────────────────────
async function apiGetResults() {
  return apiFetch('/matches/results');
}

async function apiSaveResult(matchId, homeScore, awayScore) {
  return apiFetch('/matches/results', {
    method: 'POST',
    body: { matchId, homeScore, awayScore },
  });
}

async function apiDeleteResult(matchId) {
  return apiFetch(`/matches/results/${matchId}`, { method: 'DELETE' });
}

// ── Плей-офф ─────────────────────────────────────
async function apiGetPlayoff() {
  return apiFetch('/matches/playoff');
}

async function apiSavePlayoffSlot(roundId, slotIdx, homeTeam, awayTeam, homeScore, awayScore, winner) {
  return apiFetch('/matches/playoff', {
    method: 'POST',
    body: { roundId, slotIdx, homeTeam, awayTeam, homeScore, awayScore, winner },
  });
}

// ── Участники (только админ) ──────────────────────
async function apiGetUsers() {
  return apiFetch('/matches/users');
}

async function apiDeleteUser(id) {
  return apiFetch(`/matches/users/${id}`, { method: 'DELETE' });
}
