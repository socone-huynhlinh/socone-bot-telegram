import Staff from "../models/staff";

export interface IStaffService {
    addStaff(staff:Staff): Promise<string|null>
    getStaffsByCompanyId(companyId: string): Promise<Staff[]>
    getStaffsByBranchId(branchId: string): Promise<Staff[]>
    getStaffsByDepartmentId(departmentId: string): Promise<Staff[]>
    getStaffsPendingByBranchId(branchId: string): Promise<Staff[]>
    findStaffByMacAddress(macAddress: string): Promise<Staff|null>
    findStaffByTeleId(teleId: string): Promise<Staff|null>
    getStaffsCheckInOnDateTypeShiftByBranchId(type: string, branchId: string): Promise<Staff[]>
}