import TelegramBot from "node-telegram-bot-api";
import { getAccountById } from "../../services/staff/get-telegram-account";
import { TelegramAccount } from "../../models/user";
import { getOffRequestById ,insertOffRequest, updateOffRequest, getOffReasonbyId } from "../../services/common/work-off-day-infor";
import { off } from "process";
import { isExistDate, isFutureDate } from "../../services/common/validate-date";

export const handleStart = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    bot.sendMessage(msg.chat.id, "Chào mừng bạn đến với hệ thống quản lý nhân sự của công ty SoC.one")
};