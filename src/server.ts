// src/server.ts

import dotenv from "dotenv"
dotenv.config()

import http from "http"
import url from "url"
import "./bot/telegram-bot" // Đảm bảo bot được khởi động khi server chạy
import { handleCheckinRequest, handleCheckoutRequest } from "./bot/handlers/device-handlers"
import { validateMacMiddleware } from "./middleware/check-ip-address"
const PORT = process.env.PORT || 3000

// Định nghĩa các route và middleware tương ứng
interface Route {
    path: string
    method: string
    handler: (query: any, res: http.ServerResponse) => void
    middleware?: Array<(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void>
}

const routes: Route[] = [
    {
        path: "/check-device",
        method: "GET",
        handler: (query, res) => {
            const { chatId, userName, action } = query
            if (!chatId || !userName || !action) {
                res.statusCode = 400
                res.end("Thiếu tham số cần thiết.")
                return
            }
            if (action === "checkin") {
                handleCheckinRequest(chatId as number, userName as string, action as string, res)
            } else if (action === "checkout") {
                handleCheckoutRequest(chatId as string, userName as string, action as string, res)
            } else {
                res.statusCode = 400
                res.end("Hành động không hợp lệ.")
            }
        },
        middleware: [validateMacMiddleware],
    },
    {
        path: "/check-remote",
        method: "GET",
        handler: (query, res) => {
            const { chatId, userName, action } = query
            if (!chatId || !userName || !action) {
                res.statusCode = 400
                res.end("Thiếu tham số cần thiết.")
                return
            }
            if (action === "checkinRemote") {
                handleCheckinRequest(chatId as number, userName as string, action as string, res)
            } else if (action === "checkoutRemote") {
                handleCheckoutRequest(chatId as string, userName as string, action as string, res)
            } else {
                res.statusCode = 400
                res.end("Hành động không hợp lệ.")
            }
        },
    }
    // Bạn có thể thêm các route khác ở đây nếu cần
]

// Tạo server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || "", true)
    const pathname = parsedUrl.pathname || ""
    const method = req.method || ""

    // Tìm route phù hợp
    const route = routes.find((r) => r.path === pathname && r.method === method)

    if (route) {
        const middlewares = route.middleware || []
        let index = 0

        const next = () => {
            if (index < middlewares.length) {
                const middleware = middlewares[index++]
                middleware(req, res, next)
            } else {
                route.handler(parsedUrl.query, res)
            }
        }

        next()
    } else {
        res.statusCode = 404
        res.end("Not Found")
    }
})

server.listen(PORT, () => {
    console.log(`Server đang chạy trên cổng ${PORT}...`)
})
