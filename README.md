# ЧМ 2026 — Турнир прогнозов

Веб-приложение для прогнозирования матчей Чемпионата мира 2026.  
Backend: Node.js + Express + PostgreSQL. Frontend: чистый HTML/JS.  
Деплой: [Render.com](https://render.com) (бесплатный тариф).

---

## Структура проекта

```
wc2026/
├── backend/
│   ├── middleware/
│   │   └── auth.js          # Проверка JWT-токена
│   ├── routes/
│   │   ├── auth.js          # POST /api/auth/login, /register
│   │   ├── predictions.js   # GET/POST /api/predictions/...
│   │   └── matches.js       # GET/POST /api/matches/...
│   ├── db.js                # Подключение к PostgreSQL
│   ├── server.js            # Точка входа Express
│   ├── schema.sql           # SQL для создания таблиц
│   ├── package.json
│   └── .env.example         # Пример переменных окружения
├── frontend/
│   └── public/
│       ├── index.html       # Всё приложение (HTML + CSS + JS)
│       └── api.js           # Функции для запросов к API
├── package.json             # Корневой (для Render)
├── .gitignore
└── README.md
```

---

## Шаг 1 — Запуск локально

### Требования
- Node.js 18+
- PostgreSQL (локально или облако)

### Установка

```bash
# 1. Клонируйте или создайте папку
cd wc2026/backend

# 2. Установите зависимости
npm install

# 3. Создайте файл .env (скопируйте из примера)
cp .env.example .env
# Откройте .env и заполните своими значениями

# 4. Создайте таблицы в PostgreSQL
# Откройте psql и выполните:
psql -U ваш_пользователь -d ваша_база -f schema.sql

# 5. Запустите сервер
npm start
# или для разработки с авто-перезагрузкой:
npx nodemon server.js
```

Откройте http://localhost:3000

---

## Шаг 2 — Загрузка на GitHub

```bash
# В корне проекта wc2026/
git init
git add .
git commit -m "Initial commit — WC2026 predictions app"

# Создайте репозиторий на github.com, затем:
git remote add origin https://github.com/ВАШ_АККАУНТ/wc2026.git
git branch -M main
git push -u origin main
```

---

## Шаг 3 — Создание базы данных на Render

1. Зайдите на [render.com](https://render.com) → **New → PostgreSQL**
2. Заполните:
   - **Name**: `wc2026-db`
   - **Region**: Frankfurt (EU Central) — ближайший к России
   - **Plan**: Free
3. Нажмите **Create Database**
4. После создания откройте базу → вкладка **PSQL**
5. Вставьте содержимое файла `backend/schema.sql` и выполните

---

## Шаг 4 — Деплой на Render

1. На Render → **New → Web Service**
2. Подключите ваш GitHub репозиторий
3. Настройки:
   - **Name**: `wc2026`
   - **Root Directory**: *(оставьте пустым)*
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `node backend/server.js`
   - **Plan**: Free

### Переменные окружения (Environment Variables)

В разделе **Environment** добавьте:

| Переменная       | Значение                                          |
|------------------|---------------------------------------------------|
| `DATABASE_URL`   | Скопируйте **Internal Database URL** из вашей БД  |
| `JWT_SECRET`     | Любая длинная случайная строка (32+ символа)      |
| `ADMIN_EMAIL`    | admin@wc2026.ru                                   |
| `ADMIN_PASSWORD` | Ваш пароль администратора                         |
| `NODE_ENV`       | production                                        |

> ⚠️ **DATABASE_URL** берите **Internal** (не External) — это бесплатно внутри Render.

4. Нажмите **Deploy**
5. Дождитесь надписи `Deploy succeeded` (~2-3 минуты)

---

## API — краткая документация

### Авторизация
```
POST /api/auth/register  { name, email, password }  → { token, user }
POST /api/auth/login     { email, password }         → { token, user }
```

### Прогнозы (нужен токен в заголовке)
```
GET  /api/predictions/my             → { group: {matchId: {h,a}}, playoff: {...} }
POST /api/predictions/group          { matchId, homeScore, awayScore }
POST /api/predictions/playoff        { roundId, slotIdx, homeScore, awayScore }
GET  /api/predictions/all            → все прогнозы (только admin)
```

### Результаты (только admin)
```
GET    /api/matches/results          → { matchId: {homeScore, awayScore} }
POST   /api/matches/results          { matchId, homeScore, awayScore }
DELETE /api/matches/results/:matchId
GET    /api/matches/playoff          → состояние сетки
POST   /api/matches/playoff          { roundId, slotIdx, homeTeam, awayTeam, ... }
GET    /api/matches/users            → список игроков
DELETE /api/matches/users/:id
```

---

## Важные замечания про бесплатный тариф Render

- **Web Service** засыпает через 15 минут без запросов — первый запрос после сна занимает ~30 секунд
- **База данных** (PostgreSQL Free) удаляется через **90 дней** — сделайте экспорт данных заранее
- Для постоянной работы базы используйте **Neon** (бесплатный PostgreSQL без удаления): [neon.tech](https://neon.tech)

### Как использовать Neon вместо Render PostgreSQL

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Создайте проект → скопируйте **Connection string**
3. Вставьте её в `DATABASE_URL` на Render
4. В `backend/db.js` уже настроен SSL — всё будет работать
