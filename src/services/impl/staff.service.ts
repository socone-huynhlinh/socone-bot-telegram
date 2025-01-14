import Staff, { mapStaffFromJson } from "../../models/staff"
import StaffRepository from "../../repositories/impl/staff.repository"
import { IStaffService } from "../i-staff.service"

class StaffService implements IStaffService{
    private staffRepository: StaffRepository
    constructor(){
        this.staffRepository = new StaffRepository()
    }
    getStaffsCheckInOnDateTypeShiftByBranchId(type: string, branchId: string): Promise<Staff[]> {
        try{
            const result = this.staffRepository.getStaffsCheckInOnDateTypeShiftByBranchId(type,branchId)
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    findStaffByMacAddress(macAddress: string): Promise<Staff | null> {
        try{
            const result = this.staffRepository.findStaffByMacAddress(macAddress);
            return result.then((staff: Staff | null) => {
                if (staff) {
                    return mapStaffFromJson(staff);
                }
                return null;
            });
           
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    getStaffsPendingByBranchId(branchId: string): Promise<Staff[]> {
        try{
            const result = this.staffRepository.getStaffsPendingByBranchId(branchId)
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    getStaffsByCompanyId(companyId: string): Promise<Staff[]> {
        try{
            const result = this.staffRepository.getStaffsByCompanyId(companyId)
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
    getStaffsByDepartmentId(departmentId: string): Promise<Staff[]> {
        try{
            const result = this.staffRepository.getStaffsByDepartmentId(departmentId)
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
   
    addStaff = async (staff: Staff) => {
        try{
            const result = await this.staffRepository.addStaff(staff)
            return result
        }catch(err){
            console.error("Error adding staff:",err)
            throw err
        }
    }
    getStaffsByBranchId = async (branchId: string) => {
        try{
            const result = await this.staffRepository.getStaffsByBranchId(branchId)
            return result
        }catch(err){
            console.error("Error fetching staffs:",err)
            throw err
        }
    }
}
export default StaffService