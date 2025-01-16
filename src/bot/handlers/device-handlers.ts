import http from "http"
import bot from "../telegram-bot"
import { sessionDay } from "../../services/common/session-day"
import { writeCheckin } from "../../services/staff/valid-checkin"
import { getAccountById } from "../../services/staff/get-telegram-account"
import { TelegramAccount } from "../../models/user"

export const handleCheckinRequest = async (chatId: number, userName: string, action: string, res: http.ServerResponse) => {
    // Xử lý logic Check-in ở đây
    res.statusCode = 200
    res.setHeader("Content-Type", "text/plain; charset=utf-8")
    res.end(`Check-in thành công cho người dùng ${userName} (Chat ID: ${chatId})`)
    const { session, lateFormatted, lateTime } = sessionDay();

    const lateMessage = lateTime > 0 ? `Late: ${lateFormatted}` : '';

    if (action.split("_")[0] === "checkin" && action.split("_")[1] === "main") {

        console.log("0: ", chatId);

        const account: TelegramAccount | null = await getAccountById(chatId)
        if (account) {
            console.log(`1: ${account.id}`)
            console.log(`2: ${account.first_name}`)
            console.log(`3: ${account.last_name}`)
            console.log(`4: ${account.staff_id}`)
            await writeCheckin(account.staff_id, true, lateFormatted, 'Main shift');
        } else {
            console.log("Không tìm thấy tài khoản.")
        }

        if (lateMessage === '') {
            bot.sendMessage(
                chatId,
                `<b>${userName} - #dev</b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n\n<b>Thanks for always being on time, have a nice day ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }
        else {
            bot.sendMessage(
                chatId,
                `<b>${userName} - #dev</b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n- ${lateMessage}\n\n<b>Have a nice day ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }
    }
    else if (action.split("_")[0] === "checkin" && action.split("_")[1] === "special") {
        console.log("0: ", chatId);

        const account: TelegramAccount | null = await getAccountById(chatId)
        if (account) {
            console.log(`1: ${account.id}`)
            console.log(`2: ${account.first_name}`)
            console.log(`3: ${account.last_name}`)
            console.log(`4: ${account.staff_id}`)
        } else {
            console.log("Không tìm thấy tài khoản.")
        }
        
        const typeDisplay = {
            ot: "OT",
            compensate: "Make-up",
            main: "Main shift special"
        }[action.split("_")[2]] || "Không xác định";

        console.log("Type Display: ", typeDisplay);

        if (account){
            await writeCheckin(account.staff_id, true, lateFormatted, typeDisplay);
        } else {
            console.log("Không tìm thấy tài khoản.")
        }

        bot.sendMessage(
            chatId,
            `<b>${userName} - #dev</b>\n${typeDisplay} - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Hours: ${action.split("_")[3]} hours\n- Mode: Office\n\n<b>Have a nice work ☀️</b>`,
            { parse_mode: "HTML" }
        )
    }

    else if (action === 'checkinRemote') {

        console.log("0: ", chatId);

        const account: TelegramAccount | null = await getAccountById(chatId)
        if (account) {
            console.log(`1: ${account.id}`)
            console.log(`2: ${account.first_name}`)
            console.log(`3: ${account.last_name}`)
            console.log(`4: ${account.staff_id}`)
            await writeCheckin(account.staff_id, true, lateFormatted, 'remote');
        } else {
            console.log("Không tìm thấy tài khoản.")
        }

        if (lateMessage === '') {
            bot.sendMessage(
                chatId,
                `<b>${userName} - #dev</b>\nCa chính - ${new Date().toLocaleDateString('vi-VN')}\n- Checkin: ${session}\n- Hình thức: Làm việc từ xa\n\n<b>Cảm ơn vì đã luôn đúng giờ, ngày mới an lành nhé ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }
        else {
            bot.sendMessage(
                chatId,
                `<b>${userName} - #dev</b>\nCa chính - ${new Date().toLocaleDateString('vi-VN')}\n- Checkin: ${session}\n- Hình thức: Làm việc từ xa\n- ${lateMessage}\n\n<b>Ngày mới an lành nhé ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }
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
