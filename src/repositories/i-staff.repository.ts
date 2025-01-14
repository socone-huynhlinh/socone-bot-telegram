import Staff from "../models/staff";

export interface IStaffRepository {
    addStaff(staff:Staff):Promise<string|null>
    getStaffsByBranchId(branchId:string):Promise<Staff[]>
    getStaffsByCompanyId(companyId:string):Promise<Staff[]>
    getStaffsByDepartmentId(departmentId:string):Promise<Staff[]>
    getStaffsPendingByBranchId(branchId:string):Promise<Staff[]>
    findStaffByMacAddress(macAddress:string):Promise<Staff|null>
    getStaffsCheckInOnDateTypeShiftByBranchId(type:string,branchId:string):Promise<Staff[]>
}