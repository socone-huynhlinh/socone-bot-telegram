import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";

const handleOffStartTime=async(query:CallbackQuery,bot:TelegramBot)=>{
    if (!query.data||!query.message) {
        await bot.answerCallbackQuery(query.id, { text: "Yêu cầu không hợp lệ." });
        return;
    }
   
    const chatId = query.message.chat.id;
    const offDate = query.data?.split("_")[3];

    const morningTimes = ["8:00", "9:00", "10:00", "11:00"];
    const afternoonTimes = ["13:30", "14:30", "15:30", "16:30"];

    const buttons = [
        morningTimes.map((startTime) => ({
            text: startTime,
            callback_data: `startTime_${offDate}_${startTime}`,
        })),
        afternoonTimes.map((startTime) => ({
            text: startTime,
            callback_data: `startTime_${offDate}_${startTime}`,
        })),
    ];
    await bot.sendMessage(
        chatId,
        "Vui lòng chọn thời gian bắt đầu nghỉ:",
        {
            reply_markup: {
                inline_keyboard: buttons,
            },
        }
    );
}
const handleSelectedStartTime = async (
    query: CallbackQuery,
    bot: TelegramBot,
) :Promise<void> => {
   
    const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    if(!chatId){
        return;
    }
    if (callbackData && callbackData.startsWith("off_startTime_")) {
      const parts = callbackData.split("_");
      const startTime = parts[parts.length - 1]; 
      const offDate = parts[parts.length - 2];
        const [hour, minute] = startTime.split(":").map(Number);
         
        let maxDuration = 0;
        if (hour >= 8 && hour < 12) {
            maxDuration = Math.min(12 - hour, 3);
        } else if (hour >= 13 && hour < 16) {
            maxDuration = Math.min(17 - hour, 3);
        } else if (hour === 11 || hour === 16) {
            maxDuration = 1; 
        }
        try {
            const buttons = [];
            for (let i = 1; i <= maxDuration; i++) {
                buttons.push({
                    text: `${i} giờ`,
                    callback_data: `duration_hour_${offDate}_${startTime}_${i}`,
                });
            }

            await bot.sendMessage(
                chatId,
                "Vui lòng chọn số giờ nghỉ của bạn",
                {
                    reply_markup: {
                        inline_keyboard: [buttons],
                    },
                }
            );
        } catch (err) {
            throw err
        }
    }

}

export {handleOffStartTime,handleSelectedStartTime}