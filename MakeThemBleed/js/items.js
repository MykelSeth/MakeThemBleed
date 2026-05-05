// ===== ITEMS & POWER-UPS =====
// Drops from enemies: health, ammo, and power-ups

// ===== DROP ITEMS =====
const ITEM_TYPES = {
    medkit: {
        name: 'Medkit',
        color: '#22cc44',
        icon: '+',
        apply: (player) => {
            player.health = Math.min(player.health + CONFIG.ITEMS.medkitHeal, player.maxHealth);
        }
    },
    ammo_pistol: { name: 'Pistol Ammo', color: '#ffff00', icon: '◆', weaponIdx: 0, ammoAmount: CONFIG.ITEMS.ammoAmounts[0] },
    ammo_smg: { name: 'SMG Ammo', color: '#00ff88', icon: '◆', weaponIdx: 1, ammoAmount: CONFIG.ITEMS.ammoAmounts[1] },
    ammo_shotgun: { name: 'Shotgun Ammo', color: '#ff8800', icon: '◆', weaponIdx: 2, ammoAmount: CONFIG.ITEMS.ammoAmounts[2] },
    ammo_ar: { name: 'AR Ammo', color: '#00aaff', icon: '◆', weaponIdx: 3, ammoAmount: CONFIG.ITEMS.ammoAmounts[3] },
    ammo_minigun: { name: 'Minigun Ammo', color: '#ff44ff', icon: '◆', weaponIdx: 4, ammoAmount: CONFIG.ITEMS.ammoAmounts[4] }
};

// ===== POWER-UPS =====
const POWERUP_TYPES = {
    freeze: {
        name: 'FREEZE',
        color: '#44ddff',
        icon: '❄',
        duration: CONFIG.POWERUPS.freezeDuration,
        apply: (game) => {
            game.activePowerUps.freeze = CONFIG.POWERUPS.freezeDuration;
            for (const e of game.enemies) { e.frozen = true; e.frozenTimer = CONFIG.POWERUPS.freezeDuration; }
        }
    },
    flame: {
        name: 'INFERNO',
        color: '#ff6600',
        icon: '🔥',
        duration: CONFIG.POWERUPS.flameDuration,
        apply: (game) => {
            game.activePowerUps.flame = CONFIG.POWERUPS.flameDuration;
        }
    },
    allAmmo: {
        name: 'FULL AMMO',
        color: '#ffcc00',
        icon: '📦',
        duration: 0,
        apply: (game) => {
            const p = game.player;
            for (const wIdx of p.weapons) {
                const w = WEAPONS[wIdx];
                p.magazines[wIdx] = w.magSize;
                p.reserveAmmo[wIdx] = w.reserveAmmo;
            }
        }
    },
    unlimitedAmmo: {
        name: 'UNLIMITED',
        color: '#ffd700',
        icon: '∞',
        duration: CONFIG.POWERUPS.unlimitedAmmoDuration,
        apply: (game) => {
            game.activePowerUps.unlimitedAmmo = CONFIG.POWERUPS.unlimitedAmmoDuration;
        }
    },
    atomicBomb: {
        name: 'NUKE',
        color: '#ff0000',
        icon: '☢',
        duration: 0,
        apply: (game) => {
            game.activePowerUps.nuke = CONFIG.POWERUPS.nukeFlashDuration; // visual flash
            for (const e of game.enemies) {
                if (!e.isBoss && e.typeName !== 'blue') {
                    e.health = 0;
                    e.alive = false;
                    game.particles.spawnDeathBurst(e.x, e.y);
                    game.scoring.onEnemyKilled(e);
                    game.waveManager.totalKills++;
                }
            }
            game.camera.shake(15, 0.8);
            if (game.audio) game.audio.playNuke();
        }
    }
};

class DroppedItem {
    constructor(x, y, itemType, itemKey) {
        this.x = x;
        this.y = y;
        this.type = itemType;
        this.key = itemKey;
        this.radius = 14;
        this.collected = false;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.glowTimer = Math.random() * Math.PI * 2;
        this.lifetime = CONFIG.ITEMS.despawnTime;
    }

