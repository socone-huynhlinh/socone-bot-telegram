const isOutOfWorkingHours = (): boolean => {
    const now = new Date();
    const day = now.getDay();

    console.log(`Today is: ${day}`);

    if (day === 0 || day === 6) {
        return true; 
    }

    const start = new Date();
    start.setHours(7, 0, 0, 0); 
    const end = new Date();
    end.setHours(17, 30, 0, 0); 

    if (now < start || now > end) {
        return true;
    }

    return false; 
};

// const test = isOutOfWorkingHours();

export default isOutOfWorkingHours;