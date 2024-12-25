import { WorkHours } from "../../models/work-hour"

export const getWorkTime = (workHours: WorkHours) => {
    const now = new Date()
    const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        workHours.startHour,
        workHours.startMinute,
        0,
        0,
    )
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), workHours.endHour, workHours.endMinute, 0, 0)
    return { start, end }
}
