import TelegramBot from "node-telegram-bot-api"
import axios from "axios"

import { sessionDay } from "../../services/common/device-infor"

// src/handlers/checkin.ts

export const handleRemote = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-in vì thiếu thông tin người dùng.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()
    const { session, lateFormatted, lateTime } = sessionDay();

    console.log(`Yêu cầu Check-in từ: ${userName}`)

    const checkinUrl = `http://117.2.125.118:3000/check-remote?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin`
    // bot.sendMessage(chatId, "Hãy nhấp vào nút bên dưới để thực hiện Check-in của bạn:", {
    //     reply_markup: {
    //         inline_keyboard: [
    //             [
    //                 {
    //                     text: "Thực hiện Check-in ✅",
    //                     url: checkinUrl,
    //                 },
    //             ],
    //         ],
    //     },
    // })

    // Gửi thông báo cho người dùng
    try {
        const respone = await axios.get(checkinUrl)

        if (respone.status == 200) {
            const lateMessage = lateTime > 0 ? `Đi trễ: ${lateFormatted}` : '';

            bot.sendMessage(
            chatId,
            `<b>${userName} - #dev</b>\nCa chính - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Hình thức: Làm việc Remote\n- ${lateMessage}\n\n<b>Cảm ơn vì đã luôn đúng giờ, ngày mới an lành nhé ☀️</b>`,
            { parse_mode: "HTML" }
            )
        }
        else {
            bot.sendMessage(
            chatId,
            `Check-in thất bại cho người dùng ${userName} (Chat ID: ${chatId})`
            )
        }

    } catch (error) {
        console.error("Lỗi khi thực hiện Check-in:", error)
    }
}

export const handleCheckout = (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-out vì thiếu thông tin người dùng.")
        return
    }

    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-out từ: ${userName}`)

    const checkoutUrl = `http://192.168.1.12:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkout`
    bot.sendMessage(chatId, "Hãy nhấp vào nút bên dưới để thực hiện Check-out của bạn:", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Thực hiện Check-out 🚪",
                        url: checkoutUrl,
                    },
                ],
            ],
        },
    })
}
