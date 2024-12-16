global.encoder = new TextEncoder();
global.decoder = new TextDecoder();

import { networkInterfaces } from 'os';
function getIPAddress() {
    const interfaces = networkInterfaces();
    for (let devName in interfaces) {
      let iface = interfaces[devName];
  
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal){
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}

const prodIps = [];
global.env = prodIps.includes(getIPAddress()) ? 'prod' : 'dev';

const encoder = new TextEncoder();
global.encodeAtPosition = (string, u8array, position) => {
	return encoder.encodeInto(
		string,
		position ? u8array.subarray(position | 0) : u8array,
	);
}

global.decodeText = (u8array, startPos=0, endPos=Infinity) => {
	return decoder.decode(u8array).slice(startPos, endPos);
}