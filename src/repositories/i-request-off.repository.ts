import WorkOffDay from "../models/work-off-day"

export interface IRequestOffRepository {
    insertRequestOff(workOffDay: WorkOffDay): Promise<string | null>
    getRequestOffByStaffId(staffId: string):Promise<WorkOffDay[]>
    getRequestOffByBranchId(branchId: string): Promise<WorkOffDay[]>
}