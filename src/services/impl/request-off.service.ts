import WorkOffDay from "../../models/work-off-day";
import { RequestOffRepository } from "../../repositories/impl/request-off.repository";
import { IRequestOffService } from "../i-request-off.service";

export class RequestOffService implements IRequestOffService{
    private requestOffRepository: RequestOffRepository;
    constructor(){
        this.requestOffRepository = new RequestOffRepository();
    }
    async insertRequestOff(workOffDay: WorkOffDay): Promise<string | null> {
        return await this.requestOffRepository.insertRequestOff(workOffDay)
    }

}