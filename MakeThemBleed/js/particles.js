// ===== PARTICLE SYSTEM =====
// Blood splatters, muzzle flash, death effects

class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
        this.alive = true;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx) {
        if (!this.alive) return;
        const alpha = Math.max(0, this.life / this.maxLife);
        const size = this.size * (0.3 + 0.7 * alpha);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 500;
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }

    _spawn(x, y, count, color, speedMin, speedMax, lifeMin, lifeMax, sizeMin, sizeMax) {
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            const life = lifeMin + Math.random() * (lifeMax - lifeMin);
            const size = sizeMin + Math.random() * (sizeMax - sizeMin);
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                life, color, size
            ));
        }
    }

    // Blood splatter when enemy is hit
    spawnBlood(x, y, count) {
        count = count || 5;
        const colors = ['#cc0000', '#ff0000', '#990000', '#ff3333', '#880000'];
        for (let i = 0; i < count && this.particles.length < this.maxParticles; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            const life = 0.3 + Math.random() * 0.5;
            const size = 1.5 + Math.random() * 3;
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                life, color, size
            ));
        }
    }

    // Larger blood burst on enemy death
    spawnDeathBurst(x, y) {
        const colors = ['#cc0000', '#ff0000', '#990000', '#660000', '#ff2222'];
        for (let i = 0; i < 20 && this.particles.length < this.maxParticles; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 250;
            const life = 0.4 + Math.random() * 0.8;
            const size = 2 + Math.random() * 5;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                life, color, size
            ));
        }
    }

    // Muzzle flash
    spawnMuzzleFlash(x, y, angle) {
        const colors = ['#ffff00', '#ffaa00', '#ff8800', '#ffffff'];
        for (let i = 0; i < 4 && this.particles.length < this.maxParticles; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const spread = (Math.random() - 0.5) * 0.4;
            const speed = 100 + Math.random() * 200;
            const life = 0.05 + Math.random() * 0.08;
            const size = 2 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle + spread) * speed,
                Math.sin(angle + spread) * speed,
                life, color, size
            ));
        }
    }

    // Pickup glow
    spawnPickupEffect(x, y) {
        const colors = ['#00ffff', '#00aaff', '#44ffff', '#ffffff'];
        for (let i = 0; i < 15 && this.particles.length < this.maxParticles; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 80;
            const life = 0.3 + Math.random() * 0.5;
            const size = 2 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                life, color, size
            ));
        }
    }

    // Player hit flash
    spawnPlayerHit(x, y) {
        this._spawn(x, y, 10, '#ff4444', 60, 180, 0.2, 0.4, 2, 4);
        this._spawn(x, y, 5, '#ffffff', 40, 120, 0.1, 0.2, 1, 2);
    }
}
