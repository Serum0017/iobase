import shared from './shared.js';
const {inputNameToNumber} = shared;

window.mouse = {x: 0, y: 0};

window.mouseDownFunctions = [];
window.mouseMoveFunctions = [];
window.mouseUpFunctions = [];

const Controls = {
    KeyW: 'up',
    KeyS: 'down',
    KeyA: 'left',
    KeyD: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ShiftLeft: 'shift',
    ShiftRight: 'shift',
};

window.input = {};
for(let key in inputNameToNumber){
    window.input[key] = false;
}

let chatOpen = false;
let uiHidden = false;

const chat = document.querySelector('.chat');
const chatDiv = document.querySelector('.chatDiv');
const visChatDiv = document.querySelector('.chat-div');
const lbDiv = document.querySelector('.leaderboard-div');

const inputBuf = new Uint8Array(2);

let inMenu = true;
window.onkeyup = window.onkeydown = (e) => {
    if(inMenu === true){
        if(e.type === 'keydown' && e.code === 'Enter'){
            const name = document.querySelector('.nameInput').value;
            const buf = new Uint8Array(name.length + 1);
            encodeAtPosition(name, buf, 1);
            send(buf);
            inMenu = false;
            return e.preventDefault();
        }
        return;
    }
    if(chatOpen === true){
        if(e.type === 'keydown' && e.code === 'Enter'){
            let msg = chat.value.trim();
            if(msg.length !== 0){
                const buf = new Uint8Array(msg.length + 1);
                buf[0] = 3;
                encodeAtPosition(msg, buf, 1);
                send(buf);
            }
            chat.value = '';
            chat.blur();
            chatDiv.classList.add('hidden');
            chatOpen = false;
        }
    } else {
        if (e.repeat === true) return e.preventDefault();

        if(e.type === 'keydown'){
            if(e.code === 'Enter'){
                chatOpen = true;
                chatDiv.classList.remove('hidden');
                chat.focus();
            } else if (e.code === 'KeyZ') {
                if (uiHidden === false) {
                    chat.blur();
                    if (!visChatDiv.classList.contains('hideChat')) {
                        visChatDiv.classList.add('hideChat');
                    }
                    if (!lbDiv.classList.contains('hideLB')) {
                        lbDiv.classList.add('hideLB');
                    }
                } else {
                    if (visChatDiv.classList.contains('hideChat')) {
                        visChatDiv.classList.remove('hideChat');
                        visChatDiv.scrollTop = visChatDiv.scrollHeight;
                    }
                    if (lbDiv.classList.contains('hideLB')) {
                        lbDiv.classList.remove('hideLB');
                    }
                }
                uiHidden = !uiHidden;
            }
        }

        if (Controls[e.code] != undefined) {
            const name = Controls[e.code];
            const state = e.type === 'keydown';
            window.input[name] = state;

            inputBuf[0] = state === true ? 1 : 2;
            inputBuf[1] = inputNameToNumber[name];
            send(inputBuf);

            return e.preventDefault();
        }
    }
}

window.onmousedown = (e) => {
    for(let i = 0; i < window.mouseDownFunctions.length; i++){
        window.mouseDownFunctions[i](e);
    }
};

window.onmousemove = (e) => {
    const bounds = canvas.getBoundingClientRect();
    window.mouse.x = (e.x - bounds.x) / bounds.width * canvas.w;
    window.mouse.y = (e.y - bounds.y) / bounds.height * canvas.h;

    for(let i = 0; i < window.mouseMoveFunctions.length; i++){
        window.mouseMoveFunctions[i](e);
    }
}

window.onmouseup = () => {
    for(let i = 0; i < window.mouseUpFunctions.length; i++){
        window.mouseUpFunctions[i](e);
    }
};

window.oncontextmenu = (e) => { return e.preventDefault(); };

window.ontouchstart = (e) => {
    const t = e.changedTouches[0];
    if(t === undefined) return;
    window.onmousedown({x: t.pageX, y: t.pageY, ...t});
}
window.ontouchmove = (e) => {
    const t = e.changedTouches[0];
    if(t === undefined) return;
    window.onmousemove({x: t.pageX, y: t.pageY, ...t});
}
window.ontouchend = (t) => {
    window.onmouseup({x: t.pageX, y: t.pageY, ...t});
}