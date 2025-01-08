import TelegramBot from "node-telegram-bot-api";
import { requestStatus } from "../../config/request-status"; 
import { registerStatus } from "../../config/register-status";
// import { handleRegister } from './register';
// import { register } from "module";
import { Staff } from '../../models/user';
import { addStaff } from "../../services/admin/staff-manage";
import { handleCheckinMain, handleCheckinSpecial, handleSpecialDuration, handleSpecialTimeSelection } from "./checkin_test";
import { handleOffHourlySelection } from "./request-off-test";

export const handleAdminResponse = async (bot: TelegramBot) => {
    bot.on("callback_query", async (callbackQuery) => {
        try {
            const data = callbackQuery.data;

            console.log("Data:", data);

            if (!data) {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
                return;
            }

            console.log("Callback nhận được:", callbackQuery);

            const [action, type, userChatId, detail] = data.split('_');

            // Kiểm tra dữ liệu callback hợp lệ
            // if (!action || !type || !userChatId || !detail) {
            //     await bot.answerCallbackQuery(callbackQuery.id, { text: "Dữ liệu callback không hợp lệ." });
            //     return;
            // }

            console.log("Action:", action);
            console.log("Type:", type);

            const userId = parseInt(userChatId);

            if (action === "checkin" && type === "main") {
                await handleCheckinMain(bot, userId, callbackQuery);
            } else if (action === "checkin" && type === "special") {
                await handleCheckinSpecial(bot, userId, callbackQuery);
            } else if (action === "special") {
                await handleSpecialDuration(bot, userId, callbackQuery);
            } else if (action === "durationSpecial") {
                await handleSpecialTimeSelection(bot, userId, callbackQuery);
            }

            else if (action === "off") {
                if (type === "hourly") {
                    await handleOffHourlySelection(bot, userId, detail, callbackQuery);
                } else {
                    await handleOffResponse(bot, action, userId, detail, callbackQuery);
                }

            } else if (type == "register") {
                console.log("Register response");
                await handleRegisterResponse(bot, action, userId, detail, callbackQuery);
            } else {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Loại yêu cầu không hợp lệ." });
                return;
            }
        }
        catch (error) {
            console.error("Lỗi trong quá trình xử lý phản hồi từ Admin:", error);
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Có lỗi xảy ra khi xử lý yêu cầu." });
        }
    });
}

const handleOffResponse = async (bot: TelegramBot, action: string, userId: number, offDate: string, callbackQuery: TelegramBot.CallbackQuery) => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu không hợp lệ." });
        return;
    }

    console.log("Data: ", callbackQuery.data);

    await bot.sendMessage(
        -4620420034, 
        `Yêu cầu off từ: ${userId}\nThời gian: ${offDate}\n`,
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Phê duyệt ✅", callback_data: `approve_off_${userId}_${offDate}` },
                        { text: "Từ chối ❌", callback_data: `reject_off_${userId}_${offDate}` }
                    ]
                ]
            }
        }
    );
}

const handleOffResponse_old = async (bot: TelegramBot, action: string, userId: number, offDate: string, callbackQuery: TelegramBot.CallbackQuery) => {
    const requestKey = `${userId}_${offDate}`;
    console.log("Request Key:", requestKey);

    if (!requestStatus.has(requestKey)) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu đã hết hạn hoặc không tồn tại." });
        return;
    }

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
        await bot.sendMessage(userId, `✅ Yêu cầu off ngày ${offDate} của bạn đã được Admin phê duyệt. 🎉`);
        await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu off ngày ${offDate}.`);
    } else if (action === 'reject') {
        await bot.sendMessage(userId, `❌ Yêu cầu off ngày ${offDate} của bạn đã bị Admin từ chối. ❌`);
        await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu off ngày ${offDate}.`);
    } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Hành động không hợp lệ." });
        return;
    }

    await bot.answerCallbackQuery(callbackQuery.id, { text: "Xử lý thành công!" });
};

const handleRegisterResponse = async (bot: TelegramBot, action: string, userId: number, email: string, callbackQuery: TelegramBot.CallbackQuery) => {
    const requestKey = `${userId}_${email}`;
    console.log("Request Key:", requestKey);

    if (!registerStatus.has(requestKey)) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Yêu cầu đã hết hạn hoặc không tồn tại." });
        return;
    }

    registerStatus.set(requestKey, true);
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

        const staff: Staff = {
            id: "",
            full_name: "Test1",
            role_name: "developer",
            phone_number: "1231231231",
            company_mail: email,
        };

        console.log("Staff:", staff);

        await addStaff(staff);

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