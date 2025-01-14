import Company from "../models/company";

export interface ICompanyRepository {
    getCompanies():Promise<Company[]>
}