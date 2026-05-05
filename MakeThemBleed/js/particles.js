// ===== PARTICLE SYSTEM =====
class Particle {
    constructor(x, y, vx, vy, life, color, size) { this.x = x; this.y = y; this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life; this.color = color; this.size = size; this.alive = true; }
    update(dt) { this.x += this.vx * dt; this.y += this.vy * dt; this.vx *= 0.96; this.vy *= 0.96; this.life -= dt; if (this.life <= 0) this.alive = false; }
    draw(ctx) { if (!this.alive) return; const a = Math.max(0, this.life / this.maxLife), sz = this.size * (0.3 + 0.7 * a); ctx.globalAlpha = a; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, sz, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
}
class ParticleSystem {
    constructor() { this.particles = []; this.maxParticles = 600; }
    update(dt) { for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(dt); if (!this.particles[i].alive) this.particles.splice(i, 1); } }
    draw(ctx) { for (const p of this.particles) p.draw(ctx); }
    _sp(x, y, count, color, sMin, sMax, lMin, lMax, szMin, szMax) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const a = Math.random() * 6.28, sp = sMin + Math.random() * (sMax - sMin), l = lMin + Math.random() * (lMax - lMin), sz = szMin + Math.random() * (szMax - szMin);
            this.particles.push(new Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, l, color, sz));
        }
    }
    spawnBlood(x, y, count) {
        const cs = ['#cc0000', '#ff0000', '#990000', '#ff3333', '#880000'];
        for (let i = 0; i < (count || 6) && this.particles.length < this.maxParticles; i++) {
            const c = cs[Math.floor(Math.random() * 5)], a = Math.random() * 6.28, sp = 50 + Math.random() * 150, l = 0.3 + Math.random() * 0.5, sz = 2 + Math.random() * 3.5;
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10, Math.cos(a) * sp, Math.sin(a) * sp, l, c, sz));
        }
    }
    spawnDeathBurst(x, y) {
        const cs = ['#cc0000', '#ff0000', '#990000', '#660000', '#ff2222'];
        for (let i = 0; i < 25 && this.particles.length < this.maxParticles; i++) {
            const c = cs[Math.floor(Math.random() * 5)], a = Math.random() * 6.28, sp = 80 + Math.random() * 280, l = 0.4 + Math.random() * 0.9, sz = 2 + Math.random() * 6;
            this.particles.push(new Particle(x, y, Math.cos(a) * sp, Math.sin(a) * sp, l, c, sz));
        }
    }
    spawnMuzzleFlash(x, y, angle) {
        const cs = ['#ffff00', '#ffaa00', '#ff8800', '#ffffff'];
        for (let i = 0; i < 5 && this.particles.length < this.maxParticles; i++) {
            const c = cs[Math.floor(Math.random() * 4)], spread = (Math.random() - 0.5) * 0.4, sp = 120 + Math.random() * 220;
            this.particles.push(new Particle(x, y, Math.cos(angle + spread) * sp, Math.sin(angle + spread) * sp, 0.05 + Math.random() * 0.08, c, 2 + Math.random() * 3));
        }
    }
    spawnPickupEffect(x, y) { this._sp(x, y, 15, '#00ffff', 30, 80, 0.3, 0.5, 2, 3); this._sp(x, y, 8, '#ffffff', 20, 60, 0.2, 0.4, 1, 2); }
    spawnPlayerHit(x, y) { this._sp(x, y, 12, '#ff4444', 60, 180, 0.2, 0.4, 2, 4); this._sp(x, y, 6, '#ffffff', 40, 120, 0.1, 0.2, 1, 2); }
    spawnFreeze(x, y) { this._sp(x, y, 20, '#44ddff', 40, 120, 0.5, 1.0, 2, 5); this._sp(x, y, 10, '#ffffff', 30, 80, 0.3, 0.6, 1, 3); }
    spawnNukeFlash(cx, cy, w, h) {
        for (let i = 0; i < 50 && this.particles.length < this.maxParticles; i++) {
            const px = cx + Math.random() * w, py = cy + Math.random() * h;
            this.particles.push(new Particle(px, py, 0, 0, 0.5 + Math.random() * 0.5, '#ffffff', 5 + Math.random() * 10));
        }
    }
    spawnFlame(x, y) {
        const cs = ['#ff4400', '#ff8800', '#ffcc00', '#ff2200'];
        for (let i = 0; i < 3 && this.particles.length < this.maxParticles; i++) {
            const c = cs[Math.floor(Math.random() * 4)], a = Math.random() * 6.28, sp = 20 + Math.random() * 40;
            this.particles.push(new Particle(x + (Math.random() - 0.5) * 15, y + (Math.random() - 0.5) * 15, Math.cos(a) * sp, Math.sin(a) * sp, 0.3 + Math.random() * 0.4, c, 2 + Math.random() * 3));
        }
    }
    spawnPowerUpCollect(x, y, color) { this._sp(x, y, 20, color, 50, 150, 0.3, 0.7, 2, 5); this._sp(x, y, 10, '#ffffff', 30, 100, 0.2, 0.4, 1, 3); }
}
