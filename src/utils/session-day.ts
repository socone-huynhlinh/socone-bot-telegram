export const sessionDay = () => {
    const now = new Date(); 
    const currentHour = now.getHours(); 
    const currentMinute = now.getMinutes(); 

    let session = ''; 
    let lateTime = 0; 

    // Giờ làm việc
    const morningStart = 8 * 60;        // 8:00 sáng -> đổi sang phút
    const morningEnd = 12 * 60;             // 12:00 trưa
    const afternoonStart = 13 * 60 + 30;    // 13:30 chiều
    const afternoonEnd = 17 * 60 + 30;      // 17:30 chiều

    const nowInMinutes = currentHour * 60 + currentMinute;

    if (nowInMinutes >= morningStart && nowInMinutes <= morningEnd) {
        session = 'Morning';
        if (nowInMinutes > morningStart) {
            lateTime = nowInMinutes - morningStart; 
        }
    } else if (nowInMinutes >= afternoonStart && nowInMinutes <= afternoonEnd) {
        session = 'Afternoon';
        if (nowInMinutes > afternoonStart) {
            lateTime = nowInMinutes - afternoonStart; 
        }
    } else {
        session = 'After hours';
        lateTime = 0; 
    }

    const lateHours = Math.floor(lateTime / 60); 
    const lateMinutes = lateTime % 60; 
    const lateFormatted = lateHours > 0 
        ? `${lateHours}h${lateMinutes}m` 
        : `${lateMinutes}m`; 

    return { session, lateFormatted, lateTime };
}
