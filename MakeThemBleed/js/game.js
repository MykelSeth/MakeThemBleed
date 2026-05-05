// ===== MAIN GAME =====
// Game loop, state machine, collision, input, power-ups, pause
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.keys = {};
        this.mouse = { screenX: 0, screenY: 0, worldX: 0, worldY: 0, down: false };
        this.scrollDelta = 0;
        this.state = 'menu'; // menu, playing, paused, gameover
        this.audio = new AudioManager();
        this.camera = new Camera();
        this.map = new GameMap();
        this.particles = new ParticleSystem();
        this.hud = new HUD();
        this.waveManager = new WaveManager();
        this.menuManager = new MenuManager();
        this.scoring = new ScoringSystem();
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.pickups = [];
        this.droppedItems = [];
        // Active power-ups (timers)
        this.activePowerUps = { freeze: 0, flame: 0, unlimitedAmmo: 0, nuke: 0 };
        this.lastTime = 0;
        this.deltaTime = 0;
        this._setupInput();
        this._setupMenuCallbacks();
        window.game = this;
        this.showMainMenu();
        requestAnimationFrame((t) => this.loop(t));
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }

    _setupInput() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if (!this.audio.initialized) this.audio.init();
            // ESC for pause
            if (e.key === 'Escape') {
                if (this.state === 'playing') this.pauseGame();
                else if (this.state === 'paused') this.resumeGame();
            }
        });
        window.addEventListener('keyup', (e) => { this.keys[e.key.toLowerCase()] = false; });
        this.canvas.addEventListener('mousemove', (e) => {
            this.mouse.screenX = e.clientX; this.mouse.screenY = e.clientY;
            const w = this.camera.screenToWorld(e.clientX, e.clientY);
            this.mouse.worldX = w.x; this.mouse.worldY = w.y;
        });
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) { this.mouse.down = true; if (!this.audio.initialized) this.audio.init(); }
        });
        this.canvas.addEventListener('mouseup', (e) => { if (e.button === 0) this.mouse.down = false; });
        this.canvas.addEventListener('wheel', (e) => { this.scrollDelta = e.deltaY; });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    _setupMenuCallbacks() {
        this.menuManager.onPlay = () => { if (!this.audio.initialized) this.audio.init(); this.startGame(); };
        this.menuManager.onRestart = () => { this.startGame(); };
        this.menuManager.onMainMenu = () => { this.showMainMenu(); };
        this.menuManager.onResume = () => { this.resumeGame(); };
    }

    showMainMenu() {
        this.state = 'menu';
        this.menuManager.showMainMenu();
        this.menuManager.hideGameOver();
        this.menuManager.hidePause();
        // Play menu music even before init — audio.js handles the pending flag
        this.audio.stopActionMusic(); this.audio.stopWind(); this.audio.playMenuMusic();
    }

    startGame() {
        this.state = 'playing';
        this.menuManager.hideMainMenu(); this.menuManager.hideGameOver(); this.menuManager.hidePause();
        this.player = new Player(this.map.width / 2, this.map.height / 2);
        this.enemies = []; this.projectiles = []; this.pickups = []; this.droppedItems = [];
        this.particles = new ParticleSystem();
        this.waveManager = new WaveManager(); this.waveManager.startGame(this);
        this.scoring = new ScoringSystem();
        this.activePowerUps = { freeze: 0, flame: 0, unlimitedAmmo: 0, nuke: 0 };
        if (this.audio.initialized) { this.audio.stopMenuMusic(); this.audio.startWind(); }
        document.getElementById('bossHealthBar').style.display = 'none';
        document.body.classList.add('playing');
    }

    pauseGame() {
        this.state = 'paused';
        this.menuManager.showPause();
    }

    resumeGame() {
        this.state = 'playing';
        this.menuManager.hidePause();
        this.menuManager.hideOptions();
    }

    gameOver() {
        this.state = 'gameover';
        this.audio.stopActionMusic(); this.audio.stopWind();
        if (this.audio.initialized) this.audio.playPlayerDeath();
        this.menuManager.showGameOver(this.waveManager.currentWave, this.waveManager.totalKills, this.scoring);
        document.getElementById('bossHealthBar').style.display = 'none';
        document.getElementById('waveAnnounce').style.display = 'none';
    }

    loop(ts) {
        if (this.lastTime === 0) this.lastTime = ts;
        this.deltaTime = Math.min((ts - this.lastTime) / 1000, 0.05);
        this.lastTime = ts;
        const w = this.camera.screenToWorld(this.mouse.screenX, this.mouse.screenY);
        this.mouse.worldX = w.x; this.mouse.worldY = w.y;
        if (this.state === 'playing') this.update(this.deltaTime);
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        this.player.update(dt, this);
        if (!this.player.alive) { this.gameOver(); return; }

        // Power-up timers
        for (const k in this.activePowerUps) {
            if (this.activePowerUps[k] > 0) this.activePowerUps[k] = Math.max(0, this.activePowerUps[k] - dt);
        }
        // Flame DoT
        if (this.activePowerUps.flame > 0) {
            for (const e of this.enemies) {
                if (e.alive && !e.isBoss) {
                    e.health -= 10 * dt * this.waveManager.getWaveMultiplier() * 0.5;
                    if (Math.random() < 0.1) this.particles.spawnFlame(e.x, e.y);
                    if (e.health <= 0) { e.health = 0; e.alive = false; this.particles.spawnDeathBurst(e.x, e.y); this.waveManager.onEnemyKilled(e, this); }
                }
            }
        }

        // Projectiles
        for (const p of this.projectiles) {
            p.update(dt);
            if (p.x < 0 || p.x > this.map.width || p.y < 0 || p.y > this.map.height) p.alive = false;
        }
        // Enemies
        for (const e of this.enemies) e.update(dt, this);

        // Projectile-enemy collision
        for (const p of this.projectiles) {
            if (!p.alive) continue;
            for (const e of this.enemies) {
                if (!e.alive) continue;
                const dx = p.x - e.x, dy = p.y - e.y;
                if (dx * dx + dy * dy < (p.radius + e.drawRadius) * (p.radius + e.drawRadius)) {
                    const killed = e.takeDamage(p.damage, this);
                    p.alive = false;
                    this.particles.spawnBlood(e.x, e.y, 6);
                    this.audio.playEnemyHit();
                    if (killed) {
                        this.particles.spawnDeathBurst(e.x, e.y);
                        this.audio.playEnemyDeath();
                        this.camera.shake(3, 0.1);
                        this.waveManager.onEnemyKilled(e, this);
                    }
                    break;
                }
            }
        }

        // Pickup weapon
        for (const pk of this.pickups) {
            pk.update(dt);
            const dx = pk.x - this.player.x, dy = pk.y - this.player.y;
            if (dx * dx + dy * dy < (pk.radius + this.player.radius) * (pk.radius + this.player.radius)) {
                this.player.addWeapon(pk.weaponIndex);
                pk.collected = true;
                this.particles.spawnPickupEffect(pk.x, pk.y);
                this.audio.playWeaponPickup();
            }
        }

        // Item/power-up pickups
        for (const item of this.droppedItems) {
            item.update(dt);
            if (item.collected) continue;
            const dx = item.x - this.player.x, dy = item.y - this.player.y;
            if (dx * dx + dy * dy < (item.radius + this.player.radius) * (item.radius + this.player.radius)) {
                item.collected = true;
                if (item instanceof DroppedPowerUp) {
                    item.type.apply(this);
                    this.particles.spawnPowerUpCollect(item.x, item.y, item.type.color);
                    this.audio.playPowerUp();
                    if (item.key === 'freeze') this.audio.playFreeze();
                    else if (item.key === 'flame') this.audio.playInferno();
                    else if (item.key === 'allAmmo') this.audio.playFullAmmo();
                    else if (item.key === 'unlimitedAmmo') this.audio.playUnlimitedAmmo();
                    if (item.key === 'atomicBomb') this.particles.spawnNukeFlash(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
                } else {
                    // Item
                    if (item.key === 'medkit') {
                        item.type.apply(this.player);
                    } else if (item.type.weaponIdx !== undefined) {
                        this.player.addAmmo(item.type.weaponIdx, item.type.ammoAmount);
                    }
                    this.audio.playItemPickup();
                    this.particles.spawnPickupEffect(item.x, item.y);
                }
            }
        }

        // Cleanup
        this.projectiles = this.projectiles.filter(p => p.alive);
        this.enemies = this.enemies.filter(e => e.alive);
        this.pickups = this.pickups.filter(pk => !pk.collected);
        this.droppedItems = this.droppedItems.filter(d => !d.collected);

        this.waveManager.update(dt, this);
        this.particles.update(dt);
        this.camera.follow(this.player, this.mouse, this.map.width, this.map.height, this.canvas.width, this.canvas.height);
        this.camera.update(dt);
        this.scrollDelta = 0;
    }

    render() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, w, h);

        if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
            this.camera.apply(ctx);
            this.map.draw(ctx, this.camera, w, h);
            for (const pk of this.pickups) pk.draw(ctx);
            for (const d of this.droppedItems) d.draw(ctx);
            this.particles.draw(ctx);
            for (const e of this.enemies) e.draw(ctx);
            if (this.player) this.player.draw(ctx);
            for (const p of this.projectiles) p.draw(ctx);
            this.camera.restore(ctx);
            if (this.state === 'playing') this.hud.draw(ctx, this, w, h);
        }

        // Nuke flash
        if (this.activePowerUps.nuke > 0) {
            ctx.globalAlpha = this.activePowerUps.nuke * 1.5;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }
}

window.addEventListener('load', () => { window.game = new Game(); });
