import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import Router from "../../../routes/router";
import CompanyService from "../../../services/company.service";
import Company from "../../../models/company";
import BranchService from "../../../services/branch.service";
import Branch from "../../../models/branch";
import { createClient } from "redis";

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

// Kết nối Redis
(async () => {
  await redisClient.connect();
})();

const companyService = new CompanyService();
const branchService = new BranchService();
const registerRoute = async (msg: Message, bot: TelegramBot, router: Router): Promise<void> => {
    const chatId = msg.chat.id;
    const companies: Company[] = await companyService.getCompanies();
    router.setUserData(chatId,'tele_id',chatId);
    router.setUserData(chatId,'username',`${msg.from?.first_name} ${msg.from?.last_name}`);
    // Tạo danh sách nút với callback_data chứa company ID
    const keyboard = companies.map(company => [
        { text: company.name, callback_data: `company_${company.name}_${company.id}` }
      ]);
      
    // Gửi tin nhắn với inline keyboard
    bot.sendMessage(chatId, `Choose your company:`, {
      reply_markup: {
        inline_keyboard: keyboard,
      },
    });
  };
  

// Bước 1: Nhập email
const handleEmail = (msg: Message, bot: TelegramBot, router: Router): void => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.includes("@")) {
    router.setUserData(chatId, "email", text);
    bot.sendMessage(chatId, `Email "${text}" accepted. Please enter your full name:`);
    router.setUserState(chatId, "register:full_name"); // Chuyển sang bước tiếp theo
  } else {
    bot.sendMessage(chatId, "Invalid email. Please enter a valid email:");
  }
};

const handleFullName = (msg: Message, bot: TelegramBot, router: Router): void => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.length >= 6 && !/\d/.test(text)) {
        router.setUserData(chatId, "full_name", text);
        bot.sendMessage(chatId, "Full name accepted. Please enter your phone number:");
        router.setUserState(chatId, "register:phone"); // Chuyển sang bước ti
    } else {
        bot.sendMessage(chatId, "Full name not contain numbers. Please try again:");
    }
};

const handlePosition =async (msg: Message, bot: TelegramBot, router: Router): Promise<void> => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && !/\d/.test(text)) {
        router.setUserData(chatId, "position", text);
        const userData = router.getUserData(chatId);
        await redisClient.set(`user:${chatId}`, JSON.stringify(userData));
        bot.sendMessage(chatId, "Register profile success. Wait for admin approve.");
        router.clearUserState(chatId); // Xóa trạng thái của user
    } else {
        bot.sendMessage(chatId, "Position not contain numbers. Please try again:");
    }
}

const handlePhone = (msg: Message, bot: TelegramBot, router: Router): void => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (text && text.length >= 10 && text.length <= 11 && !isNaN(Number(text))) {
        router.setUserData(chatId, "phone", text);
        bot.sendMessage(chatId, "Phone number accepted. Please enter your position at branch:");
        router.setUserState(chatId, "register:position"); // Chuyển sang bước tiếp theo
    } else {
        bot.sendMessage(chatId, "Invalid phone number. Please enter a valid phone number:");
    }
}

// Xử lý callback Socone
const handleCompany = async (query: CallbackQuery, bot: TelegramBot): Promise<void> => {
    const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    if (callbackData && callbackData.startsWith("company_")) {
      const parts = callbackData.split("_");
      const companyId = parts[parts.length - 1]; // Lấy company ID từ callback_data
      const branches:Branch[] = await branchService.getBranchesByCompanyId(companyId);
      const keyboard = branches.map(branch => [
        { text: `${branch.name} (${branch.province})`, callback_data: `branch_${branch.name}_${branch.id}` }
      ]);
      if (chatId) {
        bot.sendMessage(chatId,`Please choice branch you working for ${parts[1]} company`, {
          reply_markup: {
            inline_keyboard:keyboard
          },
        });
      }
    }
};
const handleBranch = async (query: CallbackQuery, bot: TelegramBot,router:Router): Promise<void> => {
    const callbackData = query.data; // Lấy dữ liệu callback
    const chatId = query.message?.chat.id;
    if (callbackData && callbackData.startsWith("branch_")) {
        const parts = callbackData.split("_");
        const branchId = parts[parts.length - 1]; // Lấy company ID từ callback_data
        if (chatId) {
            router.setUserData(chatId, "branchId", branchId);
            router.setUserState(chatId, "register:email"); // Chuyển sang bước tiếp theo
            bot.sendMessage(chatId,`Please enter your company email:`);
        }
    }
}
const getAllUsersFromQueue = async (): Promise<Record<string, any>[]> => {
    const users: Record<string, any>[] = [];
    let cursor = 0; // Cursor phải là một số, không phải chuỗi

    do {
        // Sử dụng SCAN với cursor và các tùy chọn
        const scanResult = await redisClient.scan(cursor, {
            MATCH: "user:*", // Lấy các khóa bắt đầu bằng "user:"
            COUNT: 100,      // Số lượng keys mỗi batch
        });

        cursor = Number(scanResult.cursor); // Cập nhật cursor thành số
        const keys = scanResult.keys;

        if (keys.length > 0) {
            // Sử dụng pipeline để lấy giá trị các keys
            const results = await Promise.all(
                keys.map((key) => redisClient.get(key))
            );

            // Parse JSON từ kết quả và thêm vào danh sách users
            results.forEach((result) => {
                if (result) {
                    const parsed = JSON.parse(result);
                    users.push(parsed);
                }
            });
        }
    } while (cursor !== 0); // Dừng khi cursor quay về "0"

    return users;
};


// Hàm khởi tạo các route
const initRegisterRoutes = (router: Router): void => {
  // Đăng ký route cha
  router.addRoute("/register", (msg, bot) => registerRoute(msg, bot, router));

  // Đăng ký các route con
  router.addRoute("register:email", (msg, bot) => handleEmail(msg, bot, router));
  router.addRoute("register:full_name", (msg, bot) => handleFullName(msg, bot, router));
  router.addRoute("register:phone", (msg, bot) => handlePhone(msg, bot, router));
  router.addRoute("register:position", (msg, bot) => handlePosition(msg, bot, router));
  
  // Đăng ký callback
  router.addCallback("company_", (query, bot) => handleCompany(query, bot));
  router.addCallback("branch_", (query, bot) => handleBranch(query, bot,router));
};


export default initRegisterRoutes;
