import TelegramBot from "node-telegram-bot-api"
import { isValidCheckin } from "../../../services/staff/valid-checkin"
import { getAccountById } from "../../../services/staff/get-telegram-account"
import TelegramAccount from "../../../models/telegram-account"
import { getWorkShiftByType, getWorkShiftByTypeAndName } from '../../../services/common/work-shift-service';
import isOutOfWorkingHours from "../../../utils/workingHours";
import Staff, { mapStaffFromJson } from "../../../models/staff";
import { getStaffByChatId } from "../../../services/staff/staff-service";

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
    const staff: Staff | null = await getStaffByChatId(chatId.toString())
    const jsonStaff = mapStaffFromJson(staff);

    // Kiểm tra xem người dùng đã Check-in chưa
    // if (jsonStaff.tele_account) {
    //     const isCheckin = await isValidCheckin(jsonStaff.tele_account.id)
    //     if (isCheckin) {
    //         console.log('Người dùng đã Check-in')
    //         bot.sendMessage(chatId, "You have already checked in; you cannot check in again.")
    //         return
    //     }
    //     else {
    //         console.log('Người dùng chưa Check-in')
    //     }
    // }

    if (!isOutOfWorkingHours()) {
        if (jsonStaff.type_staff === "fulltime") {
            await handleSpecialDurationFullTime(bot, chatId)
        }
        else {
            await handleCheckinSpecial(bot, chatId)
        }
    }
    else {
        await handleCheckinMain(bot, chatId, userName)
    }

    // bot.sendMessage(chatId, "<b>Please select your shift type</b>", {
    //     reply_markup: {
    //         inline_keyboard: [
    //             [
    //                 { text: "Main shift" , callback_data: `checkin_main_${chatId}`},
    //                 { text: "Special shift" , callback_data: `checkin_special_${chatId}`},
    //             ],
    //         ],
    //     },
    //     parse_mode: "HTML",
    // })
}

export const handleCheckinMain = async (bot: TelegramBot, chatId: number, userName: string) => {
    // await bot.answerCallbackQuery(callbackQuery.id, { text: "You have selected main shift check-in." });
    // console.log("Callback id: ", callbackQuery.id);
    // const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();
    const shift = await getWorkShiftByType("main");

    if (!shift) {
        bot.sendMessage(chatId, "Unable to retrieve shift information.");
        return;
    }

    console.log(`Yêu cầu Check-in ca chính từ: ${userName}`);

    const ipServer = process.env.IP_SERVER;
    const portServer = process.env.PORT_SERVER || 3000;
    const checkinUrl = `http://${ipServer}:${portServer}/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_main&shiftId=${shift[0].id}`;
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

export const handleCheckinSpecial = async (bot: TelegramBot, chatId: number) => {

    await bot.sendMessage(chatId, "<b>Please select your special shift type</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "OT", callback_data: `special_ot_${chatId}` },
                    { text: "Time in lieu", callback_data: `special_time%20in%20lieu_${chatId}` },
                    // { text: "Main shift", callback_data: `special_main_${chatId}` },
                ],
            ],
        },
        parse_mode: "HTML",
    });
};

export const handleSpecialDurationFullTime = async (bot: TelegramBot, chatId: number) => {
    const inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = [];
    const maxHours = 8; 

    for (let i = 1; i <= maxHours; i += 4) {
        const row: TelegramBot.InlineKeyboardButton[] = [];
        for (let j = i; j < i + 4 && j <= maxHours; j++) {
            row.push({
                text: `${j}h`,
                callback_data: `durationSpecial_main_${chatId}_${j}`,
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
}

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

    const nameType = decodeURIComponent(callbackQuery.data).split("_").slice(1)[0] || [];

    console.log(`Type: ${nameType}, userId: ${chatId}`);

    await bot.answerCallbackQuery(callbackQuery.id, { text: `You have selected: ${nameType}` });

    const inlineKeyboard: TelegramBot.InlineKeyboardButton[][] = [];
    const maxHours = 4; 

    const row: TelegramBot.InlineKeyboardButton[] = [];
    for (let i = 1; i <= maxHours; i++) {
        row.push({
            text: `${i}h`, 
            callback_data: `durationSpecial_${nameType}_${chatId}_${i}`, 
        });
    }
    inlineKeyboard.push(row); 

    await bot.sendMessage(chatId, "<b>Please select your working hours</b>", {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        },
        parse_mode: "HTML",
    });
};


export const handleSpecialTimeSelection = async (bot: TelegramBot, chatId: number, callbackQuery: TelegramBot.CallbackQuery) => {

    const [nameType, userId, duration] = callbackQuery.data?.split("_").slice(1) || [];

    const shift = await getWorkShiftByTypeAndName("special", nameType);
    if (!shift) {
        bot.sendMessage(chatId, "Unable to retrieve shift information.");
        return;
    }

    // in ra type, userId, time để kiểm tra
    console.log(`type: ${nameType}, userId: ${userId}, duration: ${duration}, shiftId: ${shift.id}`);

    await bot.answerCallbackQuery(callbackQuery.id, { text: `You have selected ${duration} hours of work time` });
    const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();

    console.log(`Yêu cầu Check-in ca đặc biệt từ: ${userName}`);

    const ipServer = process.env.IP_SERVER;
    const portServer = process.env.PORT_SERVER || 3000;

    const checkinUrl = `http://${ipServer}:${portServer}/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_special_${nameType}_${duration}&shiftId=${shift.id}`;
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
