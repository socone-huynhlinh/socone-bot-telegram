import http from "http"
import bot from "../../telegram-bot"
import { sessionDay } from "../../../utils/session-day"
import { insertCheckin } from "../../../services/common/valid-checkin"
import { getStaffByChatId, getStaffPendingByChatId } from "../../../services/staff/staff-service"
import Staff, { mapStaffFromJson } from "../../../models/staff"
import redisClient from "../../../config/redis-client"
import { addStaff } from "../../../services/admin/staff-manage"
import { deleteUserSession } from "../../../config/user-session"
import { handleReportCheckin } from "../checkin/checkin"
import { deleteUserData } from "../../../config/user-data"

export const handleCheckinRequest = async (chatId: number, userName: string, action: string, shiftId: string,res: http.ServerResponse) => {
    // Xử lý logic Check-in ở đây
    try {
        const { session, lateFormatted, lateTime } = sessionDay();

        const lateMessage = lateTime > 0 ? `Late: ${lateFormatted}` : '';

        if (action.split("_")[0] === "checkin" && action.split("_")[1] === "main") {

            console.log("0: ", chatId);

            // const account: TelegramAccount | null = await getAccountById(chatId)
            const staff: Staff | null = await getStaffByChatId(chatId.toString())
            const jsonStaff = mapStaffFromJson(staff);

            if (jsonStaff?.id) {
                await insertCheckin(jsonStaff.id, shiftId, 8);
                console.log("Telegram Account: ", jsonStaff.tele_account?.username);
            } else {
                console.log("Không tìm thấy tài khoản.")
            }

            if (lateMessage === '') {
                bot.sendMessage(
                    chatId,
                    `<b>${jsonStaff.tele_account?.username} </b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n\n<b>Thanks for always being on time, have a nice day ☀️</b>`,
                    { parse_mode: "HTML" }
                )
            }
            else {
                bot.sendMessage(
                    chatId,
                    `<b>${jsonStaff.tele_account?.username} </b>\nMain shift - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Mode: Office\n- ${lateMessage}\n\n<b>Have a nice day ☀️</b>`,
                    { parse_mode: "HTML" }
                )
            }
        }
        else if (action.split("_")[0] === "checkin" && action.split("_")[1] === "special") {
            console.log("0: ", chatId);

            // const account: TelegramAccount | null = await getAccountById(chatId)
            const staff: Staff | null = await getStaffByChatId(chatId.toString())
            const jsonStaff = mapStaffFromJson(staff);

            const typeDisplay = {
                ot: "OT",
                "time in lieu": "Time in lieu",
                main: "Main shift special"
            }[decodeURIComponent(action.split("_")[2])] || "Không xác định";

            const duration = action.split("_")[3];

            console.log("Type Display: ", typeDisplay);

            if (staff?.id) {
                await insertCheckin(staff.id, shiftId, parseInt(duration));
            } else {
                console.log("Không tìm thấy tài khoản.")
            }

            bot.sendMessage(
                chatId,
                `<b>${jsonStaff.tele_account?.username} </b>\n${typeDisplay} - ${new Date().toLocaleDateString('vi-VN')}\n- Check: ${session}\n- Hours: ${action.split("_")[3]} hours\n- Mode: Office\n\n<b>Have a nice work ☀️</b>`,
                { parse_mode: "HTML" }
            )
        }

        await handleReportCheckin(bot, chatId, userName, shiftId);
        deleteUserData(chatId);

        res.statusCode = 200
        res.setHeader("Content-Type", "text/plain; charset=utf-8")
        res.end(`Check-in thành công cho người dùng ${userName} (Chat ID: ${chatId})`)
        // res.end(`
        //     "Check-in thành công cho người dùng ${userName} (Chat ID: ${chatId})"
        // `);
    } catch (error) {
        res.statusCode = 500
        res.end(`Đã xảy ra lỗi: ${error}`)
        // res.end(`
        //     <!DOCTYPE html>
        //     <html lang="en">
        //     <head>
        //         <meta charset="UTF-8">
        //         <meta name="viewport" content="width=device-width, initial-scale=1.0">
        //         <title>Registration Failed</title>
        //         <style>
        //             body {
        //                 font-family: Arial, sans-serif;
        //                 text-align: center;
        //                 margin-top: 50px;
        //             }
        //             h1 {
        //                 color: #EF0000FF;
        //             }
        //             p {
        //                 font-size: 18px;
        //                 color: #555;
        //             }
        //         </style>
        //     </head>
        //     <body>
        //         <h1>Checkin Failed!</h1>
        //         <p>${error}</p>
        //     </body>
        //     </html>
        // `);
        return;
    }
}

