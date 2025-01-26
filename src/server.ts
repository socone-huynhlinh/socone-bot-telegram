import dotenv from "dotenv"
dotenv.config()

import http from "http"
import url from "url"
import "./bot/telegram-bot" 
import { handleCheckinRequest, handleGetMacRequest } from "./bot/handlers/http/device-handlers"
import { validateMacMiddleware } from "./middleware/check-ip-address"
import { captureMacMiddleware } from "./middleware/capture-mac-address"
const PORT = process.env.PORT || 3000

interface Route {
    path: string
    method: string
    handler: (query: { chatId?: string; userName?: string; action?: string, shiftId?: string }, res: http.ServerResponse, req: http.IncomingMessage) => void
    middleware?: Array<(req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => void>
}

const routes: Route[] = [
    {
        path: "/check-device",
        method: "GET",
        handler: (query, res, req) => {
            const { chatId, userName, action, shiftId } = query
            if (!chatId || !userName || !action || !shiftId) {
                res.statusCode = 400
                res.end("Thiếu tham số cần thiết.")
                return
            }
            if (action.split("_")[0] === "checkin") {
                handleCheckinRequest(parseInt(chatId as string), userName as string, action as string, shiftId as string, res)
            } else {
                res.statusCode = 400
                res.end("Hành động không hợp lệ.")
            }
        },
        middleware: [validateMacMiddleware],
    },
    {
        path: "/capture-mac",
        method: "GET",
        handler: (query, res, req) => {
            const chatId = query.chatId
            if (!chatId || isNaN(Number(chatId))) {
                res.statusCode = 400
                res.end("Thiếu tham số cần thiết.")
                return
            }
            handleGetMacRequest(parseInt(chatId as string), res, req)
        },
        middleware: [captureMacMiddleware],
    }
]

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url || "", true)
    const pathname = parsedUrl.pathname || ""
    const method = req.method || ""

    const route = routes.find((r) => r.path === pathname && r.method === method)

    if (route) {
        const middlewares = route.middleware || []
        let index = 0

        const next = () => {
            if (index < middlewares.length) {
                const middleware = middlewares[index++]
                middleware(req, res, next)
            } else {
                route.handler(parsedUrl.query, res, req)
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
