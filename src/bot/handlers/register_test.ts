import TelegramBot from "node-telegram-bot-api";
import { addStaff } from "../../services/admin/staff-manage";
import { Staff } from "../../models/user";
import { registerStatus } from "../../config/register-status";

// Regex kiểm tra thông tin
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9]{10,11}$/;

// Lưu tạm thông tin đăng ký
const pendingRegistrations = new Map<string, Staff>();

export const handleRegister = async (bot: TelegramBot, msg: TelegramBot.Message, onFinish: () => void) => {
    const chatId = msg.chat.id;

    bot.sendMessage(
        chatId,
        `Chào mừng bạn đến với hệ thống đăng ký! 😊\n\nĐể đăng ký, vui lòng làm theo cú pháp sau:\n\n` +
        `*Đăng ký: Tên đầy đủ | Vai trò | Số điện thoại | Email*\n\n` +
        `Ví dụ:\nĐăng ký: Nguyễn Văn A | developer | 0912345678 | nguyen.a@gmail.com\n\n` +
        `📌 *Lưu ý:* Vai trò phải là: developer, designer, content creator.\n` +
        `Sau khi gửi, yêu cầu của bạn sẽ được admin xác nhận trước khi hoàn tất.`
    );

    bot.once("message", async (response) => {
        try {
            const userMessage = response.text;

            if (!userMessage) {
                bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
                onFinish();
                return;
            }

            const parts = userMessage.split("|").map((str) => str.trim());

            if (parts.length !== 4) {
                bot.sendMessage(chatId, "Vui lòng cung cấp đầy đủ thông tin: Tên đầy đủ | Vai trò | Số điện thoại | Email");
                onFinish();
                return;
            }

            const [fullName, roleName, phoneNumber, companyMail] = parts;

            if (!fullName) {
                bot.sendMessage(chatId, "Tên không được bỏ trống.");
                onFinish();
                return;
            }

            if (!["developer", "designer", "content creator"].includes(roleName.toLowerCase())) {
                bot.sendMessage(chatId, "Vai trò không hợp lệ. Vui lòng nhập: developer, designer, content creator.");
                onFinish();
                return;
            }

            if (!phoneRegex.test(phoneNumber)) {
                bot.sendMessage(chatId, "Số điện thoại không hợp lệ.");
                onFinish();
                return;
            }

            if (!emailRegex.test(companyMail)) {
                bot.sendMessage(chatId, "Email không hợp lệ.");
                onFinish();
                return;
            }

            const requestKey = `${chatId}_${companyMail}`;
            if (registerStatus.has(requestKey)) {
                bot.sendMessage(chatId, "Yêu cầu này đã được gửi và đang chờ xử lý.");
                onFinish();
                return;
            }

            const staff: Staff = {
                id: "",
                full_name: fullName,
                role_name: roleName,
                phone_number: phoneNumber,
                company_mail: companyMail,
            };

            pendingRegistrations.set(requestKey, staff);
            registerStatus.set(requestKey, false); // False = chưa xử lý

            // Gửi yêu cầu tới admin
            bot.sendMessage(
                -4620420034, // ID chat của admin
                `📌 Yêu cầu đăng ký mới:\n\n` +
                `👤 Họ tên: ${fullName}\n` +
                `💼 Vai trò: ${roleName}\n` +
                `📞 Số điện thoại: ${phoneNumber}\n` +
                `📧 Email: ${companyMail}\n\n` +
                `Hãy chọn hành động:`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "Phê duyệt ✅", callback_data: `approve_register_${chatId}_${companyMail}` },
                                { text: "Từ chối ❌", callback_data: `reject_register_${chatId}_${companyMail}` }
                            ]
                        ]
                    }
                }
            );

            bot.sendMessage(chatId, "Yêu cầu của bạn đã được gửi đến admin để phê duyệt. Vui lòng chờ.");
        } catch (err) {
            console.error("Error registering staff:", err);
            bot.sendMessage(chatId, "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
        } finally {
            onFinish();
        }
    });
};

export const handleAdminResponse = async (bot: TelegramBot) => {
    bot.on("callback_query", async (callbackQuery) => {
        const data = callbackQuery.data;

        if (!data) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
            return;
        }

        const [action, type, userChatId, companyMail] = data.split('_');
        if (type !== "register") return;

        const chatId = parseInt(userChatId);
        const requestKey = `${chatId}_${companyMail}`;
        const staff = pendingRegistrations.get(requestKey);

        if (!staff) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu không tồn tại hoặc đã được xử lý." });
            return;
        }

        if (registerStatus.get(requestKey)) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu này đã được xử lý trước đó." });
            return;
        }

        registerStatus.set(requestKey, true); // Đánh dấu yêu cầu đã xử lý

        if (action === "approve") {
            // Lưu nhân viên vào cơ sở dữ liệu
            await addStaff(staff);

            await bot.sendMessage(chatId, `🎉 Yêu cầu đăng ký của bạn đã được admin phê duyệt. Chào mừng bạn!`);
            await bot.sendMessage(
                -4620420034,
                `✅ Bạn đã phê duyệt yêu cầu đăng ký của:\n👤 ${staff.full_name}\n💼 Vai trò: ${staff.role_name}\n📧 Email: ${staff.company_mail}`
            );
        } else if (action === "reject") {
            await bot.sendMessage(chatId, `❌ Yêu cầu đăng ký của bạn đã bị admin từ chối.`);
            await bot.sendMessage(
                -4620420034,
                `❌ Bạn đã từ chối yêu cầu đăng ký của:\n👤 ${staff.full_name}\n💼 Vai trò: ${staff.role_name}\n📧 Email: ${staff.company_mail}`
            );
        }

        // Xóa yêu cầu đã xử lý
        pendingRegistrations.delete(requestKey);

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
        );

        await bot.answerCallbackQuery(callbackQuery.id, { text: "Đã xử lý thành công!" });
    });
};

