import TelegramBot from "node-telegram-bot-api";

export const handleStart = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    bot.sendMessage(msg.chat.id, "Chào mừng bạn đến với hệ thống quản lý nhân sự của công ty SoC.one")
};