// ===== PLAYER =====
// Player movement, aiming, shooting, health

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 18;
        this.speed = 220;
        this.health = 100;
        this.maxHealth = 100;
        this.angle = 0;  // aim direction

        // Weapons
        this.weapons = [0]; // Start with Pistol (index 0)
        this.currentWeaponIdx = 0; // Index into this.weapons array
        this.fireCooldown = 0;

        // Damage
        this.damageCooldown = 0;
        this.damageFlash = 0;
        this.alive = true;

        // Animation
        this.walkTimer = 0;
        this.muzzleFlash = 0;
    }

    get currentWeapon() {
        return WEAPONS[this.weapons[this.currentWeaponIdx]];
    }

    get currentWeaponIndex() {
        return this.weapons[this.currentWeaponIdx];
    }

    addWeapon(weaponIndex) {
        if (!this.weapons.includes(weaponIndex)) {
            this.weapons.push(weaponIndex);
            this.weapons.sort((a, b) => a - b);
            // Auto-equip new weapon
            this.currentWeaponIdx = this.weapons.indexOf(weaponIndex);
        }
    }

    switchWeapon(num) {
        // num is 1-5 key, corresponds to weapon index 0-4
        const weaponIdx = num - 1;
        const idx = this.weapons.indexOf(weaponIdx);
        if (idx !== -1) {
            this.currentWeaponIdx = idx;
        }
    }

    takeDamage(amount) {
        if (this.damageCooldown > 0) return;
        this.health -= amount;
        this.damageCooldown = 0.5; // invincibility frames
        this.damageFlash = 0.2;
        if (this.health <= 0) {
            this.health = 0;
            this.alive = false;
        }
    }

    update(dt, game) {
        if (!this.alive) return;

        // Movement
        let dx = 0, dy = 0;
        if (game.keys['w'] || game.keys['arrowup']) dy -= 1;
        if (game.keys['s'] || game.keys['arrowdown']) dy += 1;
        if (game.keys['a'] || game.keys['arrowleft']) dx -= 1;
        if (game.keys['d'] || game.keys['arrowright']) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }

        this.x += dx * this.speed * dt;
        this.y += dy * this.speed * dt;

        // Walk animation
        if (dx !== 0 || dy !== 0) {
            this.walkTimer += dt * 10;
        }

        // Clamp to map bounds
        this.x = Math.max(this.radius, Math.min(this.x, game.map.width - this.radius));
        this.y = Math.max(this.radius, Math.min(this.y, game.map.height - this.radius));

        // Aim toward mouse (world coordinates)
        this.angle = Math.atan2(
            game.mouse.worldY - this.y,
            game.mouse.worldX - this.x
        );

        // Shooting
        this.fireCooldown -= dt;
        if (game.mouse.down && this.fireCooldown <= 0) {
            this.shoot(game);
        }

        // Weapon switching with number keys
        for (let i = 1; i <= 5; i++) {
            if (game.keys[String(i)]) {
                this.switchWeapon(i);
            }
        }

        // Scroll wheel weapon switching
        if (game.scrollDelta !== 0) {
            this.currentWeaponIdx += game.scrollDelta > 0 ? 1 : -1;
            if (this.currentWeaponIdx < 0) this.currentWeaponIdx = this.weapons.length - 1;
            if (this.currentWeaponIdx >= this.weapons.length) this.currentWeaponIdx = 0;
            game.scrollDelta = 0;
        }

        // Cooldowns
        this.damageCooldown -= dt;
        this.damageFlash -= dt;
        this.muzzleFlash -= dt;
    }

    shoot(game) {
        const weapon = this.currentWeapon;
        this.fireCooldown = 1 / weapon.fireRate;

        // Spawn projectiles
        const gunTipX = this.x + Math.cos(this.angle) * 25;
        const gunTipY = this.y + Math.sin(this.angle) * 25;

        for (let i = 0; i < weapon.projectileCount; i++) {
            game.projectiles.push(new Projectile(gunTipX, gunTipY, this.angle, weapon));
        }

        // Muzzle flash
        this.muzzleFlash = 0.06;
        game.particles.spawnMuzzleFlash(gunTipX, gunTipY, this.angle);

        // Camera shake
        game.camera.shake(2, 0.08);

        // Sound
        game.audio.playShot(this.currentWeaponIndex);
    }

    draw(ctx) {
        if (!this.alive) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Damage flash
        if (this.damageFlash > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(this.damageFlash * 40) * 0.3;
        }

        // Body shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(2, 3, this.radius, this.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();

        // Rotate for gun direction
        ctx.rotate(this.angle);

        // Gun
        ctx.fillStyle = '#555';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.fillRect(10, -3, 18, 6);
        ctx.strokeRect(10, -3, 18, 6);

        // Muzzle flash
        if (this.muzzleFlash > 0) {
            ctx.fillStyle = '#ffff44';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(30, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        ctx.rotate(-this.angle);

        // Body
        const bodyBob = Math.sin(this.walkTimer) * 1;
        ctx.fillStyle = '#2a6e3f';
        ctx.strokeStyle = '#1a4a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, bodyBob, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Armor details
        ctx.fillStyle = '#1a4a2a';
        ctx.beginPath();
        ctx.arc(0, bodyBob, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Visor
        ctx.fillStyle = '#44ddff';
        ctx.strokeStyle = '#22aacc';
        ctx.lineWidth = 1;
        const visorAngle = this.angle;
        const visorX = Math.cos(visorAngle) * 6;
        const visorY = Math.sin(visorAngle) * 6 + bodyBob;
        ctx.beginPath();
        ctx.ellipse(visorX, visorY, 6, 4, visorAngle, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Visor glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#44ddff';
        ctx.beginPath();
        ctx.arc(visorX, visorY, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.restore();
    }
}
