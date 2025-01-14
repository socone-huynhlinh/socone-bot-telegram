import Shift from "../models/shift"

export interface IWorkShiftRepository {
    getWorkShiftsByType(typeWork: string): Promise<Shift[]|null>
    getTypeWorkShifts(): Promise<string[]|null>
}