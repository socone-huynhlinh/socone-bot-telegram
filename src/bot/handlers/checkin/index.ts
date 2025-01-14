import TelegramBot, { CallbackQuery } from "node-telegram-bot-api"
import Router from "../../../routes/router"
import { CheckInService } from "../../../services/impl/checkin.service"
import { handleCheckinSpecial,handleCheckInMain } from "./handle-checkin"

// src/handlers/checkin.ts
const checkInService=new CheckInService()
export const startCheckIn = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-in vì thiếu thông tin người dùng.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()
    console.log()
    console.log(`Yêu cầu Check-in từ: ${userName}`)


    // Kiểm tra xem người dùng đã Check-in chưa
    if (msg.chat.id) {
        const isCheckin = await checkInService.checkExistCheckinOnDate(msg.chat.id.toString())
        if (isCheckin) {
            console.log('Người dùng đã Check-in')
            bot.sendMessage(chatId, "Bạn đã Check-in rồi, không thể Check-in lại.")
            return
        }
    }

    bot.sendMessage(chatId, "<b>Hãy chọn loại ca làm việc của bạn</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Ca chính" , callback_data: `checkin_main`},
                    { text: "Ca đặc biệt" , callback_data: `checkin_special`},
                ],
            ],
        },
        parse_mode: "HTML",
    })
}

export const handleCheckIn = async (query:CallbackQuery,bot:TelegramBot,router:Router) => {
    const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    if (callbackData && callbackData.startsWith("checkin_")) {
      const parts = callbackData.split("_");
      const typeShift = parts[parts.length - 1]; // Lấy company ID từ callback_data
        if (chatId) {
            if (typeShift === "main") {
                handleCheckInMain(bot, chatId);
            } else if (typeShift === "special") {
                handleCheckinSpecial(bot, chatId);
            }
        }
    }
};




export const handleSpecialDuration = async (
    bot: TelegramBot, 
    chatId: number,  
    callbackQuery: TelegramBot.CallbackQuery
) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu không hợp lệ." });
        return;
    }

    console.log("Data: ", callbackQuery.data);

    const [type, userId] = callbackQuery.data?.split("_").slice(1) || [];

    await bot.answerCallbackQuery(callbackQuery.id, { text: `Bạn đã chọn: ${type}` });

    // Tạo các nút bằng vòng lặp
    const inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = [];
    const maxHours = 8; // Số giờ tối đa

    for (let i = 1; i <= maxHours; i += 4) {
        const row: TelegramBot.InlineKeyboardButton[] = [];
        for (let j = i; j < i + 4 && j <= maxHours; j++) {
            row.push({
                text: `${j}h`,
                callback_data: `durationSpecial_${type}_${userId}_${j}`
            });
        }
        inlineKeyboard.push(row);
    }

    await bot.sendMessage(chatId, "<b>Vui lòng chọn số thời gian làm việc</b>", {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        },
        parse_mode: "HTML",
    });
};


export const handleSpecialTimeSelection = async (bot: TelegramBot, chatId: number, callbackQuery: TelegramBot.CallbackQuery) => {

    const [type, userId, duration] = callbackQuery.data?.split("_").slice(1) || [];

    // in ra type, userId, time để kiểm tra
    console.log(`type: ${type}, userId: ${userId}, duration: ${duration}`);

    await bot.answerCallbackQuery(callbackQuery.id, { text: `Bạn đã chọn số thời gian làm việc ${duration} tiếng` });
    const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();

    console.log(`Yêu cầu Check-in ca chính từ: ${userName}`);

    const checkinUrl = `http://192.168.1.33:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_special_${type}_${duration}`;
    await bot.sendMessage(chatId, "Hãy nhấp vào nút bên dưới để thực hiện Check-in ca chính:", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Thực hiện Check-in", url: checkinUrl },
                ],
            ],
        },
    });

}

const initCheckinRoutes=(router:Router)=>{
    router.addRoute("/checkin",(msg,bot)=>startCheckIn(bot,msg))
    router.addCallback("checkin_",(query,bot)=>handleCheckIn(query,bot,router))
}
export default initCheckinRoutes