    update(dt) {
        this.bobTimer += dt * 3;
        this.glowTimer += dt * 4;
        this.lifetime -= dt;
        if (this.lifetime <= 0) this.collected = true;
    }

    draw(ctx) {
        if (this.collected) return;
        const bobY = this.y + Math.sin(this.bobTimer) * 3;
        const pulse = 0.8 + Math.sin(this.glowTimer) * 0.2;

        // Glow
        ctx.globalAlpha = 0.2 * pulse;
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(this.x, bobY, this.radius + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Body
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, bobY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.fillStyle = this.type.color;
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, bobY);
        ctx.textBaseline = 'alphabetic';
    }
}

class DroppedPowerUp {
    constructor(x, y, powerType, powerKey) {
        this.x = x;
        this.y = y;
        this.type = powerType;
        this.key = powerKey;
        this.radius = 18;
        this.collected = false;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.glowTimer = 0;
        this.lifetime = CONFIG.POWERUPS.despawnTime;
    }

    update(dt) {
        this.bobTimer += dt * 2;
        this.glowTimer += dt * 5;
        this.lifetime -= dt;
        if (this.lifetime <= 0) this.collected = true;
    }

    draw(ctx) {
        if (this.collected) return;
        const bobY = this.y + Math.sin(this.bobTimer) * 5;
        const pulse = 0.6 + Math.sin(this.glowTimer) * 0.4;
        const ringSize = this.radius + 10 + Math.sin(this.glowTimer * 0.7) * 5;

        // Outer ring pulse
        ctx.globalAlpha = 0.15 * pulse;
        ctx.fillStyle = this.type.color;
        ctx.beginPath();
        ctx.arc(this.x, bobY, ringSize, 0, Math.PI * 2);
        ctx.fill();

        // Spinning ring
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, bobY, this.radius + 4, this.glowTimer, this.glowTimer + Math.PI * 1.5);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Body
        ctx.fillStyle = '#111';
        ctx.strokeStyle = this.type.color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(this.x, bobY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icon
        ctx.fillStyle = this.type.color;
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type.icon, this.x, bobY);
        ctx.textBaseline = 'alphabetic';

        // Name
        ctx.fillStyle = this.type.color;
        ctx.font = 'bold 10px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = pulse;
        ctx.fillText(this.type.name, this.x, bobY + this.radius + 14);
        ctx.globalAlpha = 1;
    }
}

// ===== DROP LOGIC =====
function rollEnemyDrops(enemy, game) {
    const drops = [];

    // 15% chance for item
    if (Math.random() < CONFIG.ITEMS.dropChance) {
        if (Math.random() < CONFIG.ITEMS.medkitRatio) {
            drops.push(new DroppedItem(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                ITEM_TYPES.medkit, 'medkit'
            ));
        } else {
            // Random ammo from unlocked weapons
            const unlockedWeapons = game.player.weapons;
            if (unlockedWeapons.length > 0) {
                const wIdx = unlockedWeapons[Math.floor(Math.random() * unlockedWeapons.length)];
                const ammoKeys = ['ammo_pistol', 'ammo_smg', 'ammo_shotgun', 'ammo_ar', 'ammo_minigun'];
                const key = ammoKeys[wIdx];
                drops.push(new DroppedItem(
                    enemy.x + (Math.random() - 0.5) * 20,
                    enemy.y + (Math.random() - 0.5) * 20,
                    ITEM_TYPES[key], key
                ));
            }
        }
    }

    if (Math.random() < CONFIG.POWERUPS.dropChance) {
        const powerKeys = Object.keys(POWERUP_TYPES);
        const key = powerKeys[Math.floor(Math.random() * powerKeys.length)];
        drops.push(new DroppedPowerUp(
            enemy.x + (Math.random() - 0.5) * 30,
            enemy.y + (Math.random() - 0.5) * 30,
            POWERUP_TYPES[key], key
        ));
    }

    return drops;
}
