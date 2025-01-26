# socone-bot-telegram

### Description

This project is a Telegram bot that interacts with users and performs various tasks such as checking in, checking out, and listing company staff.

### Technology Stack

- Node.js: Bot server
- NestJS: Backend web application
- NextJS: Frontend web application
- PostgreSQL: Database
- Redis: Cache
- Docker: Containerization
- DigitalOcean: Server VPS
- VPN: Wireguard
- Telegram: Messaging platform

## How to run this project

### Prerequisites

- Docker
- Docker Compose

**Command On Mac**: Pass this command when you already have docker and docker-compose installed

```bash
brew install docker
brew install docker-compose
```

**Check Docker and Docker Compose version**

```bash
docker --version
docker-compose --version
```

### Run the project

**1. Clone the repository and cd into the project directory**

**2. Run the following command to start the project**
Get Ip address local

**3. You need to run docker desktop app to run this project**

```bash
bash get-ip.sh
```

Build docker image

```bash
docker-compose build
docker-compose up
```

**When the build is complete, you can use telegram bot with your bot token add into file .env**

```bash
TELEGRAM_BOT_TOKEN=
```

**_Bot in .env file is dangnguyen bot link: https://web.telegram.org/k/#@socone_dangnguyen_bot_**

**Describe about .env file**

1. TELEGRAM_BOT_TOKEN: Telegram bot token
2. DB_HOST: Database host (localhost or ip address local)
3. DB_PORT: Database port (5434)
4. DB_USER: Database user (postgres)
5. DB_PASS: Database password (postgres)
6. DB_NAME: Database name (socone_telegram_bot)
7. REDIS_HOST: Redis host (Redis)
8. REDIS_PORT: Redis port (6379)
9. ID_GROUP_OFF: Telegram group id (123456789)
