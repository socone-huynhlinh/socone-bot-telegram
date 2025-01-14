import Company from "../models/company";

export interface ICompanyService {
    getCompanies(): Promise<Company[]>
}