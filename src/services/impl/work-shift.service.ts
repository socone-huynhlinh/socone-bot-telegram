import { WorkShiftRepository } from "../../repositories/impl/work-shift.repository"
import { IWorkShiftService } from "../i-work-shift.service"
import Shift from "../../models/shift"
export class WorkShiftService implements IWorkShiftService {
    private workShiftRepository: WorkShiftRepository
    constructor() {
        this.workShiftRepository = new WorkShiftRepository()
    }
    getTypeWorkShifts(): Promise<string[] | null> {
        return this.workShiftRepository.getTypeWorkShifts()
    }
    getWorkShiftsByType(typeWork: string): Promise<Shift[] | null> {
        return this.workShiftRepository.getWorkShiftsByType(typeWork)
    }
}