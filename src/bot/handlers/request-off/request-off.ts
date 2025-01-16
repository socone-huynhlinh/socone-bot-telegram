import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../../models/user";
import { getOffRequestById ,insertOffRequest, updateOffRequest, getOffReasonbyId } from "../../../services/common/work-off-day-infor";
import { isExistDate, isFutureDate, isExpiredRequestOffDate } from "../../../services/common/validate-date";
import { setUserSession, getUserSession, deleteUserSession } from "../../../config/user-session";

// Hàm xử lý yêu cầu nghỉ phép
export const handleRequestOff = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userName = `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim();

    console.log(`Yêu cầu Off từ: ${userName}`);

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
        await deleteUserSession(chatId);
    }

    const account: TelegramAccount | null = await getAccountById(chatId);
    if (!account) {
        bot.sendMessage(chatId, "Account not found in the system.");
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
            // await bot.sendMessage(chatId, "✅ Bạn đã hủy thao tác hiện tại.");
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
            account.staff_id,
            offDate,
            null, 
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
                            { text: "Full day", callback_data: `off_full_${chatId}_${offDate}_8:00_8_${idOffDay}` },
                            { text: "Morning", callback_data: `off_morning_${chatId}_${offDate}_8:00_4_${idOffDay}` },
                            { text: "Afternoon", callback_data: `off_afternoon_${chatId}_${offDate}_13:30_4_${idOffDay}` },
                        ],
                        [
                            { text: "Hourly", callback_data: `off_hourly_${chatId}_${offDate}_startTime_0_${idOffDay}` },
                        ],
                    ],
                },
            }
        );

        // console.log(account.staff_id);

        bot.off("message", messageListener);
        await deleteUserSession(chatId);
    };

    await setUserSession(chatId, { command: "requestingOff", listener: messageListener });

    bot.on("message", messageListener);
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

    const offDate = callbackQuery.data?.split("_")[3];

    const morningTimes = ["8:00", "9:00", "10:00", "11:00"];
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

    await setUserSession(userId, { command: "choosingStartTime" });

    await bot.sendMessage(
        userId,
        "Please select your start time for time off",
        {
            reply_markup: {
                inline_keyboard: buttons,
            },
        }
    );
};

export const handleSelectedStartTime = async (
    bot: TelegramBot,
    userId: number,
    offDate: string,
    startTime: string,
    idOffDay: string,
    callbackQuery: TelegramBot.CallbackQuery
) => {
    const [hour, minute] = startTime.split(":").map(Number);

    let maxDuration = 0;
    if (hour >= 8 && hour < 12) {
        maxDuration = Math.min(12 - hour, 3);
    } else if (hour >= 13 && hour < 16) {
        maxDuration = Math.min(17 - hour, 3);
    } else if (hour === 11 || hour === 16) {
        maxDuration = 1; 
    }

    // userSessions.set(userId, { command: "choosingDuration" });
    await setUserSession(userId, { command: "choosingDuration" });

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
    try {
        const buttons = [];
        for (let i = 1; i <= maxDuration; i++) {
            buttons.push({
                text: `${i} h`,
                callback_data: `off_hours_${userId}_${offDate}_${startTime}_${i}_${idOffDay}`,
            });
        }

        // userSessions.set(userId, { command: "waitingResponse" });
        await setUserSession(userId, { command: "waitingResponse" });

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

    // userSessions.delete(userId);
    await deleteUserSession(userId);
        
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

    // console.log("Last callback: ", callbackQuery);
    // console.log("Cần truy vấn: ", callbackQuery.data);

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

    const account: TelegramAccount | null = await getAccountById(userId);

    if (!account) {
        bot.sendMessage(userId, "Account not found in the system.");
        return;
    }

    // off_approve_7986019982_09/01/2025_12h00_1
    // action = off, type = approve, userId = 7986019982, detail = 09/01/2025, subdetail1 = 12h00, subdetail2 = 1
    // Đã có action, userId, detail
    // Cần thay đổi
    // type = approved, rejected, pending
    // start_time = offDate + startTime

    console.log(account.staff_id);

    const workOffDay = await getOffRequestById(idOffDay);
    console.log("WorkOffDay id: ", workOffDay.id);
    console.log("WorkOffDay staff_id: ", workOffDay.staff_id);
    console.log("WorkOffDay status: ", workOffDay.status);
    console.log("WorkOffDay start_time: ", workOffDay.start_time);
    console.log("WorkOffDay duration_hour: ", workOffDay.duration_hour);
    console.log("WorkOffDay description: ", workOffDay.description);

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