// ===== PLAYER =====
// Soldier model with weapon-specific visuals, reload, backward slowdown
class Player {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.radius = CONFIG.PLAYER.radius;
        this.speed = CONFIG.PLAYER.speed;
        this.health = CONFIG.PLAYER.health; this.maxHealth = CONFIG.PLAYER.health;
        this.angle = 0;
        this.weapons = [0]; // start with Pistol
        this.currentWeaponIdx = 0;
        this.fireCooldown = 0;
        // Magazine system
        this.magazines = { 0: WEAPONS[0].magSize };
        this.reserveAmmo = { 0: WEAPONS[0].reserveAmmo };
        this.isReloading = false;
        this.reloadTimer = 0;
        // Damage
        this.damageCooldown = 0; this.damageFlash = 0; this.alive = true;
        // Animation
        this.walkTimer = 0; this.muzzleFlash = 0;
        this.footstepTimer = 0;
        // Power-up state
        this.unlimitedAmmo = false;
    }
    get currentWeapon() { return WEAPONS[this.weapons[this.currentWeaponIdx]]; }
    get currentWeaponIndex() { return this.weapons[this.currentWeaponIdx]; }
    get currentMag() { return this.magazines[this.currentWeaponIndex] || 0; }
    get currentReserve() { return this.reserveAmmo[this.currentWeaponIndex] || 0; }

    addWeapon(weaponIndex) {
        if (!this.weapons.includes(weaponIndex)) {
            this.weapons.push(weaponIndex);
            this.weapons.sort((a, b) => a - b);
            this.magazines[weaponIndex] = WEAPONS[weaponIndex].magSize;
            this.reserveAmmo[weaponIndex] = WEAPONS[weaponIndex].reserveAmmo;
            this.currentWeaponIdx = this.weapons.indexOf(weaponIndex);
            this.isReloading = false;
        }
    }
    addAmmo(weaponIndex, amount) {
        if (this.weapons.includes(weaponIndex)) {
            this.reserveAmmo[weaponIndex] = Math.min(
                (this.reserveAmmo[weaponIndex] || 0) + amount,
                WEAPONS[weaponIndex].reserveAmmo * 2
            );
        }
    }
    switchWeapon(num) {
        const idx = this.weapons.indexOf(num - 1);
        if (idx !== -1 && idx !== this.currentWeaponIdx) { this.currentWeaponIdx = idx; this.isReloading = false; }
    }
    startReload(game) {
        if (this.isReloading) return;
        const w = this.currentWeapon, wi = this.currentWeaponIndex;
        if ((this.magazines[wi] || 0) >= w.magSize) return;
        if ((this.reserveAmmo[wi] || 0) <= 0 && !this.unlimitedAmmo) return;
        this.isReloading = true;
        this.reloadTimer = w.reloadTime;
        if (game && game.audio) game.audio.playReload();
    }
    takeDamage(amount) {
        if (this.damageCooldown > 0) return;
        this.health -= amount;
        this.damageCooldown = CONFIG.PLAYER.damageCooldown;
        this.damageFlash = 0.2;
        if (this.health <= 0) { this.health = 0; this.alive = false; }
    }
    update(dt, game) {
        if (!this.alive) return;
        let dx = 0, dy = 0;
        if (game.keys['w'] || game.keys['arrowup']) dy -= 1;
        if (game.keys['s'] || game.keys['arrowdown']) dy += 1;
        if (game.keys['a'] || game.keys['arrowleft']) dx -= 1;
        if (game.keys['d'] || game.keys['arrowright']) dx += 1;
        if (dx !== 0 && dy !== 0) { const l = Math.sqrt(dx * dx + dy * dy); dx /= l; dy /= l; }

        // Aim angle
        this.angle = Math.atan2(game.mouse.worldY - this.y, game.mouse.worldX - this.x);

        // Backward movement slowdown
        let speedMult = 1.0;
        if (dx !== 0 || dy !== 0) {
            const moveAngle = Math.atan2(dy, dx);
            let angleDiff = Math.abs(moveAngle - this.angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
            speedMult = 1.0 - (angleDiff / Math.PI) * CONFIG.PLAYER.backwardSpeedPenalty;
        }
        this.x += dx * this.speed * speedMult * dt;
        this.y += dy * this.speed * speedMult * dt;

        // Walk animation & footsteps
        if (dx !== 0 || dy !== 0) {
            this.walkTimer += dt * 10;
            this.footstepTimer -= dt;
            if (this.footstepTimer <= 0) {
                if (game.audio) game.audio.playPlayerFootstep();
                this.footstepTimer = CONFIG.PLAYER.footstepInterval;
            }
        }
        // Clamp
        this.x = Math.max(this.radius, Math.min(this.x, game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, game.map.height - this.radius));

        // Reload
        if (this.isReloading) {
            this.reloadTimer -= dt;
            if (this.reloadTimer <= 0) {
                const w = this.currentWeapon, wi = this.currentWeaponIndex;
                const needed = w.magSize - (this.magazines[wi] || 0);
                if (this.unlimitedAmmo) {
                    this.magazines[wi] = w.magSize;
                } else {
                    const avail = Math.min(needed, this.reserveAmmo[wi] || 0);
                    this.magazines[wi] = (this.magazines[wi] || 0) + avail;
                    this.reserveAmmo[wi] -= avail;
                }
                this.isReloading = false;
            }
        }
        // Shooting
        this.fireCooldown -= dt;
        if (game.mouse.down && this.fireCooldown <= 0 && !this.isReloading) {
            if ((this.magazines[this.currentWeaponIndex] || 0) > 0) {
                this.shoot(game);
            } else {
                this.startReload(game);
            }
        }
        // R to reload
        if (game.keys['r']) { this.startReload(game); game.keys['r'] = false; }
        // Weapon switching
        for (let i = 1; i <= 5; i++) { if (game.keys[String(i)]) { this.switchWeapon(i); game.keys[String(i)] = false; } }
        if (game.scrollDelta !== 0) {
            this.currentWeaponIdx += game.scrollDelta > 0 ? 1 : -1;
            if (this.currentWeaponIdx < 0) this.currentWeaponIdx = this.weapons.length - 1;
            if (this.currentWeaponIdx >= this.weapons.length) this.currentWeaponIdx = 0;
            game.scrollDelta = 0; this.isReloading = false;
        }
        // Unlimited ammo power-up
        this.unlimitedAmmo = game.activePowerUps && game.activePowerUps.unlimitedAmmo > 0;
        // Cooldowns
        this.damageCooldown -= dt; this.damageFlash -= dt; this.muzzleFlash -= dt;
    }
    shoot(game) {
        const w = this.currentWeapon;
        this.fireCooldown = 1 / w.fireRate;
        if (!this.unlimitedAmmo) { this.magazines[this.currentWeaponIndex]--; }
        const gx = this.x + Math.cos(this.angle) * 28, gy = this.y + Math.sin(this.angle) * 28;
        for (let i = 0; i < w.projectileCount; i++) game.projectiles.push(new Projectile(gx, gy, this.angle, w));
        this.muzzleFlash = 0.06;
        game.particles.spawnMuzzleFlash(gx, gy, this.angle);
        game.camera.shake(2.5, 0.08);
        game.audio.playShot(this.currentWeaponIndex);
    }
    draw(ctx) {
        if (!this.alive) return;
        const w = this.currentWeapon;
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.damageFlash > 0) ctx.globalAlpha = 0.5 + Math.sin(this.damageFlash * 40) * 0.3;
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, 3, this.radius, this.radius * 0.7, 0, 0, 6.28); ctx.fill();
        const bob = Math.sin(this.walkTimer) * 1.5;
        // Legs (behind body)
        ctx.save(); ctx.rotate(this.angle);
        ctx.fillStyle = '#2a3a2a';
        ctx.fillRect(-4, 6 + bob, 8, 10); ctx.fillRect(-4, -14 + bob, 8, 10);
        // Boots
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(-5, 14 + bob, 10, 4); ctx.fillRect(-5, -16 + bob, 10, 4);
        ctx.restore();
        // Arm + Gun (rotated to aim)
        ctx.save(); ctx.rotate(this.angle);
        // Back arm
        ctx.fillStyle = '#3a5a3a'; ctx.fillRect(4, -8, 10, 5);
        // Gun body
        ctx.fillStyle = '#555'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1;
        ctx.fillRect(12, -w.gunWidth / 2, w.gunLength, w.gunWidth);
        ctx.strokeRect(12, -w.gunWidth / 2, w.gunLength, w.gunWidth);
        // Gun stock (for AR/Shotgun/Minigun)
        if (this.currentWeaponIndex >= 2) { ctx.fillStyle = '#444'; ctx.fillRect(6, -3, 8, 6); }
        // Gun grip
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(16, w.gunWidth / 2, 4, 5);
        // Minigun barrels
        if (this.currentWeaponIndex === 4) { ctx.fillStyle = '#666'; for (let i = -2; i <= 2; i++) { ctx.fillRect(12 + w.gunLength - 2, i * 2 - 0.5, 4, 1); } }
        // Muzzle flash
        if (this.muzzleFlash > 0) { ctx.fillStyle = '#ffff44'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(12 + w.gunLength, 0, 7, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1; }
        // Front arm
        ctx.fillStyle = '#3a5a3a'; ctx.fillRect(14, 3, 8, 4);
        ctx.restore();
        // Body (torso) - olive drab military
        ctx.fillStyle = '#4a7a4f'; ctx.strokeStyle = '#2a4a2a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, bob, this.radius, 0, 6.28); ctx.fill(); ctx.stroke();
        // Body armor plate - darker center
        ctx.fillStyle = '#3a6040';
        ctx.beginPath(); ctx.arc(0, bob, this.radius * 0.65, 0, 6.28); ctx.fill();
        // Armor vest straps
        ctx.strokeStyle = '#2a3a20'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-6, -this.radius * 0.6 + bob); ctx.lineTo(-6, this.radius * 0.6 + bob); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(6, -this.radius * 0.6 + bob); ctx.lineTo(6, this.radius * 0.6 + bob); ctx.stroke();
        // Belt
        ctx.strokeStyle = '#3a3020'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(0, bob, this.radius * 0.85, 1.2, 1.94); ctx.stroke();
        // Helmet
        const vx = Math.cos(this.angle) * 8, vy = Math.sin(this.angle) * 8;
        ctx.fillStyle = '#3a5a35'; ctx.strokeStyle = '#2a3a20'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(vx, vy + bob, this.radius * 0.55, 0, 6.28); ctx.fill(); ctx.stroke();
        // Helmet rim
        ctx.strokeStyle = '#2a3a20'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(vx, vy + bob, this.radius * 0.6, this.angle - 1, this.angle + 1); ctx.stroke();
        // Visor - small and precise
        ctx.fillStyle = '#33bbdd'; ctx.strokeStyle = '#22aacc'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(vx + Math.cos(this.angle) * 5, vy + Math.sin(this.angle) * 5 + bob, 5, 2.5, this.angle, 0, 6.28); ctx.fill(); ctx.stroke();
        // Visor glow - subtle
        ctx.globalAlpha = 0.08; ctx.fillStyle = '#44ddff'; ctx.beginPath(); ctx.arc(vx + Math.cos(this.angle) * 5, vy + Math.sin(this.angle) * 5 + bob, 8, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
        // Reload indicator
        if (this.isReloading) {
            const w2 = this.currentWeapon, prog = 1 - (this.reloadTimer / w2.reloadTime);
            ctx.strokeStyle = '#ffcc00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, bob, this.radius + 6, -1.57, -1.57 + prog * 6.28); ctx.stroke();
        }
        // Unlimited ammo glow
        if (this.unlimitedAmmo) {
            ctx.globalAlpha = 0.15 + Math.sin(Date.now() * 0.005) * 0.1; ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(0, bob, this.radius + 10, 0, 6.28); ctx.fill(); ctx.globalAlpha = 1;
        }
        ctx.restore();
    }
}
