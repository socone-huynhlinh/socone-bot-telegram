import { Pool } from "pg";
import Department from "../../models/department";
import { IDepartmentRepository } from "../i-department.repository";
import dbConnection from "../../config/database";
import { queryData } from "../../utils/query";

class DepartmentRepository implements IDepartmentRepository {
    private pg:Pool
    constructor(){
        this.pg = dbConnection.getPool()
    }
    getDepartmentsByBranchId(branchId: string): Promise<Department[]> {
        try{
            const query = `
                SELECT * FROM departments WHERE branch_id=$1;
            `
            const result=queryData<Department>(this.pg, query, [branchId])
            return result
        }catch(err){
            console.error("Error fetching departments:",err)
            throw err
        }
    }
    getDepartments = async (): Promise<Department[]> => {
       try{
            const query = `
                SELECT * FROM departments;
            `
            const result=queryData<Department>(this.pg, query, [])
            return result
        }catch(err){
            console.error("Error fetching departments:",err)
            throw err
       }
    }
    getDepartmentById = async (id: string): Promise<Department|null> => {
        try{
            const query = `
                SELECT * FROM departments WHERE id=$1;
            `
            const result = await queryData<Department>(this.pg, query, [id])
            return result[0]
        }catch(err){
            console.error("Error fetching department:",err)
            throw err
        }
    }
}
export default DepartmentRepository;