// ===== WEAPONS SYSTEM =====
// Weapon definitions and projectile class

const WEAPONS = [
    {
        name: 'Pistol',
        damage: 10,
        fireRate: 3,          // shots per second
        projectileCount: 1,
        spread: 0,            // radians
        projectileSpeed: 600,
        bulletSize: 3,
        bulletColor: '#ffff00',
        trailColor: '#ffaa00',
        knockback: 2
    },
    {
        name: 'SMG',
        damage: 8,
        fireRate: 10,
        projectileCount: 1,
        spread: 0.09,
        projectileSpeed: 700,
        bulletSize: 2.5,
        bulletColor: '#00ff88',
        trailColor: '#00aa44',
        knockback: 1
    },
    {
        name: 'Shotgun',
        damage: 15,
        fireRate: 1.5,
        projectileCount: 6,
        spread: 0.5,
        projectileSpeed: 500,
        bulletSize: 3,
        bulletColor: '#ff8800',
        trailColor: '#ff4400',
        knockback: 5
    },
    {
        name: 'Assault Rifle',
        damage: 15,
        fireRate: 7,
        projectileCount: 1,
        spread: 0.04,
        projectileSpeed: 900,
        bulletSize: 3,
        bulletColor: '#00aaff',
        trailColor: '#0066ff',
        knockback: 3
    },
    {
        name: 'Minigun',
        damage: 12,
        fireRate: 20,
        projectileCount: 1,
        spread: 0.1,
        projectileSpeed: 800,
        bulletSize: 2,
        bulletColor: '#ff44ff',
        trailColor: '#aa00ff',
        knockback: 1
    }
];

// Weapon drop definitions: which wave drops which weapon
const WEAPON_DROPS = {
    5: 1,   // Wave 5 → SMG (index 1)
    10: 2,  // Wave 10 → Shotgun (index 2)
    15: 3,  // Wave 15 → Assault Rifle (index 3)
    20: 4   // Wave 20 → Minigun (index 4)
};

class Projectile {
    constructor(x, y, angle, weapon) {
        // Apply spread
        const spreadAngle = angle + (Math.random() - 0.5) * weapon.spread;

        this.x = x;
        this.y = y;
        this.vx = Math.cos(spreadAngle) * weapon.projectileSpeed;
        this.vy = Math.sin(spreadAngle) * weapon.projectileSpeed;
        this.damage = weapon.damage;
        this.radius = weapon.bulletSize;
        this.color = weapon.bulletColor;
        this.trailColor = weapon.trailColor;
        this.knockback = weapon.knockback;
        this.life = 2; // seconds
        this.alive = true;
        this.prevX = x;
        this.prevY = y;
    }

    update(dt) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx) {
        if (!this.alive) return;

        // Trail
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = this.radius * 0.8;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Bullet
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// Weapon pickup on the ground
class WeaponPickup {
    constructor(x, y, weaponIndex) {
        this.x = x;
        this.y = y;
        this.weaponIndex = weaponIndex;
        this.radius = 20;
        this.collected = false;
        this.bobTimer = 0;
        this.glowTimer = 0;
    }

    update(dt) {
        this.bobTimer += dt * 3;
        this.glowTimer += dt * 2;
    }

    draw(ctx) {
        if (this.collected) return;
        const bobY = this.y + Math.sin(this.bobTimer) * 5;
        const glowSize = 25 + Math.sin(this.glowTimer) * 8;
        const weapon = WEAPONS[this.weaponIndex];

        // Outer glow
        ctx.globalAlpha = 0.15 + Math.sin(this.glowTimer) * 0.1;
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(this.x, bobY, glowSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Inner circle
        ctx.fillStyle = '#001a33';
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, bobY, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Weapon icon (simple rectangle)
        ctx.save();
        ctx.translate(this.x, bobY);
        ctx.fillStyle = weapon.bulletColor;
        ctx.fillRect(-10, -2, 20, 4);
        ctx.fillRect(-3, -5, 6, 10);
        ctx.restore();

        // Name label
        ctx.fillStyle = '#00ffff';
        ctx.font = '11px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, this.x, bobY + 30);
    }
}
