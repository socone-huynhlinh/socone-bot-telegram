import Branch from "../models/branch";
import BranchRepository from "../repositories/branch.repository";

class BranchService{
    private branchRepository: BranchRepository;
    constructor(){
        this.branchRepository = new BranchRepository()
    }
    getBranchesByCompanyId = async (companyId: string) : Promise<Branch[]> =>{
        return await this.branchRepository.getBranchesByCompanyId(companyId)
    }
}
export default BranchService;