// ===== ENEMIES =====
// 5 alien variants per type, terrifying cosmic horror designs

const ENEMY_TYPES = CONFIG.ENEMIES;

const SPECIAL_EFFECTS = {};
const SE_COLORS = { fast: '#ffff00', slow: '#8888ff', moreHP: '#00ff00', moreDamage: '#ff0000' };
for (const [key, val] of Object.entries(CONFIG.SPECIAL_EFFECTS)) {
    SPECIAL_EFFECTS[key] = {
        name: val.name,
        color: SE_COLORS[key] || '#fff',
        apply: (e) => {
            e.speed *= val.speedMult;
            if (val.armorAdd) e.armor = val.armorAdd;
            if (val.hpMult !== 1) { e.health *= val.hpMult; e.maxHealth *= val.hpMult; }
            if (val.dmgMult !== 1) e.damage *= val.dmgMult;
            if (val.radiusMult) e.drawRadius *= val.radiusMult;
        }
    };
}

// Variant drawing configs for distinct silhouettes
const VARIANT_CONFIGS = {
    green: [
        { body: 'flat', limbs: 6, limbStyle: 'spider', eyes: 4, eyeSize: 2, mouth: 'mandibles', features: [] },
        { body: 'round', limbs: 4, limbStyle: 'tentacle', eyes: 0, mouth: 'circular', features: ['sucker'] },
        { body: 'worm', limbs: 0, limbStyle: 'none', eyes: 2, eyeSize: 2, mouth: 'vertical', features: ['segments'] },
        { body: 'angular', limbs: 2, limbStyle: 'scythe', eyes: 2, eyeSize: 3, mouth: 'slit', features: [] },
        { body: 'bloated', limbs: 4, limbStyle: 'stubby', eyes: 3, eyeSize: 2, mouth: 'huge', features: ['pustules'] }
    ],
    yellow: [
        { body: 'tall', limbs: 4, limbStyle: 'hinged', eyes: 2, eyeSize: 3, mouth: 'wide', features: ['hunched'] },
        { body: 'wide', limbs: 2, limbStyle: 'thick', eyes: 2, eyeSize: 4, mouth: 'gaping', features: ['muscular'] },
        { body: 'ghost', limbs: 6, limbStyle: 'tendril', eyes: 0, mouth: 'none', features: ['trail'] },
        { body: 'hex', limbs: 6, limbStyle: 'stubby', eyes: 2, eyeSize: 2, mouth: 'slit', features: ['shell'] },
        { body: 'thin', limbs: 4, limbStyle: 'spindly', eyes: 1, eyeSize: 6, mouth: 'huge', features: ['screamer'] }
    ],
    red: [
        { body: 'massive', limbs: 2, limbStyle: 'thick', eyes: 2, eyeSize: 3, mouth: 'under', features: ['armored'] },
        { body: 'wide', limbs: 4, limbStyle: 'thick', eyes: 2, eyeSize: 2, mouth: 'slit', features: ['horn'] },
        { body: 'round', limbs: 4, limbStyle: 'claw', eyes: 4, eyeSize: 2, mouth: 'maw', features: ['spikes'] },
        { body: 'bloated', limbs: 4, limbStyle: 'stubby', eyes: 1, eyeSize: 5, mouth: 'belly', features: ['veiny'] },
        { body: 'irregular', limbs: 6, limbStyle: 'tentacle', eyes: 6, eyeSize: 1.5, mouth: 'none', features: ['pustules', 'veiny'] }
    ],
    blue: [
        { body: 'tall', limbs: 4, limbStyle: 'blade', eyes: 2, eyeSize: 4, mouth: 'slit', features: ['armor', 'glow_lines'] },
        { body: 'wide', limbs: 8, limbStyle: 'spider', eyes: 6, eyeSize: 2, mouth: 'under', features: ['sac'] },
        { body: 'skeletal', limbs: 2, limbStyle: 'scythe', eyes: 2, eyeSize: 5, mouth: 'none', features: ['floating', 'ribcage'] }
    ],
    black: [
        { body: 'massive', limbs: 8, limbStyle: 'tentacle', eyes: 8, eyeSize: 3, mouth: 'maw', features: ['horns', 'bone_armor', 'veiny', 'pulsing'] }
    ]
};

