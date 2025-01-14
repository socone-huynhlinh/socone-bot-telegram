import Branch from "../models/branch";

export interface IBranchService {
    getBranchesByCompanyId(companyId: string): Promise<Branch[]>
}