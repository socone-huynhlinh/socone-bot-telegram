import pool from "../../config/database"
import TelegramAccount from "../../models/telegram-account"

export const getAccountById = async (chatId: number): Promise<TelegramAccount | null> => {
    const client = await pool.connect()
    try {
        const query = `
            SELECT *
            FROM tele_accounts
            WHERE id = $1
        `
        const res = await client.query(query, [chatId])

        if (res.rows.length === 0) {
            return null
        }

        const row = res.rows[0]
        console.log(row)

        const telegramAccount: TelegramAccount = {
            id: row.id,
            username: row.username,
            phone: row.phone,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }
        return telegramAccount
    } catch (err) {
        console.error("Lỗi khi truy vấn thông tin nhân viên:", err)
        throw err
    } finally {
        client.release()
    }
}