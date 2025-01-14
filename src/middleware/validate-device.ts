import { Request, Response, NextFunction } from "express";
import arp from "node-arp";
import StaffService from "../services/impl/staff.service";
import Staff from "../models/staff";

export const validateDeviceMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    let userIp = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "";
    const staffService = new StaffService();
    // Chuyển IPv6 về IPv4 nếu cần
    if (userIp.startsWith("::ffff:")) {
        userIp = userIp.split(":").pop() || userIp;
    }

    console.log(`User IP: ${userIp}`);

    // Lấy địa chỉ MAC
    arp.getMAC(userIp,async (err: Error | null, mac: string | null) => {
        if (err) {
            console.error(`Unable to get MAC address for IP ${userIp}:`, err);
            return res.status(500).send("Unable to get MAC address.");
        }

        if (mac) {
            console.log(`MAC Address for IP ${userIp}: ${mac}`);
            // Lưu địa chỉ MAC vào `req` để các middleware khác sử dụng
            const staff: Staff | null = await staffService.findStaffByMacAddress(mac);
            if(staff){
                req.body.ipAddress = userIp;
                req.body.staff = staff;
            }
            else{
                return res.status(500).send("Staff not found.");
            }
           
        } else {
            console.error(`MAC address not found for IP ${userIp}`);
            return res.status(500).send("MAC address not found.");
        }
        // Lưu địa chỉ MAC vào `req` để các middleware khác sử dụng
        req.body.macAddress = mac;

        // Chuyển sang middleware hoặc route tiếp theo
        next();
    });
};
