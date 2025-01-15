import TelegramBot, { CallbackQuery } from "node-telegram-bot-api";
import Router from "../../../routes/router";
import StaffService from "../../../services/impl/staff.service";
import Staff from "../../../models/staff";
import { isExistDate, isFutureDate } from "../../../utils/validate-date";
import { RequestOffService } from "../../../services/impl/request-off.service";
import WorkOffDay from "../../../models/work-off-day";
import { handleOffStartTime, handleSelectedStartTime } from "./select-hour-handle";
import dayjs from "dayjs";
const staffService=new StaffService();
const requestOffService=new RequestOffService();
const startRequestOff=async(bot:TelegramBot,msg:TelegramBot.Message,router:Router)=>{
    const chatId = msg.chat.id;
    const staffAccount:Staff|null=await staffService.findStaffByTeleId(chatId.toString());
    if(!staffAccount){
        bot.sendMessage(chatId, "Bạn cần đăng ký trước để sử dụng tính năng này");
        return;
    }
    bot.sendMessage(
        chatId,
        'Vui lòng chọn ngày bạn cần off và lý do muốn nghỉ, theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ: 10/01/2025-bệnh'
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const messageListener = async (response: TelegramBot.Message):Promise<void> => {
            if (response.chat.id !== chatId) return; // Chỉ xử lý tin nhắn từ người dùng hiện tại
    
            if (!response.text) {
                bot.sendMessage(chatId, "Lỗi: Không tìm thấy nội dung tin nhắn. Vui lòng thử lại!");
                return;
            }
    
            const [offDate, offReason] = response.text.split("-").map((str) => str.trim());
    
            if (!offDate) {
                bot.sendMessage(
                    chatId, 
                    "Lỗi: Bạn chưa nhập ngày. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do."
                );
                return;
            }
            if (!isExistDate(offDate)) {
                bot.sendMessage(
                    chatId,
                    "Ngày tháng không hợp lệ!\nVui lòng nhập lại theo cú pháp:\n- Ngày/Tháng/Năm-Lý do\n- Ví dụ 01/01/2024-bệnh"
                );
                return;
            }
    
            if (!isFutureDate(offDate)) {
                bot.sendMessage(
                    chatId,
                    "Lỗi: Ngày xin nghỉ không thể ở trước ngày hiện tại. Vui lòng nhập lại!"
                );
                return;
            }
    
            if (!offReason) {
                bot.sendMessage(
                    chatId, 
                    "Lỗi: Bạn chưa nhập lý do. Vui lòng nhập lại theo cú pháp ngày/tháng/năm-lý do."
                );
                return;
            }
            router.setUserData(chatId, "offDate", offDate);
            router.setUserData(chatId, "staff", staffAccount);
            router.setUserData(chatId, "offReason", offReason);
            await bot.sendMessage(
                chatId,
                "Vui lòng chọn thời gian nghỉ của bạn",
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "Cả ngày", callback_data: `off_full_8:00` },
                                { text: "Buổi sáng", callback_data: `off_morning_8:00` },
                                { text: "Buổi chiều", callback_data: `off_afternoon13:30` },
                            ],
                            [
                                { text: "Theo giờ", callback_data: `hourly_${chatId}_${offDate}` },
                            ],
                        ],
                    },
                }
            );
    };
    bot.on("message", messageListener); // Lắng nghe tin nhắn
}

