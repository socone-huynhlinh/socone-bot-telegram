import TelegramBot from "node-telegram-bot-api";
import {  handleSpecialDuration, handleSpecialTimeSelection } from "../checkin";
import { handleOffAdmin, handleOffResponse, handleOffStartTime, handleSelectedStartTime, } from "../requests/request-off-test";

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

            const [action, type, userChatId, detail, subdetail] = data.split('_');

            const userId = parseInt(userChatId);
            
            // Checkin
            if (action === "checkin" && type === "main") {
                // await handleCheckinMain(bot, userId, callbackQuery);
            } else if (action === "checkin" && type === "special") {
                // await handleCheckinSpecial(bot, userId, callbackQuery);
            } else if (action === "special") {
                await handleSpecialDuration(bot, userId, callbackQuery);
            } else if (action === "durationSpecial") {
                await handleSpecialTimeSelection(bot, userId, callbackQuery);
            }

            // Request off
            else if (action === "off") {
                const [action, type, userChatId, offDate, startTime, hour, idOffDay] = data.split('_');
                console.log(`Action: ${action}, Type: ${type}, UserChatId: ${userChatId}, Detail: ${offDate}, StartTime: ${startTime}, Hour: ${hour}, IDOffDay: ${idOffDay}`);
                if (type === "hourly") {
                    await handleOffStartTime(bot, userId, idOffDay, callbackQuery);
                } 
                else if (type === "startTime") {
                    await handleSelectedStartTime(bot, userId, offDate, startTime, idOffDay, callbackQuery);
                }
                else if (type === "approve" || type === "reject") {
                    await handleOffAdmin(bot, type, userId, offDate, startTime, hour, idOffDay, callbackQuery);
                }
                else {
                    await handleOffResponse(bot, userId, offDate, startTime, hour, idOffDay, callbackQuery);
                } 

            // Register
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
