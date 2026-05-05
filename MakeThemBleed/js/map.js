// ===== GAME MAP =====
// Renders the alien-themed ground and boundaries

class GameMap {
    constructor() {
        this.width = 3000;
        this.height = 3000;
        this.tileSize = 80;
        this.borderWidth = 40;

        // Pre-generate decorations
        this.decorations = [];
        this._generateDecorations();
    }

    _generateDecorations() {
        // Craters
        for (let i = 0; i < 40; i++) {
            this.decorations.push({
                type: 'crater',
                x: 100 + Math.random() * (this.width - 200),
                y: 100 + Math.random() * (this.height - 200),
                radius: 15 + Math.random() * 30,
                opacity: 0.1 + Math.random() * 0.15
            });
        }
        // Alien goo puddles
        for (let i = 0; i < 25; i++) {
            this.decorations.push({
                type: 'goo',
                x: 100 + Math.random() * (this.width - 200),
                y: 100 + Math.random() * (this.height - 200),
                radius: 10 + Math.random() * 25,
                color: Math.random() > 0.5 ? 'rgba(0, 255, 80, 0.06)' : 'rgba(120, 0, 255, 0.05)'
            });
        }
    }

    draw(ctx, camera, canvasWidth, canvasHeight) {
        // Determine visible area
        const startCol = Math.floor(camera.x / this.tileSize);
        const endCol = Math.ceil((camera.x + canvasWidth) / this.tileSize);
        const startRow = Math.floor(camera.y / this.tileSize);
        const endRow = Math.ceil((camera.y + canvasHeight) / this.tileSize);

        // Draw ground tiles
        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                const x = col * this.tileSize;
                const y = row * this.tileSize;

                // Alternate tile colors for subtle pattern
                const isDark = (row + col) % 2 === 0;
                ctx.fillStyle = isDark ? '#12121e' : '#15152a';
                ctx.fillRect(x, y, this.tileSize, this.tileSize);

                // Grid lines
                ctx.strokeStyle = 'rgba(40, 40, 80, 0.3)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x, y, this.tileSize, this.tileSize);
            }
        }

        // Draw decorations (only visible ones)
        for (const dec of this.decorations) {
            if (dec.x + dec.radius < camera.x - 50 || dec.x - dec.radius > camera.x + canvasWidth + 50) continue;
            if (dec.y + dec.radius < camera.y - 50 || dec.y - dec.radius > camera.y + canvasHeight + 50) continue;

            if (dec.type === 'crater') {
                ctx.beginPath();
                ctx.arc(dec.x, dec.y, dec.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(8, 8, 15, ${dec.opacity})`;
                ctx.fill();
                ctx.strokeStyle = `rgba(30, 30, 50, ${dec.opacity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            } else if (dec.type === 'goo') {
                ctx.beginPath();
                ctx.arc(dec.x, dec.y, dec.radius, 0, Math.PI * 2);
                ctx.fillStyle = dec.color;
                ctx.fill();
            }
        }

        // Draw map boundary - glowing warning strip
        const bw = this.borderWidth;

        // Top border
        const topGrad = ctx.createLinearGradient(0, 0, 0, bw);
        topGrad.addColorStop(0, 'rgba(255, 30, 0, 0.5)');
        topGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, this.width, bw);

        // Bottom border
        const botGrad = ctx.createLinearGradient(0, this.height - bw, 0, this.height);
        botGrad.addColorStop(0, 'rgba(255, 30, 0, 0)');
        botGrad.addColorStop(1, 'rgba(255, 30, 0, 0.5)');
        ctx.fillStyle = botGrad;
        ctx.fillRect(0, this.height - bw, this.width, bw);

        // Left border
        const leftGrad = ctx.createLinearGradient(0, 0, bw, 0);
        leftGrad.addColorStop(0, 'rgba(255, 30, 0, 0.5)');
        leftGrad.addColorStop(1, 'rgba(255, 30, 0, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(0, 0, bw, this.height);

        // Right border
        const rightGrad = ctx.createLinearGradient(this.width - bw, 0, this.width, 0);
        rightGrad.addColorStop(0, 'rgba(255, 30, 0, 0)');
        rightGrad.addColorStop(1, 'rgba(255, 30, 0, 0.5)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(this.width - bw, 0, bw, this.height);

        // Border lines
        ctx.strokeStyle = 'rgba(255, 50, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, this.width - 2, this.height - 2);
    }
}
