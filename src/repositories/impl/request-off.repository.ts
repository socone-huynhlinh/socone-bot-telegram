import { Pool } from "pg"
import dbConnection from "../../config/database"
import { IRequestOffRepository } from "../i-request-off.repository"
import WorkOffDay from "../../models/work-off-day"

export class RequestOffRepository implements IRequestOffRepository {
    private pg: Pool
    constructor() {
        this.pg = dbConnection.getPool()
    }
    async updateStatusRequestOffById(id: string, status: string): Promise<boolean> {
        const client = await this.pg.connect()
        try {
            const query = `
                UPDATE work_off_days SET status=$1 WHERE id=$2
            `
            const values = [status, id]
            await client.query(query, values)
            return true
        } catch (err) {
            throw err
        } finally {
            client.release()
        }
    }
    async insertRequestOff(workOffDay: WorkOffDay): Promise<string | null> {
        const client = await this.pg.connect()
        try {
            const query = `
                INSERT INTO work_off_days (staff_id, start_time, duration_hour, reason, status) VALUES ($1,$2,$3,$4,$5) RETURNING id;
            `
            const values = [
                workOffDay.staff_id,
                workOffDay.start_time,
                workOffDay.duration_hour,
                workOffDay.reason,
                workOffDay.status,
            ]
            const result = await client.query(query, values)
            return result.rows[0].id
        } catch (err) {
            throw err
        } finally {
            client.release()
        }
    }
    async getRequestOffByStaffId(staffId: string): Promise<WorkOffDay[]> {
        throw new Error("Method not implemented.")
    }
    async getRequestOffByBranchId(branchId: string): Promise<WorkOffDay[]> {
        throw new Error("Method not implemented.")
    }
}
