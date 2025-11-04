import Renderer from './renderer.js';
import InputHandler from './input.js';
import AudioManager from './audio.js';
import { loadSong } from './song.js';

const NOTE_TIMING = {
    PERFECT: 0.05, // +/- 50ms window
    GOOD: 0.1,     // +/- 100ms window
    OK: 0.15,      // +/- 150ms window
};

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);
        this.input = new InputHandler(this.onHit.bind(this));
        this.audio = new AudioManager();

        this.gameState = 'MENU';
        this.notes = [];
        this.activeNotes = new Map();
        this.noteSpeed = 400; // pixels per second
        this.lastTime = 0;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hitFeedback = []; // { x, y, text, time }

        this.scoreElement = document.getElementById('score');
        this.comboElement = document.getElementById('combo');
        this.finalScoreElement = document.getElementById('final-score');
        this.maxComboElement = document.getElementById('max-combo');
        this.endScreen = document.getElementById('end-screen');
        this.hud = document.getElementById('hud');

        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.renderer.resize(this.canvas.width, this.canvas.height);
    }

    async start() {
        this.gameState = 'LOADING';
        this.renderer.setLoading(true);
        try {
            const [_, songNotes] = await Promise.all([
                this.audio.loadAssets(),
                loadSong()
            ]);
            
            this.notes = songNotes;
            this.reset();
            this.gameState = 'PLAYING';
            this.renderer.setLoading(false);
            await this.audio.playMusic();
            this.lastTime = performance.now();
            requestAnimationFrame(this.gameLoop.bind(this));
        } catch (error) {
            console.error("Failed to load game assets:", error);
            // Handle loading error (e.g., show an error message on screen)
        }
    }

    reset() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.activeNotes.clear();
        this.hitFeedback = [];
        this.updateHUD();
        this.endScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
    }

    onHit(column) {
        if (this.gameState !== 'PLAYING') return;

        const currentTime = this.audio.getCurrentTime();
        const targetTime = currentTime;
        const hitZoneY = this.renderer.getHitZoneY();

        let bestNote = null;
        let bestTimeDiff = Infinity;

        // Find the closest note in the correct column
        for (const note of this.activeNotes.values()) {
            if (note.column === column) {
                const timeDiff = Math.abs(note.time - targetTime);
                if (timeDiff < NOTE_TIMING.OK && timeDiff < bestTimeDiff) {
                    bestNote = note;
                    bestTimeDiff = timeDiff;
                }
            }
        }

        if (bestNote) {
            this.audio.playSound('hit');
            let quality = 'MISS';
            let scoreBonus = 0;

            if (bestTimeDiff <= NOTE_TIMING.PERFECT) {
                quality = 'PERFECT';
                scoreBonus = 300;
                this.combo++;
            } else if (bestTimeDiff <= NOTE_TIMING.GOOD) {
                quality = 'GOOD';
                scoreBonus = 200;
                this.combo++;
            } else if (bestTimeDiff <= NOTE_TIMING.OK) {
                quality = 'OK';
                scoreBonus = 100;
                this.combo++;
            }

            this.score += scoreBonus + this.combo * 10;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.addHitFeedback(column, quality);
            this.activeNotes.delete(bestNote.id);
        }

        this.updateHUD();
    }

    addHitFeedback(column, text) {
        const x = (column + 0.5) * (this.canvas.width / 4);
        const y = this.renderer.getHitZoneY() - 50;
        this.hitFeedback.push({ x, y, text, time: performance.now() });
    }

    updateHUD() {
        this.scoreElement.textContent = this.score;
        this.comboElement.textContent = this.combo;
    }

    gameLoop(timestamp) {
        if (this.gameState !== 'PLAYING') return;

        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.renderer.draw(this);

        if (this.gameState === 'PLAYING') {
            requestAnimationFrame(this.gameLoop.bind(this));
        }
    }

    update(deltaTime) {
        const currentTime = this.audio.getCurrentTime();
        const hitZoneY = this.renderer.getHitZoneY();
        const lookaheadTime = this.canvas.height / this.noteSpeed;

        // Spawn new notes
        for (const note of this.notes) {
            if (!this.activeNotes.has(note.id) && note.time >= currentTime && note.time < currentTime + lookaheadTime) {
                this.activeNotes.set(note.id, { ...note });
            }
        }

        const feedbackDuration = 500; // ms
        this.hitFeedback = this.hitFeedback.filter(fb => performance.now() - fb.time < feedbackDuration);

        // Update and check for missed notes
        for (const note of this.activeNotes.values()) {
            note.y = hitZoneY - (note.time - currentTime) * this.noteSpeed;

            if (note.y > this.canvas.height + 50) { // Note is past the miss threshold
                this.activeNotes.delete(note.id);
                this.combo = 0;
                this.addHitFeedback(note.column, 'MISS');
                this.audio.playSound('miss');
                this.updateHUD();
            }
        }

        // Check for end of song
        if (this.activeNotes.size === 0 && currentTime > this.notes[this.notes.length - 1].time + 2) {
            this.endGame();
        }
    }

    endGame() {
        this.gameState = 'ENDED';
        this.audio.stopMusic();
        this.finalScoreElement.textContent = this.score;
        this.maxComboElement.textContent = this.maxCombo;
        this.hud.classList.add('hidden');
        this.endScreen.classList.remove('hidden');
    }
}

export default Game;