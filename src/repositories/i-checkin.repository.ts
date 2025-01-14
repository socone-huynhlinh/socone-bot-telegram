export interface ICheckinRepository {
    checkExistCheckinOnDate: (staffId: string) => Promise<boolean>
    insertCheckin: (staffId: string,workShiftId:string, checkinTime: string,durationWorkHour:number) => Promise<number>
}