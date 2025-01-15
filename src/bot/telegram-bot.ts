import TelegramBot from "node-telegram-bot-api"
import initCheckinRoutes from "./handlers/checkin"
import Router from "../routes/router"
import initRegisterRoutes from "./handlers/register"
import initStaffRoutes from "./handlers/staff"
import initRequestOffRoutes from "./handlers/requests"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env")
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const router = new Router(bot);

initRegisterRoutes(router);
initStaffRoutes(router);
initCheckinRoutes(router);
initRequestOffRoutes(router);

// // Xử lý tin nhắn
bot.on("message", (msg) => {
  router.handleMessage(msg);
});
bot.on("callback_query", (query) => {
    if (query) router.handleCallback(query);
  
    // Trả lời callback_query để tránh lỗi timeout
    bot.answerCallbackQuery(query.id);
  });

export default bot
