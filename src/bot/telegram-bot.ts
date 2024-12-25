import TelegramBot from "node-telegram-bot-api"
import { handleCheckin } from "./handlers/checkin"
import { handleCheckout } from "./handlers/checkin"
import { handleGetListStaffs } from "./handlers/list-company-staffs"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env")
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.on("message", (msg) => {
    const chatId = msg.chat.id
    const text = msg.text?.trim() || ""

    switch (true) {
        case /\/checkin/.test(text):
            handleCheckin(bot, msg)
            break

        case /\/checkout/.test(text):
            handleCheckout(bot, msg)
            break

        case /\/list-company-staffs/.test(text):
            handleGetListStaffs(bot, msg)
            break

        default:
            bot.sendMessage(chatId, "Lệnh không hợp lệ. Vui lòng thử lại.")
            break
    }
})

console.log("Bot Telegram đã được khởi động!")

export default bot
