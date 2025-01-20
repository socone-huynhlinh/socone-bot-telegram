import TelegramBot from "node-telegram-bot-api";
import { handleCheckinMain, handleCheckinSpecial, handleSpecialDuration, handleSpecialTimeSelection } from "../checkin/checkin";
import { handleOffStartTime, handleOffAdmin, handleOffResponse, handleSelectedStartTime } from "../request-off/request-off";
import { handleRegisterResponse } from "../register/register";
import { handleDepartment } from "../register/register-test";

export const handleAdminResponse = async (bot: TelegramBot) => {
    bot.on("callback_query", async (callbackQuery) => {
        try {
            const data = callbackQuery.data;

            console.log("Data:", data);

            if (!data) {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid callback data!" });
                return;
            }

            console.log("Callback nhận được:", callbackQuery);

            const [action, type, userChatId, detail, subdetail, subdetail2] = data.split('_');

            const userId = parseInt(userChatId);
            
            // Checkin
            if (action === "checkin" && type === "main") {
                // await handleCheckinMain(bot, userId, callbackQuery);
                bot.answerCallbackQuery(callbackQuery.id, { text: "You have selected main shift check-in." });
            } else if (action === "checkin" && type === "special") {
                // await handleCheckinSpecial(bot, userId);
                bot.answerCallbackQuery(callbackQuery.id, { text: "You have selected special shift check-in." });
            } else if (action === "special") {
                await handleSpecialDuration(bot, userId, callbackQuery);
                // bot.answerCallbackQuery(callbackQuery.id, { text: "You have selected special shift." });
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
            }

            // Register
            else if (action === "register") {
                console.log("Register response:");
                if (type === "branch") {
                    await handleDepartment(bot, callbackQuery);
                }
            } 

            // Invalid request
            else if (callbackQuery.data === "disabled") {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "You have processed this request before!" });
                return;
            }
            
            else {
                await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
                return;
            }
        }
        catch (error) {
            console.error("Lỗi trong quá trình xử lý phản hồi từ Admin:", error);
            await bot.answerCallbackQuery(callbackQuery.id, { text: "Error: occurred while processing request." });
            return;
        }
    });
}

