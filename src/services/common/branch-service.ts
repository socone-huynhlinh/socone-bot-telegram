import pool from "../../config/database";
import Branch from "../../models/branches";

export const getBranchesByCompanyId = async (companyId: string): Promise<Branch[]> => {
    const client = await pool.connect()
    try {
        const query = `
           SELECT branches.*
            FROM branches
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