// ===== ENEMIES =====
// Enemy types, AI, special effects, rendering

// Base stats for each enemy type
const ENEMY_TYPES = {
    green: {
        name: 'Drone',
        baseHP: 20,
        baseDamage: 5,
        baseSpeed: 80,
        radius: 14,
        color: '#22cc44',
        glowColor: 'rgba(34, 204, 68, 0.3)',
        innerColor: '#118822',
        eyeColor: '#ccffcc',
        specialChance: 0.20,  // 20% per effect
        xpValue: 10
    },
    yellow: {
        name: 'Stalker',
        baseHP: 50,
        baseDamage: 10,
        baseSpeed: 100,
        radius: 17,
        color: '#ddcc22',
        glowColor: 'rgba(221, 204, 34, 0.3)',
        innerColor: '#aa9911',
        eyeColor: '#ffffcc',
        specialChance: 0.15,
        xpValue: 25
    },
    red: {
        name: 'Brute',
        baseHP: 100,
        baseDamage: 20,
        baseSpeed: 120,
        radius: 20,
        color: '#dd3333',
        glowColor: 'rgba(221, 51, 51, 0.3)',
        innerColor: '#991111',
        eyeColor: '#ffcccc',
        specialChance: 0.10,
        xpValue: 50
    },
    blue: {
        name: 'Elite',
        baseHP: 250,
        baseDamage: 35,
        baseSpeed: 140,
        radius: 22,
        color: '#3366ff',
        glowColor: 'rgba(51, 102, 255, 0.3)',
        innerColor: '#1133aa',
        eyeColor: '#ccddff',
        specialChance: 0.05,
        xpValue: 100
    },
    black: {
        name: 'Overlord',
        baseHP: 1000,
        baseDamage: 50,
        baseSpeed: 60,
        radius: 35,
        color: '#333333',
        glowColor: 'rgba(80, 0, 0, 0.4)',
        innerColor: '#111111',
        eyeColor: '#ff4444',
        specialChance: 0.02,
        xpValue: 500
    }
};

// Special effects
const SPECIAL_EFFECTS = {
    fast: {
        name: 'Fast',
        color: '#ffff00',
        symbol: '⚡',
        apply: (enemy) => { enemy.speed *= 1.5; }
    },
    slow: {
        name: 'Armored',
        color: '#8888ff',
        symbol: '🛡',
        apply: (enemy) => {
            enemy.speed *= 0.7;
            enemy.armor = 0.5; // takes 50% less damage
        }
    },
    moreHP: {
        name: 'Tough',
        color: '#00ff00',
        symbol: '♥',
        apply: (enemy) => {
            enemy.health *= 2;
            enemy.maxHealth *= 2;
            enemy.drawRadius *= 1.15;
        }
    },
    moreDamage: {
        name: 'Deadly',
        color: '#ff0000',
        symbol: '☠',
        apply: (enemy) => { enemy.damage *= 2; }
    }
};

class Enemy {
    constructor(x, y, typeName, waveMultiplier) {
        const type = ENEMY_TYPES[typeName];
        this.typeName = typeName;
        this.type = type;

        this.x = x;
        this.y = y;

        // Stats scaled by wave
        this.maxHealth = type.baseHP * waveMultiplier;
        this.health = this.maxHealth;
        this.damage = type.baseDamage * waveMultiplier;
        this.speed = type.baseSpeed;
        this.radius = type.radius;
        this.drawRadius = type.radius;
        this.armor = 0;  // damage reduction (0 = none, 0.5 = 50% less)

        this.alive = true;
        this.attackCooldown = 0;
        this.attackSpeed = 1; // attacks per second

        // Special effects
        this.specialEffects = [];
        this._rollSpecialEffects(type.specialChance);

        // Visual
        this.pulseTimer = Math.random() * Math.PI * 2;
        this.walkTimer = Math.random() * Math.PI * 2;
        this.tentaclePhase = Math.random() * Math.PI * 2;
        this.hitFlash = 0;

        // Is this a weapon-drop elite?
        this.dropsWeapon = false;
        this.dropWeaponIndex = -1;

        // Boss flag
        this.isBoss = typeName === 'black';
    }

