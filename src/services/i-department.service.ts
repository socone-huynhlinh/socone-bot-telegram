import Department from "../models/department";

export interface IDepartmentService {
    getDepartmentsByBranchId(branchId: string): Promise<Department[]>
}