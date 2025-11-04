import Game from './game.js';

window.addEventListener('load', () => {
    const canvas = document.getElementById('game-canvas');
    const startScreen = document.getElementById('start-screen');
    const endScreen = document.getElementById('end-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const hud = document.getElementById('hud');

    const game = new Game(canvas);

    function startGame() {
        startScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        hud.classList.remove('hidden');
        game.start();
    }

    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);

    // Initial resize
    game.resize();
});