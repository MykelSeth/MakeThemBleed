// ===== WEAPONS SYSTEM =====
// Reads from CONFIG.WEAPONS. Change values in config.js.

const WEAPONS = CONFIG.WEAPONS;
const WEAPON_DROPS = CONFIG.WEAPON_DROPS;

// ===== PROJECTILE =====
class Projectile {
    constructor(x, y, angle, weapon) {
        const sp = weapon.spread;
        const finalAngle = angle + (Math.random() - 0.5) * sp * 2;
        this.x = x; this.y = y;
        this.vx = Math.cos(finalAngle) * weapon.projectileSpeed;
        this.vy = Math.sin(finalAngle) * weapon.projectileSpeed;
        this.radius = weapon.bulletSize;
        this.damage = weapon.damage;
        this.color = weapon.bulletColor;
        this.trail = weapon.trailColor;
        this.alive = true;
        this.prevX = x; this.prevY = y;
    }
    update(dt) {
        this.prevX = this.x; this.prevY = this.y;
        this.x += this.vx * dt; this.y += this.vy * dt;
    }
    draw(ctx) {
        if (!this.alive) return;
        // Trail
        ctx.strokeStyle = this.trail; ctx.lineWidth = this.radius * 0.8; ctx.globalAlpha = 0.5;
        ctx.beginPath(); ctx.moveTo(this.prevX, this.prevY); ctx.lineTo(this.x, this.y); ctx.stroke();
        ctx.globalAlpha = 1;
        // Bullet
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, 6.28); ctx.fill();
    }
}

// ===== WEAPON PICKUP =====
class WeaponPickup {
    constructor(x, y, weaponIndex) {
        this.x = x; this.y = y;
        this.weaponIndex = weaponIndex;
        this.radius = 18;
        this.collected = false;
        this.bobTimer = 0; this.glowTimer = 0;
    }
    update(dt) { this.bobTimer += dt * 3; this.glowTimer += dt * 4; }
    draw(ctx) {
        if (this.collected) return;
        const w = WEAPONS[this.weaponIndex];
        const bobY = this.y + Math.sin(this.bobTimer) * 5;
        const pulse = 0.6 + Math.sin(this.glowTimer) * 0.4;
        ctx.globalAlpha = 0.2 * pulse; ctx.fillStyle = w.bulletColor;
        ctx.beginPath(); ctx.arc(this.x, bobY, this.radius + 8, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 1; ctx.fillStyle = '#111'; ctx.strokeStyle = w.bulletColor; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(this.x, bobY, this.radius, 0, 6.28); ctx.fill(); ctx.stroke();
        ctx.fillStyle = w.bulletColor; ctx.font = 'bold 12px Orbitron,monospace'; ctx.textAlign = 'center';
        ctx.fillText(w.name.toUpperCase(), this.x, bobY + 2);
        ctx.font = '9px Rajdhani,sans-serif'; ctx.fillStyle = '#aaa';
        ctx.fillText('PICK UP', this.x, bobY + 14);
    }
}
