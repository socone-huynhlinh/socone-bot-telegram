import pool from "../../config/database"

// Hàm kiểm tra trạng thái checkin của nhân viên
export const isValidCheckin = async (staffId: string): Promise<boolean | null> => {
    const client = await pool.connect() 
    try {
        // Truy vấn kiểm tra trạng thái is_checkin của nhân viên
        const query = `
            SELECT * FROM checkins
            INNER JOIN staffs st
            ON checkins.staff_id=st.id
            WHERE st.tele_id = $1 AND DATE(time_checkin) = CURRENT_DATE;
        `
        const res = await client.query(query, [staffId]) 

        // Nếu không tìm thấy bản ghi nào
        if (res.rows.length === 0) {
            return null 
        }

        return res.rows.length > 0
    } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái check-in:", err)
        throw err
    } finally {
        client.release() // Giải phóng kết nối
    }
}

// Hàm ghi trạng thái checkin của nhân viên
export const insertCheckin = async (staffId: string, workShiftId: string, durationWorkHour: number): Promise<void> => {
    const client = await pool.connect() 
    try {
        const updateQuery = `
            INSERT INTO checkins (staff_id, shift_id, time_checkin, duration_hour)
                VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
                RETURNING id;
        `
        const result = await client.query(updateQuery, [staffId, workShiftId, durationWorkHour]) 
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

