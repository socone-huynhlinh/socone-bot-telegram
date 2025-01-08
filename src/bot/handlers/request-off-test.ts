import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../models/user";
import { requestStatus } from "../../config/request-status"; 
import { saveOffRequest } from "../../services/common/work-of-day";

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

        await bot.sendMessage(
            chatId,
            "Vui lòng chọn thời gian nghỉ của bạn",
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Cả ngày", callback_data: `off_full_${chatId}_${offDate}_8` },
                            { text: "Buổi sáng", callback_data: `off_morning_${chatId}_${offDate}_4` },
                            { text: "Buổi chiều", callback_data: `off_afternoon_${chatId}_${offDate}_4` },
                        ],
                        [
                            { text: "Theo giờ", callback_data: `off_hourly_${chatId}_${offDate}` },
                        ],
                    ],
                },
            }
        );

        console.log(account.staff_id);

        const requestId = await saveOffRequest(
            account.staff_id,
            offDate,
            null,
            "pending",
            offReason,
        );

        bot.sendMessage(chatId, "Yêu cầu của bạn đã được lưu và chờ xử lý.");
        console.log(`Yêu cầu nghỉ phép đã lưu vào DB với ID: ${requestId}`);

        onFinish();
    });
};

export const handleOffHourlySelection = async (
    bot: TelegramBot,
    userId: number,
    offDate: string,
    callbackQuery: TelegramBot.CallbackQuery
) => {
    await bot.sendMessage(
        userId,
        "Vui lòng chọn số giờ nghỉ của bạn",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "1 giờ", callback_data: `off_hours_${userId}_${offDate}_1` },
                        { text: "2 giờ", callback_data: `off_hours_${userId}_${offDate}_2` },
                        { text: "3 giờ", callback_data: `off_hours_${userId}_${offDate}_3` },
                    ],
                ],
            },
        }
    );

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Vui lòng chọn số giờ nghỉ." });
};
