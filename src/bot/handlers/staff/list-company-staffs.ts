import TelegramBot from "node-telegram-bot-api"
import { getAllStaffs } from "../../../services/admin/staff-manage"

export const handleGetListStaffs = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    try {
        const staffs = await getAllStaffs()

        if (staffs.length === 0) {
            bot.sendMessage(chatId, "Hiện tại không có nhân viên nào trong danh sách.")
            return
        }

        let response = `Danh sách nhân viên công ty:\n\n`
        // staffs.forEach((staff, index) => {
        //     response += `${index + 1}. Họ và tên: ${staff.full_name}\n`
        //     response += `   Vai trò: ${staff.role_name}\n`
        //     response += `   Số điện thoại: ${staff.phone_number}\n`
        //     response += `   Email: ${staff.company_mail}\n\n`
        // })
        bot.sendMessage(chatId, response)
    } catch (err) {
        console.error("Error sending staff list:", err)
        bot.sendMessage(chatId, "Có lỗi xảy ra khi lấy danh sách nhân viên.")
    }
}
