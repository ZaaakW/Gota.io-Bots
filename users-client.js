// ==UserScript==
// @name         Gota io Bots
// @version      0.4
// @description  Gota io bots with key bindings for split and eject actions
// @match        *://gota.io/web*
// @author       Muaric
// @grant        none
// ==/UserScript==

(function(window) {
    'use strict';

    const ws = new WebSocket("localhost");
    ws.binaryType = "arraybuffer";

    ws.onopen = () => {
        console.log("Connected to local bot server");
    };

    ws.onmessage = (message) => {
        var dataView = new DataView(message.data);
        var tag = dataView.getUint8(0);
        dataView.offset = 1;
        switch (tag) {
            case 0: {
                let captcha_token = "";
                while(true) {
                    var charCode = dataView.getUint8(dataView.offset);
                    dataView.offset++;
                    if (charCode == 0) {
                        break;
                    }
                    captcha_token += String.fromCharCode(charCode);
                }
                console.log(`parsed token: ${captcha_token}`);
                break;
            }
        }
    };

    function executeCaptcha() {
        if (window.grecaptcha && typeof window.grecaptcha.execute === 'function') {
            window.grecaptcha.execute("6LcycFwUAAAAANrun52k-J1_eNnF9zeLvgfJZSY3", {action: 'login'}).then(token => {
                var arr = new ArrayBuffer(1 + (token.length + 1));
                var dataView = new DataView(arr);
                dataView.setUint8(0, 0);
                SocketUtilities.writeString(1, dataView, token);
                sendData(arr);
            }).catch(err => {
                console.error("Error executing reCAPTCHA:", err);
            });
        } else {
            console.warn("reCAPTCHA not initialized or execute method not available.");
        }
    }

    setTimeout(() => {
        setInterval(executeCaptcha, 6000);
    }, 3000);

    function sendData(data) {
        if(ws && ws.readyState == WebSocket.OPEN){
            ws.send(data);
        }
    }

    class GotaService {
        static getVersion() {
            return "3.6.1";
        }
    }

    class SocketUtilities {
        static normalizeBuffer(buf) {
            buf = new Uint8Array(buf);
            let newBuf = new DataView(new ArrayBuffer(buf.byteLength));
            for(let i = 0; i < buf.byteLength; i++) {
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

    function performSplit() {
        sendData(Packets.createSplitPacket());
    }

    function performEject() {
        sendData(Packets.createEjectPacket());
    }

    // Add event listeners for key bindings
    document.addEventListener('keydown', (event) => {
        if (event.key === 's') { // Press 's' for split
            performSplit();
        } else if (event.key === 'e') { // Press 'e' for eject
            performEject();
        }
    });

})(window);
