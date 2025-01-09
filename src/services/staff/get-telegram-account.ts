import dbConnection from "../../config/database"
import TelegramAccount from "../../models/telegram-account"

export const getAccountById = async (chatId: number): Promise<TelegramAccount | null> => {
    const client = await dbConnection.getPool().connect() // Kết nối tới database
    try {
        const query = `
            SELECT *
            FROM telegram_accounts
            WHERE id = $1
        `
        const res = await client.query(query, [chatId])

        if (res.rows.length === 0) {
            return null
        }

        const row = res.rows[0]
        console.log(row)

        return null
    } catch (err) {
        console.error("Lỗi khi truy vấn thông tin nhân viên:", err)
        throw err
    } finally {
        client.release()
    }
}