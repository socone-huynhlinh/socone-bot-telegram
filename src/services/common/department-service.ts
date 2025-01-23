import pool from "../../config/database"
import Department from "../../models/departments";

export const getDepartmentsByBranchId = async (branchId: string): Promise<Department[]> =>{
    const client = await pool.connect();
    try {
        const query = `
            SELECT * FROM departments WHERE branch_id=$1;
        `;
        const result= await client.query<Department>(query, [branchId])
        return result.rows;
    } catch(err) {
        console.error("Error fetching departments:",err)
        throw err
    } finally {
        client.release()
    }
}