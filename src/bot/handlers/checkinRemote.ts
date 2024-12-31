import TelegramBot from "node-telegram-bot-api"
import { isValidCheckin } from "../../services/staff/valid-checkin"
import { getAccountById } from "../../services/staff/get-telegram-account"
import { TelegramAccount } from "../../models/user"

// src/handlers/checkin.ts

export const handleCheckinRemote = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-in vì thiếu thông tin người dùng.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-in remote từ: ${userName}`)

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

    const checkinUrl = `http://117.2.125.118:3000/check-remote?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkinRemote`
    bot.sendMessage(chatId, "Hãy nhấp vào nút bên dưới để thực hiện Check-in của bạn:", {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: "Thực hiện Check-in ✅",
                        url: checkinUrl,
                    },
                ],
            ],
        },
    })
}

export const handleCheckoutRemote = (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-out vì thiếu thông tin người dùng.")
        return
    }

    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-out từ remote: ${userName}`)

    const checkoutUrl = `http://117.2.125.118:3000/check-remote?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkoutRemote`
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
