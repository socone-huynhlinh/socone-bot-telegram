import Shift from "../models/shift"

export interface IWorkShiftService {
    getWorkShiftsByType(typeWork: string): Promise<Shift[]|null>
    getTypeWorkShifts(): Promise<string[]|null>
}