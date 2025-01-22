import TelegramBot, { Message } from "node-telegram-bot-api";
import Company from "../../../models/company";
import { getCompanies } from "../../../services/common/company-service";
import { getBranchesByCompanyId } from "../../../services/common/branch-service";
import Branch from "../../../models/branch";
import Department from "../../../models/department";
import { getDepartmentsByBranchId } from "../../../services/common/department-service";
import { deleteUserSession, getUserSession, setUserSession } from "../../../config/user-session";
import { validateEmailCompany } from "../../../utils/valid-email";
import { checkExistStaff, updateStatusStaffByTeleId } from "../../../services/staff/staff-service";
import getLocalIp from "../../../utils/get-ip-address";
import { getUserData, setUserData } from "../../../config/user-data";
import redisClient from "../../../config/redis-client";

export const handleRegister = async (bot: TelegramBot, msg: TelegramBot.Message): Promise<void> => {
    const chatId = msg.chat.id;

    if (!msg.from) {
        bot.sendMessage(chatId, "Unable to perform Check-in due to missing user information.");
        return;
    }
    const userName = `${msg.from.first_name || ""} ${msg.from.last_name || ""}`.trim();

    // const existingSession = await getUserSession(chatId);
    // if (existingSession) {
    //     await bot.sendMessage(chatId, "You are already in the process of registering. Please complete the current registration process before starting a new one.");
    //     return;
    // }

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }
        bot.off("message", messageListener);
        // await deleteUserSession(chatId);
    };

    const companies: Company[] = await getCompanies();
    if (!companies) {
        await bot.sendMessage(chatId, "Error fetching companies. Please try again later.");
        return;
    }

    setUserData(chatId, "company", companies[0].id);
    setUserData(chatId, "companyName", companies[0].name);
    setUserData(chatId, "userName", userName);
    
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

    await setUserSession(chatId, { command: "/register", listener: messageListener });
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

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }
        bot.off("message", messageListener);
        // await deleteUserSession(chatId);
    };

    const branchId = callbackQuery.data.split("_")[2];
    setUserData(chatId, "branchId", branchId);

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

// await setUserSession(chatId, { command: "registering", departmentId });

export const handleEmail = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const departmentId = callbackQuery.data.split("_")[2];
    setUserData(chatId, "departmentId", departmentId);

    await bot.sendMessage(chatId, `Please enter your Email:`);

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }

        const email = response.text;

        if (email && email.includes("@") && validateEmailCompany(email)) {
            if (await checkExistStaff(email)) {
                await bot.sendMessage(chatId, "Email already exists. Please enter another email:");
            }
            else {
                bot.off("message", messageListener);
                // await deleteUserSession(chatId);
                setUserData(chatId, "email", email);
                await setUserSession(chatId, { command: "typingFullName" });

                await bot.sendMessage(chatId, `Email "${email}" accepted. Please enter your full name:`);
                await handleFullName(bot, callbackQuery); 
            }
        } else {
            await bot.sendMessage(chatId, "Invalid email. Please enter a valid email:");
        }
    };

    await setUserSession(chatId, { command: "typingEmail", listener: messageListener });
    bot.on("message", messageListener);    
}

export const handleFullName = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }

        const fullName = response.text;

        if (fullName && fullName.length >= 6 && !/\d/.test(fullName)) {
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
            setUserData(chatId, "fullName", fullName);
            await setUserSession(chatId, { command: "typingPhone" });

            // console.log("UserData: ", getUserData(chatId));
            await bot.sendMessage(chatId, `Full name "${fullName}" accepted. Please enter your phone number:`);
            await handlePhone(bot, callbackQuery);
        } else {
            bot.sendMessage(chatId, "Invalid full name. Please enter a valid full name:");
        }
    };

    await setUserSession(chatId, { command: "typingFullName", listener: messageListener });

    bot.on("message", messageListener);
};


