// ===== HUD =====
// Bigger health bar, ammo counter, reload bar, power-up indicators, crosshair
class HUD {
    draw(ctx, game, cw, ch) {
        ctx.save();
        this.drawCrosshair(ctx, game.mouse.screenX, game.mouse.screenY);
        this.drawHealthBar(ctx, game.player, cw, ch);
        this.drawWeaponInfo(ctx, game.player, cw, ch);
        this.drawWaveCounter(ctx, game.waveManager, cw);
        this.drawKillCounter(ctx, game.waveManager, game.scoring, cw);
        this.drawPowerUps(ctx, game.activePowerUps, cw, ch);
        ctx.restore();
    }
    drawCrosshair(ctx, x, y) {
        const sz = 14, gap = 5, th = 2.5;
        ctx.strokeStyle = '#ff3333'; ctx.lineWidth = th; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(x - sz, y); ctx.lineTo(x - gap, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + gap, y); ctx.lineTo(x + sz, y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y - sz); ctx.lineTo(x, y - gap); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x, y + gap); ctx.lineTo(x, y + sz); ctx.stroke();
        ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 1;
    }
    drawHealthBar(ctx, player, cw, ch) {
        const bw = 250, bh = 20, pad = 25;
        const x = pad, y = ch - pad - bh;
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.strokeStyle = 'rgba(255,50,50,0.4)'; ctx.lineWidth = 1;
        this._rr(ctx, x - 2, y - 2, bw + 4, bh + 4, 5); ctx.fill(); ctx.stroke();
        const hr = player.health / player.maxHealth;
        const hc = hr > 0.6 ? '#22cc44' : hr > 0.3 ? '#ffaa00' : '#ff2222';
        const grd = ctx.createLinearGradient(x, y, x, y + bh); grd.addColorStop(0, hc); grd.addColorStop(1, this._dk(hc));
        ctx.fillStyle = grd; this._rr(ctx, x, y, bw * hr, bh, 4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Orbitron,monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(player.health)} / ${player.maxHealth}`, x + bw / 2, y + bh - 4);
        ctx.fillStyle = '#999'; ctx.font = '11px Rajdhani,sans-serif'; ctx.textAlign = 'left'; ctx.fillText('HEALTH', x, y - 8);
    }
    drawWeaponInfo(ctx, player, cw, ch) {
        const pad = 25, x = cw - pad, y = ch - pad;
        const w = player.currentWeapon;
        ctx.fillStyle = w.bulletColor; ctx.font = 'bold 18px Orbitron,monospace'; ctx.textAlign = 'right';
        ctx.fillText(w.name.toUpperCase(), x, y - 38);
        // Ammo display
        const mag = player.currentMag, reserve = player.currentReserve;
        ctx.font = 'bold 28px Orbitron,monospace';
        ctx.fillStyle = mag <= 0 ? '#ff4444' : '#fff';
        const ammoStr = `${mag} / ${reserve}`;
        ctx.fillText(ammoStr, x, y - 8);
        // Reload indicator text
        if (player.isReloading) {
            ctx.fillStyle = '#ffcc00'; ctx.font = 'bold 14px Orbitron,monospace'; ctx.textAlign = 'right';
            ctx.fillText('RELOADING...', x, y + 18);
        } else if (mag <= 0 && reserve > 0) {
            ctx.fillStyle = '#ff4444'; ctx.font = 'bold 12px Orbitron,monospace'; ctx.textAlign = 'right';
            ctx.fillText('PRESS R', x, y + 18);
        }
        // Weapon slots
        ctx.font = '12px Rajdhani,sans-serif'; ctx.textAlign = 'right';
        let slotTxt = '';
        for (let i = 0; i < 5; i++) { if (player.weapons.includes(i)) { slotTxt += i === player.currentWeaponIndex ? `[${i + 1}] ` : `${i + 1} `; } }
        ctx.fillStyle = '#555'; ctx.fillText(slotTxt.trim(), x, y + 34);
    }
    drawWaveCounter(ctx, wm, cw) {
        ctx.fillStyle = '#ff4444'; ctx.font = 'bold 22px Orbitron,monospace'; ctx.textAlign = 'center';
        ctx.fillText(`WAVE ${wm.currentWave}`, cw / 2, 45);
        if (wm.waveState === 'cleared') { ctx.fillStyle = '#44ff44'; ctx.font = '14px Rajdhani,sans-serif'; ctx.fillText('WAVE CLEARED', cw / 2, 68); }
    }
    drawKillCounter(ctx, wm, scoring, cw) {
        ctx.fillStyle = '#aaa'; ctx.font = '14px Rajdhani,sans-serif'; ctx.textAlign = 'center';
        const score = scoring ? scoring.totalScore : 0;
        ctx.fillText(`KILLS: ${wm.totalKills}  |  SCORE: ${score}`, cw / 2, 68);
    }
    drawPowerUps(ctx, pups, cw, ch) {
        if (!pups) return;
        let y = ch - 80;
        const active = [];
        if (pups.freeze > 0) active.push({ name: 'FREEZE', color: '#44ddff', time: pups.freeze });
        if (pups.flame > 0) active.push({ name: 'INFERNO', color: '#ff6600', time: pups.flame });
        if (pups.unlimitedAmmo > 0) active.push({ name: 'UNLIMITED', color: '#ffd700', time: pups.unlimitedAmmo });
        if (pups.nuke > 0) active.push({ name: 'NUKE', color: '#ff0000', time: pups.nuke });
        for (const p of active) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; this._rr(ctx, cw / 2 - 60, y, 120, 22, 4); ctx.fill();
            ctx.strokeStyle = p.color; ctx.lineWidth = 1; this._rr(ctx, cw / 2 - 60, y, 120, 22, 4); ctx.stroke();
            ctx.fillStyle = p.color; ctx.font = 'bold 11px Orbitron,monospace'; ctx.textAlign = 'center';
            ctx.fillText(`${p.name} ${p.time.toFixed(1)}s`, cw / 2, y + 15);
            y -= 28;
        }
    }
    _rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
    _dk(hex) { const r = parseInt(hex.substr(1, 2), 16), g = parseInt(hex.substr(3, 2), 16), b = parseInt(hex.substr(5, 2), 16); return `rgb(${Math.floor(r * 0.6)},${Math.floor(g * 0.6)},${Math.floor(b * 0.6)})`; }
}
