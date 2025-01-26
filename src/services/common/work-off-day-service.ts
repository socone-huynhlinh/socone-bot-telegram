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
            reason
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
            reason: row.reason
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
            reason
        FROM work_off_days
        WHERE id = $1;
    `;

    const values = [id];
    try {
        const result = await pool.query(query, values);
        return result.rows[0].reason;
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
    reason: string
) => {
    const query = `
        INSERT INTO work_off_days 
        (staff_id, start_time, duration_hour, status, created_at, reason) 
        VALUES ($1, TO_TIMESTAMP($2, 'DD/MM/YYYY HH24:MI') AT TIME ZONE 'Asia/Ho_Chi_Minh', $3, $4, NOW(), $5) 
        RETURNING id;
    `;

    const values = [staffId, startTime, durationHour, status, reason];

    try {
        const result = await pool.query(query, values);
        return result.rows[0].id; 
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
    } catch (err) {
        throw err;
    }
};

export const insertRequestOff = async (workOffDay: WorkOffDay): Promise<string | null> => {
    const client = await pool.connect();
    try{
        const query=`
            INSERT INTO work_off_days (staff_id, start_time, duration_hour, reason, status) VALUES ($1,$2,$3,$4,$5) RETURNING id;
        `
        const values=[workOffDay.staff_id,workOffDay.start_time,workOffDay.duration_hour,workOffDay.reason,workOffDay.status]
        const result = await client.query(query,values)
        return result.rows[0].id
    }catch(err){
        throw err
    }
    finally{
        client.release()
    }
}

export const updateRequestOff = async (workOffDay: WorkOffDay): Promise<void> => {
    const client = await pool.connect();
    try{
        const query=`
            UPDATE work_off_days
            SET
                start_time=$2,
                duration_hour=$3, 
                status=$5
            WHERE id=$1;
        `
        const values=[workOffDay.id, workOffDay.start_time,workOffDay.duration_hour,workOffDay.status]
        await client.query(query,values)
    }catch(err){
        throw err
    }
    finally{
        client.release()
    }
}