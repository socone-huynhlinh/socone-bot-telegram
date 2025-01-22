import TelegramBot from "node-telegram-bot-api";
import { getOffRequestById ,insertOffRequest, updateOffRequest, getOffReasonbyId, insertRequestOff } from "../../../services/common/work-off-day-service";
import { isExistDate, isFutureDate, isExpiredRequestOffDate } from "../../../utils/validate-date";
import { deleteUserSession, getUserSession, setUserSession } from "../../../config/user-session";
import Staff from "../../../models/staff";
import { getStaffByChatId } from "../../../services/staff/staff-service";
import { DateTime } from 'luxon';
import { calculateOffDay } from "../../../utils/offDay";

export const handleRequestOff = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userName = `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim();

    console.log(`Yêu cầu Off từ: ${userName}`);

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
    }

    const staff: Staff | null = await getStaffByChatId(chatId.toString())
    if (!staff) {
        bot.sendMessage(chatId, "You have not registered yet. Please register an account to use this feature.");
        await deleteUserSession(chatId);
        return;
    }
    
    await bot.sendMessage(
        chatId,
        'Please select the day you need off and the reason, using the format:\n- Day/Month/Year-Reason\n- Example: 10/01/2025-sick'
    );

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }

        if (!response.text) {
            await bot.sendMessage(chatId, "Error: Message content not found. Please try again!");
            return;
        }

        const [offDate, offReason] = response.text.split("-").map((str) => str.trim());

        if (!offDate) {
            await bot.sendMessage(
                chatId,
                "Error: You have not entered a date! Please re-enter using format:\n- Day/month/year-reason\n- Example: 10/01/2025-sick"
            );
            return;
        }

        console.log("Day off:", offDate);
        console.log("Lý do:", offReason);

        if (!isExistDate(offDate)) {
            await bot.sendMessage(
                chatId,
                "Error: Invalid date! Please re-enter using the format:\n-Day/Month/Year-Reason\n- Example: 10/01/2025-sick"
            );
            return;
        }

        if (!isFutureDate(offDate)) {
            await bot.sendMessage(
                chatId,
                "Error: The requested day off cannot be before the current date. Please re-enter!"
            );
            return;
        }

        if (!offReason) {
            await bot.sendMessage(
                chatId,
                "Error: You have not entered a reason! Please re-enter using the format:\n-Day/Month/Year-Reason\n- Example: 10/01/2025-sick"
            );
            return;
        }

        const idOffDay = await insertOffRequest(
            staff.id!,
            offDate,
            999, 
            "pending",
            offReason,
        );

        await bot.sendMessage(
            chatId,
            "Please select your time off",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Full day", callback_data: `off_full_${chatId}_${offDate}_08:00_8_${idOffDay}` },
                            { text: "Morning", callback_data: `off_morning_${chatId}_${offDate}_08:00_4_${idOffDay}` },
                            { text: "Afternoon", callback_data: `off_afternoon_${chatId}_${offDate}_13:30_4_${idOffDay}` },
                        ],
                        [
                            { text: "Hourly", callback_data: `off_hourly_${chatId}_${offDate}_startTime_0_${idOffDay}` },
                        ],
                    ],
                },
            }
        );

        bot.off("message", messageListener);
        // await deleteUserSession(chatId);
    };    

    await setUserSession(chatId, { command: "/off", listener: messageListener });
    bot.on("message", messageListener);
};

export const handleRequestOffSelection = async (
    bot: TelegramBot,
    callbackQuery: TelegramBot.CallbackQuery
) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const [action, type, userId, offDate, startTime, duration, idOffDay] = callbackQuery.data.split("_");

    console.log("Off date:", offDate);
    console.log("Start time:", startTime);

    const currentDate = new Date();
    const currentDateTime = DateTime.fromJSDate(currentDate, { zone: "Asia/Ho_Chi_Minh" }).toFormat("yyyy-MM-dd HH:mm:ss.SSSZZ");
    
    const offDateSelected = calculateOffDay(offDate, startTime);

    console.log("Current date time:", currentDateTime);
    console.log("Selected date time:", offDateSelected);

    if (offDateSelected <= currentDateTime) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid start time! The selected time has already passed." });
        return;
    }

    if (type === "full") {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "You selected Full Day." });
    } else if (type === "morning") {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "You selected Morning." });
    } else if (type === "afternoon") {
        await bot.sendMessage(chatId, "You selected Afternoon.");
        await bot.answerCallbackQuery(callbackQuery.id, { text: "You selected Afternoon." });
    } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid selection." });
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Processing your selection..." });

    // Tiến hành xử lý tiếp theo
    await handleOffResponse(bot, parseInt(userId), offDate, startTime, duration, idOffDay, callbackQuery);
};

export const handleOffStartTime = async (
    bot: TelegramBot,
    userId: number,
    idOffDay: string,
    callbackQuery: TelegramBot.CallbackQuery,
) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const existingSession = await getUserSession(userId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== userId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(userId);
                // await bot.sendMessage(chatId, "Action canceled.");
                return;
            }
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
        };

    const offDate = callbackQuery.data?.split("_")[3];

    const morningTimes = ["08:00", "09:00", "10:00", "11:00"];
    const afternoonTimes = ["13:30", "14:30", "15:30", "16:30"];

    const buttons = [
        morningTimes.map((startTime) => ({
            text: startTime,
            callback_data: `off_startTime_${userId}_${offDate}_${startTime}_0_${idOffDay}`,
        })),
        afternoonTimes.map((startTime) => ({
            text: startTime,
            callback_data: `off_startTime_${userId}_${offDate}_${startTime}_0_${idOffDay}`,
        })),
    ];

    await bot.sendMessage(
        userId,
        "Please select your start time for time off",
        {
            reply_markup: {
                inline_keyboard: buttons,
            },
        }
    );

    await setUserSession(userId, { command: "choosingStartTime", listener: messageListener });
};

export const handleSelectedStartTime = async (
    bot: TelegramBot,
    userId: number,
    offDate: string,
    startTime: string,
    idOffDay: string,
    callbackQuery: TelegramBot.CallbackQuery
) => {
    const existingSession = await getUserSession(userId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== userId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(userId);
                // await bot.sendMessage(chatId, "Action canceled.");
                return;
            }
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
        };

    // const [offDay, offMonth, offYear] = offDate.split("/").map(Number);
    // const offDateString = `${offYear}-${offMonth}-${offDay}`;

    // const timeZone = "Asia/Ho_Chi_Minh";
    // const offDateLocal = toZonedTime(new Date(offDateString), timeZone);

    const [startHour, startMinute] = startTime.split(":").map(Number);
    // const currentDate = new Date();
    
    // const currentDateLocal = toZonedTime(currentDate, timeZone);
    
    // console.log("Current time:", currentDateLocal);
    // console.log("Selected time:", offDateLocal);

    // if (offDateLocal < currentDateLocal) {
    //     await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid date! The selected date is in the past." });
    //     return;
    // }

    // if (startHour < currentDateLocal.getHours() || (startHour === currentDateLocal.getHours() && startMinute < currentDateLocal.getMinutes())) {
    //     await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid start time! The selected time has already passed." });
    //     return;
    // }

    const currentDate = new Date();
    const currentDateTime = DateTime.fromJSDate(currentDate, { zone: "Asia/Ho_Chi_Minh" }).toFormat("yyyy-MM-dd HH:mm:ss.SSSZZ");
    
    const offDateSelected = calculateOffDay(offDate, startTime);

    console.log("Current date time:", currentDateTime);
    console.log("Selected date time:", offDateSelected);

    if (offDateSelected <= currentDateTime) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid start time! The selected time has already passed." });
        return;
    }

    let maxDuration = 0;
    if (startHour >= 8 && startHour < 12) {
        maxDuration = Math.min(12 - startHour, 3);
    } else if (startHour >= 13 && startHour < 16) {
        maxDuration = Math.min(17 - startHour, 3);
    } else if (startHour === 11 || startHour === 16) {
        maxDuration = 1; 
    }

    // userSessions.set(userId, { command: "choosingDuration" });
    await setUserSession(userId, { command: "choosingDuration", listener: messageListener });

    await handleOffHourlySelection(bot, userId, offDate, startTime,idOffDay, maxDuration);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Please select the number of hours for your time off"});
};

export const handleOffHourlySelection = async (
    bot: TelegramBot,
    userId: number,
    offDate: string,
    startTime: string,
    idOffDay: string,
    maxDuration: number,
) => {
    const existingSession = await getUserSession(userId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
            if (response.chat.id !== userId) return;
    
            if (response.text?.trim() === "/cancel") {
                bot.off("message", messageListener);
                await deleteUserSession(userId);
                // await bot.sendMessage(chatId, "Action canceled.");
                return;
            }
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
        };

    try {
        const buttons = [];
        for (let i = 1; i <= maxDuration; i++) {
            buttons.push({
                text: `${i}-hour`,
                callback_data: `off_hours_${userId}_${offDate}_${startTime}_${i}_${idOffDay}`,
            });
        }

        await setUserSession(userId, { command: "waitingResponse", listener: messageListener });

        await bot.sendMessage(
            userId,
            "Please select the number of hours for your time off",
            {
                reply_markup: {
                    inline_keyboard: [buttons],
                },
            }
        );
    } catch (err) {
        console.error("Lỗi khi chọn số giờ nghỉ:", err);
        await bot.sendMessage(userId, "There was an error selecting your request-off hours.");
    }
};

export const handleOffResponse = async (bot: TelegramBot, userId: number, offDate: string, startTime: string, hour: string, idOffDay: string, callbackQuery: TelegramBot.CallbackQuery) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }
    const msg: TelegramBot.Message = callbackQuery.message as TelegramBot.Message;

    const userName = `${msg.chat?.first_name || ""} ${msg.chat?.last_name || ""}`.trim();

    const offReason = await getOffReasonbyId(idOffDay);

    await updateOffRequest(
        idOffDay,
        offDate,
        startTime,
        parseInt(hour),
        "pending",
    );

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const endHour = startHour + parseInt(hour);

    let endTime
    if (hour === "8") {
        endTime = "17:30";
    }
    else {
        endTime = `${endHour}:${startMinute.toString().padStart(2, "0")}`;
    }

    await bot.sendMessage(
        userId,
        `📋 <b>Your time-off request has been submitted with the following information:</b>\n` +
            `      - <b>Day off:</b> ${offDate}\n` +
            `      - <b>Start time:</b> ${startTime}\n` +
            `      - <b>End time:</b> ${endTime}\n` +
            `      - <b>Reason:</b> ${offReason}\n\n` +
            `✅ <i>Please wait for the admin's decision.</i>`,
        { parse_mode: "HTML" }
    );

    console.log("Data cần nhập vô nè: ", callbackQuery.data);

    await bot.sendMessage(
        -4620420034, 
        `<b>Time-off request from:</b> ${userName}\n - Day off: ${offDate}\n - Start time: ${startTime}\n - Hours: ${hour}h\n - Reason: ${offReason}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Approve ✅", callback_data: `off_approve_${userId}_${offDate}_${startTime}_${hour}_${idOffDay}` },
                        { text: "Reject ❌", callback_data: `off_reject_${userId}_${offDate}_${startTime}_${hour}_${idOffDay}` }
                    ]
                ]
            },
            parse_mode: "HTML",
        }
    );

    await deleteUserSession(userId);
};

export const handleOffAdmin = async (
    bot : TelegramBot,
    type: string,
    userId: number,
    offDate: string,
    startTime: string,
    hour: string,
    idOffDay: string,
    callbackQuery: TelegramBot.CallbackQuery
) => {

    if (isExpiredRequestOffDate(offDate)){
        await bot.answerCallbackQuery(callbackQuery.id, { text: "This leave application is overdue!" });
        return;
    }

    await bot.editMessageReplyMarkup(
        {
            inline_keyboard: [
                [
                    { text: 'Approve ✅ (Processed)', callback_data: 'disabled' },
                    { text: 'Reject ❌ (Processed)', callback_data: 'disabled' }
                ]
            ]
        },
        {
            chat_id: callbackQuery.message?.chat.id,
            message_id: callbackQuery.message?.message_id
        }
    ).catch((err) => console.error('Error while editing button:', err.message));

    // const workOffDay = await getOffRequestById(idOffDay);
    // console.log("WorkOffDay id: ", workOffDay.id);
    // console.log("WorkOffDay staff_id: ", workOffDay.staff_id);
    // console.log("WorkOffDay status: ", workOffDay.status);
    // console.log("WorkOffDay start_time: ", workOffDay.start_time);
    // console.log("WorkOffDay duration_hour: ", workOffDay.duration_hour);
    // console.log("WorkOffDay description: ", workOffDay.reason);

    if (type === "approve") {
        await updateOffRequest(
            idOffDay,
            offDate,
            startTime,
            parseInt(hour),
            "approved",
        );

        await bot.sendMessage(userId, `✅ Your request-off for ${offDate} has been approved by Admin.. 🎉`);
        await bot.sendMessage(-4620420034, `✅ You were approved for the request-off on the request ${offDate}.`);
    } else {
        await updateOffRequest(
            idOffDay,
            offDate,
            startTime,
            parseInt(hour),
            "rejected",
        );
        await bot.sendMessage(userId, `❌ Your request-off for ${offDate} has been rejected by Admin. ❌`);
        await bot.sendMessage(-4620420034, `❌ Your request-off for ${offDate} has been rejected by Admin.`);
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Request processed!" });
};