export const handleGetMacRequest = async (chatId: number, res: http.ServerResponse, req: http.IncomingMessage) => {
    if (!chatId) {
        res.statusCode = 400
        res.end("Thiếu tham số cần thiết.")
        return
    }

    const macAddress = (req as any).macAddress;
    const ipAddress = (req as any).ipAddress;

    if (!macAddress) {
        res.statusCode = 500;
        res.end("MAC address is missing.");
        return;
    }

    console.log(`Handling MAC address for chatId: ${chatId}`);
    console.log(`MAC Address: ${macAddress}`);
    console.log(`IP Address: ${ipAddress}`);

    try {
        const userData = await redisClient.get(`user:${chatId}`);
        console.log("Test: ", userData);

        if (!userData) {
            res.statusCode = 500;
            res.end("<h1>Error</h1><p>User not found.</p>");
            return;
        }
        const user = JSON.parse(userData);

        const newStaff: Staff = {
            tele_account: {
                id: chatId.toString(),
                username: user['userName'],
                phone: user['phone'],
            },
            company_email: user['email'],
            department: {
                id: user['departmentId'],
            },
            full_name: user['fullName'],
            device: {
                ip_adress: ipAddress,
                mac_address: macAddress,
            },
            position: user['position'],
        };

        const id = await addStaff(newStaff);
        const staffSend = mapStaffFromJson(await getStaffPendingByChatId(chatId.toString()));

        if (id) {
            // Gửi thông báo cho User
            await bot.sendMessage(
                chatId,
                `Your registration request has been sent successfully. Please wait for the admin to approve.`,
            );

            const idAdmin = process.env.ID_GROUP_OFF || "";

            // Gửi thông báo cho Admin
            await bot.sendMessage(
                idAdmin, 
                `<b>Register request from</b>: ${user['userName']}\n<b> - Company:</b> ${user['companyName']}\n<b> - Branch:</b> ${staffSend.department?.branch?.name}\n<b> - Department:</b> ${staffSend.department?.name}\n<b> - Email:</b> ${user['email']}\n<b> - Full name:</b> ${user['fullName']}\n<b> - Phone:</b> ${user['phone']}\n<b> - Position:</b> ${user['position']}
                `,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                { text: "Approve ✅", callback_data: `register_approve_${chatId}` },
                                { text: "Reject ❌", callback_data: `register_reject_${chatId}` }
                            ]
                        ]
                    },
                    parse_mode: "HTML",
                }
            );
            await redisClient.del(`user:${chatId}`);
            await deleteUserSession(chatId);
            res.end(`
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
            return;
        } else {
            // Xóa dữ liệu người dùng khỏi Redis nếu thất bại
            await redisClient.del(`user:${chatId}`);
            await deleteUserSession(chatId);
            res.end(`
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
            return;
        }
    } catch (error) {
        await deleteUserSession(chatId);
        res.end(`
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
                <p>${error}</p>
            </body>
            </html>
        `);
        return;
    }
    // res.statusCode = 200;
    // res.end(`MAC Address ${macAddress} registered successfully for chatId ${chatId}.`);
}
