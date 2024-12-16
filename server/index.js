import './utils.js';
import fs from 'fs';
import uWS from 'uWebSockets.js';
import shared from '../client/shared.js';
const { inputNumberToName } = shared;
import mapFns from './map.js';
const {addToMap, removeFromMap} = mapFns;
import Player from './player.js';
import '../webpack/webpack.js';
import { pack } from 'msgpackr';
import './game.js';

const PORT = 3000;

const clients = global.clients = [];
const reusableIds = [];

// create the server and set functions for when a connection opens, closes, and sends a message
global.app = uWS.App().ws('/*', {
    compression: 0,
    maxPayloadLength: 16 * 1024 * 1024,
    idleTimeout: 0,// disabled
    open: (ws) => {
        ws.me = {
            ws,
            id: -1,
            mapName: '',
            player: new Player()
        }

        if(reusableIds.length === 0) ws.me.id = clients.length;
        else ws.me.id = reusableIds.pop();
        clients[ws.me.id] = ws;
    },
    message: (ws, data) => {
        const decoded = new Uint8Array(data);
        if(ws.me.mapName === '' && decoded[0] !== 0) return;
        if(messageMap[decoded[0]] === undefined || decoded[0] >= messageMap.length) return;
        messageMap[decoded[0]](decoded, ws.me);
    },
    close: (ws) => {
        ws.closed = true;
        if(ws.me.mapName !== '') removeFromMap(ws.me, false);
        delete clients[ws.me.id];
    }
}).listen(PORT, (token) => {
    if (token) {
        console.log('Server Listening to Port ' + PORT);
    } else {
        console.log('Failed to Listen to Child Server ' + PORT);
    }
});

if(global.env === 'dev'){
    app.get('/', (res, req) => {
        res.end(fs.readFileSync('z_dev/index.html'));
    });
} else {
    app.get('/', (res, req) => {
        res.end(fs.readFileSync('z_dist/index.html'));
    });
}

app.get("/favicon.ico", (res, req) => {
    res.end(fs.readFileSync("client/gfx/favicon.ico"));
});

app.get("/:filename", (res, req) => {
    let path = 'z_dev' + req.getUrl();
    
    // Check if the file exists
    if (fs.existsSync(path)) {
        // Read and serve the file
        const file = fs.readFileSync(path);
        res.end(file);
    } else {
        // File not found
        res.writeStatus('404 Not Found');
        res.end();
    }
});

app.get("/favicon.ico", (res, req) => {
    res.end(fs.readFileSync("client/favicon.ico"));
});

// functions that each correspond to a message. Tells the server what to do when processing the message
const messageMap = [
    // 0 - join game
    (data, me) => {
        if(me.mapName !== '') return;

        const name = global.decodeText(data, 1);
        me.player.name = name;

        me.ws.subscribe('global');

        // send leaderboard
        const lb = pack(global.leaderboard);
        lb[0] = 7;
        global.send(me, lb);

        changeMap(me, global.defaultMapName);
    },
    // 1 - player input key down
    (data, me) => {
        if(data.byteLength !== 2) return;

        const name = inputNumberToName[data[1]];
        if(name === undefined) return;

        me.player.input[name] = true;
    },
    // 2 - player input key up
    (data, me) => {
        if(data.byteLength !== 2) return;

        const name = inputNumberToName[data[1]];
        if(name === undefined) return;

        me.player.input[name] = false;
    },
    // 3 - chat message
    (data, me) => {
        if(data.byteLength > 1000 || me.mapName === '') return;

        const chatMessage = me.player.name + ': ' + global.decodeText(data, 1);

        const buf = new Uint8Array(chatMessage.length + 2);
        buf[0] = 6;
        global.encodeAtPosition(chatMessage, buf, 2);
        broadcastEveryone(buf);
    }
]

global.send = (client, msg) => {
    client.ws.send(msg, true, false);
}

global.broadcastRoom = (roomId, msg) => {
    app.publish(roomId, msg, true, false);
}

global.broadcastEveryone = (msg) => {
    app.publish('global', msg, true, false);
}

function changeMap(me, newMapName){
    // 1. remove from old map .1
    if(me.mapName !== '') removeFromMap(me);

    // 2. reset stuff like powerups .2
    me.player.reset();

    // 3. add to new map .3
    addToMap(me, newMapName);
}