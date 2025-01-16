import redisClient from "./redis-client"

// Lưu session vào Redis
async function setUserSession(chatId: number, session: any): Promise<void> {
    await redisClient.set(`session:${chatId}`, JSON.stringify(session))
}

// Lấy session từ Redis
async function getUserSession(chatId: number): Promise<any | null> {
    const session = await redisClient.get(`session:${chatId}`)
    return session ? JSON.parse(session) : null
}

// Xóa session khỏi Redis
async function deleteUserSession(chatId: number): Promise<void> {
    await redisClient.del(`session:${chatId}`)
}

export { setUserSession, getUserSession, deleteUserSession }
