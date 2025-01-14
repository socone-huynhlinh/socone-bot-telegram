export interface ICheckInService{
    // insertCheckin: (staffId: string, checkinTime: string) => Promise<void>
    checkExistCheckinOnDate: (staffId: string) => Promise<boolean>
    insertCheckin: (staffId: string,workShiftId:string,durationWorkHour:number) => Promise<number>

}