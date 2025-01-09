import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../models/user";
import { requestStatus } from "../../config/request-status"; 
import { getOffRequestById ,insertOffRequest, updateOffRequest } from "../../services/common/work-off-day-infor";
import { off } from "process";

// Hàm kiểm tra ngày hợp lệ
const isValidDate = (dateStr: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/; // Định dạng dd/mm/yyyy
    if (!regex.test(dateStr)) return false;

    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

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
        'Vui lòng chọn ngày bạn cần off và lý do muốn nghỉ, theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ: 01/01/2024-bệnh'
    );

    bot.once("message", async (response) => {
        if (!response.text) {
            bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
            onFinish();
            return;
        }

        const [offDate, offReason] = response.text.split("-").map((str) => str.trim());

        console.log("Ngày nghỉ:", offDate);
        console.log("Lý do:", offReason);

        if (!isValidDate(offDate)) {
            bot.sendMessage(
                chatId,
                "Ngày tháng không hợp lệ, vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do, ví dụ 01/01/2024-bệnh"
            );
            onFinish();
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
                            { text: "Cả ngày", callback_data: `off_full_${chatId}_${offDate}_8h00_8_${idOffDay}` },
                            { text: "Buổi sáng", callback_data: `off_morning_${chatId}_${offDate}_8h00_4_${idOffDay}` },
                            { text: "Buổi chiều", callback_data: `off_afternoon_${chatId}_${offDate}_13h30_4_${idOffDay}` },
                        ],
                        [
                            { text: "Theo giờ", callback_data: `off_hourly_${chatId}_${offDate}_startTime_0_${idOffDay}` },
                        ],
                    ],
                },
            }
        );

        console.log(account.staff_id);

        bot.sendMessage(chatId, "Yêu cầu của bạn đã được lưu và chờ xử lý.");
        // console.log(`Yêu cầu nghỉ phép đã lưu vào DB với ID: ${requestId}`);

        onFinish();
    });
};

export const handleOffStartTime = async (
    bot: TelegramBot,
    offReason: string,
    callbackQuery: TelegramBot.CallbackQuery,
) => {
    const [userId, offDate] = callbackQuery.data?.split("_").slice(2, 4) || [];
    console.log("Off Date 1: ", offDate);

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Đã nhận yêu cầu, vui lòng nhập thời gian nghỉ." });

    await bot.sendMessage(
        userId,
        "Vui lòng nhập thời gian nghỉ của bạn, theo cú pháp sau:\n- Ví dụ: 8h00",
    );

    bot.once("message", async (response) => {
        try {
            if (!response.text) {
                bot.sendMessage(userId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
                return;
            }
    
            const startTime = response.text.trim();
    
            const timeRegex = /^([0-9]|1[0-2])h[0-5][0-9]$/;
            if (!timeRegex.test(startTime)) {
                await bot.sendMessage(userId, "Thời gian không hợp lệ. Vui lòng nhập lại (ví dụ: 8h00 hoặc 9h30).");
                return;
            }
    
            await handleOffHourlySelection(bot, parseInt(userId), offDate, startTime, offReason, callbackQuery);
        } catch (err) {
            console.error("Lỗi khi xử lý thời gian nghỉ:", err);
            await bot.sendMessage(userId, "Có lỗi xảy ra khi xử lý thời gian nghỉ của bạn.");
            return;
        }
    });
}

export const handleOffHourlySelection = async (
    bot: TelegramBot,
    userId: number,
    offDate: string,
    startTime: string,
    offReason: string, 
    callbackQuery: TelegramBot.CallbackQuery
) => {
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Vui lòng chọn số giờ nghỉ." });

    await bot.sendMessage(
        userId,
        "Vui lòng chọn số giờ nghỉ của bạn",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "1 giờ", callback_data: `off_hours_${userId}_${offDate}_${startTime}_1_${offReason}` },
                        { text: "2 giờ", callback_data: `off_hours_${userId}_${offDate}_${startTime}_2_${offReason}` },
                        { text: "3 giờ", callback_data: `off_hours_${userId}_${offDate}_${startTime}_3_${offReason}` },
                    ],
                ],
            },
        }
    );
};

export const handleOffResponse = async (bot: TelegramBot, userId: number, offDate: string, startTime: string, hourTime: string, idOffDay: string,callbackQuery: TelegramBot.CallbackQuery) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu không hợp lệ." });
        return;
    }

    // const account: TelegramAccount | null = await getAccountById(userId);

    // if (!account) {
    //     bot.sendMessage(userId, "Không tìm thấy tài khoản trong hệ thống.");
    //     return;
    // }

    // console.log(account.staff_id);

    // // Tạo 1 đối tượng mới để lấy thông tin work_off_day
    // const workOffDay = await getOffRequestById(idOffDay);
    // console.log("WorkOffDay status: ", workOffDay.status);
    // console.log("WorkOffDay staff_id: ", workOffDay.staff_id);
    // console.log("WorkOffDay start_time: ", workOffDay.start_time);
    // console.log("WorkOffDay duration_hour: ", workOffDay.duration_hour);
    // console.log("WorkOffDay description: ", workOffDay.description);

    // const requestId = await insertOffRequest(
    //     account.staff_id,
    //     offDate,
    //     null,
    //     "pending",
    //     offReason,
    // );

    console.log("Data cần nhập vô nè: ", callbackQuery.data);

    await bot.sendMessage(
        -4620420034, 
        `Yêu cầu off từ: ${userId}\nThời gian: ${offDate}\n`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Phê duyệt ✅", callback_data: `off_approve_${userId}_${offDate}_${startTime}_${hourTime}_${idOffDay}` },
                        { text: "Từ chối ❌", callback_data: `off_reject_${userId}_${offDate}_${startTime}_${hourTime}_${idOffDay}` }
                    ]
                ]
            }
        }
    );
};

export const handleOffAdmin = async (
    bot : TelegramBot,
    type: string,
    userId: number,
    detail: string,
    subdetail1: string,
    subdetail2: string,
    subdetail3: string,
    callbackQuery: TelegramBot.CallbackQuery
) => {
    // Kiểm tra xem status yêu cầu có tồn tại không
     
    console.log("Last callback: ", callbackQuery);
    console.log("Cần truy vấn: ", callbackQuery.data);

    const [offDate, hours] = detail.split("_");

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
    // type = approved, rejected
    // 

    console.log(account.staff_id);

    // Tạo 1 đối tượng mới để lấy thông tin work_off_day
    const workOffDay = await getOffRequestById(subdetail3);
    console.log("WorkOffDay id: ", workOffDay.id);
    console.log("WorkOffDay staff_id: ", workOffDay.staff_id);
    console.log("WorkOffDay status: ", workOffDay.status);
    console.log("WorkOffDay start_time: ", workOffDay.start_time);
    console.log("WorkOffDay duration_hour: ", workOffDay.duration_hour);
    console.log("WorkOffDay description: ", workOffDay.description);


    if (type === "approve") {
        // const requestId = await updateOffRequest(
        //     account.staff_id,
        //     null,
        //     "approved",
        // );

        await bot.sendMessage(userId, `✅ Yêu cầu off ngày ${offDate} của bạn đã được Admin phê duyệt. 🎉`);
        await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu off ngày ${offDate}.`);
    } else {
        await bot.sendMessage(userId, `❌ Yêu cầu off ngày ${offDate} của bạn đã bị Admin từ chối. ❌`);
        await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu off ngày ${offDate}.`);
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Đã xử lý yêu cầu." });
};