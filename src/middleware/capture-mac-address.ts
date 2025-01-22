// import { Request, Response } from "express";
// import arp from "node-arp";
import http from "http"
const arp = require("node-arp")

export const captureMacMiddleware = async (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    let userIp = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "";

    // Chuyển IPv6 về IPv4 nếu cần
    if (typeof userIp === "string" && userIp.startsWith("::ffff:")) {
        userIp = userIp.split(":").pop() || userIp;
    }

    console.log(`User IP: ${userIp}`);

    // Lấy địa chỉ MAC
    arp.getMAC(userIp, (err: Error | null, mac: string | null) => {
        if (err) {
            console.error(`Unable to get MAC address for IP ${userIp}:`, err);
            res.statusCode = 500;
            res.end("Unable to get MAC address.");
            return;
        }

        if (mac) {
            console.log(`MAC Address for IP ${userIp}: ${mac}`);
            // Lưu địa chỉ MAC vào `req` để các middleware khác sử dụng
            (req as any).macAddress = mac;
            (req as any).ipAddress = userIp;    
        } else {
            console.error(`MAC address not found for IP ${userIp}`);
            res.statusCode = 500;
            res.end("MAC address not found.");
            return;
        }

        // Chuyển sang middleware hoặc route tiếp theo
        next();
    });
};