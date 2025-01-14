import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../../services/staff/get-telegram-account";
import { requestStatus } from "../../../config/request-status"; 
import TelegramAccount from "../../../models/telegram-account";



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
        
        bot.sendMessage(
            -4620420034, 
            `Yêu cầu off từ: ${userName}\nThời gian: ${offDate}\nLý do: ${offReason}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Phê duyệt ✅", callback_data: `approve_off_${chatId}_${offDate}` },
                            { text: "Từ chối ❌", callback_data: `reject_off_${chatId}_${offDate}` }
                        ]
                    ]
                }
            }
        );

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