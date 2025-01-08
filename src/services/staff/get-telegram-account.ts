import pool from "../../config/database"
import { TelegramAccount } from "../../models/user"

export const getAccountById = async (chatId: number): Promise<TelegramAccount | null> => {
    const client = await pool.connect()
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

        const telegramAccount = new TelegramAccount(
            row.id,
            row.first_name,
            row.last_name,
            row.staff_id,
        )
        return telegramAccount
    } catch (err) {
        console.error("Lỗi khi truy vấn thông tin nhân viên:", err)
        throw err
    } finally {
        client.release()
    }
}