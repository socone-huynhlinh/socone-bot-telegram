import WorkOffDay from "../models/work-off-day"

export interface IRequestOffRepository {
    insertRequestOff(workOffDay: WorkOffDay): Promise<string | null>
    updateStatusRequestOffById(id: string, status: string): Promise<boolean>
    getRequestOffByStaffId(staffId: string): Promise<WorkOffDay[]>
    getRequestOffByBranchId(branchId: string): Promise<WorkOffDay[]>
}
