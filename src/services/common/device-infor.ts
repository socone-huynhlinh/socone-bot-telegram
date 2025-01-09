import dbConnection from "../../config/database"

export const getAllMacAddress = async () => {
    const client = await dbConnection.getPool().connect() // Kết
    try {
        const res = await client.query("SELECT * FROM devices")
        return res.rows
    } catch (err) {
        console.error("Error fetching staffs:", err)
        throw err
    } finally {
        client.release()
    }
}
