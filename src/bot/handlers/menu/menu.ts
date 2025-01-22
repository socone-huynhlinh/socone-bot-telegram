import TelegramBot from "node-telegram-bot-api";

export const handleMenu = async (bot: TelegramBot, msg: TelegramBot.Message) => {
    const menuText = `
Welcome to the **SoC.one** Employee Management System! Below are the available commands you can use:

**/menu**: Display the main menu.
**/checkin**: Mark your attendance for the day.
**/register**: Register a new account or update your personal information.
**/off**: Submit a request for time off.
**/cancel**: Cancel the current action.

Please choose a command to proceed.
    `;
    
    bot.sendMessage(msg.chat.id, menuText, { parse_mode: "Markdown" });
};