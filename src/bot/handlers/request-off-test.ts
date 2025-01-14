import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../models/user";
import { getOffRequestById ,insertOffRequest, updateOffRequest, getOffReasonbyId } from "../../services/common/work-off-day-infor";
import { isExistDate, isFutureDate } from "../../services/common/validate-date";
import { userSessions } from "../../config/user-session";

// Hàm xử lý yêu cầu nghỉ phép
export const handleRequestOff = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    const userName = `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim();

    console.log(`Yêu cầu Off từ: ${userName}`);

    if (userSessions.has(chatId)) {
        const existingSession = userSessions.get(chatId);
        if (existingSession?.listener) {
            bot.off("message", existingSession.listener); 
        }
        userSessions.delete(chatId); 
    }

    const account: TelegramAccount | null = await getAccountById(chatId);
    if (!account) {
        bot.sendMessage(chatId, "Không tìm thấy tài khoản trong hệ thống.");
        return;
    }

    await bot.sendMessage(
        chatId,
        'Vui lòng chọn ngày bạn cần off và lý do muốn nghỉ, theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ: 10/01/2025-bệnh'
    );

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            // bot.off("message", messageListener); 
            // userSessions.delete(chatId); 
            // await bot.sendMessage(chatId, "✅ Bạn đã hủy thao tác hiện tại.");
            return;
        }

        if (!response.text) {
            await bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
            return;
        }

        const [offDate, offReason] = response.text.split("-").map((str) => str.trim());

        if (!offDate) {
            await bot.sendMessage(
                chatId,
                "Lỗi: Bạn chưa nhập ngày. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do."
            );
            return;
        }

        console.log("Ngày nghỉ:", offDate);
        console.log("Lý do:", offReason);

        if (!isExistDate(offDate)) {
            await bot.sendMessage(
                chatId,
                "Ngày tháng không hợp lệ!\nVui lòng nhập lại theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ 01/01/2024-bệnh"
            );
            return;
        }

        if (!isFutureDate(offDate)) {
            await bot.sendMessage(
                chatId,
                "Lỗi: Ngày xin nghỉ không thể ở trước ngày hiện tại. Vui lòng nhập lại!"
            );
            return;
        }

        if (!offReason) {
            await bot.sendMessage(
                chatId,
                "Lỗi: Bạn chưa nhập lý do. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do."
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
            "Vui lòng chọn thời gian nghỉ của bạn",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Cả ngày", callback_data: `off_full_${chatId}_${offDate}_8:00_8_${idOffDay}` },
                            { text: "Buổi sáng", callback_data: `off_morning_${chatId}_${offDate}_8:00_4_${idOffDay}` },
                            { text: "Buổi chiều", callback_data: `off_afternoon_${chatId}_${offDate}_13:30_4_${idOffDay}` },
                        ],
                        [
                            { text: "Theo giờ", callback_data: `off_hourly_${chatId}_${offDate}_startTime_0_${idOffDay}` },
                        ],
                    ],
                },
            }
        );

        console.log(account.staff_id);

        bot.off("message", messageListener);
        userSessions.delete(chatId); 
    };

    userSessions.set(chatId, { command: "requestingOff", listener: messageListener });

    bot.on("message", messageListener);
};


export const handleOffStartTime = async (
    bot: TelegramBot,
    userId: number,
    idOffDay: string,
    callbackQuery: TelegramBot.CallbackQuery,
) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu không hợp lệ." });
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

    userSessions.set(userId, { command: "choosingStartTime" });

    await bot.sendMessage(
        userId,
        "Vui lòng chọn thời gian bắt đầu nghỉ:",
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

    userSessions.set(userId, { command: "choosingDuration" });

    await handleOffHourlySelection(bot, userId, offDate, startTime,idOffDay, maxDuration);
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Vui lòng chọn số giờ nghỉ." });
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
                text: `${i} giờ`,
                callback_data: `off_hours_${userId}_${offDate}_${startTime}_${i}_${idOffDay}`,
            });
        }

        userSessions.set(userId, { command: "waitingResponse" });

        await bot.sendMessage(
            userId,
            "Vui lòng chọn số giờ nghỉ của bạn",
            {
                reply_markup: {
                    inline_keyboard: [buttons],
                },
            }
        );
    } catch (err) {
        console.error("Lỗi khi chọn số giờ nghỉ:", err);
        await bot.sendMessage(userId, "Có lỗi xảy ra khi chọn số giờ nghỉ của bạn.");
    }
};

export const handleOffResponse = async (bot: TelegramBot, userId: number, offDate: string, startTime: string, hour: string, idOffDay: string, callbackQuery: TelegramBot.CallbackQuery) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu không hợp lệ." });
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

    userSessions.delete(userId);
        
    await bot.sendMessage(
        userId,
        `📋 <b>Đơn xin nghỉ của bạn đã được gửi với thông tin như sau:</b>\n` +
            `      - <b>Ngày nghỉ:</b> ${offDate}\n` +
            `      - <b>Giờ bắt đầu:</b> ${startTime}\n` +
            `      - <b>Giờ kết thúc:</b> ${endTime}\n` +
            `      - <b>Lý do:</b> ${offReason}\n\n` +
            `✅ <i>Vui lòng đợi kết quả xử lý từ admin.</i>`,
        { parse_mode: "HTML" }
    );

    console.log("Data cần nhập vô nè: ", callbackQuery.data);

    await bot.sendMessage(
        -4620420034, 
        `<b>Yêu cầu off từ:</b> ${userName}\n - Thời gian: ${offDate}\n - Bắt đầu: ${startTime}\n - Số giờ: ${hour}h\n - Lý do: ${offReason}`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Phê duyệt ✅", callback_data: `off_approve_${userId}_${offDate}_${startTime}_${hour}_${idOffDay}` },
                        { text: "Từ chối ❌", callback_data: `off_reject_${userId}_${offDate}_${startTime}_${hour}_${idOffDay}` }
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

    console.log("Last callback: ", callbackQuery);
    console.log("Cần truy vấn: ", callbackQuery.data);

    await bot.editMessageReplyMarkup(
        {
            inline_keyboard: [
                [
                    { text: 'Phê duyệt ✅ (Đã xử lý)', callback_data: 'disabled' },
                    { text: 'Từ chối ❌ (Đã xử lý)', callback_data: 'disabled' }
                ]
            ]
        },
        {
            chat_id: callbackQuery.message?.chat.id,
            message_id: callbackQuery.message?.message_id
        }
    ).catch((err) => console.error('Lỗi khi chỉnh sửa nút:', err.message));

    const account: TelegramAccount | null = await getAccountById(userId);

    if (!account) {
        bot.sendMessage(userId, "Không tìm thấy tài khoản trong hệ thống.");
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

        await bot.sendMessage(userId, `✅ Yêu cầu off ngày ${offDate} của bạn đã được Admin phê duyệt. 🎉`);
        await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu off ngày ${offDate}.`);
    } else {
        await updateOffRequest(
            idOffDay,
            offDate,
            startTime,
            parseInt(hour),
            "rejected",
        );
        await bot.sendMessage(userId, `❌ Yêu cầu off ngày ${offDate} của bạn đã bị Admin từ chối. ❌`);
        await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu off ngày ${offDate}.`);
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Đã xử lý yêu cầu." });
};