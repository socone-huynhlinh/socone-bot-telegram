import TelegramBot, { Message, CallbackQuery } from "node-telegram-bot-api";
import { Request, Response } from 'express';
import { CheckInService } from '../../services/impl/checkin.service';
import { sessionDay } from "../../utils/session-day";

export default class CheckInHandler{
    private checkInService: CheckInService;
    private bot: TelegramBot;

    constructor(bot: TelegramBot){
        this.checkInService = new CheckInService();
        this.bot = bot;
    }
    handleCheckInMain = async (req: Request, res: Response): Promise<void> =>{
        try{
            const shiftId = req.query.shiftId as string;
            const staff = req.body.staff;
            const { session } = sessionDay();
            if(staff){                
                const result=await this.checkInService.insertCheckin(staff.id,shiftId,8);

                if(result){
                    this.bot.sendMessage(
                        staff.tele_account?.id, 
                        `<b>${staff.tele_account.username} - #${staff.position}</b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n\n<b>Have a nice day ☀️</b>`,
                        { parse_mode: "HTML" }
                    );
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
            else {
                this.bot.sendMessage(
                    staff.tele_account?.id, 
                    `<b>Check-in failed!</b>`,
                    { parse_mode: "HTML" }
                );
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