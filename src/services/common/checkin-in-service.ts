import pool from "../../config/database"
import Checkin from '../../models/checkin-model';

export const insertCheckin = async (checkin: Checkin) => {
    const query = `
        INSERT INTO checkins (staff_id, shift_id, time_checkin, duration_hour)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
    `;

    const values = [checkin.staff_id, checkin.shift_id, checkin.time_checkin, checkin.duration_hour];

    try {
        const result = await pool.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error("Lỗi khi thêm thông tin Check-in vào DB:", err);
        throw err;
    }
}