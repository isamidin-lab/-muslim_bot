# MuslimBot

Multi-tenant Telegram SaaS Bot Platform for Arabic language and Islamic education.

## Features

- **Telegram Bot** — Курсы, тесты, оплата Telegram Stars, достижения, исламские функции
- **Admin Panel** — Управление курсами, пользователями, платежами, рассылками
- **User Frontend** — Каталог курсов, личный кабинет, прогресс обучения
- **AI Integration** — ChatGPT chat, генерация тестов, перевод на арабский
- **Gamification** — Монеты, достижения, реферальная система, ежедневный вход

## Quick Start

### Docker (recommended)

```bash
# Clone and start
git clone <repo-url>
cd muslim_bot

# Set your Telegram bot token
export TELEGRAM_BOT_TOKEN=your_token_here

# Start all services
docker-compose up --build

# Run database migration
docker-compose exec backend npx prisma db push --skip-generate
docker-compose exec backend npx ts-node prisma/seed.ts
```

### Local Development

```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run start:dev

# Admin panel
cd admin
npm install
npm run dev

# User frontend
cd web
npm install
npm run dev
```

## Services

| Service | Port | URL |
|---------|------|-----|
| Backend API | 3000 | http://localhost:3000 |
| Swagger | 3000 | http://localhost:3000/api/docs |
| Admin Panel | 3001 | http://localhost:3001 |
| User Frontend | 3002 | http://localhost:3002 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| MinIO (S3) | 9000 | http://localhost:9001 |

## Default Credentials

- **Admin:** admin@muslim-bot.com / admin123

## Tech Stack

- **Backend:** NestJS, Prisma, PostgreSQL, Redis, Telegraf
- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui
- **Bot:** Telegram Bot API (Telegraf)
- **Payments:** Telegram Stars
- **AI:** OpenAI GPT-4

## Project Structure

```
muslim_bot/
├── backend/          # NestJS API + Telegram bot
├── admin/            # Next.js admin panel
├── web/              # Next.js user frontend
├── docker-compose.yml
└── README.md
```
