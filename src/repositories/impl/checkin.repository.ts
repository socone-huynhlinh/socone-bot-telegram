import { Pool } from "pg";
import { ICheckinRepository } from "../i-checkin.repository";
import dbConnection from "../../config/database";

export class CheckInRepository implements ICheckinRepository{
    private pg: Pool
    constructor() {
      this.pg = dbConnection.getPool()
    }
    insertCheckin = async (staffId: string,workShiftId:string, durationWorkHour: number): Promise<number> => {
        try {
            const query = `
                INSERT INTO checkins (staff_id, shift_id, time_checkin, duration_hour)
                VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
                RETURNING id;
            `;
            const result = await this.pg.query(query, [staffId,workShiftId, durationWorkHour]);
            return result.rows[0].id;
        } catch (err) {
            console.error("Error inserting check-in:", err);
            throw err;
        }
    }
    checkExistCheckinOnDate = async (teleId: string) => {
        try {
            const query = `
                 SELECT * FROM checkins
                INNER JOIN staffs st
                ON checkins.staff_id=st.id
                WHERE st.tele_id = $1 AND DATE(time_checkin) = CURRENT_DATE;
            `
            const result = await this.pg.query(query, [teleId])
            return result.rows.length > 0
        } catch (err) {
            console.error("Lỗi khi truy vấn thông tin Check-in:", err)
            throw err
        }
    }
}