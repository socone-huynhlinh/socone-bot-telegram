import TelegramBot from "node-telegram-bot-api"
import { handleCheckin } from "./handlers/checkin/checkin_test"
import { handleCheckinRemote, handleCheckoutRemote } from "./handlers/checkin/checkinRemote"
import { handleCheckout } from "./handlers/checkin/checkin"
import { handleGetListStaffs } from "./handlers/staff/list-company-staffs"
import { handleRequestOff } from "./handlers/requests/request-off-test"
import { handleAdminResponse } from "./handlers/admin/admin-response"
import Router from "../routes/router"
import initRegisterRoutes from "./handlers/register"
import { userState } from "../config/user-state"
import { handleStart } from "./handlers/start"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env")
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })
const router = new Router(bot);

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

            default:
                bot.sendMessage(chatId, "Lệnh không hợp lệ. Vui lòng thử lại.")
                break
        }
    } 
    // else {
    //     bot.sendMessage(chatId, "Bạn vừa gửi tin nhắn không phải là lệnh.");
    // }
});
initRegisterRoutes(router);

// Xử lý tin nhắn
bot.on("message", (msg) => {
  router.handleMessage(msg);
});
bot.on("callback_query", (query) => {
    if (query) router.handleCallback(query);
  
    // Trả lời callback_query để tránh lỗi timeout
    bot.answerCallbackQuery(query.id);
  });
// bot.on("message", (msg) => {
//     const chatId = msg.chat.id
//     const text = msg.text?.trim() || ""

//     if (userState.get(chatId) === "registering") {
//         // Nếu đang xử lý đăng ký, bỏ qua xử lý message chung
//         return;
//     }

//     if (userState.get(chatId) === "requestingOff") {
//         // Nếu đang xử lý yêu cầu nghỉ, bỏ qua xử lý message chung
//         return;
//     }

//     if (text.startsWith("/")) {
//         switch (true) {
//             case /^\/checkin$/.test(text):
//                 handleCheckin(bot, msg)
//                 break

//             case /^\/checkinremote$/.test(text):
//                 handleCheckinRemote(bot, msg)
//                 break

//             case /^\/checkout$/.test(text):
//                 handleCheckout(bot, msg)
//                 break

//             case /^\/checkoutremote$/.test(text):
//                 handleCheckoutRemote(bot, msg)
//                 break

//             case /^\/off$/.test(text):
//                 userState.set(chatId, "requestingOff"); // Đặt trạng thái người dùng là "đang yêu cầu nghỉ"
//                 handleRequestOff(bot, msg, () => userState.delete(chatId)); // Xóa trạng thái sau khi xử lý xong
//                 break

//             case /^\/list-company-staffs$/.test(text):
//                 handleGetListStaffs(bot, msg)
//                 break

//             default:
//                 bot.sendMessage(chatId, "Lệnh không hợp lệ. Vui lòng thử lại.")
//                 break
//         }
//     } else {
//         bot.sendMessage(chatId, "Bạn vừa gửi tin nhắn không phải là lệnh.");
//     }
// });
// handleAdminResponse(bot);

console.log("Bot Telegram đã được khởi động!")

export default bot
