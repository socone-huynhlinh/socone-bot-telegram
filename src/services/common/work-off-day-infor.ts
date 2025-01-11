import pool from "../../config/database"
import WorkOffDay from '../../models/work-off-day';

export const getOffRequestById = async (id: string) => {
    const query = `
        SELECT 
            id, 
            staff_id, 
            TO_CHAR(start_time, 'YYYY-MM-DD HH24:MI:SS TZ') AS start_time,
            duration_hour, 
            status, 
            created_at, 
            updated_at, 
            description
        FROM work_off_days
        WHERE id = $1;
    `;

    const values = [id];

    try {
        const result = await pool.query(query, values);
        const row = result.rows[0];

        const workOffDay: WorkOffDay = {
            id: row.id,
            staff_id: row.staff_id,
            start_time: row.start_time,
            duration_hour: row.duration_hour,
            status: row.status,
            created_at: row.created_at,
            updated_at: row.updated_at,
            description: row.description
        }
        return workOffDay;

    } catch (err) {
        console.error("Lỗi khi lấy thông tin yêu cầu nghỉ từ DB:", err);
        throw err;
    }
}

export const getOffReasonbyId = async (id: string) => {
    const query = `
            SELECT 
            description
        FROM work_off_days
        WHERE id = $1;
    `;

    const values = [id];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].description;
    } catch (err) {
        console.error("Lỗi khi lấy lý do nghỉ từ DB:", err);
        throw err;
    }
}

export const insertOffRequest = async (
    staffId: string,
    startTime: string,
    durationHour: number | null,
    status: string,
    description: string
) => {
    const query = `
        INSERT INTO work_off_days 
        (staff_id, start_time, duration_hour, status, created_at, description) 
        VALUES ($1, TO_TIMESTAMP($2, 'DD/MM/YYYY HH24:MI') AT TIME ZONE 'Asia/Ho_Chi_Minh', $3, $4, NOW(), $5) 
        RETURNING id;
    `;

    const values = [staffId, startTime, durationHour, status, description];

    try {
        const result = await pool.query(query, values);
        return result.rows[0].id; // Trả về ID của yêu cầu mới
    } catch (err) {
        console.error("Lỗi khi lưu yêu cầu vào DB:", err);
        throw err;
    }
};

export const updateOffRequest = async (
    idOffDay: string, 
    offDate: string,
    startTime: string,
    durationHour: number | null,
    status: string
) => {
    const query = `
        UPDATE work_off_days 
        SET 
            start_time = TO_TIMESTAMP($2 || ' ' || $3, 'DD/MM/YYYY HH24:MI') AT TIME ZONE 'Asia/Ho_Chi_Minh',
            duration_hour = $4,
            status = $5,
            updated_at = NOW()
        WHERE id = $1;
    `;

    const values = [idOffDay, offDate, startTime, durationHour, status];

    try {
        const result = await pool.query(query, values);
        if (result.rowCount === 0) {
            throw new Error(`Không tìm thấy yêu cầu với id: ${idOffDay}`);
        }

        console.log(`Yêu cầu nghỉ phép với id ${idOffDay} đã được cập nhật.`);
    } catch (err) {
        console.error("Lỗi khi cập nhật trạng thái yêu cầu:", err);
        throw err;
    }
};