let canvas = window.canvas = document.getElementById('canvas');
let ctx = window.ctx = canvas.getContext('2d');

window.camera = {x: 0, y: 0, scale: 1};
window.mapDimensions = {x: 2000, y: 2000};
window.selfId = undefined;
window.tileSize = 100;

window.playerRenderKeys = ['r'];
window.playerInterpSpeeds = [0.44];

window.colors = {
    tile: '#1f2229',
    background: '#323645',
}

window.render = () => {
    if(window.selfId !== undefined){
        const me = players[window.selfId];
        updateInterpolate(me);
        camera.x = me.render.x;
        camera.y = me.render.y;
    }

    let cullingMinX = camera.x-canvas.w/2;
    let cullingMaxX = camera.x+canvas.w/2;
    let cullingMinY = camera.y-canvas.h/2;
    let cullingMaxY = camera.y+canvas.h/2;

    renderBG();

    ctx.translate(-(camera.x-canvas.w/2), -(camera.y-canvas.h/2));

    // render entities
    // for(let i = 0; i < entities.length; i++){

    // }

    // render players
    for(let i = 0; i < players.length; i++){
        const player = players[i];
        if(player === undefined) continue;
        const p = player.render;
        if(player.id !== window.selfId) updateInterpolate(player);

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'white';
        ctx.font = `${15 * ((Math.abs(p.r) + 0.5) / 25)}px Inter`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
            player.name,
            p.x,
            p.y + p.r * 4/3 + 3
        );
    }

    ctx.translate(camera.x-canvas.w/2, camera.y-canvas.h/2);

    if(window.disconnected === true){
        ctx.font = '81px Inter';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('Disconnected From Server.', canvas.w - 30, canvas.h - 50);
    }
}

// eX tiles

// function renderBG() {
//     ctx.fillStyle = colors.tile;
//     ctx.fillRect(0,0,canvas.w, canvas.h);

//     ctx.fillStyle = colors.background;
//     // add 1 to all dimensions so that we don't get gap artifacts on the edge of the arena
//     ctx.fillRect(-(camera.x-canvas.w/2)+1, -(camera.y-canvas.h/2)+1, window.mapDimensions.x-2, window.mapDimensions.y-2);

//     ctx.globalAlpha = 0.75;
//     ctx.lineWidth = 4.8;
//     ctx.strokeStyle = colors.tile;

//     for (let x = (canvas.w/2-camera.x)%window.tileSize; x < canvas.w + ctx.lineWidth + window.tileSize; x += window.tileSize) {
//         ctx.beginPath();
//         ctx.moveTo(x, 0);
//         ctx.lineTo(x, canvas.h);
//         ctx.stroke();
//         ctx.closePath();
//     }

//     for (let y = (canvas.h/2-camera.y)%window.tileSize; y < canvas.h + ctx.lineWidth + window.tileSize; y += window.tileSize) {
//         ctx.beginPath();
//         ctx.moveTo(0, y);
//         ctx.lineTo(canvas.w, y);
//         ctx.stroke();
//         ctx.closePath();
//     }

//     ctx.globalAlpha = 1;
// }

function renderBG() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.w,canvas.h);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(-(camera.x-canvas.w/2), -(camera.y-canvas.h/2), window.mapDimensions.x, window.mapDimensions.y, (players[window.selfId] ?? {r:0}).r);
    ctx.stroke();
    ctx.closePath();
}

function updateInterpolate(player){
    const p = player.render;
    for(let i = 0; i < playerRenderKeys.length; i++){
        const key = playerRenderKeys[i];
        p[key] = interpolate(p[key], player[key], playerInterpSpeeds[i]);
    }
    p.x = interpolate(p.x, player.pos.x, 0.35);
    p.y = interpolate(p.y, player.pos.y, 0.35);
}

// canvas resizing
const gui = document.querySelector('.gui') ?? {style:{}};
let lastScale=1;
const fullscreen = {
    ratio: 9 / 16,
    zoom: 1800,
}
window.resize = () => {
    lastScale = window.camera.scale;
    window.changeCameraScale(1);
    const dpi = window.devicePixelRatio;
    gui.style.width = canvas.style.width = Math.ceil(window.innerWidth) + 'px';
    gui.style.height = canvas.style.height = Math.ceil(window.innerHeight) + 'px';
    gui.width = canvas.width = Math.ceil(window.innerWidth) * dpi;
    gui.height = canvas.height = Math.ceil(window.innerHeight) * dpi;
    canvas.zoom = Math.max(0.1, Math.round((Math.max(canvas.height, canvas.width * fullscreen.ratio) / fullscreen.zoom * camera.scale) * 100) / 100);
    // w and h are calced with zoom
    canvas.w = canvas.width / canvas.zoom;
    canvas.h = canvas.height / canvas.zoom;
    ctx.scale(canvas.zoom, canvas.zoom);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    window.changeCameraScale(lastScale);
}

window.changeCameraScale = (scale) => {
    ctx.translate(-(1-1/window.camera.scale)*canvas.w/2, -(1-1/window.camera.scale)*canvas.h/2);

    ctx.translate(canvas.w/2, canvas.h/2);
    ctx.scale(1/window.camera.scale, 1/window.camera.scale);
    ctx.translate(-canvas.w/2, -canvas.h/2);

    window.camera.scale = scale;
    canvas.w = canvas.width / canvas.zoom / window.camera.scale;
    canvas.h = canvas.height / canvas.zoom / window.camera.scale;

    ctx.translate(canvas.w/2, canvas.h/2);
    ctx.scale(window.camera.scale, window.camera.scale);
    ctx.translate(-canvas.w/2, -canvas.h/2);
    
    ctx.translate((1-1/window.camera.scale)*canvas.w/2, (1-1/window.camera.scale)*canvas.h/2);
}
  
window.addEventListener('resize', function () {
    window.resize();
});
window.resize();

export default window.render;