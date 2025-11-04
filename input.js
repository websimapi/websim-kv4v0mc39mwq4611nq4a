class InputHandler {
    constructor(onHitCallback) {
        this.onHit = onHitCallback;
        this.keyMapping = {
            'KeyD': 0, 'KeyF': 1, 'KeyJ': 2, 'KeyK': 3
        };

        this.initDesktop();
        this.initMobile();
    }

    initDesktop() {
        window.addEventListener('keydown', (e) => {
            if (this.keyMapping.hasOwnProperty(e.code)) {
                this.onHit(this.keyMapping[e.code]);
            }
        });
    }

    initMobile() {
        const canvas = document.getElementById('game-canvas');
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const colWidth = window.innerWidth / 4;
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const column = Math.floor(touch.clientX / colWidth);
                if (column >= 0 && column < 4) {
                    this.onHit(column);
                }
            }
        }, { passive: false });
    }
}

export default InputHandler;