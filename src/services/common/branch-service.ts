import pool from "../../config/database";
import Branch from "../../models/branch";

export const getBranchesByCompanyId = async (companyId: string): Promise<Branch[]> => {
    const client = await pool.connect()
    try {
        const query = `
           SELECT branch.*
            FROM branch
            WHERE company_id = $1;
        `
        const result = await client.query<Branch>(query, [companyId])
        return result.rows
    } catch (err) {
        console.error("Error fetching branches by company id:", err)
        throw err
    } finally {
        client.release()
    }
};