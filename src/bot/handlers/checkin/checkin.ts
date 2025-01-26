import TelegramBot from "node-telegram-bot-api"
import { isValidCheckinFullTime, isValidNewCheckin } from "../../../services/common/valid-checkin"
import { getWorkShiftByType, getWorkShiftByTypeAndName } from '../../../services/common/work-shift-service';
import isOutOfWorkingHours from "../../../utils/workingHours";
import Staff, { mapStaffFromJson } from "../../../models/staff";
import { getStaffByChatId } from "../../../services/staff/staff-service";
import { deleteUserSession, getUserSession, setUserSession } from "../../../config/user-session";
import getLocalIp from "../../../utils/get-ip-address";
import { deleteUserData, getUserData, setUserData } from "../../../config/user-data";
import { addReportByStaffId } from "../../../services/common/report-service";

export const handleCheckin = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    if (!msg.from) {
        bot.sendMessage(chatId, "Unable to perform Check-in due to missing user information.");
        return;
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim();

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
    }

    const staff: Staff | null = await getStaffByChatId(chatId.toString());
    if (!staff) {
        bot.sendMessage(chatId, "You have not registered yet. Please use /register to register an account to use this feature.");
        await deleteUserSession(chatId);
        deleteUserData(chatId);
        return;
    }

    setUserData(chatId, "staffId", staff?.id)

    const jsonStaff = mapStaffFromJson(staff);
    if (jsonStaff?.tele_account) {
        if (isOutOfWorkingHours()) {
            const checkinResult = await isValidNewCheckin(jsonStaff.tele_account.id);
            if (!checkinResult.isValid) {
                await bot.sendMessage(chatId, checkinResult.message || "You have checked in during this period");
                await deleteUserSession(chatId);
                return;
            }
        }
        else {
            const isCheckin = await isValidCheckinFullTime(jsonStaff.tele_account.id);
            if (isCheckin) {
                await bot.sendMessage(chatId, "You have already checked in; you cannot check in again.");
                await deleteUserSession(chatId);
                return;
            }
        }
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            return;
        }
        bot.off("message", messageListener);
    };

    bot.on("message", messageListener);

    await setUserSession(chatId, { command: "/checkin", listener: messageListener });

    if (isOutOfWorkingHours()) {
        await handleCheckinSpecial(bot, chatId);
    }
    else if (jsonStaff?.type_staff === "parttime") {
        await handleSpecialDurationPartTime(bot, chatId);
    }
    else {
        await handleCheckinMain(bot, chatId, userName);
    }
};


export const handleCheckinMain = async (bot: TelegramBot, chatId: number, userName: string) => {
    const shift = await getWorkShiftByType("main");

    if (!shift) {
        bot.sendMessage(chatId, "Unable to retrieve shift information.");
        return;
    }

    const shiftId = shift[0].id
    if (!shiftId) {
        bot.sendMessage(chatId, "Unable to retrieve shift information.");
        return;
    }

    const ipServer = getLocalIp();
    const portServer = process.env.PORT_SERVER || 3000;
    const checkinUrl = `http://${ipServer}:${portServer}/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_main&shiftId=${shiftId}`;
    await bot.sendMessage(chatId, "Please click the button below to check-in.", {
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
    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== chatId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(chatId);
                return;
            }
            bot.off("message", messageListener);
        };

    await bot.sendMessage(chatId, "Please select your special shift type", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "OT", callback_data: `special_ot_${chatId}` },
                    { text: "Time in lieu", callback_data: `special_time%20in%20lieu_${chatId}` },
                ],
            ],
        },
        parse_mode: "HTML",
    });

    await setUserSession(chatId, { command: "checkingSpecial", listener: messageListener  });
};

export const handleSpecialDurationPartTime = async (bot: TelegramBot, chatId: number) => {
    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== chatId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(chatId);
                return;
            }
            bot.off("message", messageListener);
        };
    
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

    await bot.sendMessage(chatId, "Please select your working hours", {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        },
        parse_mode: "HTML",
    });

    await setUserSession(chatId, { command: "specialDurationPartTime", listener: messageListener });
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

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== chatId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(chatId);
                return;
            }
            bot.off("message", messageListener);
    };
    
    const nameType = decodeURIComponent(callbackQuery.data).split("_").slice(1)[0] || [];

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

    await bot.sendMessage(chatId, "Please select your working hours", {
        reply_markup: {
            inline_keyboard: inlineKeyboard
        },
        parse_mode: "HTML",
    });

    await setUserSession(chatId, { command: "specialDuration", listener: messageListener });
};


export const handleSpecialTimeSelection = async (bot: TelegramBot, chatId: number, callbackQuery: TelegramBot.CallbackQuery) => {

    const [nameType, userId, duration] = callbackQuery.data?.split("_").slice(1) || [];

    const shift = await getWorkShiftByTypeAndName("special", nameType);
    if (!shift) {
        bot.sendMessage(chatId, "Unable to retrieve shift information.");
        return;
    }

    if (!shift.id) {
        bot.sendMessage(chatId, "Unable to retrieve shift information.");
        return;
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: `You have selected ${duration} hours of work time` });
    const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();

    const ipServer = getLocalIp();
    const portServer = process.env.PORT_SERVER || 3000;

    const checkinUrl = `http://${ipServer}:${portServer}/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_special_${nameType}_${duration}&shiftId=${shift.id}`;
    const message = await bot.sendMessage(chatId, "Please click the button below to check-in.", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Check-in", url: checkinUrl },
                ],
            ],
        },
        parse_mode: "HTML",
    });

    setUserData(chatId, "messageId", message.message_id);
}

export const handleReportCheckin = async (bot: TelegramBot, chatId: number, userName: string, shiftId: string, ) => {
    bot.sendMessage(chatId, "Please report your planned work for today (at least 6 characters).", {
        parse_mode: "HTML",
    });

    const staffId = getUserData(chatId)?.staffId;
    if (!staffId) {
        await bot.sendMessage(chatId, "Error: Unable to find your staff ID. Please try again later.");
        return;
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            deleteUserData(chatId);
            return;
        }

        const workReport = response.text?.trim();

        if (workReport && workReport.startsWith('/')) {
            bot.sendMessage(chatId, "Your report cannot start with '/'. Please provide a valid work report.", {
                parse_mode: "HTML",
            });
            return;
        }

        if (!workReport || workReport.length < 6) {
            bot.sendMessage(
                chatId,
                "Your report is too short. Please provide a detailed report (at least 6 characters).",
                { parse_mode: "HTML" }
            );
            return;
        }

        await addReportByStaffId(staffId, workReport);

        await bot.sendMessage(
            chatId,
            `Thank you, <b>${userName}</b>. Your work report has been submitted successfully.`,
            { parse_mode: "HTML" }
        );

        bot.off("message", messageListener);
        await deleteUserSession(chatId); 
    };

    await setUserSession(chatId, { command: "reportingWork", listener: messageListener });
    bot.on("message", messageListener);
};
