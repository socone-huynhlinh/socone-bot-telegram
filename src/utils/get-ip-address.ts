import os from "os"

function getLocalIp() {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
      for (const iface of networkInterfaces[interfaceName] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address; 
        }
      }
    }
    return '127.0.0.1';
}

export default getLocalIp
