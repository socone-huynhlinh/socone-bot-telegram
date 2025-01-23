import pool from "../../config/database";
import Company from "../../models/companies";

export const getCompanies = async (): Promise<Company[]> => {
    const client = await pool.connect();
    try {
        const query = `
            SELECT *
            FROM company;
        `;
        const result = await client.query<Company>(query, []);
        return result.rows;
    } catch (err) {
        console.error("Error fetching companies:", err);
        throw err;
    } finally {
        client.release();
    }
}

