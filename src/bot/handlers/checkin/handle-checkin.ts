import TelegramBot from "node-telegram-bot-api";
import getLocalIp from "../../../utils/get-ip-address";

const handleCheckinSpecial = async (bot: TelegramBot,chatId:number) => {
    await bot.sendMessage(chatId, "<b>Vui lòng chọn loại ca đặc biệt của bạn</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "OT", callback_data: `special_ot_${chatId}` },
                    { text: "Bù", callback_data: `special_compensate_${chatId}` },
                    { text: "Ca chính", callback_data: `special_main_${chatId}` },
                ],
            ],
        },
        parse_mode: "HTML",
    });
};

const handleCheckInMain=async(bot:TelegramBot,chatId:number)=>{
    const ipServer=getLocalIp();
    if(!ipServer){
        bot.sendMessage(chatId,"Không thể lấy địa chỉ IP của server");
        return;
    }
    const checkinUrl = `http://${ipServer}:3000/checkin-main?chatId=${chatId}`;
    await bot.sendMessage(chatId, "<b>Hãy nhấp vào nút bên dưới để thực hiện Check-in ca chính</b>", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Thực hiện Check-in", url: checkinUrl },
                ],
            ],
        },
        parse_mode: "HTML",
    });
}
export {handleCheckinSpecial,handleCheckInMain}