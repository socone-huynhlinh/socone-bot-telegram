import TelegramBot, { CallbackQuery } from "node-telegram-bot-api"
import Router from "../../../routes/router"
import { CheckInService } from "../../../services/impl/checkin.service"
import { handleCheckinSpecial,handleCheckInMain, handleSpecialDuration, handleSpecialTimeSelection } from "./handle-checkin"
import { WorkShiftService } from "../../../services/impl/work-shift.service"

// src/handlers/checkin.ts
const workShiftService=new WorkShiftService()
const checkInService=new CheckInService()
const startCheckIn = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    if (!msg.from) {
        bot.sendMessage(chatId, "Không thể thực hiện Check-in vì thiếu thông tin người dùng.")
        return
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim()
    console.log()
    console.log(`Yêu cầu Check-in từ: ${userName}`)


    // Kiểm tra xem người dùng đã Check-in chưa
    if (msg.chat.id) {
        const isCheckin = await checkInService.checkExistCheckinOnDate(msg.chat.id.toString())
        if (isCheckin) {
            console.log('Người dùng đã Check-in')
            bot.sendMessage(chatId, "Bạn đã Check-in rồi, không thể Check-in lại.")
            return
        }
    }
    const workShifts:any[]=await workShiftService.getTypeWorkShifts() || []
    console.log("workShifts",workShifts)
    bot.sendMessage(chatId, "<b>Hãy chọn loại ca làm việc của bạn</b>", {
        reply_markup: {
            inline_keyboard: [
                workShifts.map((workShift) => ({
                    text: String(workShift.type),
                    callback_data: `checkin_${String(workShift.type)}`
                }))
            ],
        },
        parse_mode: "HTML",
    });
    
}
const handleCheckIn = async (query:CallbackQuery,bot:TelegramBot) => {
    const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    console.log("chat",query.message?.chat)
    if (callbackData && callbackData.startsWith("checkin_")) {
      const parts = callbackData.split("_");
      const typeShift = parts[parts.length - 1]; // Lấy company ID từ callback_data
        if (chatId) {
            if (typeShift === "main") {
                handleCheckInMain(bot, chatId);
            } else if (typeShift === "special") {
                handleCheckinSpecial(bot, chatId);
            }
        }
    }
};



const initCheckinRoutes=(router:Router)=>{
    router.addRoute("/checkin",(msg,bot)=>startCheckIn(bot,msg))
    router.addCallback("checkin_",(query,bot)=>handleCheckIn(query,bot))
    router.addCallback("special_",(query,bot)=>handleSpecialDuration(query,bot))
    router.addCallback("durationSpecial_", (query, bot) => handleSpecialTimeSelection(bot,query));
}
export default initCheckinRoutes