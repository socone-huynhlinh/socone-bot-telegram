import TelegramBot from "node-telegram-bot-api"
import { handleCheckin } from "./handlers/checkin_test"
import { handleCheckinRemote, handleCheckoutRemote } from "./handlers/checkinRemote"
import { handleCheckout } from "./handlers/checkin"
import { handleGetListStaffs } from "./handlers/list-company-staffs"
import { handleRequestOff } from "./handlers/request-off-test"
import { handleAdminResponse } from "./handlers/admin-response"
import { handleRegister } from "./handlers/register_test"
import { userState } from "../config/user-state"
import { handleStart } from "./handlers/start"
import { userSessions } from "../config/user-session"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env")
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.on("message", async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text?.trim() || ""

    if (text === "/cancel") {
        const session = userSessions.get(chatId);

        if (session) {
            // Dừng lắng nghe nếu có listener
            if (session.listener) {
                bot.off("message", session.listener);
            }
            userSessions.delete(chatId); // Xóa trạng thái
            await bot.sendMessage(chatId, "Bạn đã hủy thao tác hiện tại.");
        } else {
            await bot.sendMessage(chatId, "Không có thao tác nào để hủy.");
        }
        return;
    }

    if (text.startsWith("/")) {
        switch (true) {
            case /^\/start$/.test(text):
                handleStart(bot, msg)
                break

            case /^\/checkin$/.test(text):
                handleCheckin(bot, msg)
                break

            case /^\/checkinremote$/.test(text):
                handleCheckinRemote(bot, msg)
                break

            case /^\/checkout$/.test(text):
                handleCheckout(bot, msg)
                break

            case /^\/checkoutremote$/.test(text):
                handleCheckoutRemote(bot, msg)
                break

            case /^\/off$/.test(text):
                handleRequestOff(bot, msg)
                break

            case /^\/list-company-staffs$/.test(text):
                handleGetListStaffs(bot, msg)
                break
                
            default:
                bot.sendMessage(chatId, "Lệnh không hợp lệ. Vui lòng thử lại.")
                break
        }
    } 
    // else {
    //     bot.sendMessage(chatId, "Bạn vừa gửi tin nhắn không phải là lệnh.");
    // }
});

handleAdminResponse(bot);

console.log("Bot Telegram đã được khởi động!")

export default bot
