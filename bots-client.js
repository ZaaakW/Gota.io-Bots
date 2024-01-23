// ==UserScript==
// @name         Gota io Bots
// @version      0.1
// @description  gota io bots with the mouse follow (outdated version script)
// @author       Muaric
// @grant        none
// @match https://gota.io/web/
// ==/UserScript==

(function(window) {
    'use strict';
    
    const ws = new WebSocket("ws://127.0.0.1:1337");
    ws.binaryType = "arraybuffer";
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
    setTimeout(() => {
        setInterval(() => {
            window.grecaptcha.execute("6LcycFwUAAAAANrun52k-J1_eNnF9zeLvgfJZSY3", {action: `login`}).then(token => {
                var arr = new ArrayBuffer(1 + (token.length + 1));
                var dataView = new DataView(arr);
                dataView.setUint8(0, 0);
                SocketUtilities.writeString(1, dataView, token);
                sendData(arr);
            });
        }, 6000);
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
                newBuf.setUint8(i, buf[i])
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
            ;
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
    }


})(window);
