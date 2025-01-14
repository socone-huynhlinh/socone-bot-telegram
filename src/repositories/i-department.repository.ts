import Department from "../models/department"

export interface IDepartmentRepository {
    getDepartments(): Promise<Department[]>
    getDepartmentById(id: string): Promise<Department|null>
    getDepartmentsByBranchId(branchId: string): Promise<Department[]>
}