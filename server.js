const WebSocket = require("ws");
const SocksProxyAgent = require('socks-proxy-agent').SocksProxyAgent;
const fs = require("fs");

class GotaService {
    static getVersion() {
        return "3.6.1";
    }
}

class SocketUtilities {
    static normalizeBuffer(buf) {
        buf = new Uint8Array(buf);
        let newBuf = new DataView(new ArrayBuffer(buf.byteLength));
        for (let i = 0; i < buf.byteLength; i++) {
            newBuf.setUint8(i, buf[i]);
        }
        return newBuf;
    }

    static writeString(index, dataView, string) {
        for (var i = 0; i < string.length; i++) {
            dataView.setUint8(index, string.charCodeAt(i));
            index++;
        }
        dataView.setUint8(index, 0);
    }

    static writeString16(index, dataView, string) {
        for (var i = 0; i < string.length; i++) {
            dataView.setUint16(index, string.charCodeAt(i), true);
            index += 2;
        }
        dataView.setUint16(index, 0, true);
    }
}

class Packets {
    static serializeCaptcha(token) {
        var arr = new ArrayBuffer(1 + (token.length + 1));
        var dataView = new DataView(arr);
        dataView.setUint8(0, 100);
        SocketUtilities.writeString(1, dataView, token);
        return arr;
    }

    static serializeNamePacket(name) {
        var arr = new ArrayBuffer(2 + (name.length + 1) * 2);
        var dataView = new DataView(arr);
        dataView.setUint8(0, 0);
        SocketUtilities.writeString16(1, dataView, name);
        return arr;
    }

    static createConnectionPacket() {
        var str = "Gota Web " + GotaService.getVersion();
        var strArrBuff = new ArrayBuffer(1 + str.length + 1 + 1);
        var dataView = new DataView(strArrBuff);
        dataView.setUint8(0, 255);
        dataView.setUint8(1, 6);
        SocketUtilities.writeString(2, dataView, str);
        return strArrBuff;
    }

    static createPingPacket() {
        var arr = new ArrayBuffer(1);
        var buff = new DataView(arr);
        buff.setUint8(0, 71);
        return arr;
    }

    static createOptionsPacket() {
        var arr = new ArrayBuffer(3);
        var buff = new DataView(arr);
        buff.setUint8(0, 104);
        buff.setUint16(1, 100, true);
        return arr;
    }
    
    static createSplitPacket() {
        var arr = new ArrayBuffer(1);
        var buff = new DataView(arr);
        buff.setUint8(0, 17); // Kode split
        return arr;
    }
    static createEjectPacket() {
        var arr = new ArrayBuffer(1);
        var buff = new DataView(arr);
        buff.setUint8(0, 21); // Kode eject
        return arr;
    }
}

const gotaServer = "wss://212-245-254-51-ip.gota.io:1501";
const proxies = fs.readFileSync("proxy.txt", "utf-8").split("\n");
const Server = new WebSocket.Server({
    port: 1337
});

let tokens = [];
let botCount = 0;

function getRandomProxy() {
    return "http://" + proxies[~~(proxies.length * Math.random())];
}

class Bot {
    connect(proxy) {
        this.ws = new WebSocket(gotaServer, {
            agent: new SocksProxyAgent(proxy)
        });
        this.ws.binaryType = "arraybuffer";
        this.ws.onopen = this.open.bind(this);
        this.ws.onclose = this.disconnect.bind(this);
        this.ws.onerror = this.disconnect.bind(this);
        this.wasOpened = false;
    }

    disconnect(data) {
        this.ws = null;
        if (this.wasOpened) {
            console.error("You have been disconnected from the server. Reason: " + (data.reason === "" || !data.reason ? data.code : data.reason));
        }
    }

    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }

    sendPacket(packet) {
        if (this.isConnected()) {
            this.ws.send(packet);
        }
    }

    yupiuou_yupiyey(index, dataView, string) {
        for (var i = 0; i < string.length; i++) {
            dataView.setUint16(index, string.charCodeAt(i), true);
            index += 2;
        }
        dataView.setUint16(index, 0, true);
    }

    sendChatMessage() {
        var message = "[DEBUG] test message";
        var arr = new ArrayBuffer(2 + (message.length + 1) * 2);
        var dataView = new DataView(arr);
        dataView.setUint8(0, 72);
        dataView.setUint8(1, 0);
        this.yupiuou_yupiyey(2, dataView, message);
        this.sendPacket(arr);
    }

    open() {
        if (tokens.length <= 0) {
            this.ws.close();
        }
        const token = tokens.pop();
        if (!token || token == 'undefined' || token === 'undefined' || typeof token === 'undefined') {
            this.ws.close();
        }
        this.wasOpened = true;
        try {
            this.sendPacket(Packets.createConnectionPacket());
            this.sendPacket(Packets.createPingPacket());
            this.sendPacket(Packets.createOptionsPacket());
            this.sendPacket(Packets.serializeNamePacket("yeah"));
            this.sendPacket(Packets.serializeCaptcha(token));
            this.sendPacket(Packets.serializeNamePacket("yeah"));
            setInterval(() => {
                this.sendPacket(Packets.createPingPacket());
            }, 3e4);
            setInterval(() => {
                this.sendPacket(Packets.createSplitPacket());
            }, 15000); // Split every 15 seconds
            setInterval(() => {
                this.sendPacket(Packets.createEjectPacket());
            }, 10000); // Eject every 10 seconds
            botCount++;
        } catch (e) {
            this.ws.close();
        }
    }
}

setInterval(() => {
    console.clear();
    console.log(`server: ${gotaServer}, bot connected: ${botCount}, token count: ${tokens.length}`);
}, 25000);

setInterval(() => {
    if (tokens.length > 0) {
        new Bot().connect(getRandomProxy());
    }
}, 7000);

Server.on("connection", client => {
    console.log("client connected!");

    client.on("message", msg => {
        const token = msg.toString().trim();
        if (token && token !== 'undefined') {
            tokens.push(token);
            tokens = tokens.filter(elm => elm);
        }
    });
});
