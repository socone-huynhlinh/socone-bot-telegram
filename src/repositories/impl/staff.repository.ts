import { Pool } from "pg";
import dbConnection from "../../config/database";
import Staff from "../../models/staff";
import { queryData } from "../../utils/query";
import { IStaffRepository } from "../i-staff.repository";

class StaffRepository implements IStaffRepository{
    private pg:Pool
    constructor(){
        this.pg = dbConnection.getPool()
    }
    findStaffByMacAddress(macAddress: string): Promise<Staff | null> {
        try{
            const query = `
                select s.*,dp.name as department_name,tr.name as type_report,ta.id as tele_id,ta.username as tele_username,ta.phone as tele_phone from staffs s
                inner join departments dp on s.department_id=dp.id
                left join type_reports tr on s.type_report_id=tr.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                where d.mac_address=$1 and s.status='approved'
            `
            const result =  queryData<Staff>(this.pg, query, [macAddress])
            return result.then((staffs:Staff[])=>{
                return staffs.length>0?staffs[0]:null
            })
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    getStaffsPendingByBranchId(branchId: string): Promise<Staff[]> {
        try{
            const query = `
                select s.*,dp.name as department_name,tr.name as type_report,ta.id as tele_id,ta.username as tele_username,ta.phone as tele_phone from staffs s
                inner join departments dp on s.department_id=dp.id
                left join type_reports tr on s.type_report_id=tr.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                where s.status='pending' and dp.branch_id=$1
            `
            const result = queryData<Staff>(this.pg, query, [branchId])
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    getStaffsByCompanyId(companyId: string): Promise<Staff[]> {
       try{
            const query = `
                select s.*,dp.name as department_name,tr.name as type_report,ta.id as tele_id,ta.username as tele_username,ta.phone as tele_phone from staffs s
                inner join departments dp on s.department_id=dp.id
                left join type_reports tr on s.type_report_id=tr.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                where s.status='approved' and br.company_id=$1
            `
            const result=queryData<Staff>(this.pg, query, [companyId])
            return result
        }
        catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    getStaffsByDepartmentId(departmentId: string): Promise<Staff[]> {
        try{
            const query = `
                select s.*,dp.name as department_name,tr.name as type_report,ta.id as tele_id,ta.username as tele_username,ta.phone as tele_phone from staffs s
                inner join departments dp on s.department_id=dp.id
                left join type_reports tr on s.type_report_id=tr.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                where s.status='approved' and dp.id=$1
            `
            const result = queryData<Staff>(this.pg, query, [departmentId])
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    addStaff = async (staff: Staff): Promise<string|null> => {
        const client = await this.pg.connect();
        try {
            // Bắt đầu transaction
            await client.query('BEGIN');
    
            // Bước 1: Thêm nhân viên
            let query = `
                INSERT INTO staffs (department_id, tele_id, full_name, company_email, position, status)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id;
            `;
            const result = await client.query(query, [
                staff.department?.id,
                staff.tele_account?.id,
                staff.full_name,
                staff.company_email,
                staff.position,
                'approved',
            ]);
    
            if (result.rows.length > 0) {
                const staff_id = result.rows[0].id;
    
                // Bước 2: Thêm thiết bị
                query = `
                    INSERT INTO devices (ip_address,mac_address)
                    VALUES ($1,$2)
                    RETURNING id;
                `;
                const result_device = await client.query(query, [staff.device?.ip_adress,staff.device?.mac_address]);
    
                if (result_device.rows.length > 0) {
                    const device_id = result_device.rows[0].id;
    
                    // Bước 3: Liên kết nhân viên và thiết bị
                    query = `
                        INSERT INTO staff_devices (staff_id, device_id)
                        VALUES ($1, $2);
                    `;
                    await client.query(query, [staff_id, device_id]);
                    query=`
                    INSERT INTO tele_accounts (id,username,phone) VALUES($1,$2,$3)
                    RETURNING id;
                    `
                    const result_tele=await client.query(query,[staff.tele_account?.id,staff.tele_account?.username,staff.tele_account?.phone])
                    if(result_tele.rows.length>0){
                        await client.query('COMMIT');
                        return staff_id;
                    }
                    // Commit transaction
                }
            }
    
            // Nếu không thực hiện được một bước nào đó, rollback
            await client.query('ROLLBACK');
            return null;
        } catch (err) {
            // Rollback khi có lỗi
            await client.query('ROLLBACK');
            console.error('Error adding staff:', err);
            throw err;
        } finally {
            client.release();
        }
    };
    
    getStaffsByBranchId = async (branchId: string):Promise<Staff[]> => {
        try{
            const query = `
               select s.*,dp.name as department_name,tr.name as type_report,ta.id as tele_id,ta.username as tele_username,ta.phone as tele_phone from staffs s
                inner join departments dp on s.department_id=dp.id
                left join type_reports tr on s.type_report_id=tr.id
                inner join staff_devices sd on s.id=sd.staff_id
                inner join devices d on sd.device_id=d.id
                inner join tele_accounts ta on s.tele_id=ta.id
                where s.status='approved' and dp.branch_id=$1
            `
            const result = await queryData<any>(this.pg, query, [branchId])
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
}
export default StaffRepository