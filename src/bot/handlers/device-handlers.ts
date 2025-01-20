import http from "http"
import bot from "../telegram-bot"
import { sessionDay } from "../../utils/session-day"
import { insertCheckin } from "../../services/staff/valid-checkin"
import { getStaffByChatId } from "../../services/staff/staff-service"
import Staff, { mapStaffFromJson } from "../../models/staff"

export const handleCheckinRequest = async (chatId: number, userName: string, action: string, shiftId: string,res: http.ServerResponse) => {
    // Xử lý logic Check-in ở đây
    res.statusCode = 200
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.end(`Check-in thành công cho người dùng ${userName} (Chat ID: ${chatId})`)
    const { session, lateFormatted, lateTime } = sessionDay();

    const lateMessage = lateTime > 0 ? `Late: ${lateFormatted}` : '';

    if (action.split("_")[0] === "checkin" && action.split("_")[1] === "main") {

        console.log("0: ", chatId);

        // const account: TelegramAccount | null = await getAccountById(chatId)
        const staff: Staff | null = await getStaffByChatId(chatId.toString())
        const jsonStaff = mapStaffFromJson(staff);

        if (jsonStaff?.id) {
            await insertCheckin(jsonStaff.id, shiftId, 8);
            console.log("Telegram Account: ", jsonStaff.tele_account?.username);
        } else {
            console.log("Không tìm thấy tài khoản.")
        }

        if (lateMessage === '') {
            bot.sendMessage(
                chatId,
                `<b>${jsonStaff.tele_account?.username} - #dev</b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n\n<b>Thanks for always being on time, have a nice day ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }
        else {
            bot.sendMessage(
                chatId,
                `<b>${jsonStaff.tele_account?.username} - #dev</b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n- ${lateMessage}\n\n<b>Have a nice day ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }
    }
    else if (action.split("_")[0] === "checkin" && action.split("_")[1] === "special") {
        console.log("0: ", chatId);

        // const account: TelegramAccount | null = await getAccountById(chatId)
        const staff: Staff | null = await getStaffByChatId(chatId.toString())
        const jsonStaff = mapStaffFromJson(staff);

        const typeDisplay = {
            ot: "OT",
            "time in lieu": "Time in lieu",
            main: "Main shift special"
        }[decodeURIComponent(action.split("_")[2])] || "Không xác định";

        const duration = action.split("_")[3];

        console.log("Type Display: ", typeDisplay);

        if (staff?.id) {
            await insertCheckin(staff.id, shiftId, parseInt(duration));
        } else {
            console.log("Không tìm thấy tài khoản.")
        }

        bot.sendMessage(
            chatId,
            `<b>${jsonStaff.tele_account?.username} - #dev</b>\n${typeDisplay} - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Hours: ${action.split("_")[3]} hours\n- Mode: Office\n\n<b>Have a nice work ☀️</b>`,
            { parse_mode: "HTML" }
        )
    }
}

export const handleCheckoutRequest = (chatId: string, userName: string, action: string, res: http.ServerResponse) => {
    // Xử lý logic Check-out ở đây
    res.statusCode = 200
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.end(`Check-out thành công cho người dùng ${userName} (Chat ID: ${chatId})`)

    const { session } = sessionDay();

    if (action === 'checkout') {
        bot.sendMessage(
            chatId,
            `<b>${userName} - #dev</b>\nCa chính - ${new Date().toLocaleDateString('vi-VN')}\n- Checkout: ${session}\n- Hình thức: Làm việc tại văn phòng\n\n<b>Cảm ơn vì đã hoàn thành công việc, hẹn gặp lại bạn nhé ☺️</b>`,
            { parse_mode: "HTML" }
        )
    }
    else if (action === 'checkoutRemote') {
        bot.sendMessage(
            chatId,
            `<b>${userName} - #dev</b>\nCa chính - ${new Date().toLocaleDateString('vi-VN')}\n- Checkout: ${session}\n- Hình thức: Làm việc từ xa\n\n<b>Cảm ơn vì đã hoàn thành công việc, hẹn gặp lại bạn nhé ☺️</b>`,
            { parse_mode: "HTML" }
        )
    }
}
