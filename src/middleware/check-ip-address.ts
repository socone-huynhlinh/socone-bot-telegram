import http from "http"
import { getAllMacAddress } from "../services/common/device-infor"
import * as arp from "node-arp"
import util from "util"

const getMACAsync = util.promisify(arp.getMAC)

export const validateMacMiddleware = async (req: http.IncomingMessage, res: http.ServerResponse, next: () => void) => {
    let userIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || ""

    // Chuyển IPv6 về IPv4 nếu cần
    if (typeof userIp === "string" && userIp.startsWith("::ffff:")) {
        userIp = userIp.split(":").pop() || userIp
    }

    console.log(`Địa chỉ IP của thiết bị: ${userIp}`)

    try {
        const validMacs = (await getAllMacAddress()).map((mac) => (mac.mac_address || "").toLowerCase())

        console.log("Danh sách địa chỉ MAC hợp lệ:", validMacs)

        // Lấy địa chỉ MAC tương ứng
        const mac = await getMACAsync(userIp)

        if (!mac || typeof mac !== "string") {
            console.error(`Địa chỉ MAC không hợp lệ hoặc không lấy được: ${mac}`)
            res.statusCode = 500
            res.end("Không thể xác thực thiết bị.")
            return
        }

        console.log(`Địa chỉ MAC của IP ${userIp}: ${mac}`)

        // Kiểm tra tính hợp lệ của địa chỉ MAC
        if (!validMacs.includes(mac.toLowerCase())) {
            console.log("Địa chỉ MAC không hợp lệ!")
            res.statusCode = 403
            res.end("Thiết bị không được phép truy cập.")
            return
        }

        console.log("Địa chỉ MAC hợp lệ!")
        next()
    } catch (err) {
        console.error("Error validating MAC address:", err)
        res.statusCode = 500
        res.end("Có lỗi xảy ra khi xác thực thiết bị.")
    }
}
