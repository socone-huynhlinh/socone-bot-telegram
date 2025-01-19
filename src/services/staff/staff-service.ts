import pool from "../../config/database"
import Staff from '../../models/staff';

export const getStaffByChatId = async (chatid: string): Promise<Staff | null> => { 
    const client = await pool.connect()
    try {
        const query = `
                select s.*,dp.name as department_name,tr.name as type_report,ta.id as tele_id,ta.username as tele_username,ta.phone as tele_phone from staffs s
                inner join departments dp on s.department_id=dp.id
                left join type_reports tr on s.type_report_id=tr.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                where s.tele_id=$1 and s.status='approved'
            `
        const result = await client.query<Staff>(query, [chatid])
        if (result.rows.length === 0) {
            return null
        }
        return result.rows[0]
    } catch (err) {
        console.error("Error fetching staff by chat id:", err)
        throw err
    } finally {
        client.release()
    }
}