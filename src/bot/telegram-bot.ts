import TelegramBot from "node-telegram-bot-api";
import { handleCheckinRemote, handleCheckoutRemote } from "./handlers/checkin/checkin-remote";
import { handleGetListStaffs } from "./handlers/list-company-staffs";
import { handleRequestOff } from "./handlers/request-off/request-off";
import { handleAdminResponse } from "./handlers/admin/admin-response";
import { handleStart } from "./handlers/start";
import { setUserSession, getUserSession, deleteUserSession } from "../config/user-session";
import { handleCheckin } from "./handlers/checkin/checkin";
import { handleRegister } from "./handlers/register/register";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env");
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim() || "";

    if (text === "/cancel") {
        const session = await getUserSession(chatId);

        if (session) {
            // Dừng lắng nghe nếu có listener
            if (session.listener) {
                bot.off("message", session.listener);
            }
            await deleteUserSession(chatId); // Xóa trạng thái
            await bot.sendMessage(chatId, "Bạn đã hủy thao tác hiện tại.");
        } else {
            await bot.sendMessage(chatId, "Không có thao tác nào để hủy.");
        }
        return;
    }

    if (text.startsWith("/")) {
        switch (true) {
            case /^\/start$/.test(text):
                handleStart(bot, msg);
                break;

            case /^\/checkin$/.test(text):
                handleCheckin(bot, msg);
                break;

            case /^\/checkinremote$/.test(text):
                handleCheckinRemote(bot, msg);
                break;

            case /^\/checkoutremote$/.test(text):
                handleCheckoutRemote(bot, msg);
                break;

            case /^\/off$/.test(text):
                handleRequestOff(bot, msg);
                break;

            case /^\/register$/.test(text):
                handleRegister(bot, msg);
                break;

            case /^\/list-company-staffs$/.test(text):
                handleGetListStaffs(bot, msg);
                break;

            default:
                bot.sendMessage(chatId, "Lệnh không hợp lệ. Vui lòng thử lại.");
                break;
        }
    }
    // else {
    //     bot.sendMessage(chatId, "Bạn vừa gửi tin nhắn không phải là lệnh.");
    // }
});

handleAdminResponse(bot);

console.log("Bot Telegram đã được khởi động!");

export default bot;
