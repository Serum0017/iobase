import { pack } from 'msgpackr';
global.defaultMapName = 'Leaderboard';

import shared from '../client/shared.js';
const { playerUpdatePackLen } = shared;

global.leaderboard = {};
global.maps = {};

class Map {
    constructor(name){
        this.players = [];
        this.clients = [];
        this.reusablePlayerIds = [];
        this.name = name;

        this.entities = [];

        this.dimensions = {x: 500, y: 500};

        global.leaderboard[this.name] = {};
    }
    addPlayer(p){
        const id = this.reusablePlayerIds.length === 0 ? this.players.length : this.reusablePlayerIds.pop();
        p.id = id;
        this.players[id] = p;

        // add to leaderboard
        global.leaderboard[this.name][p.id] = p.name;
        const buf = new Uint8Array(this.name.length + p.name.length + 2);
        buf[0] = 8;
        buf[1] = this.name.length;
        global.encoder.encodeInto(this.name, buf.subarray(2 | 0));
        global.encoder.encodeInto(p.name, buf.subarray((this.name.length+2) | 0));
        global.broadcastEveryone(buf);
    }
    removePlayer(p){
        this.players[p.id] = undefined;
        while(this.players[this.players.length-1] === undefined && this.players.length > 0) this.players.length--;
        this.reusablePlayerIds.push(p.id);

        delete global.leaderboard[this.name][p.id];

        // remove from leaderboard
        const buf = new Uint8Array(this.name.length + p.name.length + 2);
        buf[0] = 9;
        buf[1] = this.name.length;
        global.encoder.encodeInto(this.name, buf.subarray(2 | 0));
        global.encoder.encodeInto(p.name, buf.subarray((this.name.length+2) | 0));
        global.broadcastEveryone(buf);
    }
    addClient(me){
        me.ws.subscribe(this.name);
        this.clients.push(me);
    }
    removeClient(me, isConnected){
        this.clients = this.clients.filter(c => c !== me);
        if(isConnected === true) me.ws.unsubscribe(this.name);
    }
    getRandomClient(){
        return this.clients[Math.floor(Math.random() * this.clients.length)];
    }
    getInitDataForPlayer(p){
        return [this.players.map(p => p.pack()), this.dimensions, p.id];
    }
    broadcast(msg){
        global.app.publish(this.name, msg, true, false);
    }
    updatePack() {
        const buf = new Float32Array(this.players.length * playerUpdatePackLen + 1);
        let ind = 1;
        for(let i = 0; i < this.players.length; i++){
            if(this.players[i] === undefined) continue;
            ind = this.players[i].updatePack(buf, ind);
        }
        this.broadcast(buf);
    }
}

const buf2 = new Uint8Array(2);
buf2[0] = 3;
function addToMap(me, mapName) {
    if(global.maps[mapName] === undefined) global.maps[mapName] = new Map(mapName);

    // add player up here for id
    global.maps[mapName].addPlayer(me.player);

    // for all other players send them other player's init data (many small)
    buf2[1] = 4;// reusing the buffer from earlier. byte[1] = 5 - flag next as new player msg
    global.maps[mapName].broadcast(buf2);
    global.maps[mapName].broadcast(pack(me.player));

    // send player init pack (one big)
    buf2[1] = 1;
    global.send(me, buf2);
    global.send(me, pack(global.maps[mapName].getInitDataForPlayer(me.player)));

    // add client down here so that we don't get the broadcast
    global.maps[mapName].addClient(me);
    me.mapName = mapName;
}

const buf4 = new ArrayBuffer(4);
const u8 = new Uint8Array(buf4);
const u16 = new Uint16Array(buf4);
function removeFromMap(me, isConnected=true) {
    global.maps[me.mapName].removePlayer(me.player);
    global.maps[me.mapName].removeClient(me, isConnected);

    if(global.maps[me.mapName].players.length === 0) {
        delete global.maps[me.mapName];
        delete global.leaderboard[me.mapName];
    } else {
        u8[0] = 5;// message type 5 - remove player
        u16[1] = me.player.id;
        global.maps[me.mapName].broadcast(buf4);
    }
}

export default {addToMap, removeFromMap};