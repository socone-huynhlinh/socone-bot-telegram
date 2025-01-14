
import dotenv from "dotenv"

import "./bot/telegram-bot" // Đảm bảo bot được khởi động khi server chạy
const PORT = process.env.PORT || 3000
import macRouter from "./routes/mac.route"
import express, { Request, Response } from "express";
import checkInRouter from './handler/checkin/checkin-route';
import { captureMacMiddleware } from "./middleware/capture-mac-address"
dotenv.config()

const app = express();


app.use(express.json());

// Route chính
app.get("/", (req: Request, res: Response) => {
    res.send("Hello, Telegram Bot Server is running with TypeScript!");
});

// Thêm route xử lý đăng ký MAC
app.use("/capture-mac",captureMacMiddleware, macRouter);

//handle router
app.use("/" , checkInRouter);

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// const routes: Route[] = [
//     {
//         path: "/check-device",
//         method: "GET",
//         handler: (query, res) => {
//             const { chatId, userName, action } = query
//             if (!chatId || !userName || !action) {
//                 res.statusCode = 400
//                 res.end("Thiếu tham số cần thiết.")
//                 return
//             }
//             if (action.split("_")[0] === "checkin") {
//                 handleCheckinRequest(parseInt(chatId as string), userName as string, action as string, res)
//             } else if (action === "checkout") {
//                 handleCheckoutRequest(chatId as string, userName as string, action as string, res)
//             } else {
//                 res.statusCode = 400
//                 res.end("Hành động không hợp lệ.")
//             }
//         },
//         middleware: [validateMacMiddleware],
//     },
//     {
//         path: "/check-remote",
//         method: "GET",
//         handler: (query, res) => {
//             const { chatId, userName, action } = query
//             if (!chatId || !userName || !action) {
//                 res.statusCode = 400
//                 res.end("Thiếu tham số cần thiết.")
//                 return
//             }
//             if (action === "checkinRemote") {
//                 handleCheckinRequest(parseInt(chatId as string), userName as string, action as string, res)
//             } else if (action === "checkoutRemote") {
//                 handleCheckoutRequest(chatId as string, userName as string, action as string, res)
//             } else {
//                 res.statusCode = 400
//                 res.end("Hành động không hợp lệ.")
//             }
//         },
//     }
//     // Bạn có thể thêm các route khác ở đây nếu cần
// ]
