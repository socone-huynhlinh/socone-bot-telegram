import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../models/user";
import { getOffRequestById ,insertOffRequest, updateOffRequest, getOffReasonbyId } from "../../services/common/work-off-day-infor";
import { off } from "process";
import { isExistDate, isFutureDate } from "../../services/common/validate-date";

// Hàm xử lý yêu cầu nghỉ phép
export const handleRequestOff = async (bot: TelegramBot, msg: TelegramBot.Message, onFinish: () => void) => {
    const chatId = msg.chat.id;
    const userName = `${msg.from?.first_name || ""} ${msg.from?.last_name || ""}`.trim();

    console.log(`Yêu cầu Off từ: ${userName}`);

    const account: TelegramAccount | null = await getAccountById(chatId);

    if (!account) {
        bot.sendMessage(chatId, "Không tìm thấy tài khoản trong hệ thống.");
        return;
    }

    bot.sendMessage(
        chatId,
        'Vui lòng chọn ngày bạn cần off và lý do muốn nghỉ, theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ: 10/01/2025-bệnh'
    );

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return; // Chỉ xử lý tin nhắn từ người dùng hiện tại

        if (!response.text) {
            bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
            return;
        }

        const [offDate, offReason] = response.text.split("-").map((str) => str.trim());

        if (!offDate) {
            bot.sendMessage(
                chatId, 
                "Lỗi: Bạn chưa nhập ngày. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do."
            );
            return;
        }

        console.log("Ngày nghỉ:", offDate);
        console.log("Lý do:", offReason);

        if (!isExistDate(offDate)) {
            bot.sendMessage(
                chatId,
                "Ngày tháng không hợp lệ!\nVui lòng nhập lại theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ 01/01/2024-bệnh"
            );
            return;
        }

        if (!isFutureDate(offDate)) {
            bot.sendMessage(
                chatId,
                "Lỗi: Ngày xin nghỉ không thể ở trước ngày hiện tại. Vui lòng nhập lại!"
            );
            return;
        }

        if (!offReason) {
            bot.sendMessage(
                chatId, 
                "Lỗi: Bạn chưa nhập lý do. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do."
            );
            return;
        }

        const idOffDay = await insertOffRequest(
            account.staff_id,
            offDate,
            null, // Start time sẽ được chọn sau
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

        bot.off("message", messageListener); // Gỡ lắng nghe sau khi xử lý xong
        onFinish();
    };

    bot.on("message", messageListener); // Lắng nghe tin nhắn
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
    const offDate = callbackQuery.data?.split("_")[3]

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== userId) return;

        try {
            if (!response.text) {
                await bot.sendMessage(userId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
                return;
            }

            const startTime = response.text.trim();

            const timeRegex = /^([0-9]|1[0-9]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime)) {
                await bot.sendMessage(userId, "Thời gian không hợp lệ. Vui lòng nhập lại (ví dụ: 8:00 hoặc 13:30).");
                return;
            }

            const [hour, minute] = startTime.split(":").map(Number);

            const isValidMorning = hour >= 8 && hour < 12 && (hour !== 11 || minute === 0);
            const isValidAfternoon = (hour === 16 && minute <= 30) || (hour >= 13 && hour < 16);

            let maxDuration = 0;

            if (isValidMorning) {
                maxDuration = Math.min((12 - hour - (minute > 0 ? 1 : 0)), 3);
            } else if (isValidAfternoon) {
                maxDuration = Math.min(((17.5 - (hour + minute / 60)) | 0), 3);
            }

            if (maxDuration < 1) {
                await bot.sendMessage(
                    userId,
                    "Thời gian không đủ để nghỉ. Vui lòng chọn giờ khác."
                );
                return;
            }

            await handleOffHourlySelection(bot, userId, offDate, startTime, idOffDay, maxDuration);

            bot.off("message", messageListener);
        } catch (err) {
            console.error("Lỗi khi xử lý thời gian nghỉ:", err);
            await bot.sendMessage(userId, "Có lỗi xảy ra khi xử lý thời gian nghỉ của bạn.");
            bot.off("message", messageListener); 
        }
    };

    await bot.sendMessage(
        userId,
        "Vui lòng nhập thời gian nghỉ của bạn, theo cú pháp sau:\n- Ví dụ: 8:00 hoặc 13:30",
    );

    bot.on("message", messageListener);
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