import TelegramBot from "node-telegram-bot-api";

export const handleStart = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    bot.sendMessage(msg.chat.id, "Welcome to SoC.one company's human resource management system!")
};