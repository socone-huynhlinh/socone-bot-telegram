import TelegramBot from "node-telegram-bot-api"

// src/handlers/checkin.ts

export const handleCheckin = (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-in vì thiếu thông tin người dùng.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-in từ: ${userName}`)

    const checkinUrl = `http://172.26.41.219:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkin`
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

export const handleCheckout = (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-out vì thiếu thông tin người dùng.")
        return
    }

    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()

    console.log(`Yêu cầu Check-out từ: ${userName}`)

    const checkoutUrl = `http://172.26.41.219:3000/check-device?chatId=${chatId}&userName=${encodeURIComponent(userName)}&action=checkout`
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
