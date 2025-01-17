import TelegramBot, { CallbackQuery } from "node-telegram-bot-api"
import Router from "../../../routes/router"
import StaffService from "../../../services/impl/staff.service"
import Staff from "../../../models/staff"
import { isExistDate, isExpiredRequestOffDate, isFutureDate } from "../../../utils/validate-date"
import { RequestOffService } from "../../../services/impl/request-off.service"
import WorkOffDay from "../../../models/work-off-day"
import { handleOffStartTime, handleSelectedStartTime } from "./select-hour-handle"
import { deleteUserSession, getUserSession, setUserSession } from "../../../utils/user-session"
const staffService = new StaffService()
const requestOffService = new RequestOffService()
const startRequestOff = async (bot: TelegramBot, msg: TelegramBot.Message, router: Router) => {
    const chatId = msg.chat.id
    const staffAccount: Staff | null = await staffService.findStaffByTeleId(chatId.toString())
    const existingSession = await getUserSession(chatId)
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener)
        await deleteUserSession(chatId)
    }
    if (!staffAccount) {
        bot.sendMessage(chatId, "Bạn cần đăng ký trước để sử dụng tính năng này")
        return
    }
    bot.sendMessage(
        chatId,
        "Vui lòng chọn ngày bạn cần off và lý do muốn nghỉ, theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ: 10/01/2025-bệnh",
    )
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messageListener = async (response: TelegramBot.Message): Promise<void> => {
        if (response.chat.id !== chatId) return // Chỉ xử lý tin nhắn từ người dùng hiện tại

        if (!response.text) {
            bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!")
            return
        }
        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener)
            await deleteUserSession(chatId)
            // await bot.sendMessage(chatId, "✅ Bạn đã hủy thao tác hiện tại.");
            return
        }

        const [offDate, offReason] = response.text.split("-").map((str) => str.trim())

        if (!offDate) {
            bot.sendMessage(chatId, "Lỗi: Bạn chưa nhập ngày. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do.")
            return
        }
        if (!isExistDate(offDate)) {
            bot.sendMessage(
                chatId,
                "Ngày tháng không hợp lệ!\nVui lòng nhập lại theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ 01/01/2024-bệnh",
            )
            return
        }

        if (!isFutureDate(offDate)) {
            bot.sendMessage(chatId, "Lỗi: Ngày xin nghỉ không thể ở trước ngày hiện tại. Vui lòng nhập lại!")
            return
        }

        if (!offReason) {
            bot.sendMessage(chatId, "Lỗi: Bạn chưa nhập lý do. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do.")
            return
        }
        router.setUserData(chatId, "offDate", offDate)
        console.log(offDate)
        router.setUserData(chatId, "staff", staffAccount)
        router.setUserData(chatId, "offReason", offReason)
        await bot.sendMessage(chatId, "Vui lòng chọn thời gian nghỉ của bạn", {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Cả ngày", callback_data: `off_full_8:00` },
                        { text: "Buổi sáng", callback_data: `off_morning_8:00` },
                        { text: "Buổi chiều", callback_data: `off_afternoon_13:30` },
                    ],
                    [{ text: "Theo giờ", callback_data: `hourly_${chatId}` }],
                ],
            },
        })
        bot.off("message", messageListener)
        await deleteUserSession(chatId)
    }
    await setUserSession(chatId, { command: "requestingOff", listener: messageListener })
    bot.on("message", messageListener) // Lắng nghe tin nhắn
}

