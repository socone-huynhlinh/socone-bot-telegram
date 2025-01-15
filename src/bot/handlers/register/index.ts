import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import Router from "../../../routes/router";
import Company from "../../../models/company";
import Branch from "../../../models/branch";
import DepartmentService from "../../../services/impl/department.service";
import CompanyService from "../../../services/impl/company.service";
import BranchService from "../../../services/impl/branch.service";
import getLocalIp from "../../../utils/get-ip-address";
import { createClient } from "redis";
import { validateEmailCompany } from "../../../utils/validate-email";
import StaffService from "../../../services/impl/staff.service";

const redisClient = createClient();

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

// Kết nối Redis
(async () => {
  await redisClient.connect();
})();

const departmentService = new DepartmentService();
const companyService = new CompanyService();
const branchService = new BranchService();
const staffService = new StaffService();
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
const handleEmail = async (msg: Message, bot: TelegramBot, router: Router): Promise<void> => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && text.includes("@") && validateEmailCompany(text)) {
    if(await staffService.checkExistStaff(text)){
      bot.sendMessage(chatId, "Email already exists. Please enter another email:");
    }
    else{
      router.setUserData(chatId, "email", text);
      bot.sendMessage(chatId, `Email "${text}" accepted. Please enter your full name:`);
      router.setUserState(chatId, "register:full_name"); // Chuyển sang bước tiếp theo
    }
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
const handleDepartment = (query: CallbackQuery, bot: TelegramBot, router: Router): void => {
  const callbackData = query.data; // Lấy dữ liệu callback
  const chatId = query.message?.chat.id;
  if (callbackData && callbackData.startsWith("department_")) {
      const parts = callbackData.split("_");
      const departmentId = parts[parts.length - 1]; // Lấy company ID từ callback_data
      if (chatId) {
          router.setUserData(chatId, "departmentId", departmentId);
          router.setUserState(chatId, "register:email"); // Chuyển sang bước tiếp theo
          bot.sendMessage(chatId,`Please enter your company email:`);
      }
  }
}
const handlePosition = async (msg: Message, bot: TelegramBot, router: Router): Promise<void> => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text && !/\d/.test(text)) {
      router.setUserData(chatId, "position", text);
      const userData = router.getUserData(chatId);
      await redisClient.set(`user:${chatId}`, JSON.stringify(userData));
      // Gửi đường dẫn để lấy địa chỉ MAC
      const ipServer=getLocalIp();
      const portServer=process.env.PORT || 3000;
      const macCaptureUrl = `${ipServer}:${portServer}/capture-mac?chatId=${chatId}`;
      router.clearUserState(chatId);
      bot.sendMessage(
          chatId,
          "Please click the link below to register your device and complete your profile:",
          {
              reply_markup: {
                  inline_keyboard: [[{ text: "Register Device", url: macCaptureUrl }]],
              },
          }
      );
  } else {
      bot.sendMessage(chatId, "Position must not contain numbers. Please try again:");
  }
};

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
const handleBranch = async (query: CallbackQuery, bot: TelegramBot, router: Router): Promise<void> => {
  const callbackData = query.data; // Lấy dữ liệu callback
  const chatId = query.message?.chat.id;
  if (callbackData && callbackData.startsWith("branch_")) {
      const parts = callbackData.split("_");
      const branchId = parts[parts.length - 1]; // Lấy company ID từ callback_data
      if (chatId) {
          const departments = await departmentService.getDepartmentsByBranchId(branchId);
          router.setUserData(chatId, "branchId", branchId);
          router.setUserState(chatId, "register:department"); // Chuyển sang bước tiếp theo

          // Tạo inline_keyboard với các nút trên một dòng
          const keyboard = [
              departments.map(department => ({
                  text: `${department.name}`,
                  callback_data: `department_${department.id}`
              }))
          ];

          bot.sendMessage(chatId, `Please choose the department you work for in ${parts[1]} branch`, {
              reply_markup: {
                  inline_keyboard: keyboard
              },
          });
      }
  }
};




// Hàm khởi tạo các route
const initRegisterRoutes = (router: Router): void => {
  // Đăng ký route cha
  router.addRoute("/register", (msg, bot):Promise<void> => registerRoute(msg, bot, router));

  // Đăng ký các route con
  router.addRoute("register:email", (msg, bot) => handleEmail(msg, bot, router));
  router.addRoute("register:full_name", (msg, bot) => handleFullName(msg, bot, router));
  router.addRoute("register:phone", (msg, bot) => handlePhone(msg, bot, router));
  router.addRoute("register:position", (msg, bot) => handlePosition(msg, bot, router));

  
  // Đăng ký callback
  router.addCallback("company_", (query, bot) => handleCompany(query, bot));
  router.addCallback("branch_", (query, bot) => handleBranch(query, bot,router));
  router.addCallback("department_", (query, bot) => handleDepartment(query, bot,router));
};


export default initRegisterRoutes;
