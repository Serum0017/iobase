import SAT from 'sat';
function simulate(map){
    const {players, dimensions} = map;

    // player simulation
    for(let i = 0; i < players.length; i++){
        const p = players[i];
        if(p === undefined) continue;

        p.pos.x += (p.input.right - p.input.left) * p.speed * dt;
        p.pos.y += (p.input.down - p.input.up)    * p.speed * dt;

        p.xv *= p.friction;
        p.yv *= p.friction;

        if(p.pos.x - p.sat.r < 0){
            p.pos.x = p.sat.r;
        } else if(p.pos.x + p.sat.r > dimensions.x){
            p.pos.x = dimensions.x - p.sat.r;
        }
        if(p.pos.y - p.sat.r < 0){
            p.pos.y = p.sat.r;
        } else if(p.pos.y + p.sat.r > dimensions.y){
            p.pos.y = dimensions.y - p.sat.r;
        }
    }
}

global.players = [];
global.entities = [];

let dt, now, lastTime;
const FRAME_TIME = 1000 / 60;
function run(){
    now = performance.now();
    dt = (now - lastTime) / FRAME_TIME;
    lastTime = now;

    for(let key in global.maps){
        simulate(global.maps[key]);
        global.maps[key].updatePack();
    }
}
setInterval(run, FRAME_TIME);