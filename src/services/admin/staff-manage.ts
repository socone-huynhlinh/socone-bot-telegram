import pool from "../../config/database"
import Staff from "../../models/staff"

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

export const addStaff = async (staff: Staff): Promise<string | null> => {
    const client = await pool.connect()
    try {
        // Bắt đầu transaction
        await client.query("BEGIN")
        let query = `
        INSERT INTO tele_accounts (id,username,phone) VALUES($1,$2,$3)
        RETURNING id;
        `
        const result_tele = await client.query(query, [
            staff.tele_account?.id,
            staff.tele_account?.username,
            staff.tele_account?.phone,
        ])
        // Bước 1: Thêm nhân viên
        if (result_tele.rows.length > 0) {
            const tele_id = result_tele.rows[0].id
            query = `
            INSERT INTO staffs (department_id, tele_id, full_name, company_email, position, status)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id;
        `
            const result = await client.query(query, [
                staff.department?.id,
                tele_id,
                staff.full_name,
                staff.company_email,
                staff.position,
                "pending",
            ])

            if (result.rows.length > 0) {
                const staff_id = result.rows[0].id

                // Bước 2: Thêm thiết bị
                query = `
                    INSERT INTO devices (ip_address,mac_address)
                    VALUES ($1,$2)
                    RETURNING id;
                `
                const result_device = await client.query(query, [
                    staff.device?.ip_adress,
                    staff.device?.mac_address,
                ])

                if (result_device.rows.length > 0) {
                    const device_id = result_device.rows[0].id

                    // Bước 3: Liên kết nhân viên và thiết bị
                    query = `
                        INSERT INTO staff_devices (staff_id, device_id)
                        VALUES ($1, $2);
                    `
                    await client.query(query, [staff_id, device_id])
                    await client.query("COMMIT")
                    return staff_id
                }
            }
        }
        await client.query("ROLLBACK")
        return null
    } catch (err) {
        await client.query("ROLLBACK")
        throw err
    } finally {
        client.release()
    }
}
