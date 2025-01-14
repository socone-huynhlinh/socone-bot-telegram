export interface ICheckInService{
    // insertCheckin: (staffId: string, checkinTime: string) => Promise<void>
    checkExistCheckinOnDate: (staffId: string) => Promise<boolean>
}