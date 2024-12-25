export interface WorkHours {
    startHour: number
    startMinute: number
    endHour: number
    endMinute: number
}

export const defaultWorkHours: WorkHours = {
    startHour: 8,
    startMinute: 0,
    endHour: 17,
    endMinute: 30,
}
