// ===== HUD =====
// Draws player health, weapon info, wave counter, crosshair

class HUD {
    draw(ctx, game, canvasWidth, canvasHeight) {
        ctx.save();

        // ===== CROSSHAIR =====
        this.drawCrosshair(ctx, game.mouse.screenX, game.mouse.screenY);

        // ===== HEALTH BAR =====
        this.drawHealthBar(ctx, game.player, canvasWidth, canvasHeight);

        // ===== WEAPON INFO =====
        this.drawWeaponInfo(ctx, game.player, canvasWidth, canvasHeight);

        // ===== WAVE COUNTER =====
        this.drawWaveCounter(ctx, game.waveManager, canvasWidth);

        // ===== KILL COUNTER =====
        this.drawKillCounter(ctx, game.waveManager, canvasWidth);

        ctx.restore();
    }

    drawCrosshair(ctx, x, y) {
        const size = 12;
        const gap = 4;
        const thickness = 2;

        ctx.strokeStyle = '#ff3333';
        ctx.lineWidth = thickness;
        ctx.globalAlpha = 0.8;

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(x - size, y);
        ctx.lineTo(x - gap, y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x + gap, y);
        ctx.lineTo(x + size, y);
        ctx.stroke();

        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x, y - gap);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(x, y + gap);
        ctx.lineTo(x, y + size);
        ctx.stroke();

        // Center dot
        ctx.fillStyle = '#ff4444';
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
    }

    drawHealthBar(ctx, player, canvasWidth, canvasHeight) {
        const barWidth = 200;
        const barHeight = 16;
        const padding = 20;
        const x = padding;
        const y = canvasHeight - padding - barHeight;

        // Background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
        ctx.lineWidth = 1;
        this._roundRect(ctx, x - 2, y - 2, barWidth + 4, barHeight + 4, 4);
        ctx.fill();
        ctx.stroke();

        // Health fill
        const hpRatio = player.health / player.maxHealth;
        const hpColor = hpRatio > 0.6 ? '#22cc44' : hpRatio > 0.3 ? '#ffaa00' : '#ff2222';

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
        gradient.addColorStop(0, hpColor);
        gradient.addColorStop(1, this._darken(hpColor));
        ctx.fillStyle = gradient;
        this._roundRect(ctx, x, y, barWidth * hpRatio, barHeight, 3);
        ctx.fill();

        // Health text
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(player.health)} / ${player.maxHealth}`, x + barWidth / 2, y + barHeight - 3);

        // Label
        ctx.fillStyle = '#888';
        ctx.font = '10px Rajdhani, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('HEALTH', x, y - 6);
    }

    drawWeaponInfo(ctx, player, canvasWidth, canvasHeight) {
        const padding = 20;
        const x = canvasWidth - padding;
        const y = canvasHeight - padding;

        const weapon = player.currentWeapon;

        // Weapon name
        ctx.fillStyle = weapon.bulletColor;
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.textAlign = 'right';
        ctx.fillText(weapon.name.toUpperCase(), x, y - 8);

        // Weapon index indicator
        ctx.font = '10px Rajdhani, sans-serif';
        ctx.fillStyle = '#666';
        const weaponSlots = player.weapons;
        let slotText = '';
        for (let i = 0; i < 5; i++) {
            if (weaponSlots.includes(i)) {
                if (i === player.currentWeaponIndex) {
                    slotText += `[${i + 1}] `;
                } else {
                    slotText += `${i + 1} `;
                }
            }
        }
        ctx.fillText(slotText.trim(), x, y + 8);
    }

    drawWaveCounter(ctx, waveManager, canvasWidth) {
        const x = canvasWidth / 2;
        const y = 50;

        // Wave number
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`WAVE ${waveManager.currentWave}`, x, y);

        // Wave state
        if (waveManager.waveState === 'cleared') {
            ctx.fillStyle = '#44ff44';
            ctx.font = '12px Rajdhani, sans-serif';
            ctx.fillText('WAVE CLEARED', x, y + 20);
        } else if (waveManager.waveState === 'spawning' || waveManager.waveState === 'fighting') {
            const alive = document.querySelectorAll ? 0 : 0; // will be calculated in game
            ctx.fillStyle = '#888';
            ctx.font = '11px Rajdhani, sans-serif';
        }
    }

    drawKillCounter(ctx, waveManager, canvasWidth) {
        const x = canvasWidth / 2;
        const y = 75;

        ctx.fillStyle = '#888';
        ctx.font = '12px Rajdhani, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`KILLS: ${waveManager.totalKills}`, x, y);
    }

    _roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    _darken(hex) {
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        return `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(b * 0.6)})`;
    }
}
