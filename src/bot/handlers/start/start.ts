import TelegramBot from "node-telegram-bot-api";
import { mapStaffFromJson } from "../../../models/staff";
import { getStaffByChatId, getStaffPendingByChatId } from "../../../services/staff/staff-service";

export const handleStart = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    bot.sendMessage(msg.chat.id, "Welcome to SoC.one company's human resource management system!")

    // const staff = mapStaffFromJson(await getStaffPendingByChatId(msg.chat.id.toString()));
    // const test = mapStaffFromJson(staff);
    // console.log ("Staff: ", staff.department?.branch?.name);
};