class Enemy {
    constructor(x, y, typeName, waveMultiplier) {
        const type = ENEMY_TYPES[typeName];
        this.typeName = typeName;
        this.type = type;
        this.x = x; this.y = y;
        this.maxHealth = type.baseHP * waveMultiplier;
        this.health = this.maxHealth;
        this.damage = type.baseDamage * waveMultiplier;
        this.speed = type.baseSpeed;
        this.radius = type.radius;
        this.drawRadius = type.radius;
        this.armor = 0;
        this.alive = true;
        this.attackCooldown = 0;
        this.specialEffects = [];
        // Variant
        this.variant = Math.floor(Math.random() * type.variants);
        this.variantConfig = VARIANT_CONFIGS[typeName][this.variant];
        // Animation
        this.pulseTimer = Math.random() * 6.28;
        this.walkTimer = Math.random() * 6.28;
        this.tentaclePhase = Math.random() * 6.28;
        this.hitFlash = 0;
        // Flags
        this.dropsWeapon = false;
        this.dropWeaponIndex = -1;
        this.isBoss = typeName === 'black';
        this.frozen = false;
        this.frozenTimer = 0;
    }

    applySpecialEffects(chance) {
        for (const key of Object.keys(SPECIAL_EFFECTS)) {
            if (Math.random() < chance) {
                this.specialEffects.push(key);
                SPECIAL_EFFECTS[key].apply(this);
            }
        }
    }

