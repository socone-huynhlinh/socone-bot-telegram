import { CheckInRepository } from "../../repositories/impl/checkin.repository";
import { ICheckInService } from "../i-checkin.service";

export class CheckInService implements ICheckInService{
    private checkinRepository: CheckInRepository
    constructor() {
        this.checkinRepository = new CheckInRepository()
    }
    checkExistCheckinOnDate = async (staffId: string) => {
        return await this.checkinRepository.checkExistCheckinOnDate(staffId)
    }
}