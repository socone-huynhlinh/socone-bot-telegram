import pool from "../../config/database"

export const addReportByStaffId = async (staffId: string, workReport: string) => {
    if (!staffId || !workReport) {
        throw new Error("Staff ID and work report are required.");
    }

    const client = await pool.connect(); 
    const query = `
        INSERT INTO reports (staff_id, description)
        VALUES ($1, $2)
        RETURNING *;
    `;

    const values = [staffId, workReport];

    try {
        const result = await client.query(query, values);
        return result.rows[0];
    } catch (err) {
        console.error("Error when adding report to DB:", err);
        throw err;
    } finally {
        client.release();
    }
};
