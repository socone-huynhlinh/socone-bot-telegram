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

export const addStaff = async (staff: any) => {
    const client = await pool.connect()
    try {
        await client.query("INSERT INTO staffs (full_name, role_name, phone_number, company_mail) VALUES ($1, $2, $3, $4)", [staff.full_name, staff.role_name, staff.phone_number, staff.company_mail])
    } catch (err) {
        console.error("Error adding staff:", err)
        throw err
    } finally {
        client.release()
    }
}
