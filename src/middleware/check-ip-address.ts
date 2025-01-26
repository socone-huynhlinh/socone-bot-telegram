import http from "http"
import { getAllMacAddress } from "../services/common/device-infor"

const arp = require("node-arp")
export const validateMacMiddleware = async (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    let userIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""

    // Chuyển IPv6 về IPv4 nếu cần
    if (typeof userIp === "string" && userIp.startsWith("::ffff:")) {
        userIp = userIp.split(":").pop() || userIp
    }

    try {
        const validMacs = await getAllMacAddress()
        const listValidMacs = validMacs.map(v => v.mac_address).join(", ")

        arp.getMAC(userIp, (err: any, mac: string) => {
            if (err) {
                console.error(`Không thể lấy địa chỉ MAC cho IP ${userIp}:`, err)
                res.statusCode = 500
                res.end("Không thể xác thực thiết bị.")
                return
            }

            if (!listValidMacs.includes(mac.toLowerCase())) {
                res.statusCode = 403
                res.end("Thiết bị không được phép truy cập.")
                return
            }
            next()
        })
    } catch (err) {
        console.error("Error validating MAC address:", err)
        res.statusCode = 500
        res.end("Có lỗi xảy ra khi xác thực thiết bị.")
    }
}