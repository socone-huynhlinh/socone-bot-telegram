import os from "os"

function getLocalIp() {
    // const networkInterfaces = os.networkInterfaces();
    // for (const interfaceName in networkInterfaces) {
    //   for (const iface of networkInterfaces[interfaceName] || []) {
    //     if (iface.family === 'IPv4' && !iface.internal) {
    //       return iface.address; // Địa chỉ IPv4 không phải localhost
    //     }
    //   }
    // }
    // return '127.0.0.1'; // Mặc định trả về localhost nếu không tìm thấy
    return process.env.VPS_IP
}

export default getLocalIp
