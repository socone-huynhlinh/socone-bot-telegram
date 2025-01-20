export const isExistDate = (dateStr: string): boolean => {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/; // Định dạng dd/mm/yyyy
    if (!regex.test(dateStr)) return false;

    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

export const isFutureDate = (dateStr: string): boolean => {
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Today: ${today}, Request Date: ${date}`);
    return date >= today;
}   

export const isExpiredRequestOffDate = (dateStr: string): boolean => {
    const [day, month, year] = dateStr.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - date.getTime();
    // const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 3;
}


export const isValidStartTime = (offDate: string, startTime: string): boolean => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1; // Months are 0-based
    const currentYear = now.getFullYear();

    const [offDay, offMonth, offYear] = offDate.split("/").map(Number);

    const [selectedHour, selectedMinute] = startTime.split(":").map(Number);

    const selectedDate = new Date(offYear, offMonth - 1, offDay, selectedHour, selectedMinute);
    const currentDate = new Date(currentYear, currentMonth - 1, currentDay, currentHour, currentMinute);

    console.log("Selected date:", selectedDate);
    console.log("Current date:", currentDate);

    return selectedDate >= currentDate;
}