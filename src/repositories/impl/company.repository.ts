import { Pool } from "pg";
import dbConnection from "../../config/database";
import { queryData } from "../../utils/query";
import Company from "../../models/company";
import { ICompanyRepository } from "../i-company.repository";

class CompanyRepository implements ICompanyRepository {
    private pg: Pool
    constructor() {
      this.pg = dbConnection.getPool()
    }
    getCompanies= async () => {
        try {
            const query = `
               SELECT * FROM company;
            `
            const result = await queryData<Company>(this.pg, query, [])
            return result
        } catch (err) {
            console.error("Lỗi khi truy vấn thông tin chi nhánh:", err)
            throw err
        } 
    }
}
export default CompanyRepository;