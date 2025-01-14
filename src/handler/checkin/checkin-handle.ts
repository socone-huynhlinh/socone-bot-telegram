import { console } from "inspector";
import { CheckInService } from "../../services/impl/checkin.service";
import { Request, Response } from 'express';

export default class CheckInHandler{
    private checkInService: CheckInService;
    constructor(){
        this.checkInService = new CheckInService();
    }
    async handleCheckInMain(req: Request, res: Response) : Promise<void>{
        try{
            const staff = req.body.staff;
            res.status(200).json({message:staff});
        }catch(err: any){
            res.status(500).json({message: (err as Error).message});
            res.status(500).json({message: err.message});
        }
    }
}