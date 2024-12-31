// src/middleware/validateMacMiddleware.ts
import http from "http"
import { getAllMacAddress } from "../services/common/device-infor"

const arp = require("node-arp")
export const validateMacMiddleware = async (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    let userIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""

    // Chuyển IPv6 về IPv4 nếu cần
    if (typeof userIp === "string" && userIp.startsWith("::ffff:")) {
        userIp = userIp.split(":").pop() || userIp
    }

    console.log(`Địa chỉ IP của thiết bị: ${userIp}`)

    try {
        const validMacs = await getAllMacAddress()

        console.log("Danh sách địa chỉ MAC hợp lệ:", validMacs)
        console.log(`Danh sách hợp lệ: ${validMacs.map(v => v.mac_address).join(", ")}`)
        const listValidMacs = validMacs.map(v => v.mac_address).join(", ")

        arp.getMAC(userIp, (err: any, mac: string) => {
            if (err) {
                console.error(`Không thể lấy địa chỉ MAC cho IP ${userIp}:`, err)
                res.statusCode = 500
                res.end("Không thể xác thực thiết bị.")
                return
            }

            console.log(`Địa chỉ MAC của IP ${userIp}: ${mac}`)
            if (!listValidMacs.includes(mac.toLowerCase())) {
                console.log("Địa chỉ MAC không hợp lệ!")
                res.statusCode = 403
                res.end("Thiết bị không được phép truy cập.")
                return
            }
            console.log("Địa chỉ MAC hợp lệ!")
            next()
        })
    } catch (err) {
        console.error("Error validating MAC address:", err)
        res.statusCode = 500
        res.end("Có lỗi xảy ra khi xác thực thiết bị.")
    }
}
