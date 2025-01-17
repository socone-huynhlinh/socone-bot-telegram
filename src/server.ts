
import dotenv from "dotenv"

import "./bot/telegram-bot" // Đảm bảo bot được khởi động khi server chạy
const PORT = process.env.PORT || 3000
import macRouter from "./routes/mac.route"
import express, { Request, Response } from "express";
import checkInRouter from './handlers/checkin/checkin-route';
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
