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

**1. Clone the repository, cd into the project directory and checkout to product/ver-0.9 branch**

```bash
git checkout feat-SoC-bot/product-v1.0
```

**2. Run the following command to start the project**
Get Ip address (it will get you ip private) if this the first time run this project **_required to have .env file_**

```bash
bash get-ip.sh
```

**3. You need to run docker desktop app to run this project**

**4. Update .env file if you want to change bot token**

```bash
TELEGRAM_BOT_TOKEN=
```

**Bot in .env file is dangnguyen bot link: https://t.me/socone_dangnguyen_bot**

**5. Run the following command to start the project**

Build docker image and runn docker container

```bash
docker-compose build
docker-compose up -d
```

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

**6.(Optional) Run the following command to stop the project and remove the container**

```bash
docker-compose down --volumes
```

**7. (Optional) You want to build again, you can run the following command**

```bash
docker-compose build
docker-compose up -d
```
