// src/handlers/deviceHandlers.ts

import http from "http"

export const handleCheckinRequest = (chatId: string, userName: string, res: http.ServerResponse) => {
    // Xử lý logic Check-in ở đây
    // Ví dụ: Cập nhật cơ sở dữ liệu, gửi thông báo, etc.
    res.statusCode = 200
    res.setHeader("Content-Type", "text/plain")
    res.end(`Check-in thành công cho người dùng ${userName} (Chat ID: ${chatId})`)
}

export const handleCheckoutRequest = (chatId: string, userName: string, res: http.ServerResponse) => {
    // Xử lý logic Check-out ở đây
    res.statusCode = 200
    res.setHeader("Content-Type", "text/plain")
    res.end(`Check-out thành công cho người dùng ${userName} (Chat ID: ${chatId})`)
}
