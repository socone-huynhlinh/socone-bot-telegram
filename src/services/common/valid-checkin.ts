import pool from "../../config/database"

export const isValidCheckin = async (staffId: string): Promise<boolean | null> => {
    const client = await pool.connect() 
    try {
        const query = `
            SELECT * FROM checkins
            INNER JOIN staffs st
            ON checkins.staff_id=st.id
            WHERE st.tele_id = $1 AND DATE(time_checkin) = CURRENT_DATE;
        `
        const res = await client.query(query, [staffId]) 

        if (res.rows.length === 0) {
            return false 
        }

        return res.rows.length > 0
    } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái check-in:", err)
        throw err
    } finally {
        client.release() 
    }
}

export const isValidCheckinFullTime = async (staffId: string): Promise<boolean | null> => {
    const client = await pool.connect() 
    try {
        const query = `
            SELECT * FROM checkins
            INNER JOIN staffs st
            ON checkins.staff_id=st.id
            INNER JOIN shifts sh
            ON checkins.shift_id=sh.id
            WHERE st.tele_id = $1 AND DATE(time_checkin) = CURRENT_DATE AND sh.type = 'main';
        `
        const res = await client.query(query, [staffId]) 

        if (res.rows.length === 0) {
            return false 
        }

        return res.rows.length > 0
    } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái check-in:", err)
        throw err
    } finally {
        client.release() 
    }
}

export const isValidNewCheckin = async (staffId: string): Promise<{ isValid: boolean, message?: string }> => {
    const client = await pool.connect(); 
    try {
        const query = `
            SELECT time_checkin, duration_hour
            FROM checkins
            INNER JOIN staffs st ON checkins.staff_id = st.id
            INNER JOIN shifts sh ON checkins.shift_id = sh.id
            WHERE st.tele_id = $1
            AND (sh.name = 'ot' OR sh.name = 'time in lieu')
            AND DATE(time_checkin) = CURRENT_DATE;  
        `;
        const res = await client.query(query, [staffId]);

        if (res.rows.length === 0) {
            return { isValid: true }; 
        }

        // const currentTime = new Date();
        const currentTimeUTC = new Date();
        const currentTime = new Date(currentTimeUTC.getTime() + 7 * 60 * 60 * 1000);
        
        for (const row of res.rows) {
            const existingCheckinTime = new Date(row.time_checkin.getTime() + 7 * 60 * 60 * 1000); // Chuyển sang UTC+7
            const existingDuration = row.duration_hour;
            const existingEndTime = new Date(
                existingCheckinTime.getTime() + existingDuration * 60 * 60 * 1000
            );

            console.log("currentTime", currentTime);
            console.log("existingCheckinTime", existingCheckinTime);
            console.log("existingEndTime", existingEndTime);

            if (currentTime >= existingCheckinTime && currentTime <= existingEndTime) {
                const formattedEndTime = `${existingEndTime.getHours().toString().padStart(2, '0')}:${existingEndTime.getMinutes().toString().padStart(2, '0')}`;
                return {
                    isValid: false,
                    message: `You cannot check-in yet. Please wait until ${formattedEndTime}.`
                };
            }
        }

        return { isValid: true }; 
    } catch (err) {
        console.error("Lỗi khi kiểm tra thời gian check-in:", err);
        throw err;
    } finally {
        client.release();
    }
}

export const isValidCheckinOTTimeInLieu = async (staffId: string): Promise<boolean | null> => {
    const client = await pool.connect() 
    try {
        const query = `
            SELECT SUM(duration_hour) AS total_duration
            FROM checkins
            INNER JOIN staffs st ON checkins.staff_id=st.id
            INNER JOIN shifts sh ON checkins.shift_id=sh.id
            WHERE st.tele_id = $1 
            AND DATE(time_checkin) = CURRENT_DATE 
            AND (sh.name = 'OT' OR sh.name = 'Time in lieu');
        `
        const res = await client.query(query, [staffId]) 

        if (res.rows.length === 0) {
            return null 
        }

        const totalDuration = res.rows[0].total_duration || 0
        return totalDuration >= 4
    } catch (err) {
        console.error("Lỗi khi kiểm tra trạng thái check-in:", err)
        throw err
    } finally {
        client.release() 
    }
}

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
        }
    } catch (err) {
        console.error("Lỗi khi ghi trạng thái check-in:", err)
        throw err
    } finally {
        client.release() 
    }
}