const handleShiftWorkOff = async (query: CallbackQuery, bot: TelegramBot, router: Router) => {
    const callbackData = query.data // Lấy dữ liệu callback
    const chatId = query.message?.chat.id
    if (!chatId) {
        return
    }
    if (callbackData && callbackData.startsWith("off_")) {
        const parts = callbackData.split("_")
        const typeShift = parts[1]
        const startTimeOnDate = parts[2] // VD: "8:00" hoặc "13:30"
        const staff = router.getUserData(chatId)

        if (!staff) {
            return
        }
        const offDate = staff.offDate // VD: "15/01/2025" (dd/MM/yyyy)

        // Kiểm tra dữ liệu đầu vào
        if (!offDate || !startTimeOnDate) {
            return
        }
        const [startHour, startMinute] = startTimeOnDate.split(":").map(Number)
        // // Chuyển đổi offDate từ "dd/MM/yyyy" thành "yyyy-MM-dd"
        const [day, month, year] = offDate.split("/").map(Number)
        if (!day || !month || !year) {
            throw new Error("Invalid date format")
        }

        if (isNaN(startHour) || isNaN(startMinute)) {
            throw new Error("Invalid time format")
        }

        const startDate = new Date(year, month - 1, day, startHour, startMinute) // Tạo Date object
        if (isNaN(startDate.getTime())) {
            throw new Error("Invalid date or time value")
        }
        const start_time = startDate.toISOString()
        const userData = router.getUserData(chatId)
        if (!userData) {
            return
        }
        let duration_hour = 8
        if (typeShift === "morning" || typeShift === "afternoon") {
            duration_hour = 4
        }

        const workOffDay: WorkOffDay = {
            staff_id: staff.staff.id,
            start_time: start_time, // Lưu dưới dạng ISO 8601 để tương thích với PostgreSQL
            duration_hour: duration_hour,
            reason: staff.offReason,
            status: "pending",
        }
        let endTime = `${startHour + duration_hour}:${startMinute.toString().padStart(2, "0")}`
        if (duration_hour === 8) {
            endTime = "17:30"
        }
        const idOffService = await requestOffService.insertRequestOff(workOffDay)
        if (idOffService) {
            await bot.sendMessage(
                chatId,
                `📋 <b>Đơn xin nghỉ của bạn đã được gửi với thông tin như sau:</b>\n` +
                    `      - <b>Ngày nghỉ:</b> ${offDate}\n` +
                    `      - <b>Giờ bắt đầu:</b> ${startTimeOnDate}\n` +
                    `      - <b>Giờ kết thúc:</b> ${endTime}\n` +
                    `      - <b>Lý do:</b> ${userData.offReason}\n\n` +
                    `✅ <i>Vui lòng đợi kết quả xử lý từ admin.</i>`,
                { parse_mode: "HTML" },
            )
        }

        // await bot.sendMessage(
        //     -4620420034,
        //     `<b>Yêu cầu off từ:</b> ${staff.staff.full_name}\n - Thời gian: ${offDate}\n - Bắt đầu: ${startTimeOnDate}\n - Số giờ: ${duration_hour}h\n - Lý do: ${staff.offReason}`,
        //     {
        //         reply_markup: {
        //             inline_keyboard: [
        //                 [
        //                     {
        //                         text: "Phê duyệt ✅",
        //                         callback_data: `request_admin_off_approve_${chatId}_${offDate}_${startTimeOnDate}_${duration_hour}_${idOffService}`,
        //                     },
        //                     {
        //                         text: "Từ chối ❌",
        //                         callback_data: `request_admin_off_reject_${chatId}_${offDate}_${startTimeOnDate}_${duration_hour}_${idOffService}`,
        //                     },
        //                 ],
        //             ],
        //         },
        //         parse_mode: "HTML",
        //     },
        // )

        // Xử lý tiếp với workOffDay nếu cần...
    }
}

