import pool from "../../config/database"
import Shift from '../../models/shift';

export const getWorkShifts = async (): Promise<Shift[] | null> => { 
    const client = await pool.connect()
    try {
        const query = `
               SELECT DISTINCT type
                FROM public.shifts;
            `
        const result = await client.query(query, []) 
        const shifts: Shift[] = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at
        }))
        return shifts
    } catch (err) {
        console.error("Error fetching work shifts:", err)
        throw err
    } finally {
        client.release()
    }
}

export const getWorkShiftByType = async (type: string): Promise<Shift[] | null> => {
    const client = await pool.connect()
    try {
        const query = `
            SELECT *
            FROM public.shifts
            WHERE type = $1;
        `
        const result = await client.query(query, [type])
        const shifts: Shift[] = result.rows.map((row) => ({
            id: row.id,
            name: row.name,
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at
        }))
        return shifts
    } catch (err) {
        console.error("Error fetching work shifts by type:", err)
        throw err
    } finally {
        client.release()
    }
}

export const getWorkShiftByTypeAndName = async (type: string, name: string): Promise<Shift | null> => {
    const client = await pool.connect()
    try {
        const query = `
            SELECT *
            FROM public.shifts
            WHERE type = $1 AND name = $2;
        `
        const result = await client.query(query, [type, name])
        const row = result.rows[0]
        if (!row) {
            return null
        }
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            created_at: row.created_at,
            updated_at: row.updated_at
        }
    } catch (err) {
        console.error("Error fetching work shifts by type and name:", err)
        throw err
    } finally {
        client.release()
    }
}