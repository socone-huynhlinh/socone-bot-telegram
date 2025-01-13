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

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env")
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.on("message", (msg) => {
    const chatId = msg.chat.id
    const text = msg.text?.trim() || ""

    if (userState.get(chatId) === "registering") {
        return;
    }

    if (userState.get(chatId) === "requestingOff") {
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
                // userState.set(chatId, "requestingOff"); 
                // handleRequestOff(bot, msg, () => userState.delete(chatId)); // Xóa trạng thái sau khi xử lý xong
                handleRequestOff(bot, msg)
                break

            case /^\/list-company-staffs$/.test(text):
                handleGetListStaffs(bot, msg)
                break

            case /^\/register$/.test(text):
                // userState.set(chatId, "registering"); 
                handleRegister(bot, msg, () => userState.delete(chatId)); // Xóa trạng thái sau khi xử lý xong
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
