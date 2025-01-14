import TelegramBot from "node-telegram-bot-api";

export const userSessions = new Map<number, { command: string; listener?: (msg: TelegramBot.Message) => void }>();