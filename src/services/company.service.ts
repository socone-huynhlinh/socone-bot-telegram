import CompanyRepository from "../repositories/company.repository";

class CompanyService{
    private companyRepository: CompanyRepository;
    constructor(){
        this.companyRepository = new CompanyRepository()
    }
    getCompanies = async () => {
        return await this.companyRepository.getCompanies()
    }
}
export default CompanyService;