const handleShiftWorkOff = async (query: CallbackQuery, bot: TelegramBot, router: Router) => {
    const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    if (!chatId) {
        return;
    }
    if (callbackData && callbackData.startsWith("off_")) {
        const parts = callbackData.split("_");
        const typeShift = parts[1];
        const startTimeOnDate = parts[2]; // VD: "8:00" hoặc "13:30"
        const staff = router.getUserData(chatId);

        if (!staff) {
            return;
        }

        const offDate = staff.offDate; // VD: "15/01/2025" (dd/MM/yyyy)

        // Kiểm tra dữ liệu đầu vào
        if (!offDate || !startTimeOnDate) {
            console.error('Invalid date or time:', { offDate, startTimeOnDate });
            return;
        }

        // Chuyển đổi offDate từ "dd/MM/yyyy" thành "yyyy-MM-dd"
        const formattedOffDate = offDate.split("/").reverse().join("-"); // "2025-01-15"
        const start_time = dayjs(`${formattedOffDate} ${startTimeOnDate}`, 'YYYY-MM-DD HH:mm').valueOf();
        if (isNaN(start_time)) {
            console.error('Invalid start_time:', start_time);
            return;
        }


        let duration_hour = 8;
        if (typeShift === "morning" || typeShift === "afternoon") {
            duration_hour = 4;
        }

        const workOffDay: WorkOffDay = {
            staff_id: staff.staff.id,
            start_time: start_time, // Đây là timestamp đã tính toán
            duration_hour: duration_hour,
            reason: staff.offReason,
            status: "pending",
        };
        const idOffService=await requestOffService.insertRequestOff(workOffDay);
        await bot.sendMessage(
            -4620420034,
            `<b>Yêu cầu off từ:</b> ${staff.staff.full_name}\n - Thời gian: ${offDate}\n - Bắt đầu: ${startTimeOnDate}\n - Số giờ: ${duration_hour}h\n - Lý do: ${staff.offReason}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Phê duyệt ✅", callback_data: `off_approve_${chatId}_${offDate}_${startTimeOnDate}_${duration_hour}_${idOffService}` },
                            { text: "Từ chối ❌", callback_data: `off_reject_${chatId}_${offDate}_${startTimeOnDate}_${duration_hour}_${idOffService}` }
                        ]
                    ]
                },
                parse_mode: "HTML",
            }
        );
        // Xử lý tiếp với workOffDay nếu cần...
    }
};


const handlePendingRequestOff = async (query:CallbackQuery,bot:TelegramBot,router:Router) => {
   const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    if(!chatId){
        return;
    }
    if (callbackData && callbackData.startsWith("off_hours_")) {
      const parts = callbackData.split("_");
      const durationHour = parts[parts.length - 1]; 
      const startTime = parts[parts.length - 2];
      const [startHour, startMinute] = startTime.split(":").map(Number);
        const endHour = startHour + parseInt(durationHour);

    let endTime
    if (durationHour === "8") {
        endTime = "17:30";
    }
    else {
        endTime = `${endHour}:${startMinute.toString().padStart(2, "0")}`;
    }
    const offDate = parts[parts.length - 3];
    const userData=router.getUserData(chatId);
    if(!userData){
        return;
    }
    await bot.sendMessage(
        chatId,
        `📋 <b>Đơn xin nghỉ của bạn đã được gửi với thông tin như sau:</b>\n` +
            `      - <b>Ngày nghỉ:</b> ${offDate}\n` +
            `      - <b>Giờ bắt đầu:</b> ${startTime}\n` +
            `      - <b>Giờ kết thúc:</b> ${endTime}\n` +
            `      - <b>Lý do:</b> ${userData.offReason}\n\n` +
            `✅ <i>Vui lòng đợi kết quả xử lý từ admin.</i>`,
        { parse_mode: "HTML" }
    );
    const workOffDay:WorkOffDay={
        staff_id:userData.staff.id,
        start_time:1,
        duration_hour:parseInt(durationHour),
        reason:userData.offReason,
        status:"pending"
    }
    const idOffDay=await requestOffService.insertRequestOff(workOffDay);
        await bot.sendMessage(
            -4620420034, 
            `<b>Yêu cầu off từ:</b> ${userData.staff.full_name}\n - Thời gian: ${offDate}\n - Bắt đầu: ${startTime}\n - Số giờ: ${durationHour}h\n - Lý do: ${userData.offReason}`,
            {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: "Phê duyệt ✅", callback_data: `request_admin_off_approve_${chatId}_${offDate}_${startTime}_${durationHour}_${idOffDay}` },
                            { text: "Từ chối ❌", callback_data: `request_admin_off_reject_${chatId}_${offDate}_${startTime}_${durationHour}_${idOffDay}` }
                        ]
                    ]
                },
                parse_mode: "HTML",
            }
        );
    }
    
};

// export const handleResponseAdmin = async (
//     bot : TelegramBot,
//     type: string,
//     userId: number,
//     offDate: string,
//     startTime: string,
//     hour: string,
//     idOffDay: string,
//     callbackQuery: TelegramBot.CallbackQuery
// ) => {
//     await bot.editMessageReplyMarkup(
//         {
//             inline_keyboard: [
//                 [
//                     { text: 'Phê duyệt ✅ (Đã xử lý)', callback_data: 'disabled' },
//                     { text: 'Từ chối ❌ (Đã xử lý)', callback_data: 'disabled' }
//                 ]
//             ]
//         },
//         {
//             chat_id: callbackQuery.message?.chat.id,
//             message_id: callbackQuery.message?.message_id
//         }
//     ).catch((err) => console.error('Lỗi khi chỉnh sửa nút:', err.message));

//     const account: TelegramAccount | null = await getAccountById(userId);

//     if (!account) {
//         bot.sendMessage(userId, "Không tìm thấy tài khoản trong hệ thống.");
//         return;
//     }

//     const workOffDay = await getOffRequestById(idOffDay);



//     if (type === "approve") {
//         await updateOffRequest(
//             idOffDay,
//             offDate,
//             startTime,
//             parseInt(hour),
//             "approved",
//         );

//         await bot.sendMessage(userId, `✅ Yêu cầu off ngày ${offDate} của bạn đã được Admin phê duyệt. 🎉`);
//         await bot.sendMessage(-4620420034, `✅ Bạn đã phê duyệt yêu cầu off ngày ${offDate}.`);
//     } else {
//         await updateOffRequest(
//             idOffDay,
//             offDate,
//             startTime,
//             parseInt(hour),
//             "rejected",
//         );
//         await bot.sendMessage(userId, `❌ Yêu cầu off ngày ${offDate} của bạn đã bị Admin từ chối. ❌`);
//         await bot.sendMessage(-4620420034, `❌ Bạn đã từ chối yêu cầu off ngày ${offDate}.`);
//     }

//     await bot.answerCallbackQuery(callbackQuery.id, { text: "Đã xử lý yêu cầu." });
    
// };


const initRequestOffRoutes=(router:Router):void=>{
    router.addRoute("/request_off",(msg,bot)=>startRequestOff(bot,msg,router));
    router.addCallback("hourly_",(query,bot)=>handleOffStartTime(query,bot));
    router.addCallback("off_",(query,bot)=>handleShiftWorkOff(query,bot,router));
    router.addCallback("startTime_",(query,bot)=>handleSelectedStartTime(query,bot));
    router.addCallback("duration_hour_",(query,bot)=>handlePendingRequestOff(query,bot,router));

}
export default initRequestOffRoutes;