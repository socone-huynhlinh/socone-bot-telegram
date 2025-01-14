import Department from "../../models/department";
import DepartmentRepository from "../../repositories/impl/department.repository";
import { IDepartmentService } from "../i-department.service";

class DepartmentService implements IDepartmentService{
    private departmentRepository: DepartmentRepository;
    constructor(){
        this.departmentRepository = new DepartmentRepository()
    }
    getDepartmentsByBranchId(branchId: string): Promise<Department[]> {
       try{
              const result = this.departmentRepository.getDepartmentsByBranchId(branchId)
              return result
       }
         catch(err){
                  console.error("Error fetching departments:",err)
                  throw err
         }
    }
}
export default DepartmentService;