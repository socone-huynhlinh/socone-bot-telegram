const isOutOfWorkingHours = (): boolean => {
    const now = new Date()
    const start = new Date()
    start.setHours(7, 0, 0, 0) // 7:00 AM
    const end = new Date()
    end.setHours(17, 30, 0, 0) // 5:30 PM

    return now < start || now > end
}

export default isOutOfWorkingHours