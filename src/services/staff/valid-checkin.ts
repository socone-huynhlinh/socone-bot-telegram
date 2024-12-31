import pool from "../../config/database"

// Hàm kiểm tra trạng thái checkin của nhân viên
export const isValidCheckin = async (staffId: string): Promise<boolean | null> => {
    const client = await pool.connect() 
    try {
        // Truy vấn kiểm tra trạng thái is_checkin của nhân viên
        const query = `
            SELECT is_checkin 
            FROM checkin 
            WHERE staff_id = $1 AND date_checkin::date = CURRENT_DATE
            ORDER BY date_checkin DESC -- Lấy bản ghi gần nhất
            LIMIT 1
        `
        const res = await client.query(query, [staffId]) 

        // Nếu không tìm thấy bản ghi nào
        if (res.rows.length === 0) {
            return null 
        }

        // Trả về giá trị is_checkin (true/false)
        return res.rows[0].is_checkin
    } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái check-in:", err)
        throw err
    } finally {
        client.release() // Giải phóng kết nối
    }
}

// Hàm ghi trạng thái checkin của nhân viên
export const writeCheckin = async (staffId: string, isCheckin: boolean, lateTime: string, workMode: string): Promise<void> => {
    const client = await pool.connect() 
    try {
        // Thực hiện ghi trạng thái checkin của nhân viên
        const updateQuery = `
            UPDATE checkin
            SET is_checkin = $2,
                late_time = $3,
                work_mode = $4
            WHERE staff_id = $1 AND date_checkin::date = CURRENT_DATE
            RETURNING *
        `
        const result = await client.query(updateQuery, [staffId, isCheckin, lateTime, workMode]) 
        if ((result.rowCount ?? 0) > 0) {
            console.log(`Ghi trạng thái checkin thành công cho nhân viên ${staffId}`)
        } else {
            console.log(`Không tìm thấy bản ghi checkin cho nhân viên ${staffId}`)
        }
    } catch (err) {
        console.error("Lỗi khi ghi trạng thái check-in:", err)
        throw err
    } finally {
        client.release() // Giải phóng kết nối
    }
}

