import shared from '../client/shared.js';
const {inputNameToNumber} = shared;
import SAT from 'sat';
class Player {
    constructor(){
        this.id = -1;
        this.name = '';
        this.input = {};
        this.reset();
    }
    reset(){
        this.r = 49.5;
        this.xv = this.yv = 0;
        this.speed = 7.17; this.friction = 0.4;
        this.sat = new SAT.Circle(new SAT.Vector(0,0), this.r);
        this.pos = this.sat.pos;
        for(let key in inputNameToNumber){
            this.input[key] = false;
        }
    }
    pack(){
        const keys = ['id', 'pos', 'r', 'name'];

        const pack = {};
        for(let i = 0; i < keys.length; i++){
            pack[keys[i]] = this[keys[i]];
        }
        return pack;
    }
    updatePack(f32, cur){
        f32[cur++] = this.id;
        f32[cur++] = this.pos.x;
        f32[cur++] = this.pos.y;
        return cur;
    }
}
export default Player;