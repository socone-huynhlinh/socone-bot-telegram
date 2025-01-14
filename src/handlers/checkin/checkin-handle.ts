import { Request, Response } from 'express';
import { CheckInService } from '../../services/impl/checkin.service';

export default class CheckInHandler{
    private checkInService: CheckInService;
    constructor(){
        this.checkInService = new CheckInService();
    }
    handleCheckInMain = async (req: Request, res: Response): Promise<void> =>{
        try{
            const shiftId = req.query.shiftId as string;
            const staff = req.body.staff;
            if(staff){
                const result=await this.checkInService.insertCheckin(staff.id,shiftId,8);
                if(result){
                    res.send(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Registration Success</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    margin-top: 50px;
                                }
                                h1 {
                                    color: #4CAF50;
                                }
                                p {
                                    font-size: 18px;
                                    color: #555;
                                }
                            </style>
                        </head>
                        <body>
                            <h1>CheckIn Successfully!</h1>
                            <p>${staff.full_name} checkin successfully</p>
                        </body>
                        </html>
                    `);
                    return
                }
            }
           
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Registration Failed</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        h1 {
                            color: #EF0000FF;
                        }
                        p {
                            font-size: 18px;
                            color: #555;
                        }
                    </style>
                </head>
                <body>
                    <h1>CheckIn Failed!</h1>
                </body>
                </html>
            `);
        }catch(err: any){
            console.error("Error when checkin:", err);
            res.status(500).json({message: (err as Error).message});
        }
    }
    handleCheckInSpecial = async (req: Request, res: Response): Promise<void> =>{
        try{
            const shiftId = req.query.shiftId as string;
            const workHour= req.query.workHour as string;
            const staff = req.body.staff;
            if(staff){
                const result=await this.checkInService.insertCheckin(staff.id,shiftId,parseInt(workHour));
                if(result){
                    res.send(`
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Registration Success</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    text-align: center;
                                    margin-top: 50px;
                                }
                                h1 {
                                    color: #4CAF50;
                                }
                                p {
                                    font-size: 18px;
                                    color: #555;
                                }
                            </style>
                        </head>
                        <body>
                            <h1>CheckIn Successfully!</h1>
                            <p>${staff.full_name} checkin successfully work for ${workHour} hour</p>
                        </body>
                        </html>
                    `);
                    return
                }
            }
            res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Registration Failed</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            text-align: center;
                            margin-top: 50px;
                        }
                        h1 {
                            color: #EF0000FF;
                        }
                        p {
                            font-size: 18px;
                            color: #555;
                        }
                    </style>
                </head>
                <body>
                    <h1>CheckIn Failed!</h1>
                </body>
                </html>
            `);
        }
        catch(err: any){
            console.error("Error when checkin:", err);
            res.status(500).json({message: (err as Error).message});
        }
    }
}