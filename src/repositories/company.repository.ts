import { Pool } from "pg";
import dbConnection from "../config/database";
import { queryData } from "../utils/query";
import Company from "../models/company";

class CompanyRepository{
    private pg: Pool
    constructor() {
      this.pg = dbConnection.getPool()
    }
    getCompanies= async () => {
        const client = await this.pg.connect()
        try {
            const query = `
               SELECT * FROM company;
            `
            const result = await queryData<Company>(this.pg, query, [])
            return result
        } catch (err) {
            console.error("Lỗi khi truy vấn thông tin chi nhánh:", err)
            throw err
        } finally {
            client.release()
        }
    }
}
export default CompanyRepository;