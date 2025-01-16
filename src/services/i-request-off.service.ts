import WorkOffDay from "../models/work-off-day"

export interface IRequestOffService {
    insertRequestOff(workOffDay: WorkOffDay): Promise<string | null>
    updateStatusRequestOffById(id: string, status: string): Promise<boolean>
}
