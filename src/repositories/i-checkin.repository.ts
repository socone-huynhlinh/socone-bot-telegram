export interface ICheckinRepository {
    checkExistCheckinOnDate: (staffId: string) => Promise<boolean>
    insertCheckin: (staffId: string,workShiftId:string,durationWorkHour:number) => Promise<number>
}