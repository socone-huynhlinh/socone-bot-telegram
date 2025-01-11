type Checkin = {
    id: string
    staff_id: string
    shift_id: string
    time_checkin: string
    duration_hour: number
    created_at?: Date
    updated_at?: Date
}

export default Checkin