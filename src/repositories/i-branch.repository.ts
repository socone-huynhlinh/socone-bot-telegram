import Branch from "../models/branch";

export interface IBranchRepository {
    getBranchesByCompanyId(companyId: string): Promise<Branch[]>
}