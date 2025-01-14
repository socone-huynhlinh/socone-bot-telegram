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
    return date >= today;
}