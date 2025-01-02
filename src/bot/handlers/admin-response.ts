import TelegramBot from "node-telegram-bot-api";
import { requestStatus } from "../../config/request-status"; // Import trạng thái dùng chung

// Hàm xử lý phản hồi từ Admin
export const handleAdminResponse = async (bot: TelegramBot) => {
    bot.on("callback_query", async (callbackQuery) => {
        try {
            // Kiểm tra nếu dữ liệu callback không tồn tại
            const data = callbackQuery.data;
            if (!data) {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
                return;
            }

            console.log("Callback nhận được:", callbackQuery);

            // Phân tách dữ liệu từ callback
            const [action, userChatId, offDate] = data.split('_');

            // Kiểm tra dữ liệu callback hợp lệ
            if (!action || !userChatId || !offDate) {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
                return;
            }

            const userId = parseInt(userChatId);

            // Tạo key để kiểm tra trạng thái xử lý
            const requestKey = `${userId}_${offDate}`;
            console.log("Request Key:", requestKey);

            // Kiểm tra trạng thái yêu cầu
            if (!requestStatus.has(requestKey)) {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu đã hết hạn hoặc không tồn tại." });
                return;
            }

            // Đánh dấu trạng thái đã xử lý
            requestStatus.set(requestKey, true);

            // Chỉnh sửa nút bấm thành trạng thái đã xử lý
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

            // Xử lý phản hồi từ Admin
            if (action === 'approve') {
                // Phê duyệt
                await bot.sendMessage(userId, `✅ Yêu cầu off ngày ${offDate} của bạn đã được Admin phê duyệt. 🎉`);
                await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu off ngày ${offDate}.`);
            } else if (action === 'reject') {
                // Từ chối
                await bot.sendMessage(userId, `❌ Yêu cầu off ngày ${offDate} của bạn đã bị Admin từ chối. ❌`);
                await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu off ngày ${offDate}.`);
            } else {
                // Xử lý hành động không hợp lệ
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Hành động không hợp lệ." });
                return;
            }

            // Trả lời callback để tránh lỗi timeout
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Xử lý thành công!" });
        } catch (error) {
            console.error("Lỗi trong quá trình xử lý phản hồi từ Admin:", error);
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Có lỗi xảy ra khi xử lý yêu cầu." });
        }
    });
};
