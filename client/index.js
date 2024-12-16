import './style.css';
import './utils.js';
import './render.js';
import './networking.js';
import './input.js';
import '../client/sound.js';

window.startGame = () => {
    document.querySelector('.gui').classList.remove('hidden');
    document.querySelector('.menu').classList.add('hidden');
    requestAnimationFrame(run);
}

// gameloop
function run(){
    requestAnimationFrame(run);
    window.render();
}