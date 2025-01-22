import TelegramBot from "node-telegram-bot-api"
import { isValidCheckin } from "../../../services/common/valid-checkin"
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

    console.log(`Check-in request from: ${userName}`);

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
        // await deleteUserSession(chatId);
    }

    const staff: Staff | null = await getStaffByChatId(chatId.toString());
    console.log("Staff: ", staff?.id);
    setUserData(chatId, "staffId", staff?.id)

    if (!staff) {
        bot.sendMessage(chatId, "You have not registered yet. Please use /register to register an account to use this feature.");
        await deleteUserSession(chatId);
        deleteUserData(chatId);
        return;
    }

    const jsonStaff = mapStaffFromJson(staff);
    if (jsonStaff?.tele_account) {
        const isCheckin = await isValidCheckin(jsonStaff.tele_account.id);
        if (isCheckin) {
            console.log('User has already checked in');
            bot.sendMessage(chatId, "You have already checked in; you cannot check in again.");
            return;
        }
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            await bot.sendMessage(chatId, "✅ You have canceled the current action.");
            return;
        }
        bot.off("message", messageListener);
        // await deleteUserSession(chatId);
    };

    bot.on("message", messageListener);

    await setUserSession(chatId, { command: "/checkin", listener: messageListener });

    if (!isOutOfWorkingHours()) {
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

    console.log(`Yêu cầu Check-in ca chính từ: ${userName}`);

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
    // await deleteUserSession(chatId);

    // await handleReportCheckin(bot, chatId, userName, shiftId);
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
                // await bot.sendMessage(chatId, "Action canceled.");
                return;
            }
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
        };

    await bot.sendMessage(chatId, "Please select your special shift type", {
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

    await setUserSession(chatId, { command: "checkingSpecial", listener: messageListener  });
};

export const handleSpecialDurationPartTime = async (bot: TelegramBot, chatId: number) => {
    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== chatId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(chatId);
                // await bot.sendMessage(chatId, "Action canceled.");
                return;
            }
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
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
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== chatId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(chatId);
                // await bot.sendMessage(chatId, "Action canceled.");
                return;
            }
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
    };
    

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

    // in ra type, userId, time để kiểm tra
    console.log(`type: ${nameType}, userId: ${userId}, duration: ${duration}, shiftId: ${shift.id}`);

    await bot.answerCallbackQuery(callbackQuery.id, { text: `You have selected ${duration} hours of work time` });
    const userName = `${callbackQuery.from.first_name || ""} ${callbackQuery.from.last_name || ""}`.trim();

    console.log(`Yêu cầu Check-in ca đặc biệt từ: ${userName}`);

    const ipServer = getLocalIp();
    const portServer = process.env.PORT_SERVER || 3000;

    const checkinUrl = `http://${ipServer}:${portServer}/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin_special_${nameType}_${duration}&shiftId=${shift.id}`;
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

    // await deleteUserSession(chatId);
    // await handleReportCheckin(bot, chatId, userName, shift.id);
}

export const handleReportCheckin = async (bot: TelegramBot, chatId: number, userName: string, shiftId: string) => {
    await bot.sendMessage(chatId, "Please report your planned work for today (at least 6 characters).", {
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
            // await bot.sendMessage(chatId, "You have canceled the action.");
            deleteUserData(chatId);
            return;
        }

        const workReport = response.text?.trim();

        if (!workReport || workReport.length < 6) {
            await bot.sendMessage(
                chatId,
                "Your report is too short. Please provide a detailed report (at least 6 characters).",
                { parse_mode: "HTML" }
            );
            return;
        }

        console.log(`User ${userName} reported work for shift ${shiftId}: ${workReport}`);

        await addReportByStaffId(staffId, workReport);

        await bot.sendMessage(
            chatId,
            `Thank you, <b>${userName}</b>. Your work report has been submitted successfully.`,
            { parse_mode: "HTML" }
        );

        bot.off("message", messageListener);
        await deleteUserSession(chatId); 
        // deleteUserData(chatId);
    };

    await setUserSession(chatId, { command: "reportingWork", listener: messageListener });
    bot.on("message", messageListener);
};
