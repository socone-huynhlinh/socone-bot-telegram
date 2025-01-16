import TelegramBot from "node-telegram-bot-api"
import { isValidCheckin } from "../../../services/staff/valid-checkin"
import { getAccountById } from "../../../services/staff/get-telegram-account"
import { TelegramAccount } from "../../../models/user"

// src/handlers/checkin.ts

export const handleCheckin = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Unable to perform Check-in due to missing user information.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Check-in request from: ${userName}`)

    const account: TelegramAccount | null = await getAccountById(chatId)

    // Kiểm tra xem người dùng đã Check-in chưa
    if (account) {
        const isCheckin = await isValidCheckin(account.staff_id)
        if (isCheckin) {
            console.log('Người dùng đã Check-in')
            bot.sendMessage(chatId, "You have already checked in; you cannot check in again.")
            return
        }
        else {
            console.log('Người dùng chưa Check-in')
        }
    }

    bot.sendMessage(chatId, "<b>Please select your shift type</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Main shift" , callback_data: `checkin_main_${chatId}`},
                    { text: "Special shift" , callback_data: `checkin_special_${chatId}`},
                ],
            ],
        },
        parse_mode: "HTML",
    })
}

export const handleCheckinMain = async (bot: TelegramBot, chatId: number, callbackQuery: TelegramBot.CallbackQuery) => {
    await bot.answerCallbackQuery(callbackQuery.id, { text: "You have selected main shift check-in." });
    const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();

    console.log(`Yêu cầu Check-in ca chính từ: ${userName}`);

    const checkinUrl = `http://192.168.1.15:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_main`;
    await bot.sendMessage(chatId, "<b>Please click the button below to check-in.</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Check-in", url: checkinUrl },
                ],
            ],
        },
        parse_mode: "HTML",
    });
};

export const handleCheckinSpecial = async (bot: TelegramBot, chatId: number, callbackQuery: TelegramBot.CallbackQuery) => {
    await bot.answerCallbackQuery(callbackQuery.id, { text: "You have selected special shift check-in." });

    await bot.sendMessage(chatId, "<b>Please select your special shift type</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "OT", callback_data: `special_ot_${chatId}` },
                    { text: "Make-up", callback_data: `special_compensate_${chatId}` },
                    { text: "Main shift", callback_data: `special_main_${chatId}` },
                ],
            ],
        },
        parse_mode: "HTML",
    });
};

export const handleSpecialDuration = async (
    bot: TelegramBot, 
    chatId: number,  
    callbackQuery: TelegramBot.CallbackQuery
) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    console.log("Data: ", callbackQuery.data);

    const [type, userId] = callbackQuery.data?.split("_").slice(1) || [];

    await bot.answerCallbackQuery(callbackQuery.id, { text: `You have selected: ${type}` });

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

    await bot.sendMessage(chatId, "<b>Please select your working hours</b>", {
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

    await bot.answerCallbackQuery(callbackQuery.id, { text: `You have selected ${duration} hours of work time` });
    const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();

    console.log(`Yêu cầu Check-in ca đặc biệt từ: ${userName}`);

    const checkinUrl = `http://192.168.1.15:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_special_${type}_${duration}`;
    await bot.sendMessage(chatId, "<b>Please click the button below to check-in.</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Check-in", url: checkinUrl },
                ],
            ],
        },
        parse_mode: "HTML",
    });
}