    _rollSpecialEffects(chance) {
        const effectKeys = Object.keys(SPECIAL_EFFECTS);
        for (const key of effectKeys) {
            if (Math.random() < chance) {
                this.specialEffects.push(key);
                SPECIAL_EFFECTS[key].apply(this);
            }
        }
    }

    takeDamage(amount, game) {
        // Apply armor
        const actual = amount * (1 - this.armor);
        this.health -= actual;
        this.hitFlash = 0.1;

        // Knockback
        if (game && game.player) {
            const dx = this.x - game.player.x;
            const dy = this.y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                this.x += (dx / dist) * 3;
                this.y += (dy / dist) * 3;
            }
        }

        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
            return true; // dead
        }
        return false;
    }

    update(dt, game) {
        if (!this.alive) return;

        // Calculate direction to player
        const player = game.player;
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            dx /= dist;
            dy /= dist;
        }

        // Separation from other enemies (avoid stacking)
        let sepX = 0, sepY = 0;
        for (const other of game.enemies) {
            if (other === this || !other.alive) continue;
            const ox = this.x - other.x;
            const oy = this.y - other.y;
            const od = Math.sqrt(ox * ox + oy * oy);
            const minDist = this.radius + other.radius + 2;
            if (od < minDist && od > 0) {
                sepX += (ox / od) * (minDist - od) * 2;
                sepY += (oy / od) * (minDist - od) * 2;
            }
        }

        // Move toward player
        this.x += (dx * this.speed + sepX) * dt;
        this.y += (dy * this.speed + sepY) * dt;

        // Clamp to map
        this.x = Math.max(this.radius, Math.min(this.x, game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, game.map.height - this.radius));

        // Attack if close enough
        const attackRange = this.radius + player.radius + 5;
        if (dist < attackRange) {
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                player.takeDamage(this.damage);
                if (game.audio) game.audio.playPlayerHit();
                game.particles.spawnPlayerHit(player.x, player.y);
                game.camera.shake(4, 0.15);
                this.attackCooldown = 1 / this.attackSpeed;
            }
        } else {
            this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        }

        // Animation timers
        this.pulseTimer += dt * 5;
        this.walkTimer += dt * (this.speed / 15);
        this.tentaclePhase += dt * 8;
        this.hitFlash -= dt;
    }

    draw(ctx) {
        if (!this.alive) return;
        const type = this.type;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Calculate walk bob
        const bob = Math.sin(this.walkTimer) * 2;

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 3 + bob, this.drawRadius, this.drawRadius * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Glow for specials
        if (this.specialEffects.length > 0) {
            const glowSize = this.drawRadius * 1.8 + Math.sin(this.pulseTimer) * 4;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = this.specialEffects.includes('moreDamage') ? '#ff0000' :
                this.specialEffects.includes('fast') ? '#ffff00' :
                    this.specialEffects.includes('slow') ? '#4444ff' : '#00ff00';
            ctx.beginPath();
            ctx.arc(0, bob, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Tentacle legs (4-6 depending on type)
        const tentacleCount = this.isBoss ? 8 : (this.typeName === 'blue' ? 6 : 4);
        ctx.strokeStyle = type.innerColor;
        ctx.lineWidth = this.isBoss ? 3 : 2;
        for (let i = 0; i < tentacleCount; i++) {
            const baseAngle = (i / tentacleCount) * Math.PI * 2;
            const wave = Math.sin(this.tentaclePhase + i * 1.5) * 0.3;
            const len = this.drawRadius * 0.7 + Math.sin(this.tentaclePhase + i) * 3;
            const endX = Math.cos(baseAngle + wave) * (this.drawRadius + len);
            const endY = Math.sin(baseAngle + wave) * (this.drawRadius + len) + bob;
            const midX = Math.cos(baseAngle) * this.drawRadius;
            const midY = Math.sin(baseAngle) * this.drawRadius + bob;
            ctx.beginPath();
            ctx.moveTo(midX * 0.8, midY * 0.8);
            ctx.quadraticCurveTo(midX, midY, endX, endY);
            ctx.stroke();
        }

        // Body
        if (this.hitFlash > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = type.color;
        }
        ctx.strokeStyle = type.innerColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, bob, this.drawRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner detail
        ctx.fillStyle = type.innerColor;
        ctx.beginPath();
        ctx.arc(0, bob, this.drawRadius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (aimed at concept of player direction)
        const eyeSpread = this.drawRadius * 0.3;
        const eyeSize = this.isBoss ? 6 : 4;
        const pupilSize = this.isBoss ? 3 : 2;

        // Left eye
        ctx.fillStyle = type.eyeColor;
        ctx.beginPath();
        ctx.arc(-eyeSpread, -eyeSpread * 0.5 + bob, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Right eye
        ctx.beginPath();
        ctx.arc(eyeSpread, -eyeSpread * 0.5 + bob, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupils
        ctx.fillStyle = this.isBoss ? '#ff0000' : '#111';
        ctx.beginPath();
        ctx.arc(-eyeSpread + 1, -eyeSpread * 0.5 + bob, pupilSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeSpread + 1, -eyeSpread * 0.5 + bob, pupilSize, 0, Math.PI * 2);
        ctx.fill();

        // Mouth
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.beginPath();
        ctx.ellipse(0, eyeSpread * 0.4 + bob, this.drawRadius * 0.3, this.drawRadius * 0.15 + Math.sin(this.pulseTimer * 2) * 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Armor ring for slow special
        if (this.specialEffects.includes('slow')) {
            ctx.strokeStyle = 'rgba(100, 100, 255, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, bob, this.drawRadius + 5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Speed lines for fast special
        if (this.specialEffects.includes('fast')) {
            ctx.strokeStyle = 'rgba(255, 255, 0, 0.4)';
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                const ly = -8 + i * 8 + bob;
                ctx.beginPath();
                ctx.moveTo(-this.drawRadius - 10 - i * 3, ly);
                ctx.lineTo(-this.drawRadius - 3, ly);
                ctx.stroke();
            }
        }

        // Damage skull for moreDamage special
        if (this.specialEffects.includes('moreDamage')) {
            const pulse = 0.7 + Math.sin(this.pulseTimer * 3) * 0.3;
            ctx.globalAlpha = pulse;
            ctx.fillStyle = '#ff0000';
            ctx.font = `${this.isBoss ? 14 : 10}px serif`;
            ctx.textAlign = 'center';
            ctx.fillText('☠', 0, -this.drawRadius - 5 + bob);
            ctx.globalAlpha = 1;
        }

        // Boss crown/horns
        if (this.isBoss) {
            ctx.fillStyle = '#660000';
            ctx.strokeStyle = '#330000';
            ctx.lineWidth = 2;
            // Left horn
            ctx.beginPath();
            ctx.moveTo(-15, -this.drawRadius + bob);
            ctx.lineTo(-22, -this.drawRadius - 18 + bob);
            ctx.lineTo(-8, -this.drawRadius + 5 + bob);
            ctx.fill();
            ctx.stroke();
            // Right horn
            ctx.beginPath();
            ctx.moveTo(15, -this.drawRadius + bob);
            ctx.lineTo(22, -this.drawRadius - 18 + bob);
            ctx.lineTo(8, -this.drawRadius + 5 + bob);
            ctx.fill();
            ctx.stroke();
        }

        // Weapon drop indicator
        if (this.dropsWeapon) {
            const glow = 0.5 + Math.sin(this.pulseTimer * 2) * 0.5;
            ctx.globalAlpha = glow;
            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, bob, this.drawRadius + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // Special effect count badge
        if (this.specialEffects.length > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.beginPath();
            ctx.arc(this.drawRadius + 2, -this.drawRadius + bob, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '9px Orbitron, monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.specialEffects.length, this.drawRadius + 2, -this.drawRadius + bob);
            ctx.textBaseline = 'alphabetic';
        }

        // Health bar (for non-boss enemies above half damage)
        if (!this.isBoss && this.health < this.maxHealth) {
            const barWidth = this.drawRadius * 2;
            const barHeight = 3;
            const barY = -this.drawRadius - 12 + bob;

            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

            const hpRatio = this.health / this.maxHealth;
            const hpColor = hpRatio > 0.5 ? '#44ff44' : hpRatio > 0.25 ? '#ffaa00' : '#ff2222';
            ctx.fillStyle = hpColor;
            ctx.fillRect(-barWidth / 2, barY, barWidth * hpRatio, barHeight);
        }

        ctx.restore();
    }
}
