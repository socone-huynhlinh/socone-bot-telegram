import { Router, Request, Response } from "express";
import { createClient } from "redis";
import StaffService from "../services/impl/staff.service";
import Staff from "../models/staff";
// import Router as router from "./router"; // Removed incorrect import statement

const redisClient = createClient();
redisClient.connect(); // Kết nối Redis
const router = Router(); // Ensure router is declared correctly
const staffService = new StaffService();

router.get("/", async (req: Request, res: Response): Promise<void> => {
    const { chatId } = req.query;

    if (!chatId) {
        res.status(400).send("<h1>Error</h1><p>Missing chat ID.</p>");
        return;
    }

    try {
        const userData = await redisClient.get(`user:${chatId}`);
        if (!userData) {
            res.status(404).send("<h1>Error</h1><p>User not found.</p>");
            return;
        }

        console.log(`User data for Chat ID ${chatId}:`, JSON.parse(userData));
        const user = JSON.parse(userData);

        const newStaff: Staff = {
            tele_account: {
                id: user['tele_id'],
                username: user['username'],
                phone: user['phone'],
            },
            company_email: user['email'],
            department: {
                id: user['departmentId'],
            },
            full_name: user['full_name'],
            device: {
                ip_adress: req.body.ipAddress,
                mac_address: req.body.macAddress,
            },
            position: user['position'],
        };

        const id = await staffService.addStaff(newStaff);

        if (id) {
            await redisClient.del(`user:${chatId}`);
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
                    <h1>Registration Successful!</h1>
                    <p>Your device has been successfully registered.</p>
                </body>
                </html>
            `);
        } else {
            // Xóa dữ liệu người dùng khỏi Redis nếu thất bại
            await redisClient.del(`user:${chatId}`);
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
                    <h1>Registration Failed!</h1>
                </body>
                </html>
            `);
        }
    } catch (error) {
        console.error("Error during registration:", error);
        res.status(500).send("<h1>Error</h1><p>Internal Server Error.</p>");
    }
});

export default router;
