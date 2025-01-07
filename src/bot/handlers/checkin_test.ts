import TelegramBot from "node-telegram-bot-api"
import { isValidCheckin } from "../../services/staff/valid-checkin"
import { getAccountById } from "../../services/staff/get-telegram-account"
import { TelegramAccount } from "../../models/user"

// src/handlers/checkin.ts

export const handleCheckin = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-in vì thiếu thông tin người dùng.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-in từ: ${userName}`)

    const account: TelegramAccount | null = await getAccountById(chatId)

    // Kiểm tra xem người dùng đã Check-in chưa
    if (account) {
        const isCheckin = await isValidCheckin(account.staff_id)
        if (isCheckin) {
            console.log('Người dùng đã Check-in')
            bot.sendMessage(chatId, "Bạn đã Check-in rồi, không thể Check-in lại.")
            return
        }
        else {
            console.log('Người dùng chưa Check-in')
        }
    }

    const checkinUrl = `http://192.168.1.45:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin`
    bot.sendMessage(chatId, "Hãy chọn loại ca làm việc của bạn", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Ca chính" , callback_data: 'checkin_main_${chatId}'},
                    { text: "Ca đặc biệt" , callback_data: 'checkin_special_${chatId}'},
                ],
            ],
        },
    })
}



export const handleCheckout = (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-out vì thiếu thông tin người dùng.")
        return
    }

    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-out từ: ${userName}`)

    const checkoutUrl = `http://192.168.1.45:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkout`
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
