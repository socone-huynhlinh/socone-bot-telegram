import TelegramBot from "node-telegram-bot-api";
import { registerStatus } from "../../../config/register-status";
// import { Staff } from "../../../models/user";
import { addStaff } from "../../../services/admin/staff-manage";
import { deleteUserSession, getUserSession, setUserSession } from "../../../config/user-session";

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^[0-9]{10,11}$/;

export const handleRegister = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    // Kiểm tra và xóa phiên làm việc hiện tại nếu tồn tại
    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener);
        await deleteUserSession(chatId);
    }

    // Gửi thông báo hướng dẫn
    await bot.sendMessage(
        chatId,
        `Chào mừng bạn đến với hệ thống đăng ký! 😊\n\nĐể đăng ký, vui lòng làm theo cú pháp sau:\n\n` +
        `*Đăng ký: Tên đầy đủ | Vai trò | Số điện thoại | Email*\n\n` +
        `Ví dụ:\nĐăng ký: Nguyễn Văn A | developer | 0912345678 | nguyen.a@gmail.com\n\n` +
        `📌 *Lưu ý:* Vai trò phải là: developer, designer, content creator.\n` +
        `Sau khi gửi, yêu cầu của bạn sẽ được admin xác nhận trước khi hoàn tất.`
    );

    // Lắng nghe phản hồi từ người dùng
    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        // Xử lý lệnh /cancel
        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            await bot.sendMessage(chatId, "✅ Bạn đã hủy thao tác đăng ký.");
            return;
        }

        try {
            const userMessage = response.text;

            if (!userMessage) {
                await bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
                return;
            }

            const parts = userMessage.split("|").map((str) => str.trim());

            if (parts.length !== 4) {
                await bot.sendMessage(chatId, "Vui lòng cung cấp đầy đủ thông tin: Tên đầy đủ | Vai trò | Số điện thoại | Email");
                return;
            }

            const [fullName, roleName, phoneNumber, companyMail] = parts;

            if (!fullName) {
                await bot.sendMessage(chatId, "Tên không được bỏ trống.");
                return;
            }

            if (!["developer", "designer", "content creator"].includes(roleName.toLowerCase())) {
                await bot.sendMessage(chatId, "Vai trò không hợp lệ. Vui lòng nhập: developer, designer, content creator.");
                return;
            }

            if (!phoneRegex.test(phoneNumber)) {
                await bot.sendMessage(chatId, "Số điện thoại không hợp lệ.");
                return;
            }

            if (!emailRegex.test(companyMail)) {
                await bot.sendMessage(chatId, "Email không hợp lệ.");
                return;
            }

            const requestKey = `${chatId}_${companyMail}`;
            if (registerStatus.has(requestKey)) {
                await bot.sendMessage(chatId, "Yêu cầu này đã được gửi và đang chờ xử lý.");
                return;
            }

            registerStatus.set(requestKey, false); // False = chưa xử lý

            // Gửi yêu cầu tới admin
            await bot.sendMessage(
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
                                { text: "Phê duyệt ✅", callback_data: `approve_register_${chatId}_${fullName}_${roleName}_${phoneNumber}_${companyMail}` },
                                { text: "Từ chối ❌", callback_data: `reject_register_${chatId}_${fullName}_${roleName}_${phoneNumber}_${companyMail}` }
                            ]
                        ]
                    }
                }
            );

            await bot.sendMessage(chatId, "Yêu cầu của bạn đã được gửi. Vui lòng chờ xác nhận từ Admin.");

            bot.off("message", messageListener);
            await deleteUserSession(chatId);
        } catch (err) {
            console.error("Error registering staff:", err);
            await bot.sendMessage(chatId, "Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.");
        }
    };

    // Lưu trạng thái và lắng nghe tin nhắn
    await setUserSession(chatId, { command: "registering", listener: messageListener });
    bot.on("message", messageListener);
};

export const handleRegisterResponse = async (bot: TelegramBot, action: string, userId: number, email: string, callbackQuery: TelegramBot.CallbackQuery) => {
    // const requestKey = `${userId}_${email}`;
    // console.log("Request Key:", requestKey);

    if(!callbackQuery.message) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
        return;
    }

    console.log("Callback data nhận được:", callbackQuery.data);    

    // registerStatus.set(requestKey, true);
    await setUserSession(userId, { command: "register admin response", listener: null });

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
    ).catch((err) => console.error('Lỗi khi chỉnh sửa nút:', err.message))

    if (action === 'approve') {
        console.log("Approve register");

        // const staff: Staff = {
        //     id: "",
        //     full_name: "Test1",
        //     role_name: "developer",
        //     phone_number: "1231231231",
        //     company_mail: email,
        // };

        // console.log("Staff:", staff);

        // await addStaff(staff);

        await bot.sendMessage(userId, `✅ Yêu cầu đăng ký với email ${email} của bạn đã được Admin phê duyệt. 🎉`);
        await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu đăng ký với email ${email}.`);
    } else if (action === 'reject') {
        await bot.sendMessage(userId, `❌ Yêu cầu đăng ký với email ${email} của bạn đã bị Admin từ chối. ❌`);
        await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu đăng ký với email ${email}.`);
    } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Hành động không hợp lệ." });
        return;
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Xử lý thành công!" });
};

