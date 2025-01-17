import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";
import getLocalIp from "../../../utils/get-ip-address";
import { WorkShiftService } from "../../../services/impl/work-shift.service";

const workShiftService = new WorkShiftService();

const handleCheckInMain=async(bot:TelegramBot,chatId:number)=>{
    const ipServer=getLocalIp();
    if(!ipServer){
        bot.sendMessage(chatId,"Unable to retrieve the server's IP address");
        return;
    }
    const shifts=await workShiftService.getWorkShiftsByType("main");
    const portServer=process.env.PORT || 3000;
    const checkinUrl = `http://${ipServer}:${portServer}/checkin-main?chatId=${chatId}`;
    if (!shifts || shifts.length === 0) {
        bot.sendMessage(chatId, "No main shift found!");
        return;
    }
    await bot.sendMessage(chatId, "<b>Please click the button below to check-in</b>", {
        reply_markup: {
            inline_keyboard: [
                shifts.map((shift) => {
                    return { text: "Check-in", url: `${checkinUrl}&shiftId=${shift.id}` };
               })
            ],
        },
        parse_mode: "HTML",
    });
}

const handleCheckinSpecial = async (bot: TelegramBot,chatId:number) => {
    const shifts = await workShiftService.getWorkShiftsByType("special");
    if (!shifts || shifts.length === 0) {
        bot.sendMessage(chatId, "No main shift found!");
        return;
    }
    await bot.sendMessage(chatId, "<b>Please select your special shift type</b>", {
        reply_markup: {
            inline_keyboard: [
               shifts.map((shift) => {
                    return { text: shift.name, callback_data: `special_${shift.id}_${shift.name}` };
               })
            ],
        },
        parse_mode: "HTML",
    });
};

const handleSpecialDuration = async (
    query: CallbackQuery,
    bot: TelegramBot,
) => {
    const chatId = query.message?.chat.id;
    if (!chatId) {
        await bot.answerCallbackQuery(query.id, { text: "Unable to determine chat ID!" });
        return;
    }
    if (!query.data) {
        await bot.answerCallbackQuery(query.id, { text: "Invalid request!" });
        return;
    }

    const [shiftId,shiftName] = query.data?.split("_").slice(1) || [];

    await bot.answerCallbackQuery(query.id, { text: `You selected: ${shiftName}` });

    // Tạo các nút bằng vòng lặp
    const inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = [];
    const maxHours = 8; // Số giờ tối đa

    for (let i = 1; i <= maxHours; i += 4) {
        const row: TelegramBot.InlineKeyboardButton[] = [];
        for (let j = i; j < i + 4 && j <= maxHours; j++) {
            row.push({
                text: `${j}h`,
                callback_data: `durationSpecial_${shiftId}_${j}`
            });
        }
        inlineKeyboard.push(row);
    }

    await bot.sendMessage(chatId, "<b>Please select your working hours</b>", {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        },
        parse_mode: "HTML",
    });
};

const handleSpecialTimeSelection = async (bot: TelegramBot, query:CallbackQuery) => {
    const chatId = query.message?.chat.id;
    if(!chatId){
        await bot.answerCallbackQuery(query.id, { text: "Unable to determine chat ID!" });
    }
    const [shiftId, duration] = query.data?.split("_").slice(1) || [];
    await bot.answerCallbackQuery(query.id, { text: `You have selected ${duration} hours of work time` });
    const ipServer=getLocalIp();
    if(!ipServer){
        if (chatId) {
            bot.sendMessage(chatId,"Unable to retrieve the server's IP address");
        }
        return;
    }
    const portServer=process.env.PORT || 3000;
    const checkinUrl = `http://${ipServer}:${portServer}/checkin-special?chatId=${chatId}`;
    if (chatId) {
        await bot.sendMessage(chatId, "Please click the button below to check-in", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Check-in", url: `${checkinUrl}&shiftId=${shiftId}&workHour=${duration}` },
                    ],
                ],
            },
        });
    }
}

export {handleCheckinSpecial,handleCheckInMain,handleSpecialDuration,handleSpecialTimeSelection}