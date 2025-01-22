import TelegramBot from "node-telegram-bot-api"
import { handleGetListStaffs } from "./handlers/list-company-staffs"
import { handleRequestOff } from "./handlers/request-off/request-off"
import { handleAdminResponse } from "./handlers/admin/admin-response"
import { handleStart } from "./handlers/start/start"
import { setUserSession, getUserSession, deleteUserSession } from "../config/user-session"
import { handleCheckin } from "./handlers/checkin/checkin"
import { handleRegister } from "./handlers/register/register-test"
import dotenv from "dotenv"
import { handleMenu } from "./handlers/menu/menu"
dotenv.config()
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("TELEGRAM_BOT_TOKEN không được cấu hình trong .env")
}

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true })

bot.on("message", async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text?.trim() || ""

    const session = await getUserSession(chatId);

    if (text === "/cancel") {
        // const session = await getUserSession(chatId)
        if (session) {
            // Dừng lắng nghe nếu có listener
            if (session.listener) {
                bot.off("message", session.listener)
            }
            await deleteUserSession(chatId); // Xóa trạng thái
            await bot.sendMessage(chatId, "You have canceled the current action.");
        } else {
            await bot.sendMessage(chatId, "There is no action to cancel.");
        }
        return
    }

    if (text.startsWith("/")) {
        if (session?.command && session.command !== text) {
            await bot.sendMessage(
                chatId,
                `You are currently in the middle of the command "${session.command}". Please use /cancel to stop the current process before starting a new one.`
            );
            return;
        }
        switch (true) {
            case /^\/start$/.test(text):
                // await setUserSession(chatId, { command: "/start" });
                handleStart(bot, msg);
                break;

            case /^\/checkin$/.test(text):
                await setUserSession(chatId, { command: "/checkin" });
                handleCheckin(bot, msg);
                break;

            case /^\/off$/.test(text):
                await setUserSession(chatId, { command: "/off" });
                handleRequestOff(bot, msg);
                break;

            case /^\/register$/.test(text):
                await setUserSession(chatId, { command: "/register" });
                handleRegister(bot, msg);
                break;

            // case /^\/list-company-staffs$/.test(text):
            //     await setUserSession(chatId, { command: "/list-company-staffs" });
            //     handleGetListStaffs(bot, msg);
            //     break;

            case /^\/menu$/.test(text):
                handleMenu(bot, msg);
                break;

            default:
                bot.sendMessage(chatId, "Invalid command. Please try again.");
                break;
        }
    }
    // else {
    //     bot.sendMessage(chatId, "Bạn vừa gửi tin nhắn không phải là lệnh.");
    // }
})

handleAdminResponse(bot)

console.log("Bot Telegram đã được khởi động!")

export default bot
