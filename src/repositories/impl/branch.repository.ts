import { Pool } from "pg";
import dbConnection from "../../config/database";
import { queryData } from "../../utils/query";
import Branch from "../../models/branch";
import { IBranchRepository } from "../i-branch.repository";

class BranchRepository implements IBranchRepository {
    private pg: Pool
    constructor() {
      this.pg = dbConnection.getPool()
    }
    getBranchesByCompanyId= async (companyId: string) => {
        try {
            const query = `
               SELECT branch.*
                FROM branch
                WHERE company_id = $1;
            `
            const result = await queryData<Branch>(this.pg, query, [companyId])
            return result
        } catch (err) {
            console.error("Lỗi khi truy vấn thông tin chi nhánh:", err)
            throw err
        } finally {
        }
    }
}
export default BranchRepository;