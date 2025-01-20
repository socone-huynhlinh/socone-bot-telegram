import TelegramBot, { Message } from "node-telegram-bot-api";
import Company from "../../../models/company";
import { getCompanies } from "../../../services/common/company-service";
import { getBranchesByCompanyId } from "../../../services/common/branch-service";
import Branch from "../../../models/branch";
import Department from "../../../models/department";
import { getDepartmentsByBranchId } from "../../../services/common/department-service";
import { deleteUserSession, getUserSession, setUserSession } from "../../../config/user-session";

// export const handleRegister = async (bot: TelegramBot, msg: TelegramBot.Message): Promise<void> => {
//     const chatId = msg.chat.id;
//     const companies: Company[] = await getCompanies();
//     if (!companies) {
//         bot.sendMessage(chatId, "Error fetching companies. Please try again later.");
//         return;
//     }
//     const keyboard = companies.map(company => [
//         { text: company.name, callback_data: `company_${company.name}_${company.id}` }
//     ]);
      
//     bot.sendMessage(chatId, `Choose your company:`, {
//         reply_markup: {
//             inline_keyboard: keyboard,
//         },
//     });
// };
export const handleRegister = async (bot: TelegramBot, msg: TelegramBot.Message): Promise<void> => {
    const chatId = msg.chat.id;

    const existingSession = await getUserSession(chatId);
    if (existingSession) {
        await bot.sendMessage(chatId, "You are already in the process of registering. Please complete the current registration process before starting a new one.");
        return;
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "✅ You have canceled the current action.");
            return;
        }
        bot.off("message", messageListener);
        await deleteUserSession(chatId);
    };

    const companies: Company[] = await getCompanies();
    if (!companies) {
        await bot.sendMessage(chatId, "Error fetching companies. Please try again later.");
        return;
    }

    const branches: Branch[] = await getBranchesByCompanyId(companies[0].id);
    if (!branches) {
        await bot.sendMessage(chatId, "Error fetching branches. Please try again later.");
        return;
    }

    const keyboard = branches.map(branch => ({
        text: branch.name,
        callback_data: `register_branch_${branch.id}`,
    }));

    await bot.sendMessage(chatId, `Choose your branch:`, {
        reply_markup: {
            inline_keyboard: [keyboard],
        },
    });

    bot.on("message", messageListener);

    await setUserSession(chatId, { command: "registering", listener: messageListener });
}

export const handleDepartment = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    } 
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }
    const branchId = callbackQuery.data.split("_")[2];

    const departments: Department[] = await getDepartmentsByBranchId(branchId);
    const keyboard = [
        departments.map(department => ({
            text: `${department.name}`,
            callback_data: `register_department_${department.id}`
        }))
    ];

    await setUserSession(chatId, { command: "ChoosingDepartment" });

    await bot.sendMessage(chatId, `Please choose the department you work for in branch`, {
        reply_markup: {
            inline_keyboard: keyboard
        },
    });
}

