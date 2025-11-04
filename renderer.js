class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize(canvas.width, canvas.height);
        this.isLoading = false;

        this.colors = {
            columnLines: 'rgba(255, 255, 255, 0.2)',
            hitZone: 'rgba(74, 144, 226, 0.5)',
            notes: ['#ff6b6b', '#f9ca24', '#48dbfb', '#ff6b6b'],
            feedback: {
                PERFECT: '#48dbfb',
                GOOD: '#1dd1a1',
                OK: '#f9ca24',
                MISS: '#ff6b6b'
            }
        };
    }

    setLoading(loading) {
        this.isLoading = loading;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.hitZoneY = height * 0.85;
        this.noteHeight = 20;
    }

    getHitZoneY() {
        return this.hitZoneY;
    }

    draw(gameState) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.isLoading) {
            this.drawLoading();
            return;
        }

        this.drawColumns();
        this.drawHitZone();
        this.drawNotes(gameState.activeNotes);
        this.drawHitFeedback(gameState.hitFeedback);
    }

    drawLoading() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Assets...', this.width / 2, this.height / 2);
    }

    drawColumns() {
        const colWidth = this.width / 4;
        this.ctx.strokeStyle = this.colors.columnLines;
        this.ctx.lineWidth = 2;
        for (let i = 1; i < 4; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(colWidth * i, 0);
            this.ctx.lineTo(colWidth * i, this.height);
            this.ctx.stroke();
        }
    }

    drawHitZone() {
        this.ctx.fillStyle = this.colors.hitZone;
        this.ctx.fillRect(0, this.hitZoneY - this.noteHeight / 2, this.width, this.noteHeight);

        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.hitZoneY);
        this.ctx.lineTo(this.width, this.hitZoneY);
        this.ctx.stroke();
    }

    drawNotes(activeNotes) {
        const colWidth = this.width / 4;
        for (const note of activeNotes.values()) {
            const x = note.column * colWidth;
            const y = note.y;

            this.ctx.fillStyle = this.colors.notes[note.column];
            this.ctx.fillRect(x + 5, y - this.noteHeight / 2, colWidth - 10, this.noteHeight);
        }
    }

    drawHitFeedback(feedback) {
        this.ctx.textAlign = 'center';
        this.ctx.font = 'bold 32px Arial';

        for(const fb of feedback) {
            const timeSince = performance.now() - fb.time;
            const alpha = 1.0 - (timeSince / 500); // Fades out over 500ms

            this.ctx.fillStyle = this.colors.feedback[fb.text] || '#FFFFFF';
            this.ctx.globalAlpha = Math.max(0, alpha);

            const y = fb.y - (timeSince / 20); // Floats up
            this.ctx.fillText(fb.text, fb.x, y);
        }
        this.ctx.globalAlpha = 1.0;
    }
}

export default Renderer;