    takeDamage(amount, game) {
        const actual = amount * (1 - this.armor);
        this.health -= actual;
        this.hitFlash = 0.1;
        if (game && game.player) {
            const dx = this.x - game.player.x, dy = this.y - game.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) { this.x += (dx / dist) * 3; this.y += (dy / dist) * 3; }
        }
        if (this.health <= 0) { this.health = 0; this.alive = false; return true; }
        return false;
    }

    update(dt, game) {
        if (!this.alive) return;
        // Frozen
        if (this.frozen) {
            this.frozenTimer -= dt;
            if (this.frozenTimer <= 0) this.frozen = false;
            this.pulseTimer += dt * 2;
            return;
        }
        const p = game.player;
        let dx = p.x - this.x, dy = p.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) { dx /= dist; dy /= dist; }
        // Separation
        let sx = 0, sy = 0;
        for (const o of game.enemies) {
            if (o === this || !o.alive) continue;
            const ox = this.x - o.x, oy = this.y - o.y, od = Math.sqrt(ox * ox + oy * oy);
            const md = this.radius + o.radius + 2;
            if (od < md && od > 0) { sx += (ox / od) * (md - od) * 2; sy += (oy / od) * (md - od) * 2; }
        }
        this.x += (dx * this.speed + sx) * dt;
        this.y += (dy * this.speed + sy) * dt;
        this.x = Math.max(this.radius, Math.min(this.x, game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, game.map.height - this.radius));
        // Attack
        if (dist < this.radius + p.radius + 5) {
            this.attackCooldown -= dt;
            if (this.attackCooldown <= 0) {
                p.takeDamage(this.damage);
                if (game.audio) { game.audio.playAlienBite(); game.audio.playPlayerHit(); }
                game.particles.spawnPlayerHit(p.x, p.y);
                game.camera.shake(5, 0.15);
                this.attackCooldown = 1;
            }
        } else { this.attackCooldown = Math.max(0, this.attackCooldown - dt); }
        this.pulseTimer += dt * 5; this.walkTimer += dt * (this.speed / 15); this.tentaclePhase += dt * 8; this.hitFlash -= dt;
    }

    draw(ctx) {
        if (!this.alive) return;
        const t = this.type, v = this.variantConfig, r = this.drawRadius;
        ctx.save();
        ctx.translate(this.x, this.y);
        const bob = Math.sin(this.walkTimer) * 2;

        // Frozen tint
        if (this.frozen) { ctx.globalAlpha = 0.7; }

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath(); ctx.ellipse(2, 3 + bob, r, r * 0.6, 0, 0, 6.28); ctx.fill();

        // Special glow
        if (this.specialEffects.length > 0) {
            const gs = r * 1.8 + Math.sin(this.pulseTimer) * 4;
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = this.specialEffects.includes('moreDamage') ? '#ff0000' : this.specialEffects.includes('fast') ? '#ffff00' : this.specialEffects.includes('slow') ? '#4444ff' : '#00ff00';
            ctx.beginPath(); ctx.arc(0, bob, gs, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
        }

        // Limbs
        this._drawLimbs(ctx, r, bob, v);
        // Body
        this._drawBody(ctx, r, bob, v, t);
        // Eyes
        this._drawEyes(ctx, r, bob, v, t);
        // Mouth
        this._drawMouth(ctx, r, bob, v, t);
        // Features
        this._drawFeatures(ctx, r, bob, v, t);

        // Armor ring (slow special)
        if (this.specialEffects.includes('slow')) {
            ctx.strokeStyle = 'rgba(100,100,255,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([4, 4]);
            ctx.beginPath(); ctx.arc(0, bob, r + 5, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
        }
        // Speed lines (fast)
        if (this.specialEffects.includes('fast')) {
            ctx.strokeStyle = 'rgba(255,255,0,0.4)'; ctx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) { const ly = -8 + i * 8 + bob; ctx.beginPath(); ctx.moveTo(-r - 10 - i * 3, ly); ctx.lineTo(-r - 3, ly); ctx.stroke(); }
        }
        // Deadly skull
        if (this.specialEffects.includes('moreDamage')) {
            ctx.globalAlpha = 0.7 + Math.sin(this.pulseTimer * 3) * 0.3; ctx.fillStyle = '#ff0000'; ctx.font = `${this.isBoss ? 14 : 10}px serif`; ctx.textAlign = 'center'; ctx.fillText('☠', 0, -r - 5 + bob); ctx.globalAlpha = 1;
        }
        // Boss horns
        if (this.isBoss) {
            ctx.fillStyle = '#440000'; ctx.strokeStyle = '#220000'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(-18, -r + bob); ctx.lineTo(-28, -r - 22 + bob); ctx.lineTo(-8, -r + 5 + bob); ctx.fill(); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(18, -r + bob); ctx.lineTo(28, -r - 22 + bob); ctx.lineTo(8, -r + 5 + bob); ctx.fill(); ctx.stroke();
        }
        // Weapon drop indicator
        if (this.dropsWeapon) {
            ctx.globalAlpha = 0.5 + Math.sin(this.pulseTimer * 2) * 0.5; ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, bob, r + 10, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1;
        }
        // Special count badge
        if (this.specialEffects.length > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.arc(r + 2, -r + bob, 8, 0, 6.28); ctx.fill();
            ctx.fillStyle = '#fff'; ctx.font = '10px Orbitron,monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.specialEffects.length, r + 2, -r + bob); ctx.textBaseline = 'alphabetic';
        }
        // HP bar (non-boss)
        if (!this.isBoss && this.health < this.maxHealth) {
            const bw = r * 2, bh = 4, by = -r - 14 + bob;
            ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(-bw / 2, by, bw, bh);
            const hr = this.health / this.maxHealth; ctx.fillStyle = hr > 0.5 ? '#44ff44' : hr > 0.25 ? '#ffaa00' : '#ff2222'; ctx.fillRect(-bw / 2, by, bw * hr, bh);
        }
        // Frozen overlay
        if (this.frozen) {
            ctx.strokeStyle = 'rgba(100,200,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, bob, r + 3, 0, 6.28); ctx.stroke();
            ctx.fillStyle = 'rgba(100,200,255,0.15)'; ctx.beginPath(); ctx.arc(0, bob, r, 0, 6.28); ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    _drawLimbs(ctx, r, bob, v) {
        if (v.limbs === 0) return;
        const phase = this.tentaclePhase;
        ctx.lineWidth = this.isBoss ? 3 : 2;
        for (let i = 0; i < v.limbs; i++) {
            const base = (i / v.limbs) * 6.28;
            const wave = Math.sin(phase + i * 1.5) * 0.3;
            const len = r * 0.6 + Math.sin(phase + i) * 4;
            ctx.strokeStyle = this.hitFlash > 0 ? '#fff' : this.type.inner;
            ctx.beginPath();
            const sx = Math.cos(base) * r * 0.7, sy = Math.sin(base) * r * 0.7 + bob;
            const ex = Math.cos(base + wave) * (r + len), ey = Math.sin(base + wave) * (r + len) + bob;
            if (v.limbStyle === 'scythe' || v.limbStyle === 'blade') {
                // Curved blade limb
                const mx = (sx + ex) / 2 + Math.cos(base + 1.57) * 10, my = (sy + ey) / 2 + Math.sin(base + 1.57) * 10;
                ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, ex, ey);
                // Blade tip
                ctx.lineTo(ex + Math.cos(base + wave) * 8, ey + Math.sin(base + wave) * 8);
            } else if (v.limbStyle === 'tentacle' || v.limbStyle === 'tendril') {
                // Wavy tentacle
                const mx = sx + (ex - sx) * 0.5 + Math.sin(phase * 2 + i) * 8, my = sy + (ey - sy) * 0.5 + Math.cos(phase * 2 + i) * 8;
                ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, ex, ey);
            } else if (v.limbStyle === 'hinged') {
                // Jointed leg
                const mx = Math.cos(base + 0.3) * (r + len * 0.4), my = Math.sin(base + 0.3) * (r + len * 0.4) + bob - 5;
                ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.lineTo(ex, ey);
            } else {
                // Simple leg/spider leg
                ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
            }
            ctx.stroke();
            // Claw tip for claw style
            if (v.limbStyle === 'claw') {
                ctx.fillStyle = this.type.inner;
                ctx.beginPath(); ctx.arc(ex, ey, 2.5, 0, 6.28); ctx.fill();
            }
        }
    }

    _drawBody(ctx, r, bob, v, t) {
        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : t.color;
        ctx.strokeStyle = t.inner;
        ctx.lineWidth = 2;
        ctx.beginPath();
        if (v.body === 'flat') { ctx.ellipse(0, bob, r * 1.2, r * 0.7, 0, 0, 6.28); }
        else if (v.body === 'worm') { ctx.ellipse(0, bob, r * 0.6, r * 1.3, 0, 0, 6.28); }
        else if (v.body === 'tall' || v.body === 'skeletal') { ctx.ellipse(0, bob, r * 0.75, r * 1.15, 0, 0, 6.28); }
        else if (v.body === 'wide' || v.body === 'massive') { ctx.ellipse(0, bob, r * 1.15, r * 0.85, 0, 0, 6.28); }
        else if (v.body === 'angular' || v.body === 'hex') {
            for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28, px = Math.cos(a) * r, py = Math.sin(a) * r + bob; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath();
        }
        else if (v.body === 'bloated') { ctx.ellipse(0, bob + 2, r * 1.1, r * 1.1, 0, 0, 6.28); }
        else if (v.body === 'thin') { ctx.ellipse(0, bob, r * 0.55, r * 1.2, 0, 0, 6.28); }
        else if (v.body === 'ghost') { ctx.ellipse(0, bob - 3, r * 0.9, r * 1.1, 0, 0, 6.28); }
        else if (v.body === 'irregular') {
            ctx.moveTo(r * 0.8, bob); ctx.quadraticCurveTo(r * 1.1, bob - r * 0.5, -r * 0.3, bob - r); ctx.quadraticCurveTo(-r * 1.2, bob, 0, bob + r); ctx.quadraticCurveTo(r * 0.5, bob + r * 0.3, r * 0.8, bob);
        }
        else { ctx.arc(0, bob, r, 0, 6.28); }
        ctx.fill(); ctx.stroke();

        // Inner body detail
        ctx.fillStyle = t.inner; ctx.globalAlpha = 0.6;
        ctx.beginPath(); ctx.arc(0, bob, r * 0.5, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
    }

    _drawEyes(ctx, r, bob, v, t) {
        const count = v.eyes || 0;
        if (count === 0) return;
        const eyeR = v.eyeSize || 3;
        const pupilR = eyeR * 0.5;
        if (count === 1) {
            ctx.fillStyle = t.eye; ctx.beginPath(); ctx.arc(0, -r * 0.15 + bob, eyeR, 0, 6.28); ctx.fill();
            ctx.fillStyle = this.isBoss ? '#ff0000' : '#111'; ctx.beginPath(); ctx.arc(1, -r * 0.15 + bob, pupilR, 0, 6.28); ctx.fill();
        } else if (count <= 3) {
            const spread = r * 0.3;
            for (let i = 0; i < count; i++) {
                const ex = (i - count / 2 + 0.5) * spread, ey = -r * 0.2 + bob;
                ctx.fillStyle = t.eye; ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, 6.28); ctx.fill();
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex + 1, ey, pupilR, 0, 6.28); ctx.fill();
            }
        } else {
            // Cluster of eyes
            for (let i = 0; i < count; i++) {
                const a = (i / count) * 6.28 - 1.57, dist = r * 0.3;
                const ex = Math.cos(a) * dist, ey = Math.sin(a) * dist + bob;
                ctx.fillStyle = t.eye; ctx.beginPath(); ctx.arc(ex, ey, eyeR, 0, 6.28); ctx.fill();
                ctx.fillStyle = this.isBoss ? '#ff0000' : '#111'; ctx.beginPath(); ctx.arc(ex + 0.5, ey, pupilR, 0, 6.28); ctx.fill();
            }
        }
    }

    _drawMouth(ctx, r, bob, v, t) {
        const pulse = Math.sin(this.pulseTimer * 2) * 0.3;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        switch (v.mouth) {
            case 'mandibles':
                ctx.strokeStyle = t.inner; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.3 + bob); ctx.lineTo(-r * 0.5, r * 0.55 + bob); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(r * 0.3, r * 0.3 + bob); ctx.lineTo(r * 0.5, r * 0.55 + bob); ctx.stroke();
                break;
            case 'circular':
                ctx.beginPath(); ctx.arc(0, r * 0.2 + bob, r * 0.2 + pulse * 2, 0, 6.28); ctx.fill();
                // Teeth ring
                ctx.strokeStyle = t.eye; ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.12 + 0, Math.sin(a) * r * 0.12 + r * 0.2 + bob); ctx.lineTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25 + r * 0.2 + bob); ctx.stroke(); }
                break;
            case 'vertical':
                ctx.beginPath(); ctx.ellipse(0, r * 0.1 + bob, r * 0.1, r * 0.35 + pulse * 3, 0, 0, 6.28); ctx.fill(); break;
            case 'wide': case 'gaping': case 'huge':
                ctx.beginPath(); ctx.ellipse(0, r * 0.35 + bob, r * 0.4 + pulse * 3, r * 0.15 + pulse * 2, 0, 0, 6.28); ctx.fill();
                // Teeth
                ctx.fillStyle = t.eye;
                for (let i = 0; i < 5; i++) { ctx.fillRect(-r * 0.35 + i * r * 0.15, r * 0.25 + bob, 3, 4); }
                break;
            case 'slit':
                ctx.beginPath(); ctx.ellipse(0, r * 0.3 + bob, r * 0.3, r * 0.05 + pulse, 0, 0, 6.28); ctx.fill(); break;
            case 'maw': case 'belly':
                ctx.beginPath(); ctx.arc(0, bob, r * 0.35 + pulse * 3, 0.3, 2.84); ctx.fill();
                ctx.fillStyle = '#220000'; ctx.beginPath(); ctx.arc(0, bob, r * 0.25, 0.5, 2.64); ctx.fill();
                break;
            case 'under':
                ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(0, r * 0.5 + bob, r * 0.25, r * 0.08 + pulse, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; break;
        }
    }

    _drawFeatures(ctx, r, bob, v, t) {
        for (const f of v.features) {
            switch (f) {
                case 'segments':
                    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
                    for (let i = 1; i < 4; i++) { const sy = bob - r * 1.3 + i * (r * 2.6 / 4); ctx.beginPath(); ctx.moveTo(-r * 0.5, sy); ctx.lineTo(r * 0.5, sy); ctx.stroke(); }
                    break;
                case 'pustules':
                    for (let i = 0; i < 4; i++) {
                        const a = i * 1.8 + this.pulseTimer * 0.1, px = Math.cos(a) * r * 0.6, py = Math.sin(a) * r * 0.6 + bob;
                        ctx.fillStyle = 'rgba(180,200,0,0.5)'; ctx.beginPath(); ctx.arc(px, py, 3 + Math.sin(this.pulseTimer + i) * 1, 0, 6.28); ctx.fill();
                    }
                    break;
                case 'veiny':
                    ctx.strokeStyle = 'rgba(150,0,0,0.3)'; ctx.lineWidth = 1;
                    for (let i = 0; i < 5; i++) {
                        const a = i * 1.3, sx = Math.cos(a) * r * 0.3, sy = Math.sin(a) * r * 0.3 + bob;
                        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + Math.cos(a + 1) * r * 0.4, sy + Math.sin(a + 1) * r * 0.4, Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9 + bob); ctx.stroke();
                    }
                    break;
                case 'horn':
                    ctx.fillStyle = t.inner; ctx.beginPath(); ctx.moveTo(0, -r + bob); ctx.lineTo(-5, -r - 12 + bob); ctx.lineTo(5, -r - 12 + bob); ctx.closePath(); ctx.fill(); break;
                case 'spikes':
                    ctx.fillStyle = t.inner;
                    for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r + bob); ctx.lineTo(Math.cos(a) * (r + 8), Math.sin(a) * (r + 8) + bob); ctx.lineTo(Math.cos(a + 0.2) * r, Math.sin(a + 0.2) * r + bob); ctx.fill(); }
                    break;
                case 'armor': case 'bone_armor':
                    ctx.strokeStyle = 'rgba(200,200,200,0.3)'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(0, bob, r * 0.85, -0.5, 0.5); ctx.stroke();
                    ctx.beginPath(); ctx.arc(0, bob, r * 0.85, 2.6, 3.6); ctx.stroke();
                    break;
                case 'glow_lines':
                    ctx.strokeStyle = 'rgba(100,150,255,0.4)'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.5 + bob); ctx.lineTo(0, -r * 0.8 + bob); ctx.lineTo(r * 0.5, -r * 0.5 + bob); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.3 + bob); ctx.lineTo(0, r * 0.6 + bob); ctx.lineTo(r * 0.3, r * 0.3 + bob); ctx.stroke();
                    break;
                case 'shell':
                    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.arc(0, bob, r * 0.8, 0, 3.14); ctx.stroke();
                    ctx.beginPath(); ctx.arc(0, bob, r * 0.6, 0, 3.14); ctx.stroke();
                    break;
                case 'trail':
                    ctx.globalAlpha = 0.2; ctx.fillStyle = t.color;
                    for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, bob + i * 8, r * (1 - i * 0.2), 0, 6.28); ctx.fill(); }
                    ctx.globalAlpha = 1;
                    break;
                case 'pulsing':
                    const p = 0.5 + Math.sin(this.pulseTimer * 3) * 0.5;
                    ctx.globalAlpha = p * 0.2; ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(0, bob, r * 1.3, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
                    break;
                case 'sac':
                    ctx.fillStyle = 'rgba(60,30,80,0.5)'; ctx.beginPath(); ctx.ellipse(0, r * 0.6 + bob, r * 0.4, r * 0.25, 0, 0, 6.28); ctx.fill(); break;
                case 'ribcage':
                    ctx.strokeStyle = 'rgba(200,200,200,0.2)'; ctx.lineWidth = 1;
                    for (let i = 0; i < 4; i++) { const ry = bob - r * 0.3 + i * r * 0.2; ctx.beginPath(); ctx.ellipse(0, ry, r * 0.4, r * 0.05, 0, 0, 3.14); ctx.stroke(); }
                    break;
                case 'floating':
                    ctx.globalAlpha = 0.1; ctx.fillStyle = t.color;
                    ctx.beginPath(); ctx.ellipse(0, r + 5, r * 0.5, 3, 0, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
                    break;
            }
        }
    }
}
