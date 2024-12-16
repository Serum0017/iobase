import shared from './shared.js';
const { playerUpdatePackLen } = shared;
import './msgpackr.js';

const messageMap = [
    // 0 - update
    (data) => {
        const f32 = new Float32Array(data.buffer);
        for(let i = 1; i < f32.length; i += playerUpdatePackLen){
            const p = window.players[f32[i]];
            p.pos.x = f32[i+1];
            p.pos.y = f32[i+2];
        }
    },
    // 1 - init
    (data) => {
        let [players, dimensions, selfId] = msgpackr.unpack(data);

        console.log(players, dimensions, selfId);
        window.resetGame();

        for(let i = 0; i < players.length; i++){
            if(players[i] === undefined || players[i] === null) window.players[i] = undefined;
            else window.players[i] = createPlayerFromData(players[i]);
        }

        window.selfId = selfId;

        window.mapDimensions = dimensions;

        if(!gameStarted) {
            window.startGame();
            gameStarted = true;
        }
    },
    // 2 - reload page (for hot refresh)
    () => {
        location.reload();
    },
    // 3 - flag next message as type
    (data) => {
        nextMsgFlag = data[1];
    },
    // 4 - new player
    (data) => {
        let p = createPlayerFromData(msgpackr.unpack(data));
        window.players[p.id] = p;
    },
    // 5 - remove player
    (data) => {
        let id = new Uint16Array(data.buffer)[1];
        window.players[id] = undefined;
    },
    // 6 - chat message
    (data) => {
        window.addChatMessage(
            stringHTMLSafe(decodeText(data, 2)),
            ['normal', 'system', 'dev', 'guest'][data[1]]
        )
    },
    // 7 - init leaderboard
    (data) => {
        data[0] = 222;
        const lb = msgpackr.unpack(data);

        for(let mapName in lb){
            for(let id in lb[mapName]){
                addToLeaderboard(lb[mapName][id], mapName);
            }
        }
    },
    // 8 - add to leaderboard
    (data) => {
        // [8, len, mapName, playerName]
        const len = data[1];
        const mapName = decodeText(data, 2, len+2);
        const playerName = stringHTMLSafe(decodeText(data, len+2));
        addToLeaderboard(playerName, mapName);
    },
    // 9 - remove from leaderboard
    (data) => {
        // [9, len, mapName, playerName]
        const len = data[1];
        const mapName = decodeText(data, 2, len+2);
        const playerName = stringHTMLSafe(decodeText(data, len+2));

        // remove the player from the mapDiv
        document.getElementById(`player-container-${playerName}-${mapName}`).remove();

        // if no more players then remove the mapDiv
        let mapDiv = document.getElementById(`leaderboard-map-${mapName}`);
        if(mapDiv.children.length === 1/*map name*/) mapDiv.remove();
    },
]

function createPlayerFromData(data) {
    data.render = {
        x: data.pos.x,
        y: data.pos.y
    }
    for(let i = 0; i < playerRenderKeys.length; i++){
        const key = playerRenderKeys[i];
        data.render[key] = data[key];
    }
    return data;
}

const HOST = location.origin.replace(/^http/, 'ws');
let ws, nextMsgFlag, gameStarted = false;
window.disconnected = false;
const messageQueue = [];
window.send = (data) => {
    messageQueue.push(data);
}

const leaderboard = document.querySelector('.leaderboard-div');
function initWS() {
    ws = new WebSocket(HOST);
    ws.binaryType = "arraybuffer";

    ws.addEventListener("message", function (data) {
        if(nextMsgFlag !== undefined){
            messageMap[nextMsgFlag](data.data);
            nextMsgFlag = undefined;
            return;
        }
        const decoded = new Uint8Array(data.data);
        messageMap[decoded[0]](decoded);
    });

    ws.onopen = () => {
        console.log('connected to the server!');
        window.send = (data) => {
            ws.send(data);
        }
        for(let i = 0; i < messageQueue.length; i++){
            window.send(messageQueue[i]);
        }
    }

    ws.onclose = () => {
        if(window.username !== null) window.disconnected = true;
        console.log('Websocket closed.');// Attempting to reconnect...
        // TODO: reconnection.
        window.send = () => {};
    }
}
initWS();

function addToLeaderboard(playerName, mapName){
    let mapDiv = document.getElementById(`leaderboard-map-${mapName}`);
    if(mapDiv === null){
        // create mapDiv
        mapDiv = document.createElement('div');
        mapDiv.classList.add("lb-group");
        mapDiv.id = `leaderboard-map-${mapName}`;

        const displayMapName = stringHTMLSafe(mapName);

        const mapNameDiv = document.createElement('span');
        mapDiv.appendChild(mapNameDiv);
        mapNameDiv.classList.add('lb-name');
        mapNameDiv.style.color = /*window.mapColors[mapName] ??*/ '#6cd95b';
        mapNameDiv.innerHTML = displayMapName;

        leaderboard.appendChild(mapDiv);
    }

    // add the player to the mapDiv
    const playerContainer = document.createElement('div');
    playerContainer.id = `player-container-${playerName}-${mapName}`;
    playerContainer.classList.add('lb-players');
    mapDiv.appendChild(playerContainer);

    const playerDiv = document.createElement('div');
    playerContainer.appendChild(playerDiv);

    const playerNameDiv = document.createElement('span');
    playerNameDiv.classList.add('player-name');
    playerNameDiv.innerHTML = playerName;
    playerDiv.appendChild(playerNameDiv);
}

window.addChatMessage = (message, type) => {
    const div = document.createElement('div');
    if (type !== 'system') div.classList.add('chat-message');
    else div.classList.add('system-message');

    const chatPrefixMap = {
        normal: '',
        system: '<span class="rainbow">[SERVER]</span>',
        dev: '<span class="rainbow">[DEV]</span>',
        guest: '<span class="guest">'
    };

    const chatSuffixMap = {
        normal: '',
        system: '',
        dev: '',
        guest: '</span>'
    };

    div.innerHTML = chatPrefixMap[type] + message + chatSuffixMap[type];
    const chatMessageDiv = document.querySelector('.chat-div');
    chatMessageDiv.appendChild(div);
    chatMessageDiv.scrollTop = chatMessageDiv.scrollHeight;
}