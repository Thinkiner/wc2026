-- Запустите этот файл один раз для создания таблиц
-- В Render: откройте вкладку "PSQL" вашей базы данных и вставьте этот код

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#f5c518',
  is_admin   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица прогнозов на групповые матчи
CREATE TABLE IF NOT EXISTS predictions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id   INTEGER NOT NULL,          -- порядковый номер матча из расписания
  home_score INTEGER,                   -- прогноз хозяев
  away_score INTEGER,                   -- прогноз гостей
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, match_id)             -- один прогноз на матч на человека
);

-- Таблица прогнозов на плей-офф
CREATE TABLE IF NOT EXISTS playoff_predictions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_id   TEXT NOT NULL,             -- 'r32', 'r16', 'qf', 'sf', 'fin'
  slot_idx   INTEGER NOT NULL,          -- номер матча внутри раунда
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, round_id, slot_idx)
);

-- Таблица реальных результатов матчей (заполняет админ)
CREATE TABLE IF NOT EXISTS match_results (
  match_id   INTEGER PRIMARY KEY,       -- совпадает с match_id в predictions
  home_score INTEGER NOT NULL,
  away_score INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Таблица результатов плей-офф (заполняет админ)
CREATE TABLE IF NOT EXISTS playoff_results (
  round_id   TEXT NOT NULL,
  slot_idx   INTEGER NOT NULL,
  home_team  TEXT NOT NULL DEFAULT '',
  away_team  TEXT NOT NULL DEFAULT '',
  home_score INTEGER,
  away_score INTEGER,
  winner     TEXT,
  PRIMARY KEY (round_id, slot_idx)
);
