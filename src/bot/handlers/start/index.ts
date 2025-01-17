import TelegramBot from "node-telegram-bot-api";
import Router from "../../../routes/router"

const startStart = (bot: TelegramBot, msg: TelegramBot.Message): void => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Hello! I am a bot. How can I help you?");
};

const initStartRoutes = (router: Router): void => {
    router.addRoute("/start", (msg, bot) => startStart(bot, msg))
    
};
export default initStartRoutes;