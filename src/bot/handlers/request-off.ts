import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../models/user";
import { requestStatus } from "../../config/request-status"; 

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

        // bot.sendMessage(
        //     chatId,
        //     "Kết quả sẽ được Admin xác nhận, cảm ơn bạn đã thông báo!"
        // );

        bot.sendMessage(
            -4620420034, 
            `Yêu cầu off từ: ${userName}\nThời gian: ${offDate}\nLý do: ${offReason}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Phê duyệt ✅", callback_data: `approve_${chatId}_${offDate}` },
                            { text: "Từ chối ❌", callback_data: `reject_${chatId}_${offDate}` }
                        ]
                    ]
                }
            }
        );

        // // Đánh dấu yêu cầu chưa được xử lý
        // const requestKey = `${chatId}_${offDate}`;
        // requestStatus.set(requestKey, false); // False = chưa xử lý

        const requestKey = `${chatId}_${offDate}`;
        if (requestStatus.has(requestKey)) {
            bot.sendMessage(chatId, "Yêu cầu này đã được gửi và đang chờ xử lý.");
            onFinish();
            return;
        }

        requestStatus.set(requestKey, false); // False = chưa xử lý
        bot.sendMessage(chatId, "Kết quả sẽ được Admin xác nhận, cảm ơn bạn đã thông báo!");
        onFinish();
    });
};


export const handleAdminResponse = async (bot: TelegramBot) => {
    bot.on("callback_query", async (callbackQuery) => {
        const data = callbackQuery.data;

        if (!data) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
            return;
        }

        console.log(callbackQuery);

        const [action, userChatId, offDate] = data.split('_');
        const userId = parseInt(userChatId);

        const requestKey = `${userId}_${offDate}`;

        console.log('Trạng thái yêu cầu:', requestStatus.get(requestKey));

        requestStatus.set(requestKey, true);

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

        if (action === 'approve') {
            await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu off ngày ${offDate}.`);
            await bot.sendMessage(userId, `Yêu cầu off ngày ${offDate} của bạn đã được Admin phê duyệt. 🎉`);
        } else if (action === 'reject') {
            await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu off ngày ${offDate}.`);
            await bot.sendMessage(userId, `Yêu cầu off ngày ${offDate} của bạn đã bị Admin từ chối. ❌`);
        }

        // Đánh dấu trạng thái đã xử lý
        if (requestStatus.get(requestKey)) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Đã xử lý thành công!" });
            return;
        }

        await bot.answerCallbackQuery(callbackQuery.id);
    });
};