const handlePendingRequestOff = async (query: CallbackQuery, bot: TelegramBot, router: Router) => {
    const callbackData = query.data
    const chatId = query.message?.chat.id
    if (!chatId) {
        return
    }
    if (callbackData && callbackData.startsWith("duration_hour_")) {
        const parts = callbackData.split("_")
        const durationHour = parts[parts.length - 1]
        const startTime = parts[parts.length - 2]
        console.log(parts)
        const [startHour, startMinute] = startTime.split(":").map(Number)
        const endHour = startHour + parseInt(durationHour)

        let endTime
        if (durationHour === "8") {
            endTime = "17:30"
        } else {
            endTime = `${endHour}:${startMinute.toString().padStart(2, "0")}`
        }

        const offDate = parts[parts.length - 3]
        const [day, month, year] = offDate.split("/").map(Number)
        if (!day || !month || !year) {
            throw new Error("Invalid date format")
        }

        if (isNaN(startHour) || isNaN(startMinute)) {
            throw new Error("Invalid time format")
        }

        const startDate = new Date(year, month - 1, day, startHour, startMinute) // Tạo Date object
        if (isNaN(startDate.getTime())) {
            throw new Error("Invalid date or time value")
        }

        const start_time = startDate.toISOString() // Chuyển thành ISO 8601

        const userData = router.getUserData(chatId)
        if (!userData) {
            return
        }
        const workOffDay: WorkOffDay = {
            staff_id: userData.staff.id,
            start_time: start_time, // Lưu dưới dạng ISO 8601
            duration_hour: parseInt(durationHour),
            reason: userData.offReason,
            status: "pending",
        }
        const idOffDay = await requestOffService.insertRequestOff(workOffDay)
        await bot.sendMessage(
            chatId,
            `📋 <b>Đơn xin nghỉ của bạn đã được gửi với thông tin như sau:</b>\n` +
                `      - <b>Ngày nghỉ:</b> ${offDate}\n` +
                `      - <b>Giờ bắt đầu:</b> ${startTime}\n` +
                `      - <b>Giờ kết thúc:</b> ${endTime}\n` +
                `      - <b>Lý do:</b> ${userData.offReason}\n\n` +
                `✅ <i>Vui lòng đợi kết quả xử lý từ admin.</i>`,
            { parse_mode: "HTML" },
        )

        await deleteUserSession(chatId)

        await bot.sendMessage(
            -4620420034,
            `<b>Yêu cầu off từ:</b> ${userData.staff.full_name}\n - Thời gian: ${offDate}\n - Bắt đầu: ${startTime}\n - Số giờ: ${durationHour}h\n - Lý do: ${userData.offReason}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Phê duyệt ✅",
                                callback_data: `request_admin_off_approve_${chatId}_${offDate}_${startTime}_${durationHour}_${idOffDay}`,
                            },
                            {
                                text: "Từ chối ❌",
                                callback_data: `request_admin_off_reject_${chatId}_${offDate}_${startTime}_${durationHour}_${idOffDay}`,
                            },
                        ],
                    ],
                },
                parse_mode: "HTML",
            },
        )
    }
}

export const handleResponseAdmin = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) => {
    const callbackData = callbackQuery.data // Lấy dữ liệu callback
    const chatId = callbackQuery.message?.chat.id
    if (callbackData && callbackData.startsWith("request_admin_off_")) {
        const parts = callbackData.split("_")
        const type = parts[3]
        const idOffDay = parts[parts.length - 1]
        const userId = parts[4]
        const offDate = parts[5]
        if (isExpiredRequestOffDate(offDate)) {
            await bot.answerCallbackQuery(callbackQuery.id, { text: "This leave application is overdue!" })
            return
        }
        await bot
            .editMessageReplyMarkup(
                {
                    inline_keyboard: [
                        [
                            { text: "Approve ✅ (Processed)", callback_data: "disabled" },
                            { text: "Reject ❌ (Processed)", callback_data: "disabled" },
                        ],
                    ],
                },
                {
                    chat_id: callbackQuery.message?.chat.id,
                    message_id: callbackQuery.message?.message_id,
                },
            )
            .catch((err) => console.error("Error while editing button:", err.message))
        if (!chatId) {
            return
        }
        if (type === "approve") {
            await requestOffService.updateStatusRequestOffById(idOffDay, "approved")
            await bot.sendMessage(userId, `✅ Your request-off for ${offDate} has been approved by Admin.. 🎉`)
            await bot.sendMessage(-4620420034, `✅ You were approved for the request-off on the request ${offDate}.`)
        } else {
            await requestOffService.updateStatusRequestOffById(idOffDay, "rejected")
            await bot.sendMessage(userId, `❌ Your request-off for ${offDate} has been rejected by Admin. ❌`)
            await bot.sendMessage(-4620420034, `❌ Your request-off for ${offDate} has been rejected by Admin.`)
        }
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Request processed!" })
    }
}

const initRequestOffRoutes = (router: Router): void => {
    router.addRoute("/off", (msg, bot) => startRequestOff(bot, msg, router))
    router.addCallback("hourly_", (query, bot) => handleOffStartTime(query, bot, router))
    router.addCallback("off_", (query, bot) => handleShiftWorkOff(query, bot, router))
    router.addCallback("startTime_", (query, bot) => handleSelectedStartTime(query, bot))
    router.addCallback("duration_hour_", (query, bot) => handlePendingRequestOff(query, bot, router))
    router.addCallback("request_admin_off_", (query, bot) => handleResponseAdmin(bot, query))
}
export default initRequestOffRoutes
