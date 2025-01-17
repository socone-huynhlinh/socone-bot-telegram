# socone-bot-telegram

### Description

This project is a Telegram bot that interacts with users and performs various tasks such as checking in, checking out, and listing company staff.

### Folder Structure

```bash
socon-bot-telegram/
├── src/
│   ├── app.ts
│   ├── bot/
│   │   ├── handlers/
│   │   │   ├── checkin.ts
│   │   │   ├── common.ts
│   │   │   ├── device-handlers.ts
│   │   │   ├── list-company-staffs.ts
│   │   ├── telegram-bot.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── telegram-config.ts
│   ├── middleware/
│   │   ├── check-ip-address.ts
│   ├── models/
│   │   ├── user.ts
│   │   ├── work-hour.ts
│   ├── server.ts
│   ├── services/
│       ├── admin/
│       │   ├── staff-manage.ts
│       ├── common/
│       │   ├── device-infor.ts
│       ├── staff/
│           ├── checkin-service.ts
├── .env
├── .prettierrc
├── package.json
├── tsconfig.json
├── tslint.json

```

- **src/**: Contains the source code of the project.
    - **app.ts**: Entry point of the application.
    - **bot/**: Contains the bot-related code.
        - **handlers/**: Contains the handlers for different bot commands.
            - **checkin.ts**: Handles the check-in command.
            - **common.ts**: Contains common utility functions for the bot.
            - **device-handlers.ts**: Handles device-related requests.
            - **list-company-staffs.ts**: Handles the command to list company staff.
        - **telegram-bot.ts**: Initializes and configures the Telegram bot.
    - **config/**: Contains configuration files.
        - **database.ts**: Database configuration.
        - **telegram-config.ts**: Telegram bot configuration.
    - **middleware/**: Contains middleware functions.
        - **check-ip-address.ts**: Middleware to check the IP address.
    - **models/**: Contains data models.
        - **user.ts**: User model.
        - **work-hour.ts**: Work hour model.
    - **server.ts**: Server setup and route definitions.
    - **services/**: Contains service functions.
        - **admin/**: Admin-related services.
            - **staff-manage.ts**: Service to manage staff.
        - **common/**: Common services.
            - **device-infor.ts**: Service to get device information.
        - **staff/**: Staff-related services.
            - **checkin-service.ts**: Service to handle check-in.

### Scripts

**Use npm**

- **start**: Starts the application.
- **dev**: Starts the application in development mode with file watching.

### Configuration

- **.env**: Environment variables configuration.
- **.prettierrc**: Prettier configuration.
- **tsconfig.json**: TypeScript configuration.

## Run container

## Build and start container

```bash
docker-compose up -d --build
```

### Remove container

```bash
docker-compose down -v
```

### Backup database

```bash
pg_dump -U postgres -d socone_telegram_bot -F c -f socone_schemas_bot.dump -p 5434 -h localhost
```
