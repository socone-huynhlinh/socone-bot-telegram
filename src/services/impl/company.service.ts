import CompanyRepository from "../../repositories/impl/company.repository";
import { ICompanyService } from "../i-company.service";

class CompanyService implements ICompanyService{
    private companyRepository: CompanyRepository;
    constructor(){
        this.companyRepository = new CompanyRepository()
    }
    getCompanies = async () => {
        return await this.companyRepository.getCompanies()
    }
}
export default CompanyService;