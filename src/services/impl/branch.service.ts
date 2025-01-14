import Branch from "../../models/branch";
import BranchRepository from "../../repositories/impl/branch.repository";
import { IBranchService } from "../i-branch.service";

class BranchService implements IBranchService{
    private branchRepository: BranchRepository;
    constructor(){
        this.branchRepository = new BranchRepository()
    }
    getBranchesByCompanyId = async (companyId: string) : Promise<Branch[]> =>{
        return await this.branchRepository.getBranchesByCompanyId(companyId)
    }
}
export default BranchService;