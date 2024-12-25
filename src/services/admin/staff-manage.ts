import pool from "../../config/database"

export const getAllStaffs = async () => {
    const client = await pool.connect()
    try {
        const res = await client.query("SELECT * FROM staffs ORDER BY full_name ASC")
        return res.rows
    } catch (err) {
        console.error("Error fetching staffs:", err)
        throw err
    } finally {
        client.release()
    }
}
