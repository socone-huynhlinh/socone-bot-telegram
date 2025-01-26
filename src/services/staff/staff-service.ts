import pool from "../../config/database"
import Staff from '../../models/staff';

export const getStaffByChatId = async (chatid: string): Promise<Staff | null> => { 
    const client = await pool.connect()
    try {
        const query = `
                select
                    s.*,
                    dp.name as department_name,
                    ta.id as tele_id,
                    ta.username as tele_username,
                    ta.phone as tele_phone, 
                    br.id as branch_id, 
                    br.name as branch_name 
                from 
                    staffs s
                inner join departments dp on s.department_id=dp.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                inner join branches br on dp.branch_id = br.id
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

export const getStaffPendingByChatId = async (chatid: string): Promise<Staff | null> => { 
    const client = await pool.connect()
    try {
        const query = `
                select
                    s.*,
                    dp.name as department_name,
                    ta.id as tele_id,
                    ta.username as tele_username,
                    ta.phone as tele_phone, 
                    br.id as branch_id, 
                    br.name as branch_name 
                from 
                    staffs s
                inner join departments dp on s.department_id=dp.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                inner join branches br on dp.branch_id = br.id
                where s.tele_id=$1 and s.status='pending'
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

export const updateStatusStaffByTeleId = async (teleId: string, status: string, typeStaff: string) => {
    const client = await pool.connect()

    try {
        const query = `
            UPDATE staffs
            SET
                status = $2,
                type_staff = $3
            WHERE tele_id = $1;
        `
        await client.query(query, [teleId, status, typeStaff])
    } catch (err) {
        console.error("Error updating staff status:", err)
        throw err
    } finally {
        client.release()
    }
}

export const checkExistStaff = async (email: string): Promise<boolean> => {
    const client = await pool.connect()
    try {
        let query = `
        select
            s.*,
            dp.name as department_name,
            ta.id as tele_id,
            ta.username as tele_username,
            ta.phone as tele_phone 
        from
            staffs s
        inner join departments dp on s.department_id=dp.id
        inner join staff_devices sd on s.id=sd.staff_id
        inner join devices d on sd.device_id=d.id
        inner join tele_accounts ta on s.tele_id=ta.id
        where s.company_email =$1
     `
        const result = await client.query<Staff>(query, [email])
        return result.rows.length > 0
    } catch (err) {
        console.error("Error fetching staff by chat id:", err)
        throw err
    } finally {
        client.release()
    }
}

