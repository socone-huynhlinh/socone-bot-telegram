import { Staff } from "../models/user";

const pendingRegistrations = new Map<string, Staff>();

export const savePendingRegistration = (key: string, staff: Staff) => {
    pendingRegistrations.set(key, staff);
};

export const getPendingRegistration = (key: string): Staff | undefined => {
    return pendingRegistrations.get(key);
};

export const deletePendingRegistration = (key: string): boolean => {
    return pendingRegistrations.delete(key);
};

export const hasPendingRegistration = (key: string): boolean => {
    return pendingRegistrations.has(key);
};
