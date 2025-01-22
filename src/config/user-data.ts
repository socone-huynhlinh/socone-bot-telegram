export const userData: Map<number, Record<string, any>> = new Map();

export const setUserData = (chatId: number, key: string, value: any): void =>{
    const data = userData.get(chatId) || {};
    data[key] = value;
    userData.set(chatId, data);
}
export const getUserData = (chatId: number): Record<string, any> | undefined =>{
    console.log(`Getting user data: ${chatId} -> ${userData.get(chatId)}`);
    return userData.get(chatId);
}