export const handlePhone = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }

        const phone = response.text;

        if (phone && phone.length >= 10 && phone.length <= 11 && !isNaN(Number(phone))) {
            bot.off("message", messageListener);
            // await deleteUserSession(chatId);
            setUserData(chatId, "phone", phone);
            await setUserSession(chatId, { command: "choosingPosition" });

            await bot.sendMessage(chatId, `Phone number "${phone}" accepted.`);
            await handlePosition(bot, callbackQuery);
        } else {
            bot.sendMessage(chatId, "Invalid phone number. Please enter a valid phone number:");
        }
    }
    await setUserSession(chatId, { command: "typingPhone", listener: messageListener });

    bot.on("message", messageListener);
}

export const handlePosition = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const existingSession = await getUserSession(chatId);
    if (existingSession?.listener) {
        bot.off("message", existingSession.listener); // Xóa listener cũ
    }

    const userData = getUserData(chatId);
    console.log("UserData: ", userData);

    const messageListener = async (response: TelegramBot.Message) => {
        if (response.chat.id !== chatId) return;

        if (response.text?.trim() === "/cancel") {
            bot.off("message", messageListener);
            await deleteUserSession(chatId);
            // await bot.sendMessage(chatId, "Action canceled.");
            return;
        }

        bot.off("message", messageListener);
        // await deleteUserSession(chatId);
    }
    await setUserSession(chatId, { command: "choosingPosition", listener: messageListener });

    bot.on("message", messageListener);

    await bot.sendMessage(chatId, "Please choose your position", {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "Developer", callback_data: `register_position_developer` },
                    { text: "Designer", callback_data: `register_position_designer` },
                    { text: "Accountant", callback_data: `register_position_accountant` },
                    { text: "HR", callback_data: `register_position_hr` },
                ],
            ],
        },
        parse_mode: "HTML",
    });
}

export const handleGetMac = async (bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    const chatId = callbackQuery.message?.chat.id;
    if (!chatId) {
        bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    const position = callbackQuery.data.split("_")[2];
    setUserData(chatId, "position", position);
    
    const userData = getUserData(chatId);
    await redisClient.set(`user:${chatId}`, JSON.stringify(userData));

    const test = await redisClient.get(`user:${chatId}`);
    console.log("Test: ", test);

    const ipServer = getLocalIp();
    const portServer=process.env.PORT || 3000;
    const macCaptureUrl = `${ipServer}:${portServer}/capture-mac?chatId=${chatId}`;
    await bot.sendMessage(
        chatId,
        "Please click the link below to register your device and complete your profile:",
        {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "Register Device", url: macCaptureUrl },
                    ],
                ],
            },
        }
    );
    // await handleAdminRegister(bot, chatId);
    // await deleteUserSession(chatId);
}

export const handleRegisterAdmin = async (bot: TelegramBot, type: string, callbackQuery: TelegramBot.CallbackQuery): Promise<void> => {
    if (!callbackQuery.data) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
        return;
    }

    console.log("Xem ne cuuuu",callbackQuery.data);
    const chatId = callbackQuery.data.split("_")[2];
    console.log("Chat ID: ", chatId);

    await bot.editMessageReplyMarkup(
        {
            inline_keyboard: [
                [
                    { text: 'Approve ✅ (Processed)', callback_data: 'disabled' },
                    { text: 'Reject ❌ (Processed)', callback_data: 'disabled' }
                ]
            ]
        },
        {
            chat_id: callbackQuery.message?.chat.id,
            message_id: callbackQuery.message?.message_id
        }
    ).catch((err) => console.error('Error while editing button:', err.message));
    
    if (type === 'approve') {
        await updateStatusStaffByTeleId(chatId, 'approved');

        await bot.sendMessage(chatId, `✅ Your registation request has been approved by Admin. 🎉`);
        await bot.sendMessage(-4620420034, `✅ You were approved for the registration on the request.`);
    }
    else if (type === 'reject') {
        await updateStatusStaffByTeleId(chatId, 'rejected');

        await bot.sendMessage(chatId, `❌ Your registation request has been approved by Admin.`);
        await bot.sendMessage(-4620420034, `❌ You were approved for the registration on the request.`);
    }
    else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Invalid request!" });
    }
}
