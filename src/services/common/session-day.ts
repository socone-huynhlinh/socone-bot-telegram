export const sessionDay = () => {
    const now = new Date(); 
    const currentHour = now.getHours(); 
    const currentMinute = now.getMinutes(); 

    let session = ''; 
    let lateTime = 0; 

    // Giờ làm việc
    const morningStart = 8 * 60;        // 8:00 sáng -> đổi sang phút
    const morningEnd = 12 * 60;             // 12:00 trưa
    const afternoonStart = 13 * 60 + 30;    // 1:30 chiều
    const afternoonEnd = 17 * 60 + 30;      // 5:30 chiều

    // Thời gian hiện tại chuyển sang phút
    const nowInMinutes = currentHour * 60 + currentMinute;

    // Xác định buổi làm việc và tính giờ đi trễ
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

    // Chuyển đổi thời gian đi trễ từ phút sang giờ và phút
    const lateHours = Math.floor(lateTime / 60); 
    const lateMinutes = lateTime % 60; 
    const lateFormatted = lateHours > 0 
        ? `${lateHours}h${lateMinutes}m` 
        : `${lateMinutes}m`; 

    return { session, lateFormatted, lateTime };
}
