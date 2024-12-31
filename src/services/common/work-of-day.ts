import pool from "../../config/database"

export const saveOffRequest = async (
    staffId: string,
    startTime: string,
    durationHour: number | null,
    status: string,
    description: string
) => {
    const query = `
        INSERT INTO work_off_days 
        (staff_id, start_time, duration_hour, status, created_at, description) 
        VALUES ($1, TO_TIMESTAMP($2, 'DD/MM/YYYY'), $3, $4, NOW(), $5) 
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