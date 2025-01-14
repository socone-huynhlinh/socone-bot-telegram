import StaffService from "../../../services/impl/staff.service";
import Router from "../../../routes/router";
import TelegramBot, { Message } from "node-telegram-bot-api";

const staffService=new StaffService();
const handleStaffsPending=async (msg:Message,bot:TelegramBot,router:Router):Promise<void>=>{
    const chatId=msg.chat.id;
    const staffs=await staffService.getStaffsPendingByBranchId('40375c41-7ba2-41ac-9fb7-9e78c1c6914b');
    if(staffs.length>0){
        const message=staffs.map((staff:any,index:number)=>`${index+1}. ${staff.full_name} - ${staff.company_email}`).join("\n");
        bot.sendMessage(chatId,message);
    }else{
        bot.sendMessage(chatId,"No staffs pending");
    }
}
const initStaffRoutes=(router:Router):void=>{
    router.addRoute("/staffs_pending",(msg,bot)=>handleStaffsPending(msg,bot,router));
}
export default initStaffRoutes;